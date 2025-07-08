export type UserRole = 'admin' | 'cliente' | 'profesional';
export type TurnoStatus = 'pendiente' | 'confirmado' | 'cancelado' | 'realizado';

// Tipo base que coincide con el backend
export interface IUserBase {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role: UserRole;
    is_admin: boolean;
}

// Tipo extendido para el frontend que incluye _id
export interface IUser extends IUserBase {
    _id: string;
}

export interface AuthResponse {
    token: string;
    user: IUser;
}

// Tipo base que coincide con el backend
export interface IServiceBase {
    nombre: string;
    Image: string;
    tipo: string;
    precio: number;
    descripcion: string;
}

// Tipo extendido para el frontend que incluye _id
export interface IService extends IServiceBase {
    _id: string;
}

// Tipo base para turnos
export interface ITurnoBase {
    cliente: string;
    servicio: string;
    fecha: Date | string;
    hora: string;
    estado: TurnoStatus;
}

// ITurno con la misma estructura que en interfaces.ts para mantener compatibilidad
export interface ITurno {
    _id: string;
    cliente: string;
    servicio: string;
    fecha: Date;
    hora: string;
    estado: TurnoStatus;
    map(arg0: (turno: ITurno, index: number) => JSX.Element): import("react").ReactNode;
}

// Tipo expandido con objetos populados (puedes usarlo en componentes específicos)
export interface ITurnoPopulated {
    _id: string;
    cliente: {
        _id: string;
        first_name: string;
        last_name: string;
        email?: string;
    };
    servicio: {
        _id: string;
        nombre: string;
        precio: number;
        descripcion?: string;
        Image?: string;
        tipo?: string;
    };
    profesional: {
        _id: string;
        first_name: string;
        last_name: string;
        email?: string;
        role: UserRole;
    };
    fecha: Date | string;
    hora: string;
    estado: TurnoStatus;
}

// Tipo para la creación de turnos desde el frontend
export interface ICreateTurnoRequest {
    cliente: string;
    servicio: string;
    fecha: string | Date;
    hora: string;
    estado: TurnoStatus;
}