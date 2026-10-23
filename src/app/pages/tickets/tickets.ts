import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TecnicoService } from '../../services/tecnico.service';
import { TicketService } from '../../services/ticket.service';
import { TecnicoItem } from '../../models/tecnico.model';
import {
  CategoriaItem,
  ComentarioTicketItem,
  EstadoTicketItem,
  HistorialTicketItem,
  PrioridadItem,
  TicketItem,
} from '../../models/ticket.model';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css',
})
export class Tickets implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly tecnicoService = inject(TecnicoService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  modo: 'todos' | 'mios' | 'asignados' = 'todos';
  tickets: TicketItem[] = [];
  categorias: CategoriaItem[] = [];
  prioridades: PrioridadItem[] = [];
  estados: EstadoTicketItem[] = [];
  tecnicos: TecnicoItem[] = [];

  cargando = false;
  mensaje = '';
  error = '';
  filtroTexto = '';
  filtroEstado = 'TODOS';
  filtroPrioridad = 'TODAS';
  filtroCategoria = 'TODAS';

  mostrarModalFormulario = false;
  editando = false;
  idTicketEditar: number | null = null;
  guardandoTicket = false;
  errorModalFormulario = '';
  erroresFormulario: Record<string, string> = {};
  formulario = { titulo: '', descripcion: '', idCategoria: 0, idPrioridad: 0 };

  mostrarModalDetalle = false;
  ticketDetalle: TicketItem | null = null;
  historial: HistorialTicketItem[] = [];
  comentarios: ComentarioTicketItem[] = [];
  comentarioNuevo = '';
  errorComentario = '';
  enviandoComentario = false;

  mostrarModalAsignar = false;
  tecnicoSeleccionado = 0;
  descripcionAsignacion = '';
  errorAsignar = '';

  mostrarModalEstado = false;
  estadoSeleccionado = 0;
  descripcionEstado = '';
  solucionEstado = '';
  errorEstado = '';

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.modo = (data['modo'] || 'todos') as typeof this.modo;
      this.cargarDatos();
    });
  }

  get idUsuarioActual(): number {
    return this.authService.getIdUsuario() || 0;
  }
  get rol(): string {
    return this.authService.getRol() || '';
  }
  get esAdmin(): boolean {
    return this.rol === 'ROLE_ADMIN';
  }
  get esTecnico(): boolean {
    return this.rol === 'ROLE_TECNICO';
  }
  get esUsuario(): boolean {
    return this.rol === 'ROLE_USUARIO';
  }

  get tituloPagina(): string {
    if (this.modo === 'mios') return 'Mis tickets';
    if (this.modo === 'asignados') return 'Mis tickets asignados';
    return 'Todos los tickets';
  }

  get subtituloPagina(): string {
    if (this.modo === 'mios') return 'Consulta el estado y seguimiento de tus solicitudes.';
    if (this.modo === 'asignados')
      return 'Gestiona únicamente los tickets asignados a tu perfil técnico.';
    return 'Supervisa, asigna y gestiona cada solicitud de soporte.';
  }

  get ticketsFiltrados(): TicketItem[] {
    const termino = this.filtroTexto.trim().toLowerCase();
    return this.tickets.filter((t) => {
      const coincideTexto =
        !termino ||
        (t.codigoTicket || '').toLowerCase().includes(termino) ||
        (t.titulo || '').toLowerCase().includes(termino) ||
        (t.usuarioCreador || '').toLowerCase().includes(termino) ||
        (t.tecnicoAsignado || '').toLowerCase().includes(termino);
      const coincideEstado = this.filtroEstado === 'TODOS' || t.estado === this.filtroEstado;
      const coincidePrioridad =
        this.filtroPrioridad === 'TODAS' || t.prioridad === this.filtroPrioridad;
      const coincideCategoria =
        this.filtroCategoria === 'TODAS' || t.categoria === this.filtroCategoria;
      return coincideTexto && coincideEstado && coincidePrioridad && coincideCategoria;
    });
  }

  get ticketCerrado(): boolean {
    return (this.ticketDetalle?.estado || '').toUpperCase() === 'CERRADO';
  }
  get nombreEstadoSeleccionado(): string {
    return this.estados.find((e) => e.idEstado === this.estadoSeleccionado)?.nombre || '';
  }
  get estadosDisponiblesCambio(): EstadoTicketItem[] {
    if (this.esAdmin) return this.estados;
    if (this.esTecnico) return this.estados.filter((e) => e.nombre !== 'CERRADO');
    return [];
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = '';
    this.ticketService.listarTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets || [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.error = this.extraerError(err, 'No se pudieron cargar los tickets.');
        this.cdr.detectChanges();
      },
    });
    this.ticketService.listarCategorias().subscribe({
      next: (r) => {
        this.categorias = (r || []).filter((c) => c.estado !== false);
        this.cdr.detectChanges();
      },
    });
    this.ticketService.listarPrioridades().subscribe({
      next: (r) => {
        this.prioridades = r || [];
        this.cdr.detectChanges();
      },
    });
    this.ticketService.listarEstados().subscribe({
      next: (r) => {
        this.estados = r || [];
        this.cdr.detectChanges();
      },
    });
    if (this.esAdmin) {
      this.tecnicoService.listarTecnicosActivos().subscribe({
        next: (r) => {
          if (r.rpta === 1 && r.body) this.tecnicos = r.body;
          this.cdr.detectChanges();
        },
      });
    }
  }

  abrirNuevoTicket(): void {
    this.editando = false;
    this.idTicketEditar = null;
    this.errorModalFormulario = '';
    this.erroresFormulario = {};
    this.formulario = { titulo: '', descripcion: '', idCategoria: 0, idPrioridad: 0 };
    this.mostrarModalFormulario = true;
  }

  abrirEditar(t: TicketItem): void {
    if (this.esCerrado(t)) return;
    this.editando = true;
    this.idTicketEditar = t.idTicket;
    this.errorModalFormulario = '';
    this.erroresFormulario = {};
    this.formulario = {
      titulo: t.titulo,
      descripcion: t.descripcion,
      idCategoria: t.idCategoria,
      idPrioridad: t.idPrioridad,
    };
    this.mostrarModalFormulario = true;
  }

  guardarTicket(): void {
    this.errorModalFormulario = '';
    this.erroresFormulario = {};
    if (!this.validarFormularioTicket()) return;
    this.guardandoTicket = true;

    if (this.editando && this.idTicketEditar) {
      this.ticketService
        .actualizarTicket(this.idTicketEditar, {
          ...this.formulario,
          titulo: this.formulario.titulo.trim(),
          descripcion: this.formulario.descripcion.trim(),
        })
        .subscribe({
          next: () => {
            this.guardandoTicket = false;
            this.exitoYRecargar('Ticket actualizado correctamente.');
          },
          error: (e) => {
            this.guardandoTicket = false;
            this.errorModalFormulario = this.extraerError(e, 'No se pudo actualizar el ticket.');
            this.cdr.detectChanges();
          },
        });
      return;
    }

    this.ticketService
      .crearTicket({
        ...this.formulario,
        titulo: this.formulario.titulo.trim(),
        descripcion: this.formulario.descripcion.trim(),
      })
      .subscribe({
        next: () => {
          this.guardandoTicket = false;
          this.exitoYRecargar('Ticket creado correctamente.');
        },
        error: (e) => {
          this.guardandoTicket = false;
          this.errorModalFormulario = this.extraerError(e, 'No se pudo crear el ticket.');
          this.cdr.detectChanges();
        },
      });
  }

  verDetalle(t: TicketItem): void {
    this.mostrarModalDetalle = true;
    this.ticketDetalle = t;
    this.comentarioNuevo = '';
    this.errorComentario = '';
    this.cargarDetalle(t.idTicket);
  }

  cargarDetalle(id: number): void {
    this.ticketService.obtenerTicket(id).subscribe({
      next: (r) => {
        this.ticketDetalle = r;
        this.cdr.detectChanges();
      },
    });
    this.ticketService.listarHistorial(id).subscribe({
      next: (r) => {
        this.historial = r || [];
        this.cdr.detectChanges();
      },
    });
    this.ticketService.listarComentarios(id).subscribe({
      next: (r) => {
        this.comentarios = r || [];
        this.cdr.detectChanges();
      },
    });
  }

  agregarComentario(): void {
    if (!this.ticketDetalle || this.ticketCerrado) return;
    this.errorComentario = '';
    const comentario = this.comentarioNuevo.trim();
    if (!comentario) {
      this.errorComentario = 'Escribe un comentario antes de enviarlo.';
      return;
    }
    if (comentario.length > 4000) {
      this.errorComentario = 'El comentario no puede superar 4000 caracteres.';
      return;
    }
    this.enviandoComentario = true;
    this.ticketService.agregarComentario(this.ticketDetalle.idTicket, { comentario }).subscribe({
      next: () => {
        this.enviandoComentario = false;
        this.comentarioNuevo = '';
        this.cargarDetalle(this.ticketDetalle!.idTicket);
      },
      error: (e) => {
        this.enviandoComentario = false;
        this.errorComentario = this.extraerError(e, 'No se pudo agregar el comentario.');
        this.cdr.detectChanges();
      },
    });
  }

  abrirAsignar(t: TicketItem): void {
    if (this.esCerrado(t)) return;
    this.ticketDetalle = t;
    this.tecnicoSeleccionado = t.idTecnicoAsignado || 0;
    this.descripcionAsignacion = '';
    this.errorAsignar = '';
    this.mostrarModalAsignar = true;
  }

  asignarTecnico(): void {
    if (!this.ticketDetalle) return;
    this.errorAsignar = '';
    if (!this.tecnicoSeleccionado) {
      this.errorAsignar = 'Selecciona un técnico disponible.';
      return;
    }
    this.ticketService
      .asignarTecnico(this.ticketDetalle.idTicket, {
        idTecnico: this.tecnicoSeleccionado,
        descripcion: this.descripcionAsignacion.trim(),
      })
      .subscribe({
        next: () => this.exitoYRecargar('Técnico asignado correctamente.'),
        error: (e) => {
          this.errorAsignar = this.extraerError(e, 'No se pudo asignar el técnico.');
          this.cdr.detectChanges();
        },
      });
  }

  abrirCambiarEstado(t: TicketItem): void {
    if (!this.esAdmin && this.esCerrado(t)) return;
    this.ticketDetalle = t;
    this.estadoSeleccionado = t.idEstado;
    this.descripcionEstado = '';
    this.solucionEstado = t.solucion || '';
    this.errorEstado = '';
    this.mostrarModalEstado = true;
  }

  cambiarEstado(): void {
    if (!this.ticketDetalle || !this.estadoSeleccionado) return;
    this.errorEstado = '';
    if (this.estadoSeleccionado === this.ticketDetalle.idEstado) {
      this.errorEstado = 'Selecciona un estado diferente al actual.';
      return;
    }
    if (this.nombreEstadoSeleccionado === 'RESUELTO' && !this.solucionEstado.trim()) {
      this.errorEstado = 'Registra la solución aplicada para marcar el ticket como resuelto.';
      return;
    }
    this.ticketService
      .cambiarEstado(this.ticketDetalle.idTicket, {
        idEstado: this.estadoSeleccionado,
        descripcion: this.descripcionEstado.trim(),
        solucion: this.solucionEstado.trim(),
      })
      .subscribe({
        next: () => this.exitoYRecargar('Estado actualizado correctamente.'),
        error: (e) => {
          this.errorEstado = this.extraerError(e, 'No se pudo cambiar el estado.');
          this.cdr.detectChanges();
        },
      });
  }

  puedeEditar(t: TicketItem): boolean {
    if (this.esCerrado(t)) return false;
    return this.esAdmin || (this.esUsuario && t.estado === 'CREADO');
  }

  puedeAsignar(t: TicketItem): boolean {
    return this.esAdmin && !this.esCerrado(t);
  }
  puedeGestionarEstado(t: TicketItem): boolean {
    return this.esAdmin || (this.esTecnico && !this.esCerrado(t));
  }
  esCerrado(t: TicketItem): boolean {
    return (t.estado || '').toUpperCase() === 'CERRADO';
  }

  nombreComentario(c: ComentarioTicketItem): string {
    return c.idUsuario === this.idUsuarioActual ? 'Tú' : c.nombreUsuario || 'Usuario';
  }

  inicialesComentario(c: ComentarioTicketItem): string {
    if (c.idUsuario === this.idUsuarioActual) return 'TÚ';
    return this.obtenerIniciales(c.nombreUsuario || 'Usuario');
  }

  rolComentario(c: ComentarioTicketItem): string {
    if (c.idUsuario === this.idUsuarioActual) return '';
    if (c.rolUsuario === 'TECNICO') return 'Técnico';
    if (c.rolUsuario === 'ADMIN') return 'Administrador';
    return 'Usuario';
  }

  formatearPrioridad(v: string): string {
    const p = (v || '').toUpperCase();
    if (p === 'CRITICA' || p === 'CRÍTICA') return 'Crítica';
    return p.charAt(0) + p.slice(1).toLowerCase();
  }

  formatearEstado(v: string): string {
    return (v || '')
      .toLowerCase()
      .replaceAll('_', ' ')
      .replace(/^./, (c) => c.toUpperCase());
  }
  obtenerIniciales(nombre?: string | null): string {
    return nombre
      ? nombre
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((p) => p[0])
          .join('')
          .toUpperCase()
      : '--';
  }
  esCritica(v: string): boolean {
    return ['CRITICA', 'CRÍTICA'].includes((v || '').toUpperCase());
  }

  private validarFormularioTicket(): boolean {
    const titulo = this.formulario.titulo.trim();
    const descripcion = this.formulario.descripcion.trim();
    if (!titulo) this.erroresFormulario['titulo'] = 'El título es obligatorio.';
    else if (titulo.length > 200)
      this.erroresFormulario['titulo'] = 'El título no puede superar 200 caracteres.';
    if (!descripcion) this.erroresFormulario['descripcion'] = 'La descripción es obligatoria.';
    else if (descripcion.length > 4000)
      this.erroresFormulario['descripcion'] = 'La descripción no puede superar 4000 caracteres.';
    if (!this.formulario.idCategoria)
      this.erroresFormulario['idCategoria'] = 'Selecciona una categoría.';
    if (!this.formulario.idPrioridad)
      this.erroresFormulario['idPrioridad'] = 'Selecciona una prioridad.';
    return Object.keys(this.erroresFormulario).length === 0;
  }

  private exitoYRecargar(mensaje: string): void {
    this.mensaje = mensaje;
    this.error = '';
    this.mostrarModalFormulario = false;
    this.mostrarModalAsignar = false;
    this.mostrarModalEstado = false;
    this.cargarDatos();
    if (this.ticketDetalle) this.cargarDetalle(this.ticketDetalle.idTicket);
    setTimeout(() => {
      this.mensaje = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  private extraerError(error: any, fallback: string): string {
    return error?.error?.detail || error?.error?.message || error?.error?.mensaje || fallback;
  }
}
