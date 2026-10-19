export interface GenericResponse<T> {
  tipo: string;
  rpta: number;
  mensaje: string;
  body: T;
}
