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

// Funciones para otros endpoints (por implementar cuando sean necesarias)
export const serviceApi = {
  getAll: async (): Promise<IService[]> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_SERVICE}`);
    return response.map(mapServiceFromApi);
  },

  getById: async (id: string): Promise<IService> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_SERVICE}/${id}`);
    return mapServiceFromApi(response);
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