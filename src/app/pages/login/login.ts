import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  credenciales: LoginRequest = {
    correo: '',
    password: '',
  };

  recordarme: boolean = true;
  mostrarPassword: boolean = false;
  cargando: boolean = false;
  mensajeError: string = '';

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  iniciarSesion(): void {
    this.mensajeError = '';

    if (!this.credenciales.correo.trim() || !this.credenciales.password.trim()) {
      this.mensajeError = 'Por favor, ingresa tu correo y contraseña.';
      return;
    }

    this.cargando = true;

    this.authService.login(this.credenciales).subscribe({
      next: (res) => {
        this.cargando = false;
        this.cdr.detectChanges();
        if (res.rpta === 1) {
          this.router.navigate(['/dashboard']);
        } else {
          this.mensajeError = res.mensaje || 'Error al iniciar sesión.';
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = err.error?.mensaje || 'Credenciales incorrectas o usuario inactivo.';
        this.cdr.detectChanges();
      },
    });
  }
}
