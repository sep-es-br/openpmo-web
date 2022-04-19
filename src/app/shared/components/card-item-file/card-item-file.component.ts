import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { ICardItem } from '../../interfaces/ICardItem';
import { ResponsiveService } from '../../services/responsive.service';

@Component({
  selector: 'app-card-item-file',
  templateUrl: './card-item-file.component.html',
  styleUrls: ['./card-item-file.component.scss']
})
export class CardItemFileComponent implements OnInit {
  @Input() properties: ICardItem;
  @Input() displayModeCard: string;
  @Output() onUploadFile = new EventEmitter();

  cardIdItem: string;
  iconImg;
  responsive: boolean;
  showMenuNewModel = false;

  constructor(
    private router: Router,
    private responsiveSrv: ResponsiveService,
  ) {
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });
  }

  ngOnInit(): void {
    this.cardIdItem = this.properties.itemId || this.properties.itemId === 0 ?
      `${this.properties.itemId < 10 && this.properties.itemId !== 0 ? '0' + this.properties.itemId : this.properties.itemId}` : '';
  }

  navigateToPage(url: string, params?: { name: string; value: string | number }[]) {
    const queryParams = params && params.reduce((obj, item) => ((obj[item.name] = item.value), obj), {});
    this.router.navigate(
      [url],
      {
        queryParams
      }
    );
  }

  getQueryParams() {
    let params = this.properties?.itemId ? { id: this.properties.itemId } : {};
    if (this.properties.paramsUrlCard) {
      params = {
        ...params,
        ... this.properties.paramsUrlCard.reduce((obj, item) => ((obj[item.name] = item.value), obj), {})
      };
    }
    return params;
  }

  async handleUpload(event, uploader) {
    const files = event.files;
    uploader.clear();
    this.onUploadFile.emit(files);
  }

}
