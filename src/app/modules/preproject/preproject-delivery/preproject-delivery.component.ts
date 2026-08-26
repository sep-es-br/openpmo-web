import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ICard } from 'src/app/shared/interfaces/ICard';

@Component({
  selector: 'app-preproject-delivery',
  templateUrl: './preproject-delivery.component.html',
  styleUrls: ['./preproject-delivery.component.scss']
})
export class PreprojectDeliveryComponent {
  name: string = '';

  readonly idPlan: string | null = this.route.snapshot.queryParamMap.get('idPlan');

  readonly cardProperties: ICard = {
    cardTitle: 'deliverable',
    collapseble: false,
    toggleable: false,
    initialStateToggle: false,
    initialStateCollapse: false
  };


  constructor(private readonly route: ActivatedRoute, private readonly router: Router) {}

  back(): void {
    void this.router.navigate(['/preproject/new'], { queryParams: this.idPlan ? { idPlan: this.idPlan } : undefined });
  }
}
