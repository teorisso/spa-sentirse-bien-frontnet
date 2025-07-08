'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { ITurnoPopulated } from '@/types';
import { X, Calendar, Clock, FileText } from 'lucide-react';
import PageHero from '@/components/PageHero';

export default function ProfesionalTurnosPage() {
  const { user, isAuthLoaded } = useAuth();
  const router = useRouter();
  const [turnos, setTurnos] = useState<ITurnoPopulated[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtro de fecha (por defecto hoy)
  const [dateFilter, setDateFilter] = useState<string>(() => {
    return format(new Date(), 'yyyy-MM-dd');
  });

  // Filtro por servicio
  const [serviceFilter, setServiceFilter] = useState<string>('todos');

  useEffect(() => {
    if (!isAuthLoaded) return;

    if (!user) {
      toast.error('Debes iniciar sesión para ver esta página');
      router.push('/login');
      return;
    }

    if (user.role !== 'profesional') {
      toast.error('No tienes permisos para acceder a esta página');
      router.push('/');
      return;
    }

    fetchTurnos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAuthLoaded]);

  const fetchTurnos = async (retryCount = 0, maxRetries = 3) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No se encontró token de autenticación');
        router.push('/login');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}?token=${token}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      const contentType = res.headers.get('content-type');
      const responseText = await res.text();

      if (contentType && contentType.includes('text/html')) {
        // Servidor iniciando o error de build
        if (retryCount < maxRetries) {
          toast.loading(`El servidor está iniciando. Reintentando en ${(retryCount + 1) * 5} segundos...`);
          setTimeout(() => {
            toast.dismiss();
            fetchTurnos(retryCount + 1, maxRetries);
          }, (retryCount + 1) * 5000);
          return;
        }
        throw new Error('El servidor respondió con HTML en lugar de JSON');
      }

      let data: any = [];
      try {
        data = JSON.parse(responseText);
      } catch (err) {
        throw new Error('La respuesta del servidor no es un JSON válido');
      }

      if (!res.ok) {
        throw new Error(data.message || `Error del servidor: ${res.status}`);
      }

      // Enriquecer profesionales faltantes
      const idsSinPop = data.filter((t: any) => typeof t.profesional === 'string').map((t: any) => t.profesional);
      const uniqueIds = Array.from(new Set(idsSinPop));
      if (uniqueIds.length) {
        try {
          const resUsers = await fetch(`${process.env.NEXT_PUBLIC_API_USER}`);
          if (resUsers.ok) {
            const usuarios = await resUsers.json();
            const map: Record<string, any> = {};
            usuarios.forEach((u: any) => (map[u._id] = u));
            data.forEach((t: any) => {
              if (typeof t.profesional === 'string' && map[t.profesional]) {
                t.profesional = map[t.profesional];
              }
            });
          }
        } catch (e) {
          console.error('Error enriquecer profesionales', e);
        }
      }

      // Filtrar turnos del profesional logueado
      const misTurnos = data.filter((t: ITurnoPopulated) => {
        if (!user) return false;
        if (typeof t.profesional === 'string') return t.profesional === user._id;
        return t.profesional?._id === user._id;
      });

      setTurnos(misTurnos);
    } catch (err: any) {
      console.error('Error al obtener turnos', err);
      const message = err instanceof Error ? err.message : 'Error desconocido al cargar los turnos';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintTurnos = () => {
    const printContent = document.getElementById('turnos-table');
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime().toString();

    if (printContent) {
      const printWindow = window.open(windowUrl, uniqueName);

      printWindow?.document.write(`
        <html>
          <head>
            <title>Turnos - Sentirse Bien</title>
            <style>
              body { font-family: Arial, sans-serif; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Turnos del Día - Spa Sentirse Bien</h1>
              <p>Fecha: ${format(new Date(dateFilter), 'dd/MM/yyyy')}</p>
            </div>
            ${printContent.outerHTML}
          </body>
        </html>
      `);

      printWindow?.document.close();
      printWindow?.print();
    }
  };

  // Filtrar turnos por fecha seleccionada
  const filteredTurnos = turnos.filter(turno => {
    // Fecha
    if (dateFilter) {
      const turnoDate = format(new Date(turno.fecha), 'yyyy-MM-dd');
      if (turnoDate !== dateFilter) return false;
    }

    // Servicio
    if (serviceFilter !== 'todos') {
      const servicioId = typeof turno.servicio === 'string' ? turno.servicio : turno.servicio._id;
      if (servicioId !== serviceFilter) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <>
        <PageHero
          title="Mis Turnos"
          description="Consulta los turnos asignados para el día"
        />
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-lg">Cargando turnos...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHero
          title="Mis Turnos"
          description="Consulta los turnos asignados para el día"
        />
        <div className="flex flex-col justify-center items-center min-h-[400px]">
          <p className="text-lg text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={() => fetchTurnos()} 
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
          >
            Reintentar
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHero
        title="Mis Turnos"
        description="Consulta los turnos asignados para el día"
      />

      <div className="max-w-7xl mx-auto p-8 my-12">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-semibold text-primary">Turnos del Profesional</h2>
          </div>

          {/* Filtro por fecha */}
          <div className="flex flex-wrap gap-4 p-6 bg-gray-50 items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="date-filter" className="font-medium">Fecha:</label>
              <input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="p-2 border rounded"
                placeholder="Selecciona fecha"
              />
              {dateFilter && (
                <button 
                  type="button"
                  title="Limpiar filtro de fecha"
                  onClick={() => setDateFilter('')}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X size={16} />
                  <span className="sr-only">Limpiar filtro de fecha</span>
                </button>
              )}
            </div>

            {/* Filtro por servicio */}
            <div className="flex items-center gap-2">
              <label htmlFor="service-filter" className="font-medium">Servicio:</label>
              <select
                id="service-filter"
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="p-2 border rounded"
              >
                <option value="todos">Todos</option>
                {Array.from(new Set(turnos.map(t => typeof t.servicio === 'string' ? undefined : t.servicio)))
                  .filter(Boolean)
                  .map((serv: any) => (
                    <option key={serv._id} value={serv._id}>{serv.nombre}</option>
                  ))}
              </select>
              {serviceFilter !== 'todos' && (
                <button 
                  type="button"
                  title="Limpiar filtro de servicio"
                  onClick={() => setServiceFilter('todos')}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X size={16} />
                  <span className="sr-only">Limpiar filtro de servicio</span>
                </button>
              )}
            </div>

            <div className="flex-1"></div>

            <button
              onClick={handlePrintTurnos}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded"
            >
              <FileText size={16} />
              <span>Imprimir</span>
            </button>
          </div>

          {/* Tabla de turnos */}
          <div className="overflow-x-auto">
            <table className="min-w-full" id="turnos-table">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTurnos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No se encontraron turnos para la fecha seleccionada
                    </td>
                  </tr>
                ) : (
                  filteredTurnos.map((turno) => (
                    <tr key={turno._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {turno.cliente ? `${turno.cliente.first_name ?? ''} ${turno.cliente.last_name ?? ''}`.trim() || 'Cliente eliminado' : 'Cliente eliminado'}
                        </div>
                        <div className="text-xs text-gray-500">{turno.cliente && turno.cliente.email ? turno.cliente.email : 'Sin email'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{turno.servicio.nombre}</div>
                        <div className="text-sm text-gray-500">${turno.servicio.precio}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar size={16} className="text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {format(new Date(turno.fecha), 'dd/MM/yyyy', { locale: es })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock size={16} className="text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">{turno.hora}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            turno.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                            turno.estado === 'confirmado' ? 'bg-green-100 text-green-800' :
                            turno.estado === 'cancelado' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {turno.estado.charAt(0).toUpperCase() + turno.estado.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
} 