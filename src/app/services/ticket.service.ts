import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ActualizarTicketRequest,
  AsignarTecnicoRequest,
  CambiarEstadoTicketRequest,
  CategoriaItem,
  CategoriaRequest,
  ComentarioTicketItem,
  CrearTicketRequest,
  DashboardTicket,
  EstadoTicketItem,
  EstadoTicketRequest,
  HistorialTicketItem,
  NuevoComentarioRequest,
  PrioridadItem,
  PrioridadRequest,
  TecnicoEstadistica,
  TicketItem,
} from '../models/ticket.model';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly ticketsUrl = `${environment.apiUrl}/tickets`;
  private readonly categoriasUrl = `${environment.apiUrl}/categorias`;
  private readonly prioridadesUrl = `${environment.apiUrl}/prioridades`;
  private readonly estadosUrl = `${environment.apiUrl}/estados-ticket`;

  listarTickets(): Observable<TicketItem[]> {
    return this.http.get<TicketItem[]>(this.ticketsUrl);
  }

  obtenerTicket(id: number): Observable<TicketItem> {
    return this.http.get<TicketItem>(`${this.ticketsUrl}/${id}`);
  }

  crearTicket(dto: CrearTicketRequest): Observable<TicketItem> {
    return this.http.post<TicketItem>(this.ticketsUrl, dto);
  }

  actualizarTicket(id: number, dto: ActualizarTicketRequest): Observable<TicketItem> {
    return this.http.put<TicketItem>(`${this.ticketsUrl}/${id}`, dto);
  }

  cambiarEstado(id: number, dto: CambiarEstadoTicketRequest): Observable<TicketItem> {
    return this.http.put<TicketItem>(`${this.ticketsUrl}/${id}/estado`, dto);
  }

  asignarTecnico(id: number, dto: AsignarTecnicoRequest): Observable<TicketItem> {
    return this.http.put<TicketItem>(`${this.ticketsUrl}/${id}/asignar-tecnico`, dto);
  }

  listarHistorial(id: number): Observable<HistorialTicketItem[]> {
    return this.http.get<HistorialTicketItem[]>(`${this.ticketsUrl}/${id}/historial`);
  }

  listarComentarios(id: number): Observable<ComentarioTicketItem[]> {
    return this.http.get<ComentarioTicketItem[]>(`${this.ticketsUrl}/${id}/comentarios`);
  }

  agregarComentario(id: number, dto: NuevoComentarioRequest): Observable<ComentarioTicketItem> {
    return this.http.post<ComentarioTicketItem>(`${this.ticketsUrl}/${id}/comentarios`, dto);
  }

  obtenerDashboard(): Observable<DashboardTicket> {
    return this.http.get<DashboardTicket>(`${this.ticketsUrl}/dashboard`);
  }

  obtenerEstadisticaTecnico(idTecnico: number): Observable<TecnicoEstadistica> {
    return this.http.get<TecnicoEstadistica>(
      `${this.ticketsUrl}/estadisticas/tecnico/${idTecnico}`,
    );
  }

  listarCategorias(): Observable<CategoriaItem[]> {
    return this.http.get<CategoriaItem[]>(this.categoriasUrl);
  }

  crearCategoria(dto: CategoriaRequest): Observable<CategoriaItem> {
    return this.http.post<CategoriaItem>(this.categoriasUrl, dto);
  }

  actualizarCategoria(id: number, dto: CategoriaRequest): Observable<CategoriaItem> {
    return this.http.put<CategoriaItem>(`${this.categoriasUrl}/${id}`, dto);
  }

  desactivarCategoria(id: number): Observable<void> {
    return this.http.delete<void>(`${this.categoriasUrl}/${id}`);
  }

  listarPrioridades(): Observable<PrioridadItem[]> {
    return this.http.get<PrioridadItem[]>(this.prioridadesUrl);
  }

  crearPrioridad(dto: PrioridadRequest): Observable<PrioridadItem> {
    return this.http.post<PrioridadItem>(this.prioridadesUrl, dto);
  }

  actualizarPrioridad(id: number, dto: PrioridadRequest): Observable<PrioridadItem> {
    return this.http.put<PrioridadItem>(`${this.prioridadesUrl}/${id}`, dto);
  }

  eliminarPrioridad(id: number): Observable<void> {
    return this.http.delete<void>(`${this.prioridadesUrl}/${id}`);
  }

  listarEstados(): Observable<EstadoTicketItem[]> {
    return this.http.get<EstadoTicketItem[]>(this.estadosUrl);
  }

  crearEstado(dto: EstadoTicketRequest): Observable<EstadoTicketItem> {
    return this.http.post<EstadoTicketItem>(this.estadosUrl, dto);
  }

  actualizarEstado(id: number, dto: EstadoTicketRequest): Observable<EstadoTicketItem> {
    return this.http.put<EstadoTicketItem>(`${this.estadosUrl}/${id}`, dto);
  }

  eliminarEstado(id: number): Observable<void> {
    return this.http.delete<void>(`${this.estadosUrl}/${id}`);
  }
}
