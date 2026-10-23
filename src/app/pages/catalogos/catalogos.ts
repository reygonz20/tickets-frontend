import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TicketService } from '../../services/ticket.service';
import { CategoriaItem, EstadoTicketItem, PrioridadItem } from '../../models/ticket.model';

@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogos.html',
  styleUrl: './catalogos.css',
})
export class Catalogos implements OnInit {
  private readonly service = inject(TicketService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  categorias: CategoriaItem[] = [];
  prioridades: PrioridadItem[] = [];
  estados: EstadoTicketItem[] = [];
  vista: 'categorias' | 'prioridades' | 'estados' = 'categorias';

  mostrarModal = false;
  editando = false;
  idEditar: number | null = null;
  guardando = false;
  error = '';
  mensaje = '';
  errores: Record<string, string> = {};

  formCategoria = { nombre: '', descripcion: '', estado: true };
  formPrioridad = { nombre: '' };
  formEstado = { nombre: '', descripcion: '', orden: 1 };

  readonly estadosBase = new Set([
    'CREADO',
    'ASIGNADO',
    'EN_PROCESO',
    'PENDIENTE',
    'RESUELTO',
    'CERRADO',
    'CANCELADO',
  ]);

  ngOnInit(): void {
    this.route.data.subscribe((d) => {
      this.vista = (d['vista'] || 'categorias') as typeof this.vista;
      this.cargar();
    });
  }

  cargar(): void {
    this.service.listarCategorias().subscribe({
      next: (r) => {
        this.categorias = r || [];
        this.cdr.detectChanges();
      },
    });
    this.service.listarPrioridades().subscribe({
      next: (r) => {
        this.prioridades = r || [];
        this.cdr.detectChanges();
      },
    });
    this.service.listarEstados().subscribe({
      next: (r) => {
        this.estados = r || [];
        this.cdr.detectChanges();
      },
    });
  }

  get titulo(): string {
    if (this.vista === 'categorias') return 'Categorías';
    if (this.vista === 'prioridades') return 'Prioridades';
    return 'Estados';
  }

  get subtitulo(): string {
    if (this.vista === 'categorias')
      return 'Administra las categorías disponibles para clasificar las solicitudes.';
    if (this.vista === 'prioridades')
      return 'Administra los niveles de prioridad disponibles para los tickets.';
    return 'Administra el flujo de estados disponible durante la atención de tickets.';
  }

  get totalCategoriasActivas(): number {
    return this.categorias.filter((c) => c.estado !== false).length;
  }

  get etiquetaBoton(): string {
    if (this.vista === 'categorias') return 'Nueva categoría';
    if (this.vista === 'prioridades') return 'Nueva prioridad';
    return 'Nuevo estado';
  }

  abrirNuevo(): void {
    this.editando = false;
    this.idEditar = null;
    this.error = '';
    this.errores = {};
    this.formCategoria = { nombre: '', descripcion: '', estado: true };
    this.formPrioridad = { nombre: '' };
    this.formEstado = {
      nombre: '',
      descripcion: '',
      orden: Math.max(0, ...this.estados.map((e) => e.orden || 0)) + 1,
    };
    this.mostrarModal = true;
  }

  editarCategoria(c: CategoriaItem): void {
    this.prepararEdicion(c.idCategoria);
    this.formCategoria = {
      nombre: c.nombre,
      descripcion: c.descripcion || '',
      estado: c.estado !== false,
    };
  }

  editarPrioridad(p: PrioridadItem): void {
    this.prepararEdicion(p.idPrioridad);
    this.formPrioridad = { nombre: p.nombre };
  }

  editarEstado(e: EstadoTicketItem): void {
    this.prepararEdicion(e.idEstado);
    this.formEstado = { nombre: e.nombre, descripcion: e.descripcion || '', orden: e.orden };
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  guardar(): void {
    this.error = '';
    this.errores = {};
    if (!this.validar()) return;
    this.guardando = true;

    if (this.vista === 'categorias') {
      const dto = {
        ...this.formCategoria,
        nombre: this.formCategoria.nombre.trim(),
        descripcion: this.formCategoria.descripcion.trim(),
      };
      const req =
        this.editando && this.idEditar
          ? this.service.actualizarCategoria(this.idEditar, dto)
          : this.service.crearCategoria(dto);
      req.subscribe({ next: () => this.guardadoCorrecto(), error: (e) => this.guardadoError(e) });
      return;
    }

    if (this.vista === 'prioridades') {
      const dto = { nombre: this.formPrioridad.nombre.trim() };
      const req =
        this.editando && this.idEditar
          ? this.service.actualizarPrioridad(this.idEditar, dto)
          : this.service.crearPrioridad(dto);
      req.subscribe({ next: () => this.guardadoCorrecto(), error: (e) => this.guardadoError(e) });
      return;
    }

    const dto = {
      nombre: this.formEstado.nombre.trim(),
      descripcion: this.formEstado.descripcion.trim(),
      orden: Number(this.formEstado.orden),
    };
    const req =
      this.editando && this.idEditar
        ? this.service.actualizarEstado(this.idEditar, dto)
        : this.service.crearEstado(dto);
    req.subscribe({ next: () => this.guardadoCorrecto(), error: (e) => this.guardadoError(e) });
  }

  desactivarCategoria(c: CategoriaItem): void {
    if (!c.estado || !confirm(`¿Desactivar la categoría "${c.nombre}"?`)) return;
    this.service
      .desactivarCategoria(c.idCategoria)
      .subscribe({
        next: () => this.exito('Categoría desactivada.'),
        error: (e) => this.mostrarError(e),
      });
  }

  eliminarPrioridad(p: PrioridadItem): void {
    if (!confirm(`¿Eliminar la prioridad "${p.nombre}"?`)) return;
    this.service
      .eliminarPrioridad(p.idPrioridad)
      .subscribe({
        next: () => this.exito('Prioridad eliminada.'),
        error: (e) => this.mostrarError(e),
      });
  }

  eliminarEstado(e: EstadoTicketItem): void {
    if (this.esEstadoBase(e)) return;
    if (!confirm(`¿Eliminar el estado "${this.formatear(e.nombre)}"?`)) return;
    this.service
      .eliminarEstado(e.idEstado)
      .subscribe({
        next: () => this.exito('Estado eliminado.'),
        error: (err) => this.mostrarError(err),
      });
  }

  esEstadoBase(e: EstadoTicketItem): boolean {
    return this.estadosBase.has((e.nombre || '').toUpperCase());
  }
  formatear(v: string): string {
    return (v || '')
      .toLowerCase()
      .replaceAll('_', ' ')
      .replace(/^./, (c) => c.toUpperCase());
  }

  private prepararEdicion(id: number): void {
    this.editando = true;
    this.idEditar = id;
    this.error = '';
    this.errores = {};
    this.mostrarModal = true;
  }

  private validar(): boolean {
    if (this.vista === 'categorias') {
      if (!this.formCategoria.nombre.trim()) this.errores['nombre'] = 'El nombre es obligatorio.';
      if (this.formCategoria.nombre.trim().length > 100)
        this.errores['nombre'] = 'Máximo 100 caracteres.';
      if (this.formCategoria.descripcion.length > 255)
        this.errores['descripcion'] = 'Máximo 255 caracteres.';
    } else if (this.vista === 'prioridades') {
      if (!this.formPrioridad.nombre.trim()) this.errores['nombre'] = 'El nombre es obligatorio.';
      if (this.formPrioridad.nombre.trim().length > 50)
        this.errores['nombre'] = 'Máximo 50 caracteres.';
    } else {
      if (!this.formEstado.nombre.trim()) this.errores['nombre'] = 'El nombre es obligatorio.';
      if (this.formEstado.nombre.trim().length > 50)
        this.errores['nombre'] = 'Máximo 50 caracteres.';
      if (this.formEstado.descripcion.length > 255)
        this.errores['descripcion'] = 'Máximo 255 caracteres.';
      if (!this.formEstado.orden || this.formEstado.orden < 1)
        this.errores['orden'] = 'El orden debe ser mayor a 0.';
    }
    return Object.keys(this.errores).length === 0;
  }

  private guardadoCorrecto(): void {
    this.guardando = false;
    this.mostrarModal = false;
    this.exito(
      this.editando ? 'Cambios guardados correctamente.' : 'Registro creado correctamente.',
    );
  }

  private guardadoError(e: any): void {
    this.guardando = false;
    this.error = this.extraerError(e);
    this.cdr.detectChanges();
  }
  private mostrarError(e: any): void {
    this.error = this.extraerError(e);
    this.cdr.detectChanges();
  }
  private extraerError(e: any): string {
    return (
      e?.error?.detail ||
      e?.error?.message ||
      e?.error?.mensaje ||
      'No se pudo completar la operación.'
    );
  }
  private exito(texto: string): void {
    this.mensaje = texto;
    this.error = '';
    this.cargar();
    setTimeout(() => {
      this.mensaje = '';
      this.cdr.detectChanges();
    }, 3000);
  }
}
