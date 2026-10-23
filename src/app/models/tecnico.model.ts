export interface EspecialidadItem {
  idEspecialidad: number;
  nombre: string;
  descripcion?: string;
  estado: boolean;
}

export interface TecnicoItem {
  idTecnico: number;
  idUsuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono?: string;
  idEspecialidad: number;
  especialidad: string;
  disponibilidad: string;
  estado: boolean;
}

export interface NuevoTecnicoRequest {
  idUsuario: number;
  idEspecialidad: number;
  disponibilidad: string;
}

export interface ActualizarTecnicoRequest {
  idEspecialidad: number;
  disponibilidad: string;
  estado?: boolean;
}

export interface NuevaEspecialidadRequest {
  nombre: string;
  descripcion?: string;
}

export interface ActualizarEspecialidadRequest {
  nombre: string;
  descripcion?: string;
  estado?: boolean;
}
