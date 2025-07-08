'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { ITurnoPopulated } from '@/types';
import { X, Calendar, Clock, User, FileText, Trash2, PlusCircle } from 'lucide-react';
import ReservaModal from '@/components/ReservaModal';
import LoadingScreen from '@/components/LoadingScreen';
import PageHero from '@/components/PageHero';

export default function AdminTurnosPage() {
  const { user, isAdmin, isAuthLoaded } = useAuth();
  const router = useRouter();
  const [turnos, setTurnos] = useState<ITurnoPopulated[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReserva, setShowReserva] = useState(false);
  
  // Estados para filtrado
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [dateFilter, setDateFilter] = useState<string>('');
  
  useEffect(() => {
    // Only check authentication after AuthContext has finished loading
    if (!isAuthLoaded) {
      return; // Wait until auth is loaded before making decisions
    }
    
    if (!user) {
      toast.error('Debes iniciar sesión para ver esta página');
      router.push('/login');
      return;
    }
    
    if (!isAdmin) {
      toast.error('No tienes permisos para acceder a esta página');
      router.push('/');
      return;
    }
    
    fetchTurnos();
  }, [user, isAdmin, isAuthLoaded, router]);

  const fetchTurnos = async (retryCount = 0, maxRetries = 3) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Intentando obtener turnos...");
      console.log("URL API:", process.env.NEXT_PUBLIC_API_TURNO);
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No se encontró token de autenticación');
        router.push('/login');
        return;
      }
      
      // Usar el token como parámetro de URL en lugar de header (evita problemas CORS)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}?token=${token}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
      
      console.log("Status code:", res.status);
      
      // Check for HTML response (common when server is starting)
      const contentType = res.headers.get('content-type');
      const responseText = await res.text();
      
      if (contentType && contentType.includes('text/html')) {
        console.error('Servidor devolvió HTML en lugar de JSON');
        
        if (responseText.includes('application is starting') || 
            responseText.includes('building')) {
          toast.error('El servidor está iniciando. Por favor espera unos momentos e intenta nuevamente.');
          
          // Reintentar después de un retraso si no hemos excedido los reintentos máximos
          if (retryCount < maxRetries) {
            toast.loading(`Reintentando en ${(retryCount + 1) * 5} segundos...`);
            setTimeout(() => {
              toast.dismiss();
              fetchTurnos(retryCount + 1, maxRetries);
            }, (retryCount + 1) * 5000);
            return;
          }
        }
        
        throw new Error('El servidor respondió con HTML en lugar de JSON');
      }
      
      // Analizar respuesta JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error al analizar JSON:', parseError);
        throw new Error('La respuesta del servidor no es un JSON válido');
      }
      
      if (!res.ok) {
        throw new Error(data.message || `Error del servidor: ${res.status}`);
      }
      
      // enriquecer profesionales
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
              if (typeof t.profesional === 'string') {
                t.profesional = null;
              }
            });
          }
        } catch {}
      }
      
      setTurnos(data);
      setError(null);
    } catch (error) {
      console.error("Error completo:", error);
      
      // Si es un error de red y no hemos excedido los reintentos, intentar de nuevo
      if (error instanceof TypeError && error.message.includes('Failed to fetch') && 
          retryCount < maxRetries) {
        console.log(`Reintentando (${retryCount + 1}/${maxRetries})...`);
        toast.loading(`El servidor parece estar inaccesible. Reintentando en ${(retryCount + 1) * 3} segundos...`);
        
        setTimeout(() => {
          toast.dismiss();
          fetchTurnos(retryCount + 1, maxRetries);
        }, (retryCount + 1) * 3000);
        return;
      }
      
      // Mensaje de error específico
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar los turnos';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (turnoId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No se encontró token de autenticación');
        router.push('/login');
        return;
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}/edit/${turnoId}?token=${token}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          estado: newStatus
        })
      });
      
      if (!res.ok) throw new Error('Error al actualizar el estado');
      
      toast.success(`Estado actualizado a ${newStatus}`);
      fetchTurnos();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar el estado');
    }
  };
  
  const handleDeleteTurno = async (turnoId: string) => {
    if (!confirm('¿Eliminar este turno de forma permanente?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Sin token');
        return;
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}/delete/${turnoId}?token=${token}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error al eliminar');
      toast.success('Turno eliminado');
      fetchTurnos();
    } catch (e) {
      console.error(e);
      toast.error('No se pudo eliminar');
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
              <h1>Listado de Turnos - Spa Sentirse Bien</h1>
              <p>Fecha: ${format(new Date(), "dd/MM/yyyy")}</p>
            </div>
            ${printContent.outerHTML}
          </body>
        </html>
      `);
      
      printWindow?.document.close();
      printWindow?.print();
    }
  };

  // Filtrado de turnos
  const filteredTurnos = turnos.filter(turno => {
    // Filtro por estado
    if (statusFilter !== 'todos' && turno.estado !== statusFilter) return false;
    
    // Filtro por fecha
    if (dateFilter) {
      const turnoDate = format(new Date(turno.fecha), 'yyyy-MM-dd');
      if (turnoDate !== dateFilter) return false;
    }
    
    return true;
  });

  if (loading) {
    return (
      <LoadingScreen
        title="Administración de Turnos"
        description="Gestiona todos los turnos del spa"
        message="Cargando turnos..."
      />
    );
  }

  if (error) {
    return (
      <>
        <PageHero
          title="Administración de Turnos"
          description="Gestiona todos los turnos del spa"
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
        title="Administración de Turnos"
        description="Gestiona todos los turnos del spa"
      />
      <div className="max-w-7xl mx-auto p-8 my-12">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-semibold text-primary">Administración de Turnos</h2>
          </div>
          
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 p-6 bg-gray-50">
            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" className="font-medium">Estado:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 border rounded"
              >
                <option value="todos">Todos</option>
                <option value="pendiente">Pendientes</option>
                <option value="confirmado">Confirmados</option>
                <option value="cancelado">Cancelados</option>
                <option value="realizado">Realizados</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="font-medium">Fecha:</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="p-2 border rounded"
                placeholder="Selecciona una fecha"
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
            
            <div className="flex-1"></div>
            
            <button
              onClick={handlePrintTurnos}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-sm bg-gray-200 text-primary hover:bg-gray-300 transition"
            >
              <FileText size={16} />
              <span>Imprimir</span>
            </button>

            <button
              onClick={() => setShowReserva(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded"
            >
              <PlusCircle size={16} />
              <span>Crear turno</span>
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
                    Profesional
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTurnos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No se encontraron turnos con los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  filteredTurnos.map((turno) => (
                    <tr key={turno._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {turno.cliente ? `${turno.cliente.first_name ?? ''} ${turno.cliente.last_name ?? ''}`.trim() || 'Cliente eliminado' : 'Cliente eliminado'}
                            </div>
                            <div className="text-xs text-gray-500">{turno.cliente && turno.cliente.email ? turno.cliente.email : 'Sin email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{turno.servicio.nombre}</div>
                        <div className="text-sm text-gray-500">${turno.servicio.precio}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User size={16} className="text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {turno.profesional ? `${turno.profesional.first_name} ${turno.profesional.last_name}` : 'Falta asignar profesional'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar size={16} className="text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {format(new Date(turno.fecha), 'dd/MM/yyyy')}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center gap-2">
                        <select
                          value={turno.estado}
                          onChange={(e) => handleStatusChange(turno._id, e.target.value)}
                          className="p-2 border rounded text-sm min-w-[120px] w-full max-w-[150px]"	
                          title="Cambiar estado del turno"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="confirmado">Confirmar</option>
                          <option value="cancelado">Cancelar</option>
                          <option value="realizado">Realizado</option>
                        </select>
                        <button onClick={() => handleDeleteTurno(turno._id)} title="Eliminar turno" className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de nueva reserva */}
      <ReservaModal isOpen={showReserva} onClose={() => setShowReserva(false)} onSuccess={() => { setShowReserva(false); fetchTurnos(); }} />
    </>
  );
}