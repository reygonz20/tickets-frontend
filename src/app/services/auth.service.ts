import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { GenericResponse } from '../models/generic-response.model';
import { JwtDto, LoginRequest } from '../models/auth.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private readonly TOKEN_KEY = 'helpdesk_token';
  private readonly USER_KEY = 'helpdesk_user';

  login(credenciales: LoginRequest): Observable<GenericResponse<JwtDto>> {
    return this.http.post<GenericResponse<JwtDto>>(`${this.apiUrl}/login`, credenciales).pipe(
      tap((response) => {
        if (response.rpta === 1 && response.body) {
          this.guardarSesion(response.body);
        }
      }),
    );
  }

  private guardarSesion(jwtDto: JwtDto): void {
    localStorage.setItem(this.TOKEN_KEY, jwtDto.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(jwtDto));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUsuarioActual(): JwtDto | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as JwtDto;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getRol(): string | null {
    const user = this.getUsuarioActual();
    return user ? user.rol : null;
  }

  getIdUsuario(): number | null {
    const user = this.getUsuarioActual();
    return user ? user.idUsuario : null;
  }

  actualizarDatosSesion(nombres: string, correo: string): void {
    const actual = this.getUsuarioActual();
    if (actual) {
      actual.nombres = nombres;
      actual.correo = correo;
      localStorage.setItem(this.USER_KEY, JSON.stringify(actual));
    }
  }
}
