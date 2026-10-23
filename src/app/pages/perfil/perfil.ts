import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { TicketService } from '../../services/ticket.service';
import { ActualizarPerfilRequest, Usuario } from '../../models/auth.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly ticketService = inject(TicketService);
  private readonly cdr = inject(ChangeDetectorRef);

  usuario: Usuario | null = null;
  cargando = false;
  ticketsCreados = 0;
  ticketsResueltos = 0;

  mostrarModalPerfil = false;
  mostrarModalPassword = false;
  guardando = false;
  mensajeError = '';
  mensajeExito = '';
  mensajeCargaPerfil = '';
  erroresPerfil: Record<string, string> = {};
  erroresPassword: Record<string, string> = {};

  formPerfil = { nombres: '', apellidos: '', correo: '', telefono: '' };
  formPassword = { nuevaPassword: '', confirmarPassword: '' };
  mostrarNuevaPassword = false;
  mostrarConfirmarPassword = false;

  ngOnInit(): void {
    this.cargarPerfil();
    this.cargarResumen();
  }

  cargarPerfil(): void {
    this.cargando = true;
    this.mensajeCargaPerfil = '';

    // El endpoint /usuarios/perfil es el principal porque sirve para todos los roles.
    // Si por alguna razón no está disponible todavía y el usuario es ADMIN,
    // hacemos fallback al endpoint administrativo por id para no dejar la vista vacía.
    this.usuarioService.obtenerPerfil().subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.rpta === 1 && res.body) {
          this.usuario = res.body;
        } else {
          this.intentarFallbackAdmin();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.intentarFallbackAdmin();
      },
    });
  }

  private intentarFallbackAdmin(): void {
    const idUsuario = this.authService.getIdUsuario();
    const rol = this.authService.getRol();

    if (rol === 'ADMIN' && idUsuario) {
      this.usuarioService.obtenerPorId(idUsuario).subscribe({
        next: (res) => {
          this.cargando = false;
          if (res.rpta === 1 && res.body) {
            this.usuario = res.body;
          } else {
            this.mensajeCargaPerfil = 'No se pudo cargar la información del perfil.';
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.cargando = false;
          this.mensajeCargaPerfil = 'No se pudo cargar la información del perfil.';
          this.cdr.detectChanges();
        },
      });
      return;
    }

    this.cargando = false;
    this.mensajeCargaPerfil =
      'No se pudo cargar la información del perfil. Verifica que el endpoint /api/usuarios/perfil esté disponible en Auth Service.';
    this.cdr.detectChanges();
  }

  cargarResumen(): void {
    this.ticketService.obtenerDashboard().subscribe({
      next: (d) => {
        this.ticketsCreados = d.total;
        this.ticketsResueltos = d.resueltos + d.cerrados;
        this.cdr.detectChanges();
      },
    });
  }

  get iniciales(): string {
    if (!this.usuario) return 'U';
    return (
      (this.usuario.nombres?.trim()[0] || 'U') + (this.usuario.apellidos?.trim()[0] || '')
    ).toUpperCase();
  }

  get rolLegible(): string {
    if (!this.usuario) return 'Usuario';
    if (this.usuario.rol === 'ADMIN') return 'Administrador';
    if (this.usuario.rol === 'TECNICO') return 'Técnico';
    return 'Usuario';
  }

  get departamentoLegible(): string {
    if (!this.usuario) return 'Usuario General';
    if (this.usuario.rol === 'ADMIN') return 'Administración del sistema';
    if (this.usuario.rol === 'TECNICO') return 'Soporte Técnico TI';
    return 'Área de Operaciones';
  }

  abrirModalEditarPerfil(): void {
    if (!this.usuario) return;
    this.mensajeError = '';
    this.erroresPerfil = {};
    this.formPerfil = {
      nombres: this.usuario.nombres,
      apellidos: this.usuario.apellidos,
      correo: this.usuario.correo,
      telefono: this.usuario.telefono || '',
    };
    this.mostrarModalPerfil = true;
  }

  cerrarModalPerfil(): void {
    this.mostrarModalPerfil = false;
  }

  guardarPerfil(): void {
    if (!this.usuario) return;
    this.mensajeError = '';
    this.erroresPerfil = {};
    if (!this.validarPerfil()) return;

    const dto: ActualizarPerfilRequest = {
      nombres: this.formPerfil.nombres.trim(),
      apellidos: this.formPerfil.apellidos.trim(),
      correo: this.formPerfil.correo.trim(),
      telefono: this.formPerfil.telefono.trim(),
    };

    this.guardando = true;
    this.usuarioService.actualizarPerfil(dto).subscribe({
      next: (res) => {
        this.guardando = false;
        if (res.rpta === 1 && res.body) {
          this.usuario = res.body;
          this.authService.actualizarDatosSesion(this.usuario.nombres, this.usuario.correo);
          this.mostrarModalPerfil = false;
          this.mostrarAvisoExito('Tu información personal ha sido actualizada.');
        } else this.mensajeError = res.mensaje;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.guardando = false;
        this.mensajeError =
          err?.error?.mensaje || err?.error?.message || 'No se pudo actualizar el perfil.';
        this.cdr.detectChanges();
      },
    });
  }

  abrirModalPassword(): void {
    this.mensajeError = '';
    this.erroresPassword = {};
    this.formPassword = { nuevaPassword: '', confirmarPassword: '' };
    this.mostrarNuevaPassword = false;
    this.mostrarConfirmarPassword = false;
    this.mostrarModalPassword = true;
  }

  cerrarModalPassword(): void {
    this.mostrarModalPassword = false;
  }

  guardarPassword(): void {
    if (!this.usuario) return;
    this.mensajeError = '';
    this.erroresPassword = {};
    const clave = this.formPassword.nuevaPassword.trim();
    const confirmar = this.formPassword.confirmarPassword.trim();
    if (!clave) this.erroresPassword['nuevaPassword'] = 'Ingresa la nueva contraseña.';
    else if (clave.length < 6 || clave.length > 100)
      this.erroresPassword['nuevaPassword'] = 'Debe tener entre 6 y 100 caracteres.';
    if (!confirmar) this.erroresPassword['confirmarPassword'] = 'Confirma la nueva contraseña.';
    else if (clave !== confirmar)
      this.erroresPassword['confirmarPassword'] = 'Las contraseñas no coinciden.';
    if (Object.keys(this.erroresPassword).length) return;

    const dto: ActualizarPerfilRequest = {
      nombres: this.usuario.nombres,
      apellidos: this.usuario.apellidos,
      correo: this.usuario.correo,
      telefono: this.usuario.telefono || '',
      password: clave,
    };

    this.guardando = true;
    this.usuarioService.actualizarPerfil(dto).subscribe({
      next: (res) => {
        this.guardando = false;
        if (res.rpta === 1) {
          this.mostrarModalPassword = false;
          this.mostrarAvisoExito('Tu contraseña ha sido actualizada correctamente.');
        } else this.mensajeError = res.mensaje;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.guardando = false;
        this.mensajeError =
          err?.error?.mensaje || err?.error?.message || 'Error al actualizar la contraseña.';
        this.cdr.detectChanges();
      },
    });
  }

  private validarPerfil(): boolean {
    const letras = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;
    const correo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const telefono = /^9\d{8}$/;
    const n = this.formPerfil.nombres.trim();
    const a = this.formPerfil.apellidos.trim();
    const c = this.formPerfil.correo.trim();
    const t = this.formPerfil.telefono.trim();

    if (!n) this.erroresPerfil['nombres'] = 'El nombre es obligatorio.';
    else if (!letras.test(n))
      this.erroresPerfil['nombres'] = 'El nombre solo puede contener letras.';
    if (!a) this.erroresPerfil['apellidos'] = 'El apellido es obligatorio.';
    else if (!letras.test(a))
      this.erroresPerfil['apellidos'] = 'El apellido solo puede contener letras.';
    if (!c) this.erroresPerfil['correo'] = 'El correo es obligatorio.';
    else if (!correo.test(c))
      this.erroresPerfil['correo'] = 'Ingresa un correo electrónico válido.';
    if (!t) this.erroresPerfil['telefono'] = 'El teléfono es obligatorio.';
    else if (!telefono.test(t))
      this.erroresPerfil['telefono'] =
        'Debe tener 9 dígitos, empezar con 9 y contener solo números.';
    return Object.keys(this.erroresPerfil).length === 0;
  }

  private mostrarAvisoExito(texto: string): void {
    this.mensajeExito = texto;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.mensajeExito = '';
      this.cdr.detectChanges();
    }, 3500);
  }
}
