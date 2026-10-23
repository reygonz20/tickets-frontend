export interface CategoriaItem {
  idCategoria: number;
  nombre: string;
  descripcion?: string;
  estado?: boolean;
}

export interface PrioridadItem {
  idPrioridad: number;
  nombre: string;
}

export interface EstadoTicketItem {
  idEstado: number;
  nombre: string;
  descripcion?: string;
  orden: number;
}

export interface TicketItem {
  idTicket: number;
  codigoTicket: string;
  titulo: string;
  descripcion: string;
  idCategoria: number;
  categoria: string;
  idPrioridad: number;
  prioridad: string;
  idEstado: number;
  estado: string;
  idUsuarioCreador: number;
  usuarioCreador?: string | null;
  correoUsuarioCreador?: string | null;
  idTecnicoAsignado?: number | null;
  tecnicoAsignado?: string | null;
  correoTecnicoAsignado?: string | null;
  solucion?: string | null;
  fechaCreacion?: string;
  fechaAsignacion?: string | null;
  fechaInicioAtencion?: string | null;
  fechaResolucion?: string | null;
  fechaCierre?: string | null;
  fechaActualizacion?: string;
}

export interface CrearTicketRequest {
  titulo: string;
  descripcion: string;
  idCategoria: number;
  idPrioridad: number;
}

export interface ActualizarTicketRequest {
  titulo: string;
  descripcion: string;
  idCategoria: number;
  idPrioridad: number;
}

export interface CambiarEstadoTicketRequest {
  idEstado: number;
  descripcion?: string;
  solucion?: string;
}

export interface AsignarTecnicoRequest {
  idTecnico: number;
  descripcion?: string;
}

export interface HistorialTicketItem {
  idHistorial: number;
  idTicket: number;
  idUsuario: number;
  nombreUsuario?: string | null;
  rolUsuario?: string | null;
  accion: string;
  idEstadoAnterior?: number | null;
  estadoAnterior?: string | null;
  idEstadoNuevo?: number | null;
  estadoNuevo?: string | null;
  descripcion?: string | null;
  fecha: string;
}

export interface ComentarioTicketItem {
  idComentario: number;
  idTicket: number;
  idUsuario: number;
  nombreUsuario?: string | null;
  rolUsuario?: string | null;
  comentario: string;
  fechaComentario: string;
}

export interface NuevoComentarioRequest {
  comentario: string;
}

export interface CategoriaRequest {
  nombre: string;
  descripcion?: string;
  estado?: boolean;
}

export interface PrioridadRequest {
  nombre: string;
}

export interface EstadoTicketRequest {
  nombre: string;
  descripcion?: string;
  orden: number;
}

export interface DashboardTicket {
  total: number;
  creados: number;
  asignados: number;
  enProceso: number;
  pendientes: number;
  resueltos: number;
  cerrados: number;
  criticos: number;
}

export interface TecnicoEstadistica {
  idTecnico: number;
  asignados: number;
  resueltos: number;
}
