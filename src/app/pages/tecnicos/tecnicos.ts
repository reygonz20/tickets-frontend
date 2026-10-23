import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TecnicoService } from '../../services/tecnico.service';
import { UsuarioService } from '../../services/usuario.service';
import { TicketService } from '../../services/ticket.service';
import { Usuario } from '../../models/auth.model';
import { TecnicoEstadistica } from '../../models/ticket.model';
import {
  ActualizarEspecialidadRequest,
  ActualizarTecnicoRequest,
  EspecialidadItem,
  NuevaEspecialidadRequest,
  NuevoTecnicoRequest,
  TecnicoItem,
} from '../../models/tecnico.model';

@Component({
  selector: 'app-tecnicos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tecnicos.html',
  styleUrl: './tecnicos.css',
})
export class Tecnicos implements OnInit {
  private readonly tecnicoService = inject(TecnicoService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly ticketService = inject(TicketService);
  private readonly cdr = inject(ChangeDetectorRef);

  tecnicos: TecnicoItem[] = [];
  usuariosTecnicos: Usuario[] = [];
  especialidades: EspecialidadItem[] = [];
  especialidadesActivas: EspecialidadItem[] = [];

  cargando: boolean = false;
  totalActivos: number = 0;
  totalDisponibles: number = 0;
  estadisticas = new Map<number, TecnicoEstadistica>();

  filtroTexto: string = '';
  filtroEspecialidad: string = 'TODAS';
  filtroDisponibilidad: string = 'TODAS';
  filtroEstado: string = 'TODOS';

  // Modal técnico
  mostrarModalTecnico: boolean = false;
  modoEdicionTecnico: boolean = false;
  idTecnicoEditar: number | null = null;
  guardandoTecnico: boolean = false;
  mensajeErrorTecnico: string = '';
  erroresTecnico: Record<string, string> = {};

  formularioTecnico: NuevoTecnicoRequest & { estado?: boolean } = {
    idUsuario: 0,
    idEspecialidad: 0,
    disponibilidad: 'DISPONIBLE',
    estado: true,
  };

  // Modal detalle
  mostrarModalDetalle: boolean = false;
  tecnicoDetalle: TecnicoItem | null = null;
  cargandoDetalle: boolean = false;

  // Modal especialidades
  mostrarModalEspecialidades: boolean = false;
  editandoEspecialidad: boolean = false;
  idEspecialidadEditar: number | null = null;
  guardandoEspecialidad: boolean = false;
  mensajeErrorEspecialidad: string = '';
  erroresEspecialidad: Record<string, string> = {};

  formularioEspecialidad: NuevaEspecialidadRequest & { estado?: boolean } = {
    nombre: '',
    descripcion: '',
    estado: true,
  };

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;

    this.tecnicoService.listarTecnicos().subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.rpta === 1 && res.body) {
          this.tecnicos = res.body;
          this.cargarEstadisticasTecnicos();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });

    this.tecnicoService.listarTecnicosActivos().subscribe({
      next: (res) => {
        this.totalActivos = res.rpta === 1 && res.body ? res.body.length : 0;
        this.cdr.detectChanges();
      },
    });

    this.tecnicoService.listarTecnicosDisponibles().subscribe({
      next: (res) => {
        this.totalDisponibles = res.rpta === 1 && res.body ? res.body.length : 0;
        this.cdr.detectChanges();
      },
    });

    this.cargarEspecialidades();
    this.cargarUsuariosTecnicos();
  }

  cargarEspecialidades(): void {
    this.tecnicoService.listarEspecialidades().subscribe({
      next: (res) => {
        if (res.rpta === 1 && res.body) {
          this.especialidades = res.body;
        }
        this.cdr.detectChanges();
      },
    });

    this.tecnicoService.listarEspecialidadesActivas().subscribe({
      next: (res) => {
        if (res.rpta === 1 && res.body) {
          this.especialidadesActivas = res.body;
        }
        this.cdr.detectChanges();
      },
    });
  }

  cargarUsuariosTecnicos(): void {
    this.usuarioService.listarUsuarios().subscribe({
      next: (res) => {
        if (res.rpta === 1 && res.body) {
          this.usuariosTecnicos = res.body.filter((u) => u.rol === 'TECNICO' && u.estado);
        }
        this.cdr.detectChanges();
      },
    });
  }

  get filasTecnicos(): Array<{ usuario: Usuario; perfil: TecnicoItem | null }> {
    const perfilesPorUsuario = new Map(this.tecnicos.map((t) => [t.idUsuario, t]));

    const desdeUsuarios = this.usuariosTecnicos.map((usuario) => ({
      usuario,
      perfil: perfilesPorUsuario.get(usuario.idUsuario) || null,
    }));

    const idsUsuarios = new Set(this.usuariosTecnicos.map((u) => u.idUsuario));
    const huerfanos = this.tecnicos
      .filter((t) => !idsUsuarios.has(t.idUsuario))
      .map((t) => ({
        usuario: {
          idUsuario: t.idUsuario,
          nombres: t.nombres,
          apellidos: t.apellidos,
          correo: t.correo,
          telefono: t.telefono || '',
          rol: 'TECNICO',
          estado: t.estado,
          fechaCreacion: '',
        } as Usuario,
        perfil: t,
      }));

    return [...desdeUsuarios, ...huerfanos];
  }

  get tecnicosFiltrados(): Array<{ usuario: Usuario; perfil: TecnicoItem | null }> {
    return this.filasTecnicos.filter((item) => {
      const u = item.usuario;
      const t = item.perfil;
      const termino = this.filtroTexto.trim().toLowerCase();
      const nombre = `${u.nombres} ${u.apellidos}`.toLowerCase();
      const correo = (u.correo || '').toLowerCase();
      const especialidad = (t?.especialidad || '').toLowerCase();

      const coincideTexto =
        !termino ||
        nombre.includes(termino) ||
        correo.includes(termino) ||
        especialidad.includes(termino);

      const coincideEspecialidad =
        this.filtroEspecialidad === 'TODAS' ||
        (!!t && String(t.idEspecialidad) === this.filtroEspecialidad);

      const coincideDisponibilidad =
        this.filtroDisponibilidad === 'TODAS' ||
        (!!t && (t.disponibilidad || '').toUpperCase() === this.filtroDisponibilidad);

      const activo = t ? t.estado : u.estado;
      const coincideEstado =
        this.filtroEstado === 'TODOS' ||
        (this.filtroEstado === 'ACTIVO' && activo) ||
        (this.filtroEstado === 'INACTIVO' && !activo);

      return coincideTexto && coincideEspecialidad && coincideDisponibilidad && coincideEstado;
    });
  }

  get totalUsuariosTecnicos(): number {
    return this.usuariosTecnicos.length;
  }

  get totalPerfilesConfigurados(): number {
    return this.tecnicos.length;
  }

  get totalPendientesConfigurar(): number {
    return this.usuariosDisponiblesParaTecnico.length;
  }

  get usuariosDisponiblesParaTecnico(): Usuario[] {
    const idsYaRegistrados = new Set(this.tecnicos.map((t) => t.idUsuario));
    return this.usuariosTecnicos.filter((u) => !idsYaRegistrados.has(u.idUsuario));
  }

  cargarEstadisticasTecnicos(): void {
    this.estadisticas.clear();
    this.tecnicos.forEach((t) => {
      this.ticketService.obtenerEstadisticaTecnico(t.idTecnico).subscribe({
        next: (e) => {
          this.estadisticas.set(t.idTecnico, e);
          this.cdr.detectChanges();
        },
        error: () => {
          this.estadisticas.set(t.idTecnico, {
            idTecnico: t.idTecnico,
            asignados: 0,
            resueltos: 0,
          });
        },
      });
    });
  }

  ticketsAsignados(t: TecnicoItem | null): number {
    return t ? this.estadisticas.get(t.idTecnico)?.asignados || 0 : 0;
  }

  ticketsResueltos(t: TecnicoItem | null): number {
    return t ? this.estadisticas.get(t.idTecnico)?.resueltos || 0 : 0;
  }

  nombreUsuarioSeleccionado(): string {
    const u = this.usuariosTecnicos.find((x) => x.idUsuario === this.formularioTecnico.idUsuario);
    return u ? `${u.nombres} ${u.apellidos}` : 'Usuario técnico';
  }

  obtenerIniciales(t: TecnicoItem): string {
    const n = t.nombres ? t.nombres.trim()[0] : 'T';
    const a = t.apellidos ? t.apellidos.trim()[0] : '';
    return (n + a).toUpperCase();
  }

  obtenerInicialesUsuario(u: Usuario): string {
    const n = u.nombres ? u.nombres.trim()[0] : 'T';
    const a = u.apellidos ? u.apellidos.trim()[0] : '';
    return (n + a).toUpperCase();
  }

  configurarUsuarioComoTecnico(u: Usuario): void {
    this.modoEdicionTecnico = false;
    this.idTecnicoEditar = null;
    this.mensajeErrorTecnico = '';
    this.erroresTecnico = {};
    this.formularioTecnico = {
      idUsuario: u.idUsuario,
      idEspecialidad: this.especialidadesActivas[0]?.idEspecialidad || 0,
      disponibilidad: 'DISPONIBLE',
      estado: true,
    };
    this.mostrarModalTecnico = true;
  }

  esDisponible(t: TecnicoItem): boolean {
    return (t.disponibilidad || '').toUpperCase() === 'DISPONIBLE';
  }

  formatearDisponibilidad(valor: string): string {
    const normalizado = (valor || '').toUpperCase();
    if (normalizado === 'DISPONIBLE') return 'Disponible';
    if (normalizado === 'OCUPADO') return 'Ocupado';
    if (normalizado === 'NO_DISPONIBLE') return 'No disponible';
    return valor || 'Sin definir';
  }

  claseDisponibilidad(valor: string): string {
    const normalizado = (valor || '').toUpperCase();
    if (normalizado === 'DISPONIBLE') return 'avail-online';
    if (normalizado === 'OCUPADO') return 'avail-busy';
    return 'avail-offline';
  }

  // =========================
  // TÉCNICOS
  // =========================

  abrirModalNuevoTecnico(): void {
    this.modoEdicionTecnico = false;
    this.idTecnicoEditar = null;
    this.mensajeErrorTecnico = '';
    this.erroresTecnico = {};
    this.formularioTecnico = {
      idUsuario: 0,
      idEspecialidad: this.especialidadesActivas[0]?.idEspecialidad || 0,
      disponibilidad: 'DISPONIBLE',
      estado: true,
    };
    this.mostrarModalTecnico = true;
  }

  abrirModalEditarTecnico(t: TecnicoItem): void {
    this.modoEdicionTecnico = true;
    this.idTecnicoEditar = t.idTecnico;
    this.mensajeErrorTecnico = '';
    this.formularioTecnico = {
      idUsuario: t.idUsuario,
      idEspecialidad: t.idEspecialidad,
      disponibilidad: t.disponibilidad,
      estado: t.estado,
    };
    this.mostrarModalTecnico = true;
  }

  cerrarModalTecnico(): void {
    this.mostrarModalTecnico = false;
  }

  guardarTecnico(): void {
    this.mensajeErrorTecnico = '';
    this.erroresTecnico = {};

    if (!this.modoEdicionTecnico && !this.formularioTecnico.idUsuario) {
      this.erroresTecnico['idUsuario'] = 'Debes seleccionar un usuario técnico activo.';
    }
    if (!this.formularioTecnico.idEspecialidad) {
      this.erroresTecnico['idEspecialidad'] = 'Debes seleccionar una especialidad.';
    }
    if (!this.formularioTecnico.disponibilidad) {
      this.erroresTecnico['disponibilidad'] = 'Debes seleccionar la disponibilidad.';
    }
    if (Object.keys(this.erroresTecnico).length) return;

    this.guardandoTecnico = true;

    if (!this.modoEdicionTecnico) {
      const dto: NuevoTecnicoRequest = {
        idUsuario: this.formularioTecnico.idUsuario,
        idEspecialidad: this.formularioTecnico.idEspecialidad,
        disponibilidad: this.formularioTecnico.disponibilidad,
      };

      this.tecnicoService.crearTecnico(dto).subscribe({
        next: (res) => {
          this.guardandoTecnico = false;
          if (res.rpta === 1) {
            this.mostrarModalTecnico = false;
            this.cargarDatos();
          } else {
            this.mensajeErrorTecnico = res.mensaje;
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.guardandoTecnico = false;
          this.mensajeErrorTecnico = err.error?.mensaje || 'Error al registrar el técnico.';
          this.cdr.detectChanges();
        },
      });
      return;
    }

    if (this.idTecnicoEditar !== null) {
      const dto: ActualizarTecnicoRequest = {
        idEspecialidad: this.formularioTecnico.idEspecialidad,
        disponibilidad: this.formularioTecnico.disponibilidad,
        estado: this.formularioTecnico.estado,
      };

      this.tecnicoService.actualizarTecnico(this.idTecnicoEditar, dto).subscribe({
        next: (res) => {
          this.guardandoTecnico = false;
          if (res.rpta === 1) {
            this.mostrarModalTecnico = false;
            this.cargarDatos();
          } else {
            this.mensajeErrorTecnico = res.mensaje;
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.guardandoTecnico = false;
          this.mensajeErrorTecnico = err.error?.mensaje || 'Error al actualizar el técnico.';
          this.cdr.detectChanges();
        },
      });
    }
  }

  desactivarTecnico(t: TecnicoItem): void {
    if (!confirm(`¿Deseas desactivar a ${t.nombres} ${t.apellidos} como técnico?`)) {
      return;
    }

    this.tecnicoService.desactivarTecnico(t.idTecnico).subscribe({
      next: (res) => {
        if (res.rpta === 1) {
          this.cargarDatos();
        }
      },
      error: (err) => {
        alert(err.error?.mensaje || 'No se pudo desactivar el técnico.');
      },
    });
  }

  verPerfil(t: TecnicoItem): void {
    this.cargandoDetalle = true;
    this.tecnicoDetalle = null;
    this.mostrarModalDetalle = true;

    this.tecnicoService.obtenerTecnicoPorId(t.idTecnico).subscribe({
      next: (res) => {
        this.cargandoDetalle = false;
        if (res.rpta === 1 && res.body) {
          this.tecnicoDetalle = res.body;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargandoDetalle = false;
        this.cdr.detectChanges();
      },
    });
  }

  cerrarModalDetalle(): void {
    this.mostrarModalDetalle = false;
    this.tecnicoDetalle = null;
  }

  // =========================
  // ESPECIALIDADES
  // =========================

  abrirModalEspecialidades(): void {
    this.cancelarEdicionEspecialidad();
    this.mostrarModalEspecialidades = true;
  }

  cerrarModalEspecialidades(): void {
    this.mostrarModalEspecialidades = false;
    this.cancelarEdicionEspecialidad();
  }

  editarEspecialidad(e: EspecialidadItem): void {
    this.editandoEspecialidad = true;
    this.idEspecialidadEditar = e.idEspecialidad;
    this.mensajeErrorEspecialidad = '';
    this.erroresEspecialidad = {};
    this.formularioEspecialidad = {
      nombre: e.nombre,
      descripcion: e.descripcion || '',
      estado: e.estado,
    };
  }

  cancelarEdicionEspecialidad(): void {
    this.editandoEspecialidad = false;
    this.idEspecialidadEditar = null;
    this.mensajeErrorEspecialidad = '';
    this.erroresEspecialidad = {};
    this.formularioEspecialidad = {
      nombre: '',
      descripcion: '',
      estado: true,
    };
  }

  guardarEspecialidad(): void {
    this.mensajeErrorEspecialidad = '';
    this.erroresEspecialidad = {};

    const nombre = this.formularioEspecialidad.nombre.trim();
    const descripcion = (this.formularioEspecialidad.descripcion || '').trim();
    if (!nombre)
      this.erroresEspecialidad['nombre'] = 'El nombre de la especialidad es obligatorio.';
    else if (nombre.length > 100) this.erroresEspecialidad['nombre'] = 'Máximo 100 caracteres.';
    if (descripcion.length > 255)
      this.erroresEspecialidad['descripcion'] = 'Máximo 255 caracteres.';
    if (Object.keys(this.erroresEspecialidad).length) return;

    this.guardandoEspecialidad = true;

    if (!this.editandoEspecialidad) {
      const dto: NuevaEspecialidadRequest = {
        nombre: this.formularioEspecialidad.nombre.trim(),
        descripcion: this.formularioEspecialidad.descripcion?.trim(),
      };

      this.tecnicoService.crearEspecialidad(dto).subscribe({
        next: (res) => {
          this.guardandoEspecialidad = false;
          if (res.rpta === 1) {
            this.cancelarEdicionEspecialidad();
            this.cargarEspecialidades();
          } else {
            this.mensajeErrorEspecialidad = res.mensaje;
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.guardandoEspecialidad = false;
          this.mensajeErrorEspecialidad = err.error?.mensaje || 'Error al crear la especialidad.';
          this.cdr.detectChanges();
        },
      });
      return;
    }

    if (this.idEspecialidadEditar !== null) {
      const dto: ActualizarEspecialidadRequest = {
        nombre: this.formularioEspecialidad.nombre.trim(),
        descripcion: this.formularioEspecialidad.descripcion?.trim(),
        estado: this.formularioEspecialidad.estado,
      };

      this.tecnicoService.actualizarEspecialidad(this.idEspecialidadEditar, dto).subscribe({
        next: (res) => {
          this.guardandoEspecialidad = false;
          if (res.rpta === 1) {
            this.cancelarEdicionEspecialidad();
            this.cargarEspecialidades();
            this.cargarDatos();
          } else {
            this.mensajeErrorEspecialidad = res.mensaje;
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.guardandoEspecialidad = false;
          this.mensajeErrorEspecialidad =
            err.error?.mensaje || 'Error al actualizar la especialidad.';
          this.cdr.detectChanges();
        },
      });
    }
  }

  desactivarEspecialidad(e: EspecialidadItem): void {
    if (!confirm(`¿Deseas desactivar la especialidad ${e.nombre}?`)) {
      return;
    }

    this.tecnicoService.desactivarEspecialidad(e.idEspecialidad).subscribe({
      next: (res) => {
        if (res.rpta === 1) {
          this.cancelarEdicionEspecialidad();
          this.cargarEspecialidades();
          this.cargarDatos();
        }
      },
      error: (err) => {
        this.mensajeErrorEspecialidad =
          err.error?.mensaje || 'No se pudo desactivar la especialidad.';
        this.cdr.detectChanges();
      },
    });
  }
}
