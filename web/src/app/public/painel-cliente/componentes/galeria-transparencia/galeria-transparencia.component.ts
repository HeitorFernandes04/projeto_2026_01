import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-galeria-transparencia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './galeria-transparencia.component.html',
  styleUrls: ['./galeria-transparencia.component.scss']
})
export class GaleriaTransparenciaComponent {
  constructor(private router: Router, private location: Location) {}

  voltar(): void {
    this.location.back();
  }

  sair(): void {
    const urlParts = this.router.url.split('/');
    const slug = urlParts[2]; 
    this.router.navigate([`/agendar/${slug}`]);
  }
}