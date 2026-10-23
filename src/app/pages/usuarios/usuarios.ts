import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';
import {
  ActualizarUsuarioRequest,
  NuevoUsuarioRequest,
  Rol,
  Usuario,
} from '../../models/auth.model';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  usuarios: Usuario[] = [];
  roles: Rol[] = [];
  cargando = false;

  filtroTexto = '';
  filtroRol = 'TODOS';
  filtroEstado = 'TODOS';

  mostrarModal = false;
  modoEdicion = false;
  idUsuarioEditar: number | null = null;
  guardando = false;
  mensajeErrorModal = '';
  confirmarPassword = '';
  errores: Record<string, string> = {};

  formulario: NuevoUsuarioRequest = this.formularioVacio();

  ngOnInit(): void {
    this.cargarDatos();
  }

  get idUsuarioActual(): number {
    return this.authService.getIdUsuario() || 0;
  }

  get editandoMiPropiaCuenta(): boolean {
    return this.modoEdicion && this.idUsuarioEditar === this.idUsuarioActual;
  }

  cargarDatos(): void {
    this.cargando = true;
    this.usuarioService.listarUsuarios().subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.rpta === 1 && res.body) this.usuarios = res.body;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });

    this.usuarioService.listarRoles().subscribe({
      next: (res) => {
        if (res.rpta === 1 && res.body) this.roles = res.body;
        this.cdr.detectChanges();
      },
    });
  }

  get usuariosFiltrados(): Usuario[] {
    return this.usuarios.filter((u) => {
      const nombreCompleto = `${u.nombres} ${u.apellidos}`.toLowerCase();
      const correo = u.correo.toLowerCase();
      const termino = this.filtroTexto.trim().toLowerCase();
      const coincideTexto =
        !termino || nombreCompleto.includes(termino) || correo.includes(termino);
      const coincideRol = this.filtroRol === 'TODOS' || u.rol === this.filtroRol;
      const coincideEstado =
        this.filtroEstado === 'TODOS' ||
        (this.filtroEstado === 'ACTIVO' && u.estado) ||
        (this.filtroEstado === 'INACTIVO' && !u.estado);
      return coincideTexto && coincideRol && coincideEstado;
    });
  }

  obtenerIniciales(u: Usuario): string {
    const n = u.nombres?.trim()[0] || 'U';
    const a = u.apellidos?.trim()[0] || '';
    return (n + a).toUpperCase();
  }

  formatearRol(rol: string): string {
    if (rol === 'ADMIN') return 'Administrador';
    if (rol === 'TECNICO') return 'Técnico';
    return 'Usuario';
  }

  abrirModalNuevo(): void {
    this.modoEdicion = false;
    this.idUsuarioEditar = null;
    this.mensajeErrorModal = '';
    this.errores = {};
    this.confirmarPassword = '';
    this.formulario = this.formularioVacio();
    this.mostrarModal = true;
  }

  abrirModalEditar(u: Usuario): void {
    this.modoEdicion = true;
    this.idUsuarioEditar = u.idUsuario;
    this.mensajeErrorModal = '';
    this.errores = {};
    this.confirmarPassword = '';
    this.formulario = {
      nombres: u.nombres,
      apellidos: u.apellidos,
      correo: u.correo,
      telefono: u.telefono || '',
      rolAsignado: u.rol,
      password: '',
      estado: u.estado,
    };
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  guardarUsuario(): void {
    this.mensajeErrorModal = '';
    this.errores = {};
    if (!this.validarFormulario()) return;

    this.guardando = true;
    if (!this.modoEdicion) {
      this.usuarioService
        .crearUsuario(this.normalizarFormulario() as NuevoUsuarioRequest)
        .subscribe({
          next: (res) => this.procesarGuardado(res.rpta, res.mensaje),
          error: (err) => this.procesarError(err, 'Error al registrar el usuario.'),
        });
      return;
    }

    if (this.idUsuarioEditar !== null) {
      const dto = this.normalizarFormulario() as ActualizarUsuarioRequest;
      this.usuarioService.actualizarUsuario(this.idUsuarioEditar, dto).subscribe({
        next: (res) => this.procesarGuardado(res.rpta, res.mensaje),
        error: (err) => this.procesarError(err, 'Error al actualizar el usuario.'),
      });
    }
  }

  private validarFormulario(): boolean {
    const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const telefono = /^9\d{8}$/;

    const nombres = this.formulario.nombres.trim();
    const apellidos = this.formulario.apellidos.trim();
    const correo = this.formulario.correo.trim();
    const tel = (this.formulario.telefono || '').trim();
    const password = (this.formulario.password || '').trim();

    if (!nombres) this.errores['nombres'] = 'El nombre es obligatorio.';
    else if (!soloLetras.test(nombres))
      this.errores['nombres'] = 'El nombre solo puede contener letras.';

    if (!apellidos) this.errores['apellidos'] = 'El apellido es obligatorio.';
    else if (!soloLetras.test(apellidos))
      this.errores['apellidos'] = 'El apellido solo puede contener letras.';

    if (!correo) this.errores['correo'] = 'El correo electrónico es obligatorio.';
    else if (!email.test(correo)) this.errores['correo'] = 'Ingresa un correo electrónico válido.';

    if (!tel) this.errores['telefono'] = 'El teléfono es obligatorio.';
    else if (!telefono.test(tel))
      this.errores['telefono'] = 'Debe tener 9 dígitos, empezar con 9 y contener solo números.';

    if (!this.formulario.rolAsignado) this.errores['rolAsignado'] = 'Selecciona un rol.';

    if (!this.modoEdicion && !password) this.errores['password'] = 'La contraseña es obligatoria.';
    else if (password && (password.length < 6 || password.length > 100))
      this.errores['password'] = 'Debe tener entre 6 y 100 caracteres.';

    if (password && password !== this.confirmarPassword)
      this.errores['confirmarPassword'] = 'Las contraseñas no coinciden.';
    if (!this.modoEdicion && !this.confirmarPassword)
      this.errores['confirmarPassword'] = 'Confirma la contraseña.';

    return Object.keys(this.errores).length === 0;
  }

  private normalizarFormulario(): NuevoUsuarioRequest | ActualizarUsuarioRequest {
    const dto: ActualizarUsuarioRequest = {
      nombres: this.formulario.nombres.trim(),
      apellidos: this.formulario.apellidos.trim(),
      correo: this.formulario.correo.trim(),
      telefono: (this.formulario.telefono || '').trim(),
      rolAsignado: this.formulario.rolAsignado,
      estado: this.formulario.estado,
    };
    const password = (this.formulario.password || '').trim();
    if (password) dto.password = password;
    return dto;
  }

  private procesarGuardado(rpta: number, mensaje: string): void {
    this.guardando = false;
    if (rpta === 1) {
      this.mostrarModal = false;
      this.cargarDatos();
    } else {
      this.mensajeErrorModal = mensaje;
    }
    this.cdr.detectChanges();
  }

  private procesarError(err: any, fallback: string): void {
    this.guardando = false;
    this.mensajeErrorModal =
      err?.error?.mensaje || err?.error?.message || err?.error?.detail || fallback;
    this.cdr.detectChanges();
  }

  private formularioVacio(): NuevoUsuarioRequest {
    return {
      nombres: '',
      apellidos: '',
      correo: '',
      telefono: '',
      rolAsignado: 'USUARIO',
      password: '',
      estado: true,
    };
  }
}
