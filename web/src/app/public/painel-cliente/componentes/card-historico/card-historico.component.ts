import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-card-historico',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-historico.component.html',
  styleUrls: ['./card-historico.component.scss']
})
export class CardHistoricoComponent {
  @Input() historico: any;

  constructor(private router: Router) {}

  verDetalhes(): void {
    // Captura o slug dinamicamente da URL atual (/agendar/SLUG/painel)
    const urlParts = this.router.url.split('/');
    const slug = urlParts[2]; 

    // Navega para a galeria de transparência passando o ID da OS via parâmetro
    this.router.navigate([`/agendar/${slug}/painel/galeria-transparencia`], {
      queryParams: { os: this.historico?.id }
    });
  }
}