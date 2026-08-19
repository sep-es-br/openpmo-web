import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card-sharing-indicators',
  templateUrl: './card-sharing-indicators.component.html',
  styleUrls: ['./card-sharing-indicators.component.scss']
})
export class CardSharingIndicatorsComponent {
  @Input() shared = false;
  @Input() linked = false;
  @Input() showLinked = false;
  @Input() hasBaseline = false;
  @Input() baselineName: string;
}
