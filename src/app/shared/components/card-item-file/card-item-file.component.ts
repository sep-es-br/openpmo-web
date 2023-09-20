import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { ICardItem } from '../../interfaces/ICardItem';
import { ResponsiveService } from '../../services/responsive.service';
import { MobileViewService } from '../../services/mobile-view.service';

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
    private responsiveSrv: MobileViewService,
  ) {
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });
  }

  ngOnInit(): void {
    this.cardIdItem = this.properties.itemId || this.properties.itemId === 0 ?
      `${this.properties.itemId < 10 && this.properties.itemId !== 0 ? '0' + this.properties.itemId : this.properties.itemId}` : '';
  }

  async handleUpload(event, uploader) {
    const files = event.files;
    uploader.clear();
    this.onUploadFile.emit(files);
  }

}
