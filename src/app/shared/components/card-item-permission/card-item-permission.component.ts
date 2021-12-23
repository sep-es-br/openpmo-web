import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { IconsEnum } from '../../enums/IconsEnum';
import { ICardItemPermission } from '../../interfaces/ICardItemPermission';
import { ResponsiveService } from '../../services/responsive.service';

@Component({
  selector: 'app-card-item-permission',
  templateUrl: './card-item-permission.component.html',
  styleUrls: ['./card-item-permission.component.scss']
})
export class CardItemPermissionComponent implements OnInit {

  @Input() properties: ICardItemPermission;
  @Input() displayModeCard: string;
  @Input() isReadOnly?: boolean;
  @Output() changeSelected = new EventEmitter();
  @Output() deletedSharedCard = new EventEmitter();

  newItemIcon = IconsEnum.Plus;
  cardIdItem: string;
  responsive: boolean;

  constructor(
    private router: Router,
    private responsiveSrv: ResponsiveService
  ) {
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });
  }

  ngOnInit(): void {
    this.cardIdItem = this.properties.itemId || this.properties.itemId === 0 ?
    `ID: ${ this.properties.itemId < 10 && this.properties.itemId !== 0 ? '0'+this.properties.itemId : this.properties.itemId}` : '';
  }

  navigateToPage(url: string, params?: {name: string; value: string | number}[]) {
    this.router.navigateByUrl(url);
    const queryParams = params.reduce((obj, item) => ((obj[item.name] = item.value), obj), {});
    this.router.navigate(
      [url],
      {
        queryParams
      }
    );
  }

  handleSelect() {
    this.changeSelected.next();
  }

  handleDeleteSharedCard() {
    this.deletedSharedCard.next({id: this.properties.itemId, office: this.properties.titleCardItem});
  }
}
