import { Component, ContentChild, ContentChildren, EventEmitter, HostBinding, Input, OnInit, Output, TemplateRef, ViewChildren } from '@angular/core';

@Component({
  selector: 'app-card-list',
  templateUrl: './card-list.component.html',
  styleUrls: ['./card-list.component.scss']
})
export class CardListComponent<T> {

  @ContentChild('itemElem') itemElem : TemplateRef<any>;
  
  @Input() itemList: T[] = [];

  @Input() cardWidth : string;
  @Input() cardHeigth : string;

  @Input() newItemFunc = () => { this.itemList?.push({} as T) };
  @Input() removeItemFunc = (item : T) => { 

    if(this.itemList) {
      const index = this.itemList.indexOf(item);
      if (index !== -1) {
        this.itemList.splice(index, 1); // remove o item na posição `index`
      }
    }

  };

  @Input() trackByFn: (index: number, item:any) => any;


  @HostBinding('style.--card-width')
  get setCardWidthProp() {
    return this.cardWidth
  }

  @HostBinding('style.--card-heigth')
  get setCardHeigthProp() {
    return this.cardHeigth
  }

  constructor() { }

}
