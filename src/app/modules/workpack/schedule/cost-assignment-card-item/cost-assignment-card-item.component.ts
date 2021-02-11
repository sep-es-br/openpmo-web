import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

interface ICartItemCostAssignment {
  type: string;
  unitMeasureName?: string;
  idCost?: number;
  costAccountName?: string;
  plannedWork?: number;
  actualWork?: number;
  menuItemsCost?: MenuItem[];
  menuItemsNewCost?: MenuItem[];
}

@Component({
  selector: 'app-cost-assignment-card-item',
  templateUrl: './cost-assignment-card-item.component.html',
  styleUrls: ['./cost-assignment-card-item.component.scss']
})
export class CostAssignmentCardItemComponent implements OnInit {

  @Input() properties: ICartItemCostAssignment;
  @Output() costChanged = new EventEmitter();

  iconsEnum = IconsEnum;
  responsive: boolean;
  cardIdItem: string;

  constructor(
    private responsiveSrv: ResponsiveService,
  ) {
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });
   }

  ngOnInit(): void {
    this.cardIdItem = this.properties.idCost ?
    `ID: ${ this.properties.idCost < 10 ? '0'+this.properties.idCost : this.properties.idCost}` : '';
  }

  handleCostChange() {
    this.costChanged.emit();
  }

}

