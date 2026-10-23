import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { JwtDto } from '../../models/auth.model';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  get usuario(): JwtDto | null {
    return this.authService.getUsuarioActual();
  }

  get rol(): string | null {
    return this.authService.getRol();
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

  get nombreRolLegible(): string {
    if (this.esAdmin) return 'Administrador';
    if (this.esTecnico) return 'Técnico';
    return 'Usuario';
  }

  get iniciales(): string {
    const nombres = this.usuario?.nombres || 'U';
    const partes = nombres.trim().split(' ');
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nombres.substring(0, 2).toUpperCase();
  }

  get tituloActual(): string {
    const url = this.router.url;
    if (url.includes('/usuarios')) return 'Usuarios';
    if (url.includes('/perfil')) return 'Mi perfil';
    if (url.includes('/tecnicos')) return 'Técnicos';
    if (url.includes('/tickets')) return 'Todos los tickets';
    if (url.includes('/mis-asignados')) return 'Mis tickets asignados';
    if (url.includes('/mis-tickets')) return 'Mis tickets';
    if (url.includes('/categorias')) return 'Categorías';
    if (url.includes('/prioridades')) return 'Prioridades';
    if (url.includes('/estados')) return 'Estados';
    return 'Panel principal';
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
