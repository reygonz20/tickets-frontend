import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { GenericResponse } from '../models/generic-response.model';
import {
  ActualizarEspecialidadRequest,
  ActualizarTecnicoRequest,
  EspecialidadItem,
  NuevaEspecialidadRequest,
  NuevoTecnicoRequest,
  TecnicoItem,
} from '../models/tecnico.model';

@Injectable({
  providedIn: 'root',
})
export class TecnicoService {
  private readonly http = inject(HttpClient);
  private readonly tecnicosUrl = `${environment.apiUrl}/tecnicos`;
  private readonly especialidadesUrl = `${environment.apiUrl}/especialidades`;

  // =========================
  // TÉCNICOS
  // =========================

  // GET /api/tecnicos
  listarTecnicos(): Observable<GenericResponse<TecnicoItem[]>> {
    return this.http.get<GenericResponse<TecnicoItem[]>>(this.tecnicosUrl);
  }

  // GET /api/tecnicos/activos
  listarTecnicosActivos(): Observable<GenericResponse<TecnicoItem[]>> {
    return this.http.get<GenericResponse<TecnicoItem[]>>(`${this.tecnicosUrl}/activos`);
  }

  // GET /api/tecnicos/disponibles
  listarTecnicosDisponibles(): Observable<GenericResponse<TecnicoItem[]>> {
    return this.http.get<GenericResponse<TecnicoItem[]>>(`${this.tecnicosUrl}/disponibles`);
  }

  // GET /api/tecnicos/usuario/{idUsuario}
  obtenerTecnicoPorUsuario(idUsuario: number): Observable<GenericResponse<TecnicoItem>> {
    return this.http.get<GenericResponse<TecnicoItem>>(`${this.tecnicosUrl}/usuario/${idUsuario}`);
  }

  // PATCH /api/tecnicos/{id}/disponibilidad
  cambiarDisponibilidad(
    id: number,
    disponibilidad: string,
  ): Observable<GenericResponse<TecnicoItem>> {
    return this.http.patch<GenericResponse<TecnicoItem>>(
      `${this.tecnicosUrl}/${id}/disponibilidad`,
      { disponibilidad },
    );
  }

  // GET /api/tecnicos/{id}
  obtenerTecnicoPorId(id: number): Observable<GenericResponse<TecnicoItem>> {
    return this.http.get<GenericResponse<TecnicoItem>>(`${this.tecnicosUrl}/${id}`);
  }

  // POST /api/tecnicos
  crearTecnico(dto: NuevoTecnicoRequest): Observable<GenericResponse<TecnicoItem>> {
    return this.http.post<GenericResponse<TecnicoItem>>(this.tecnicosUrl, dto);
  }

  // PUT /api/tecnicos/{id}
  actualizarTecnico(
    id: number,
    dto: ActualizarTecnicoRequest,
  ): Observable<GenericResponse<TecnicoItem>> {
    return this.http.put<GenericResponse<TecnicoItem>>(`${this.tecnicosUrl}/${id}`, dto);
  }

  // DELETE /api/tecnicos/{id}
  desactivarTecnico(id: number): Observable<GenericResponse<void>> {
    return this.http.delete<GenericResponse<void>>(`${this.tecnicosUrl}/${id}`);
  }

  // =========================
  // ESPECIALIDADES
  // =========================

  // GET /api/especialidades
  listarEspecialidades(): Observable<GenericResponse<EspecialidadItem[]>> {
    return this.http.get<GenericResponse<EspecialidadItem[]>>(this.especialidadesUrl);
  }

  // GET /api/especialidades/activas
  listarEspecialidadesActivas(): Observable<GenericResponse<EspecialidadItem[]>> {
    return this.http.get<GenericResponse<EspecialidadItem[]>>(`${this.especialidadesUrl}/activas`);
  }

  // POST /api/especialidades
  crearEspecialidad(dto: NuevaEspecialidadRequest): Observable<GenericResponse<EspecialidadItem>> {
    return this.http.post<GenericResponse<EspecialidadItem>>(this.especialidadesUrl, dto);
  }

  // PUT /api/especialidades/{id}
  actualizarEspecialidad(
    id: number,
    dto: ActualizarEspecialidadRequest,
  ): Observable<GenericResponse<EspecialidadItem>> {
    return this.http.put<GenericResponse<EspecialidadItem>>(`${this.especialidadesUrl}/${id}`, dto);
  }

  // DELETE /api/especialidades/{id}
  desactivarEspecialidad(id: number): Observable<GenericResponse<void>> {
    return this.http.delete<GenericResponse<void>>(`${this.especialidadesUrl}/${id}`);
  }
}
