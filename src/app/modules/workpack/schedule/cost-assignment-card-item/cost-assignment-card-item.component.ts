import { Component, Input, OnInit, EventEmitter, Output, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
  readonly?: boolean;
}

@Component({
  selector: 'app-cost-assignment-card-item',
  templateUrl: './cost-assignment-card-item.component.html',
  styleUrls: ['./cost-assignment-card-item.component.scss']
})
export class CostAssignmentCardItemComponent implements OnInit, OnDestroy {

  @Input() properties: ICartItemCostAssignment;
  @Output() costChanged = new EventEmitter();

  iconsEnum = IconsEnum;
  responsive: boolean;
  cardIdItem: string;
  currentLang: string;
  $destroy = new Subject();

  constructor(
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.currentLang = this.translateSrv.getDefaultLang();
    this.translateSrv.onDefaultLangChange.pipe(takeUntil(this.$destroy)).subscribe(({ lang }) => this.currentLang = lang);
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  ngOnInit(): void {
    this.cardIdItem = this.properties.idCost ?
      `ID: ${this.properties.idCost < 10 ? '0' + this.properties.idCost : this.properties.idCost}` : '';
  }

  handleCostChange(event, field: string) {
    setTimeout(() => {
      this.properties[field] = +event.target.value;
      this.costChanged.emit();
    }, 1);
  }

}

