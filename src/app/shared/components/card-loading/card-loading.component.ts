import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-card-loading',
  templateUrl: './card-loading.component.html',
  styleUrls: ['./card-loading.component.scss']
})
export class CardLoadingComponent {

  @Input() isCardLoading = true;

  constructor(
  ) { }

}
