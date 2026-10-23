import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { GenericResponse } from '../models/generic-response.model';
import {
  ActualizarPerfilRequest,
  ActualizarUsuarioRequest,
  NuevoUsuarioRequest,
  Rol,
  Usuario,
} from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly usuariosUrl = `${environment.apiUrl}/usuarios`;
  private readonly rolesUrl = `${environment.apiUrl}/roles`;

  // GET /api/usuarios
  listarUsuarios(): Observable<GenericResponse<Usuario[]>> {
    return this.http.get<GenericResponse<Usuario[]>>(this.usuariosUrl);
  }

  // GET /api/usuarios/{id}
  obtenerPorId(id: number): Observable<GenericResponse<Usuario>> {
    return this.http.get<GenericResponse<Usuario>>(`${this.usuariosUrl}/${id}`);
  }

  // GET /api/usuarios/perfil - datos del usuario autenticado
  obtenerPerfil(): Observable<GenericResponse<Usuario>> {
    return this.http.get<GenericResponse<Usuario>>(`${this.usuariosUrl}/perfil`);
  }

  // POST /api/usuarios
  crearUsuario(dto: NuevoUsuarioRequest): Observable<GenericResponse<Usuario>> {
    return this.http.post<GenericResponse<Usuario>>(this.usuariosUrl, dto);
  }

  // PUT /api/usuarios/{id}
  actualizarUsuario(
    id: number,
    dto: ActualizarUsuarioRequest,
  ): Observable<GenericResponse<Usuario>> {
    return this.http.put<GenericResponse<Usuario>>(`${this.usuariosUrl}/${id}`, dto);
  }

  // DELETE /api/usuarios/{id}
  desactivarUsuario(id: number): Observable<GenericResponse<void>> {
    return this.http.delete<GenericResponse<void>>(`${this.usuariosUrl}/${id}`);
  }

  // GET /api/roles
  listarRoles(): Observable<GenericResponse<Rol[]>> {
    return this.http.get<GenericResponse<Rol[]>>(this.rolesUrl);
  }

  // PUT /api/usuarios/perfil
  actualizarPerfil(dto: ActualizarPerfilRequest): Observable<GenericResponse<Usuario>> {
    return this.http.put<GenericResponse<Usuario>>(`${this.usuariosUrl}/perfil`, dto);
  }
}
