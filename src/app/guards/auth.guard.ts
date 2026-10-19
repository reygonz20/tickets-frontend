import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // Validacion de ruta segun rol
  const rolesPermitidos = route.data?.['roles'] as string[] | undefined;
  const rolUsuario = authService.getRol();

  if (rolesPermitidos && rolesPermitidos.length > 0) {
    if (!rolUsuario || !rolesPermitidos.includes(rolUsuario)) {
      router.navigate(['/dashboard']);
      return false;
    }
  }

  return true;
};
