import { IUser, IService, ITurno, AuthResponse } from '@/types';

// Función para convertir respuesta de usuario de ASP.NET a formato frontend
export const mapUserFromApi = (apiUser: any): IUser => {
  return {
    _id: apiUser.id || apiUser.Id,
    first_name: apiUser.firstName || apiUser.FirstName,
    last_name: apiUser.lastName || apiUser.LastName,
    email: apiUser.email,
    password: '', // No devolvemos la contraseña
    role: apiUser.role,
    is_admin: apiUser.isAdmin
  };
};

// Función para convertir respuesta de servicio de ASP.NET a formato frontend
export const mapServiceFromApi = (apiService: any): IService => {
  return {
    _id: apiService.id || apiService.Id,
    nombre: apiService.nombre,
    Image: apiService.image || apiService.Image,
    tipo: apiService.tipo,
    precio: apiService.precio,
    descripcion: apiService.descripcion
  };
};

// Interfaz para respuesta paginada
export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Función para convertir respuesta de turno de ASP.NET a formato frontend
export const mapTurnoFromApi = (apiTurno: any): ITurno => {
  return {
    _id: apiTurno.id || apiTurno.Id,
    cliente: apiTurno.clienteId,
    servicio: apiTurno.servicioId,
    fecha: new Date(apiTurno.fecha),
    hora: apiTurno.hora,
    estado: apiTurno.estado,
    map: function(arg0: (turno: ITurno, index: number) => JSX.Element): import("react").ReactNode {
      throw new Error('Function not implemented.');
    }
  };
};

// Función para convertir respuesta de autenticación
export const mapAuthFromApi = (apiResponse: any): AuthResponse => {
  const authData = apiResponse.data || apiResponse;
  
  return {
    token: authData.token,
    user: mapUserFromApi(authData.user)
  };
};

// Función para realizar peticiones con manejo de errores y adaptación
export const apiRequest = async (
  url: string, 
  options: RequestInit = {}
): Promise<any> => {
  try {
    // Agregar headers por defecto
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Agregar token de autorización si existe
    const token = localStorage.getItem('token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Si la API ASP.NET devuelve un error estructurado
      if (data.message) {
        throw new Error(data.message);
      }
      // Si devuelve errores como array
      if (data.errors && Array.isArray(data.errors)) {
        throw new Error(data.errors.join(', '));
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    // La API ASP.NET envuelve las respuestas en { success, message, data }
    // Pero algunas respuestas pueden ser directas
    return data.data !== undefined ? data.data : data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Funciones específicas para cada endpoint
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_AUTH}/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return mapAuthFromApi(response);
  },

  register: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<AuthResponse> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_AUTH}/register`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return mapAuthFromApi(response);
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiRequest(`${process.env.NEXT_PUBLIC_API_AUTH}/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiRequest(`${process.env.NEXT_PUBLIC_API_AUTH}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },
};

// API de servicios con funciones completas
export const serviceApi = {
  // Obtener servicios con paginación y filtros
  getAll: async (options?: {
    page?: number;
    pageSize?: number;
    tipo?: string;
    search?: string;
    includeInactive?: boolean;
  }): Promise<PaginatedResponse<IService>> => {
    const params = new URLSearchParams();
    
    if (options?.page) params.append('page', options.page.toString());
    if (options?.pageSize) params.append('pageSize', options.pageSize.toString());
    if (options?.tipo) params.append('tipo', options.tipo);
    if (options?.search) params.append('search', options.search);
    if (options?.includeInactive) params.append('includeInactive', 'true');

    const url = `${process.env.NEXT_PUBLIC_API_SERVICE}?${params.toString()}`;
    
    // Para respuestas paginadas, necesitamos la respuesta completa, no solo data
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const fullResponse = await response.json();
    
    return {
      data: fullResponse.data.map(mapServiceFromApi),
      totalCount: fullResponse.totalCount,
      page: fullResponse.page,
      pageSize: fullResponse.pageSize,
      totalPages: fullResponse.totalPages,
      hasNext: fullResponse.hasNext,
      hasPrevious: fullResponse.hasPrevious
    };
  },

  // Obtener todos los servicios sin paginación (para compatibilidad)
  getAllSimple: async (): Promise<IService[]> => {
    const url = `${process.env.NEXT_PUBLIC_API_SERVICE}?pageSize=100`;
    
    // Hacer fetch directo para depurar
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Respuesta completa de la API:', data);
    
    // La respuesta tiene estructura: { success, message, data: [...] }
    if (!data.success) {
      throw new Error(data.message || 'Error al obtener servicios');
    }

    if (!Array.isArray(data.data)) {
      console.error('data.data no es un array:', data.data);
      throw new Error('Respuesta de API inválida');
    }

    return data.data.map(mapServiceFromApi);
  },

  // Obtener servicio por ID
  getById: async (id: string): Promise<IService> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_SERVICE}/${id}`);
    return mapServiceFromApi(response);
  },

  // Obtener servicio por nombre
  getByName: async (nombre: string): Promise<IService> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_SERVICE}/name/${encodeURIComponent(nombre)}`);
    return mapServiceFromApi(response);
  },

  // Crear nuevo servicio
  create: async (serviceData: {
    nombre: string;
    image: string;
    tipo?: string;
    precio?: number;
    descripcion?: string;
  }): Promise<IService> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_SERVICE}`, {
      method: 'POST',
      body: JSON.stringify({
        nombre: serviceData.nombre,
        image: serviceData.image,
        tipo: serviceData.tipo,
        precio: serviceData.precio,
        descripcion: serviceData.descripcion
      }),
    });
    return mapServiceFromApi(response);
  },

  // Actualizar servicio existente
  update: async (id: string, serviceData: {
    nombre?: string;
    image?: string;
    tipo?: string;
    precio?: number;
    descripcion?: string;
    isActive?: boolean;
  }): Promise<IService> => {
    const updateData: any = {};
    
    if (serviceData.nombre !== undefined) updateData.nombre = serviceData.nombre;
    if (serviceData.image !== undefined) updateData.image = serviceData.image;
    if (serviceData.tipo !== undefined) updateData.tipo = serviceData.tipo;
    if (serviceData.precio !== undefined) updateData.precio = serviceData.precio;
    if (serviceData.descripcion !== undefined) updateData.descripcion = serviceData.descripcion;
    if (serviceData.isActive !== undefined) updateData.isActive = serviceData.isActive;

    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_SERVICE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return mapServiceFromApi(response);
  },

  // Eliminar servicio (soft delete)
  delete: async (id: string): Promise<void> => {
    await apiRequest(`${process.env.NEXT_PUBLIC_API_SERVICE}/${id}`, {
      method: 'DELETE',
    });
  },

  // Obtener tipos de servicios únicos
  getTypes: async (): Promise<string[]> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_SERVICE}/tipos`);
    return response;
  },
};

export const turnoApi = {
  getAll: async (): Promise<ITurno[]> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_TURNO}`);
    return response.map(mapTurnoFromApi);
  },

  getById: async (id: string): Promise<ITurno> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_TURNO}/${id}`);
    return mapTurnoFromApi(response);
  },
}; 