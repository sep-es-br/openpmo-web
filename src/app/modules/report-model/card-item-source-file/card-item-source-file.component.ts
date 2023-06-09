import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';

@Component({
  selector: 'app-card-item-source-file',
  templateUrl: './card-item-source-file.component.html',
  styleUrls: ['./card-item-source-file.component.scss']
})
export class CardItemSourceFileComponent implements OnInit {

  @Input() properties: ICardItem;
  @Input() displayModeCard: string;
  @Output() uploadFile = new EventEmitter();

  cardIdItem: string;
  iconImg;
  responsive: boolean;
  editPermission = false;

  constructor(
    private router: Router,
    private responsiveSrv: ResponsiveService,
  ) {
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });
   }

  async ngOnInit() {
    this.editPermission = this.properties?.editPermission;
    this.cardIdItem = this.properties.itemId || this.properties.itemId === 0 ?
    `${ this.properties.itemId < 10 && this.properties.itemId !== 0 ? '0'+this.properties.itemId : this.properties.itemId}` : '';
  }

  async handleUploadFile(event, uploader) {
    const files = event.files;
    uploader.clear();
    this.uploadFile.emit(files);
  }
}
