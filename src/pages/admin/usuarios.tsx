'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Shield,
  Mail,
  Crown,
  Users,
  AlertCircle,
  Plus
} from 'lucide-react';
import PageHero from '@/components/PageHero';
import UsuarioModal from '@/components/admin/UsuarioModal';
import LoadingScreen from '@/components/LoadingScreen';
import { IUser } from '@/types';

export default function AdminUsuariosPage() {
  const { user, isAdmin, isAuthLoaded } = useAuth();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('todos');

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
    
    fetchUsuarios();
  }, [user, isAdmin, isAuthLoaded, router]);

  const fetchUsuarios = async (retryCount = 0, maxRetries = 3) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Obteniendo usuarios...");
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No se encontró token de autenticación');
        router.push('/login');
        return;
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_USER}?token=${token}`, {
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
              fetchUsuarios(retryCount + 1, maxRetries);
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
      
      setUsuarios(data);
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
          fetchUsuarios(retryCount + 1, maxRetries);
        }, (retryCount + 1) * 3000);
        return;
      }
      
      // Mensaje de error específico
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar los usuarios';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${userName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No se encontró token de autenticación');
        router.push('/login');
        return;
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_USER}/${userId}?token=${token}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) throw new Error('Error al eliminar el usuario');
      
      toast.success(`Usuario "${userName}" eliminado exitosamente`);
      fetchUsuarios(); // Refresh the list
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el usuario');
    }
  };

  const handleOpenModal = (usuario: IUser) => {
    setEditingUser(usuario);
    setIsModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = () => {
    fetchUsuarios(); // Refresh the list after saving
  };

  // Filter usuarios based on search term and role
  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = 
      usuario.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'todos' || usuario.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'profesional':
        return 'bg-blue-100 text-blue-800';
      case 'cliente':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'profesional':
        return 'Profesional';
      case 'cliente':
        return 'Cliente';
      default:
        return role;
    }
  };

  if (!isAuthLoaded || loading) {
    return (
      <LoadingScreen
        title="Gestión de Usuarios"
        description="Panel de administración"
        message="Cargando usuarios..."
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHero 
          title="Gestión de Usuarios" 
          description="Panel de administración" 
        />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar usuarios</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchUsuarios()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHero 
        title="Gestión de Usuarios" 
        description="Administra usuarios y sus roles en el sistema" 
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with stats and actions */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center space-x-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-gray-600">Total Usuarios</p>
                    <p className="text-2xl font-bold text-primary">{usuarios.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center space-x-3">
                  <Crown className="h-8 w-8 text-amber-500" />
                  <div>
                    <p className="text-sm text-gray-600">Administradores</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {usuarios.filter(u => u.role === 'admin').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón Crear Usuario */}
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center space-x-2 bg-primary text-white px-4 py-3 rounded-lg shadow-sm hover:bg-primary/90 transition-colors self-start md:self-auto"
            >
              <Plus className="h-5 w-5" />
              <span>Crear usuario</span>
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Role Filter */}
              <div className="md:w-48">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent appearance-none"
                    aria-label="Filtrar por rol"
                    title="Filtrar por rol"
                  >
                    <option value="todos">Todos los roles</option>
                    <option value="cliente">Clientes</option>
                    <option value="profesional">Profesionales</option>
                    <option value="admin">Administradores</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" id="usuarios-table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Privilegios
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No se encontraron usuarios</p>
                      <p className="text-sm">
                        {searchTerm || roleFilter !== 'todos' 
                          ? 'Intenta ajustar los filtros de búsqueda'
                          : 'No hay usuarios disponibles en el sistema'
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsuarios.map((usuario) => (
                    <tr key={usuario._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {usuario.first_name} {usuario.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="h-4 w-4 text-gray-400 mr-2" />
                          {usuario.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(usuario.role)}`}>
                          {getRoleDisplayName(usuario.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {usuario.is_admin ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              <Crown className="h-3 w-3 mr-1" />
                              Administrador
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                              Usuario estándar
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenModal(usuario)}
                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar usuario"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(usuario._id, `${usuario.first_name} ${usuario.last_name}`)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results count */}
        {filteredUsuarios.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Mostrando {filteredUsuarios.length} de {usuarios.length} usuarios
          </div>
        )}
      </div>

      {/* Usuario Modal */}
      {isModalOpen && (
        <UsuarioModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          usuario={editingUser}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}