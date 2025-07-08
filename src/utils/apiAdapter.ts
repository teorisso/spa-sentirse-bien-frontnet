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
  // Obtener turnos con filtros
  getAll: async (filters?: {
    clienteId?: string;
    profesionalId?: string;
    servicioId?: string;
    estado?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<any>> => {
    const params = new URLSearchParams();
    
    // Usar PascalCase para los parámetros que espera el backend ASP.NET
    if (filters?.clienteId) params.append('ClienteId', filters.clienteId);
    if (filters?.profesionalId) params.append('ProfesionalId', filters.profesionalId);
    if (filters?.servicioId) params.append('ServicioId', filters.servicioId);
    if (filters?.estado) params.append('Estado', filters.estado);
    if (filters?.fechaDesde) params.append('FechaDesde', filters.fechaDesde);
    if (filters?.fechaHasta) params.append('FechaHasta', filters.fechaHasta);
    if (filters?.page) params.append('Page', filters.page.toString());
    if (filters?.pageSize) params.append('PageSize', filters.pageSize.toString());

    const url = `${process.env.NEXT_PUBLIC_API_TURNO}?${params.toString()}`;
    const response = await apiRequest(url);
    return response;
  },

  // Obtener turno por ID
  getById: async (id: string): Promise<any> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_TURNO}/${id}`);
    return response;
  },

  // Crear nuevo turno
  create: async (turnoData: {
    clienteId: string;
    servicioId: string;
    profesionalId: string;
    fecha: string;
    hora: string;
    notas?: string;
  }): Promise<any> => {
    // Convertir a formato PascalCase que espera el backend ASP.NET
    const createData = {
      ClienteId: turnoData.clienteId,
      ServicioId: turnoData.servicioId,
      ProfesionalId: turnoData.profesionalId,
      Fecha: turnoData.fecha,
      Hora: turnoData.hora,
      Notas: turnoData.notas
    };

    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_TURNO}`, {
      method: 'POST',
      body: JSON.stringify(createData),
    });
    return response;
  },

  // Actualizar turno
  update: async (id: string, updateData: {
    profesionalId?: string;
    fecha?: string;
    hora?: string;
    estado?: string;
    notas?: string;
    precioPagado?: number;
  }): Promise<any> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_TURNO}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return response;
  },

  // Cancelar turno
  cancel: async (id: string): Promise<void> => {
    await apiRequest(`${process.env.NEXT_PUBLIC_API_TURNO}/${id}`, {
      method: 'DELETE',
    });
  },

  // Obtener disponibilidad
  getDisponibilidad: async (profesionalId: string, fecha: string): Promise<string[]> => {
    const params = new URLSearchParams();
    params.append('profesionalId', profesionalId);
    params.append('fecha', fecha);
    
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_TURNO}/disponibilidad?${params.toString()}`);
    return response;
  },
};

export const paymentApi = {
  // Obtener pagos con filtros
  getAll: async (filters?: {
    clienteId?: string;
    estado?: string;
    metodoPago?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    montoMinimo?: number;
    montoMaximo?: number;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<any>> => {
    const params = new URLSearchParams();
    
    if (filters?.clienteId) params.append('clienteId', filters.clienteId);
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.metodoPago) params.append('metodoPago', filters.metodoPago);
    if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde);
    if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta);
    if (filters?.montoMinimo) params.append('montoMinimo', filters.montoMinimo.toString());
    if (filters?.montoMaximo) params.append('montoMaximo', filters.montoMaximo.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

    const url = `${process.env.NEXT_PUBLIC_API_PAYMENT}?${params.toString()}`;
    const response = await apiRequest(url);
    return response;
  },

  // Obtener pago por ID
  getById: async (id: string): Promise<any> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_PAYMENT}/${id}`);
    return response;
  },

  // Crear nuevo pago
  create: async (paymentData: {
    turnoId: string;
    monto: number;
    metodoPago: string;
    paymentDetails?: any;
    notas?: string;
  }): Promise<any> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_PAYMENT}`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
    return response;
  },

  // Procesar pago
  process: async (paymentData: {
    paymentId: string;
    transactionId?: string;
    authorizationCode?: string;
    notas?: string;
  }): Promise<any> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_PAYMENT}/process`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
    return response;
  },

  // Reembolsar pago
  refund: async (id: string, motivo: string): Promise<any> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_PAYMENT}/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    });
    return response;
  },

  // Obtener estadísticas (solo admins)
  getStats: async (fechaDesde?: string, fechaHasta?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);
    
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_PAYMENT}/stats?${params.toString()}`);
    return response;
  },
};

export const userApi = {
  // Obtener todos los usuarios (solo admins)
  getAll: async (role?: string): Promise<IUser[]> => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    
    const url = `${process.env.NEXT_PUBLIC_API_USER}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await apiRequest(url);
    
    if (Array.isArray(response)) {
      return response.map(mapUserFromApi);
    }
    return [];
  },

  // Obtener profesionales específicamente
  getProfesionales: async (): Promise<IUser[]> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_USER}/profesionales`);
    
    if (Array.isArray(response)) {
      return response.map(mapUserFromApi);
    }
    return [];
  },

  // Obtener clientes (solo admins)
  getClientes: async (): Promise<IUser[]> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_USER}/clientes`);
    
    if (Array.isArray(response)) {
      return response.map(mapUserFromApi);
    }
    return [];
  },

  // Obtener usuario por ID
  getById: async (id: string): Promise<IUser> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_USER}/${id}`);
    return mapUserFromApi(response);
  },

  // Obtener perfil del usuario actual
  getProfile: async (): Promise<IUser> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_USER}/profile`);
    return mapUserFromApi(response);
  },
};

export const qrApi = {
  // Generar código QR
  generate: async (qrData: {
    action: string;
    userId?: string;
    turnoId?: string;
    data?: Record<string, any>;
    expirationMinutes?: number;
  }): Promise<any> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_QR}/generate`, {
      method: 'POST',
      body: JSON.stringify({
        action: qrData.action,
        userId: qrData.userId,
        turnoId: qrData.turnoId,
        data: qrData.data,
        expirationMinutes: qrData.expirationMinutes || 60
      }),
    });
    return response;
  },

  // Generar QR para check-in de turno
  generateCheckin: async (turnoId: string): Promise<any> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_QR}/turno/${turnoId}/checkin`, {
      method: 'POST',
    });
    return response;
  },

  // Obtener información de QR
  getInfo: async (token: string): Promise<any> => {
    const response = await apiRequest(`${process.env.NEXT_PUBLIC_API_QR}/info/${token}`);
    return response;
  },

  // Obtener historial de QRs (solo admins)
  getHistory: async (filters?: {
    page?: number;
    pageSize?: number;
    action?: string;
    isUsed?: boolean;
  }): Promise<PaginatedResponse<any>> => {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters?.action) params.append('action', filters.action);
    if (filters?.isUsed !== undefined) params.append('isUsed', filters.isUsed.toString());

    const url = `${process.env.NEXT_PUBLIC_API_QR}/history?${params.toString()}`;
    const response = await apiRequest(url);
    return response;
  },
}; 