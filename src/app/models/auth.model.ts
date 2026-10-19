export interface LoginRequest {
  correo: string;
  password: string;
}

export interface JwtDto {
  token: string;
  bearer: string;
  idUsuario: number;
  correo: string;
  nombres: string;
  rol: string;
}

export interface Usuario {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  rol: string;
  estado: boolean;
  fechaCreacion: string;
}

export interface NuevoUsuarioRequest {
  correo: string;
  password?: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  rolAsignado: string;
  estado?: boolean;
}

export interface Rol {
  idRol: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
}

export interface ActualizarPerfilRequest {
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  password?: string;
}
export interface ActualizarUsuarioRequest {
  correo: string;
  password?: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  rolAsignado: string;
  estado?: boolean;
}
