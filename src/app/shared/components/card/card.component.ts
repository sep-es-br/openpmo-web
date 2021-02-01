import { Component, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { ICard } from '../../interfaces/ICard';
import { ResponsiveService } from '../../services/responsive.service';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnDestroy {

  @Input() properties: ICard;
  responsive: boolean;
  subResponsive: Subscription;

  constructor(
    private responsiveSrv: ResponsiveService
  ) {
    this.subResponsive = this.responsiveSrv.observable.subscribe(value => this.responsive = value);
  }

  ngOnDestroy(): void {
    this.subResponsive?.unsubscribe();
    this.properties?.onToggle?.complete();
  }

}
