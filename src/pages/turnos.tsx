'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import PageHero from '@/components/PageHero';
import LoadingScreen from '@/components/LoadingScreen';
import { format, addHours, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { ITurnoPopulated } from '@/types';
import ReservaModal from '@/components/ReservaModal';
import PagoDebitoModal from '@/components/PagoDebitoModal';
import dynamic from 'next/dynamic';
import { FileText, CreditCard, Wallet, Printer } from 'lucide-react';

const TurnosPage = () => {
  const { user, isAuthLoaded } = useAuth();
  const router = useRouter();
  const [turnos, setTurnos] = useState<ITurnoPopulated[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [pagoInfo, setPagoInfo] = useState<{ dateKey: string; amount: number; descuento: boolean } | null>(null);
  
  // For client-side rendering only
  const [isMounted, setIsMounted] = useState(false);

  // Estados para filtrado
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    console.log("Effect running, auth state:", { 
      user: !!user, 
      isAuthLoaded, 
      token: typeof window !== 'undefined' ? !!localStorage.getItem('token') : false 
    });
    
    if (!isAuthLoaded) {
      console.log("Auth still loading, waiting...");
      return;
    }
    
    if (!user) {
      console.log("No user found after auth loaded, redirecting to login");
      toast.error('Debes iniciar sesión para ver tus turnos');
      router.push('/login');
      return;
    }
    
    fetchTurnos();
  }, [user, isAuthLoaded, isMounted, router]);

  const fetchTurnos = async (retryCount = 0, maxRetries = 3) => {
    if (!user?._id) {
      console.log('No user ID available, skipping fetch');
      setLoading(false);
      return;
    }
    
    const timeout = 15000;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token available in localStorage');
        toast.error('No se encontró tu token de autenticación. Por favor, inicia sesión nuevamente.');
        router.push('/login');
        setLoading(false);
        return;
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}?token=${token}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-cache'
      });
      
      console.log('Response status:', res.status);
      
      const contentType = res.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      const responseText = await res.text();
      console.log('Response body preview:', responseText.substring(0, 200));
      
      if (contentType && contentType.includes('text/html')) {
        console.error('Server returned HTML instead of JSON. HTML preview:', responseText.substring(0, 300));
        
        if (responseText.includes('application is starting') || 
            responseText.includes('building')) {
          throw new Error('El servidor está iniciando. Por favor espera unos momentos e intenta nuevamente.');
        }
        
        if (responseText.includes('login') || responseText.includes('unauthorized') ||
            responseText.includes('not authorized')) {
          localStorage.removeItem('token');
          toast.error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
          router.push('/login');
          return;
        }
        
        throw new Error('El servidor devolvió HTML en lugar de JSON. Posible problema de autenticación.');
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        throw new Error('La respuesta del servidor no es un JSON válido');
      }
      
      if (!res.ok) {
        throw new Error(data.message || `Error del servidor: ${res.status}`);
      }
      
      if (Array.isArray(data)) {
        const userTurnos = data.filter(turno => 
          turno.cliente === user._id || 
          turno.cliente?._id === user._id
        );

        // Enriquecer con profesionales si vienen sin poblar
        const profesIdsFaltantes = userTurnos
          .filter(t => typeof t.profesional === 'string')
          .map(t => t.profesional as string);
        const uniqueIds = Array.from(new Set(profesIdsFaltantes));

        if (uniqueIds.length) {
          try {
            const resProfs = await fetch(`${process.env.NEXT_PUBLIC_API_USER}`);
            if (resProfs.ok) {
              const allUsers = await resProfs.json();
              const profMap: Record<string, any> = {};
              allUsers.forEach((u: any) => {
                profMap[u._id] = u;
              });
              userTurnos.forEach(t => {
                if (typeof t.profesional === 'string' && profMap[t.profesional]) {
                  (t as any).profesional = profMap[t.profesional];
                }
                if (typeof t.profesional === 'string') {
                  (t as any).profesional = null;
                }
              });
            }
          } catch {}
        }
        setTurnos(userTurnos);
      } else {
        setTurnos([]);
      }
      setLoading(false);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`Request timed out after ${timeout / 1000} seconds`);
        if (retryCount < maxRetries) {
          console.log('Timeout occurred, trying again...');
          toast.loading(`El servidor está tardando en responder. Reintentando automáticamente...`);
          
          setTimeout(() => {
            toast.dismiss();
            fetchTurnos(retryCount + 1, maxRetries);
          }, 1000);
          return;
        }
        error = new Error('La solicitud tomó demasiado tiempo y fue cancelada después de varios intentos');
      }

      console.error('Full error:', error);
      
      if ((error instanceof TypeError && error.message.includes('Failed to fetch')) && 
          retryCount < maxRetries) {
        
        toast.loading(`El servidor parece estar iniciando. Reintentando en ${(retryCount + 1) * 5} segundos...`);
        
        const delay = (retryCount + 1) * 5000;
        
        setTimeout(() => {
          toast.dismiss();
          fetchTurnos(retryCount + 1, maxRetries);
        }, delay);
        return;
      }
      
      let errorMessage = 'No se pudieron cargar tus turnos';
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'No se pudo conectar con el servidor. El servidor puede estar iniciando o inactivo. Por favor, inténtalo de nuevo en unos momentos.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      if (error instanceof TypeError && error.message.includes('blocked by CORS policy')) {
        errorMessage = 'Error de permisos CORS. Contacta al administrador del sistema.';
      }
      
      toast.error(errorMessage);
      setTurnos([]);
      setLoading(false);
    }
  };

  const handleCancelTurno = async (turnoId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar este turno?')) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No se encontró tu token de autenticación');
        return;
      }
      
      // Buscar el turno en el estado actual para obtener toda la información
      const turnoACancelar = turnos.find(t => t._id === turnoId);
      if (!turnoACancelar) {
        toast.error('No se encontró el turno a cancelar');
        return;
      }
      
      // Preparar el objeto del turno con el estado actualizado
      const turnoActualizado = {
        cliente: typeof turnoACancelar.cliente === 'string' 
          ? turnoACancelar.cliente 
          : turnoACancelar.cliente._id,
        servicio: typeof turnoACancelar.servicio === 'string' 
          ? turnoACancelar.servicio 
          : turnoACancelar.servicio._id,
        fecha: typeof turnoACancelar.fecha === 'string' 
          ? turnoACancelar.fecha 
          : turnoACancelar.fecha.toISOString(),
        hora: turnoACancelar.hora,
        estado: 'cancelado'
      };
      
      console.log('Enviando datos de cancelación:', turnoActualizado);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}/edit/${turnoId}?token=${token}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(turnoActualizado)
      });
      
      console.log('Status de respuesta de cancelación:', res.status);
      
      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        const responseText = await res.text();
        
        console.error('Error en cancelación:', responseText);
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = JSON.parse(responseText);
            throw new Error(errorData.message || 'Error al cancelar el turno');
          } catch (parseError) {
            throw new Error('Error al cancelar el turno');
          }
        } else {
          throw new Error(`Error del servidor: ${res.status}`);
        }
      }
      
      // Verificar que la respuesta sea JSON válido
      const responseText = await res.text();
      if (responseText) {
        try {
          const responseData = JSON.parse(responseText);
          console.log('Respuesta exitosa de cancelación:', responseData);
        } catch (parseError) {
          console.warn('Respuesta no es JSON válido, pero la operación fue exitosa');
        }
      }
      
      toast.success('Turno cancelado con éxito');
      
      // Actualizar el estado local inmediatamente para mejor UX
      setTurnos(prevTurnos => 
        prevTurnos.map(turno => 
          turno._id === turnoId 
            ? { ...turno, estado: 'cancelado' as const }
            : turno
        )
      );
      
      // Recargar todos los turnos para asegurar consistencia
      setTimeout(() => {
        fetchTurnos();
      }, 500);
      
    } catch (error) {
      console.error('Error completo al cancelar turno:', error);
      
      let errorMessage = 'Error al cancelar el turno';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Mensajes específicos para ciertos tipos de error
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.';
        } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
          errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
          localStorage.removeItem('token');
          router.push('/login');
          return;
        } else if (error.message.includes('48 horas')) {
          errorMessage = 'Este turno ya no se puede cancelar porque faltan menos de 48 horas.';
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const handlePrintTurno = (turno: ITurnoPopulated) => {
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime().toString();
    const printWindow = window.open(windowUrl, uniqueName);
    
    if (printWindow) {
      // CORREGIDO: Manejo consistente de fechas
      const fechaString = typeof turno.fecha === 'string' ? turno.fecha : turno.fecha.toISOString();
      const fecha = parseISO(fechaString.split('T')[0]);
      const fechaFormateada = format(fecha, "dd 'de' MMMM 'de' yyyy", { locale: es });
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Turno - Spa Sentirse Bien</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 20px;
              }
              .header h1 {
                color: #7D8C88;
                margin-bottom: 5px;
              }
              .turno-details {
                margin-bottom: 30px;
              }
              .turno-details h2 {
                color: #7D8C88;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
              }
              .detail-row {
                display: flex;
                margin-bottom: 15px;
              }
              .detail-label {
                font-weight: bold;
                width: 150px;
              }
              .status {
                display: inline-block;
                padding: 5px 10px;
                border-radius: 15px;
                font-weight: bold;
                font-size: 14px;
                text-transform: uppercase;
              }
              .status-pendiente {
                color: #92400E;
              }
              .status-confirmado {
                color: #065F46;
              }
              .status-cancelado {
                color: #B91C1C;
              }
              .status-realizado {
                color: #1E40AF;
              }
              .footer {
                margin-top: 50px;
                text-align: center;
                font-size: 14px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 20px;
              }
              .price {
                font-size: 24px;
                font-weight: bold;
                color: #7D8C88;
              }
              @media print {
                body {
                  padding: 0;
                  margin: 15mm;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Spa Sentirse Bien</h1>
              <p>Comprobante de Turno</p>
            </div>
            
            <div class="turno-details">
              <h2>Datos del Turno</h2>
              
              <div class="detail-row">
                <div class="detail-label">Cliente:</div>
                <div>${user?.first_name} ${user?.last_name}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Email:</div>
                <div>${user?.email}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Servicio:</div>
                <div>${turno.servicio.nombre}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Profesional:</div>
                <div>${turno.profesional ? `${turno.profesional.first_name} ${turno.profesional.last_name}` : 'Falta asignar profesional'}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Descripción:</div>
                <div>${turno.servicio.descripcion}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Fecha:</div>
                <div>${fechaFormateada}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Hora:</div>
                <div>${turno.hora}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Estado:</div>
                <div>
                  <span class="status status-${turno.estado}">
                    ${turno.estado.charAt(0).toUpperCase() + turno.estado.slice(1)}
                  </span>
                </div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Precio:</div>
                <div class="price">$${turno.servicio.precio}</div>
              </div>
            </div>
            
            <div class="footer">
              <p>Gracias por confiar en Spa Sentirse Bien</p>
              <p>Este comprobante fue generado el ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}</p>
              <p>Para cualquier consulta, comunícate con nosotros al teléfono: (011) 4444-5555</p>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const canCancelTurno = (turno: ITurnoPopulated): boolean => {
    // CORREGIDO: Manejo consistente de fechas
    const fechaString = typeof turno.fecha === 'string' ? turno.fecha : turno.fecha.toISOString();
    const fecha = parseISO(fechaString.split('T')[0]);
    const [hours, minutes] = turno.hora.split(':').map(Number);
    fecha.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const cancelLimit = addHours(now, 48);
    
    return fecha > cancelLimit;
  };

  const filteredTurnos = turnos.filter(turno => {
    if (statusFilter === 'todos') return true;
    return turno.estado === statusFilter;
  });

  // Agrupar turnos por fecha (YYYY-MM-DD)
  const groupedTurnos = useMemo(() => {
    const groups: Record<string, ITurnoPopulated[]> = {};
    filteredTurnos.forEach((turno) => {
      const fechaString = typeof turno.fecha === 'string' ? turno.fecha : turno.fecha.toISOString();
      const dateKey = fechaString.split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(turno);
    });
    return groups;
  }, [filteredTurnos]);

  // Ordenar fechas ascendentemente
  const sortedDateKeys = useMemo(() => {
    return Object.keys(groupedTurnos).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [groupedTurnos]);

  // Handler para pagar los turnos de un día dado
  const handlePayTurnosDelDia = useCallback(
    (dateKey: string) => {
      const turnosDelDia = groupedTurnos[dateKey] || [];
      const turnosPagables = turnosDelDia.filter((t) => t.estado === 'pendiente');
      const totalDia = turnosPagables.reduce((sum, t) => sum + t.servicio.precio, 0);

      if (turnosPagables.length === 0) {
        toast.error('No hay turnos pendientes para pagar en esta fecha');
        return;
      }

      // Aquí podrías redirigir a una página de pago o abrir un modal de pago.
      // Por ahora redirigimos a una ruta ficticia con query de ids.
      const ids = turnosPagables.map((t) => t._id).join(',');
      router.push(`/pago?turnos=${ids}`);
    },
    [groupedTurnos, router]
  );

  // Imprimir todos los turnos de un día
  const handlePrintTurnosDelDia = useCallback(
    (dateKey: string) => {
      const turnosDia = (groupedTurnos[dateKey] || []).sort((a, b) => a.hora.localeCompare(b.hora));
      if (turnosDia.length === 0) return;

      const fecha = parseISO(dateKey);
      const fechaFormateadaCab = format(fecha, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es });

      const htmlTurnos = turnosDia
        .map((turno) => {
          const profesional = turno.profesional ? `${turno.profesional.first_name} ${turno.profesional.last_name}` : 'Falta asignar profesional';
          return `
            <div style="margin-bottom:24px;">
              <h3 style="margin:0;color:#7D8C88;">${turno.servicio.nombre}</h3>
              <p style="margin:4px 0;font-size:14px;">Profesional: ${profesional}</p>
              <p style="margin:4px 0;font-size:14px;">Hora: ${turno.hora}</p>
              <p style="margin:4px 0;font-size:14px;">Precio: $${turno.servicio.precio}</p>
              <p style="margin:4px 0;font-size:14px;">Estado: ${turno.estado}</p>
            </div>
          `;
        })
        .join('');

      const printWindow = window.open('about:blank', new Date().getTime().toString());
      if (!printWindow) return;

      printWindow.document.write(`
        <html>
          <head>
            <title>Turnos ${fechaFormateadaCab}</title>
            <style>
              body{font-family:Arial,sans-serif;padding:20px;color:#333;}
              h1{color:#7D8C88;margin-bottom:30px;}
              hr{border:none;border-top:1px solid #ddd;margin:20px 0;}
            </style>
          </head>
          <body>
            <h1>Turnos – ${fechaFormateadaCab}</h1>
            ${htmlTurnos}
            <hr />
            <p>Cliente: ${user?.first_name} ${user?.last_name} – ${user?.email}</p>
            <p style="font-size:12px;color:#666;">Generado el ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}</p>
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    },
    [groupedTurnos, user]
  );

  // Factura por día (pago efectivo)
  const handleFacturaTurnosDelDia = useCallback(
    (dateKey: string) => {
      const turnosDia = (groupedTurnos[dateKey] || []).sort((a, b) => a.hora.localeCompare(b.hora));
      if (turnosDia.length === 0) return;

      const fecha = parseISO(dateKey);
      const fechaFormateada = format(fecha, "dd/MM/yyyy", { locale: es });

      const filasServicios = turnosDia
        .map(
          (t) => `
            <tr>
              <td style="padding:8px;border:1px solid #ddd;">${t.servicio.nombre}</td>
              <td style="padding:8px;border:1px solid #ddd;">${t.hora}</td>
              <td style="padding:8px;border:1px solid #ddd;">$${t.servicio.precio}</td>
            </tr>
          `
        )
        .join('');

      const total = turnosDia.reduce((sum, t) => sum + t.servicio.precio, 0);

      const win = window.open('about:blank', new Date().getTime().toString());
      if (!win) return;

      win.document.write(`
        <html>
          <head>
            <title>Factura – ${fechaFormateada}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
              h1 { margin-bottom: 0; }
              h2 { margin-top: 4px; color: #666; font-size: 16px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { text-align: left; }
              th { background: #f5f5f5; }
              .tot { text-align: right; font-size: 18px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>Spa Sentirse Bien</h1>
            <h2>Factura por pago en efectivo – ${fechaFormateada}</h2>
            <p>Cliente: ${user?.first_name} ${user?.last_name} – ${user?.email}</p>

            <table>
              <thead>
                <tr>
                  <th style="padding:8px;border:1px solid #ddd;">Servicio</th>
                  <th style="padding:8px;border:1px solid #ddd;">Hora</th>
                  <th style="padding:8px;border:1px solid #ddd;">Precio</th>
                </tr>
              </thead>
              <tbody>
                ${filasServicios}
              </tbody>
            </table>

            <p class="tot"><strong>Total a abonar (efectivo): $${total}</strong></p>

            <p style="font-size:12px;color:#666;">Emitido el ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}</p>
          </body>
        </html>
      `);

      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    },
    [groupedTurnos, user]
  );

  // Pagar con débito => crear registro de pago y dejar backend confirmar turnos
  const handlePagarDebitoDelDia = useCallback(
    async (dateKey: string) => {
      const turnosDia = (groupedTurnos[dateKey] || []).filter((t) => t.estado === 'pendiente');
      if (!turnosDia.length) {
        toast.error('No hay turnos pagables ese día');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Debes iniciar sesión nuevamente');
        router.push('/login');
        return;
      }

      // Calcular monto total con descuento si corresponde
      const eligibleDescuento = turnosDia.every(canCancelTurno);
      const total = turnosDia.reduce((sum, t) => sum + t.servicio.precio, 0);
      const montoFinal = eligibleDescuento ? Math.round(total * 0.85) : total;

      try {
        const pagoBody = {
          turnos: turnosDia.map((t) => t._id),
          amount: montoFinal,
          cliente: user?._id,
        };

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_PAYMENT}/create?token=${token}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(pagoBody),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Error ${res.status}: ${text || 'registrando pago'}`);
        }

        toast.success('Pago con débito registrado y turnos confirmados');

        // Actualización optimista del estado local
        setTurnos((prev) =>
          prev.map((t) =>
            turnosDia.find((pd) => pd._id === t._id)
              ? { ...t, estado: 'confirmado' as const }
              : t
          )
        );

        // Refrescar desde el servidor para mantener consistencia
        fetchTurnos();
      } catch (err) {
        console.error(err);
        toast.error('Error al confirmar el pago');
      }
    },
    [groupedTurnos, router, user, canCancelTurno]
  );

  if (!isMounted || loading) {
    return (
      <LoadingScreen
        title="Mis Turnos"
        description="Gestiona tus reservas en Sentirse Bien"
        message="Cargando turnos..."
      />
    );
  }

  return (
    <>
      <PageHero
        title="Mis Turnos"
        description="Gestiona tus reservas en Sentirse Bien"
      />
      
      <div className="max-w-6xl mx-auto p-6 my-12">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <label htmlFor="statusFilter" className="mr-2 text-primary font-medium">Filtrar por estado:</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border rounded-md"
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="confirmado">Confirmados</option>
              <option value="cancelado">Cancelados</option>
              <option value="realizado">Realizados</option>
            </select>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Reservar Nuevo Turno
          </button>
        </div>
        
        {filteredTurnos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No tienes turnos {statusFilter !== 'todos' ? `con estado "${statusFilter}"` : ''}</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 bg-primary text-white px-6 py-2 rounded-md"
            >
              Reservar Ahora
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {sortedDateKeys.map((dateKey) => {
              const fecha = parseISO(dateKey);
              const turnosDelDia = groupedTurnos[dateKey].sort((a, b) => a.hora.localeCompare(b.hora));
              const turnosPagables = turnosDelDia.filter((t) => t.estado === 'pendiente');
              const totalDia = turnosPagables.reduce((sum, t) => sum + t.servicio.precio, 0);
              const eligibleDescuento = turnosPagables.length > 0 && turnosPagables.every(canCancelTurno);
              const precioDebito = eligibleDescuento ? Math.round(totalDia * 0.85) : totalDia;
              return (
                <div key={dateKey} className="mb-8 rounded-lg border border-gray-200 shadow-sm bg-white">
                  {/* Header Día con botón imprimir */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 bg-gray-100 rounded-t-lg">
                    <h2 className="text-lg font-bold text-primary">
                      {format(fecha, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
                    </h2>

                    {turnosDelDia.length > 0 && (
                      <button
                        onClick={() => handlePrintTurnosDelDia(dateKey)}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-sm bg-gray-200 text-primary hover:bg-gray-300 transition"
                      >
                        <Printer size={16} />
                        <span>Imprimir día</span>
                      </button>
                    )}
                  </div>

                  {/* Lista de turnos del día */}
                  <div className="space-y-4 p-4">
                    {turnosDelDia.map((turno) => {
                      const canCancel = canCancelTurno(turno);

                      return (
                        <div
                          key={turno._id}
                          className="p-4 rounded-md border-l-4 border-primary bg-white hover:bg-gray-50 transition"
                        >
                          <div className="flex flex-col md:flex-row justify-between">
                            <div className="mb-4 md:mb-0">
                              <h3 className="text-lg font-semibold">{turno.servicio.nombre}</h3>
                              <p className="text-sm text-gray-500 mt-0.5">Profesional: {turno.profesional ? `${turno.profesional.first_name} ${turno.profesional.last_name}` : 'Falta asignar profesional'}</p>
                              <p className="text-gray-600 mt-1">
                                {turno.hora}
                              </p>
                              {!canCancel && (turno.estado === 'pendiente' || turno.estado === 'confirmado') && (
                                <p className="text-amber-600 text-sm mt-1">
                                  ⚠️ Este turno ya no se puede cancelar (menos de 48hs)
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                              <span
                                className={`px-3 py-1 rounded-full text-sm ${
                                  turno.estado === 'pendiente' ? 'bg-yellow-200 text-yellow-800' :
                                  turno.estado === 'confirmado' ? 'bg-green-200 text-green-800' :
                                  turno.estado === 'cancelado' ? 'bg-red-200 text-red-800' :
                                  'bg-blue-200 text-blue-800'
                                }`}
                              >
                                {turno.estado.charAt(0).toUpperCase() + turno.estado.slice(1)}
                              </span>

                              {(turno.estado === 'pendiente' || turno.estado === 'confirmado') && canCancel && (
                                <button
                                  onClick={() => handleCancelTurno(turno._id)}
                                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                                >
                                  Cancelar
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="mt-3">
                            <p className="text-sm text-gray-500">Precio: ${turno.servicio.precio}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Botones de pago */}
                  {turnosPagables.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                      {/* Efectivo */}
                      <button
                        onClick={() => handleFacturaTurnosDelDia(dateKey)}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-sm bg-primary text-white hover:bg-primary/90 transition"
                      >
                        <Wallet size={16} />
                        <span>Efectivo</span>
                        <span className="ml-2 font-semibold">${totalDia}</span>
                      </button>

                      {/* Débito */}
                      <button
                        onClick={() => {
                          setPagoInfo({ dateKey, amount: precioDebito, descuento: eligibleDescuento });
                          setIsPagoModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-sm bg-primary text-white hover:bg-primary/90 transition"
                      >
                        <CreditCard size={16} />
                        <span>Débito {eligibleDescuento ? '(-15%)' : ''}</span>
                        <span className="ml-2 font-semibold">${precioDebito}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ReservaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTurnos}
      />

      {/* Modal de Pago con Débito */}
      <PagoDebitoModal
        isOpen={isPagoModalOpen}
        onClose={() => setIsPagoModalOpen(false)}
        amount={pagoInfo?.amount || 0}
        discountApplied={pagoInfo?.descuento || false}
        onPay={() => {
          if (pagoInfo) {
            handlePagarDebitoDelDia(pagoInfo.dateKey);
          }
          setIsPagoModalOpen(false);
        }}
      />
    </>
  );
};

export default dynamic(() => Promise.resolve(TurnosPage), { ssr: false });