import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TicketService } from '../../services/ticket.service';
import { DashboardTicket, TicketItem } from '../../models/ticket.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly ticketsService = inject(TicketService);
  private readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  tickets: TicketItem[] = [];
  resumen: DashboardTicket = {
    total: 0,
    creados: 0,
    asignados: 0,
    enProceso: 0,
    pendientes: 0,
    resueltos: 0,
    cerrados: 0,
    criticos: 0,
  };

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.ticketsService.obtenerDashboard().subscribe({
      next: (r) => {
        this.resumen = r;
        this.cdr.detectChanges();
      },
    });
    this.ticketsService.listarTickets().subscribe({
      next: (r) => {
        this.tickets = r || [];
        this.cdr.detectChanges();
      },
    });
  }

  get rol() {
    return this.auth.getRol() || '';
  }
  get esAdmin() {
    return this.rol === 'ROLE_ADMIN';
  }
  get esTecnico() {
    return this.rol === 'ROLE_TECNICO';
  }
  get esUsuario() {
    return this.rol === 'ROLE_USUARIO';
  }
  get recientes() {
    return this.tickets.slice(0, 5);
  }
  get enlaceTickets() {
    return this.esAdmin ? '/tickets' : this.esTecnico ? '/mis-asignados' : '/mis-tickets';
  }
}
