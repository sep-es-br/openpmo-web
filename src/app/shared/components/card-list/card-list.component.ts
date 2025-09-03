import { Component, ContentChild, ContentChildren, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChildren } from '@angular/core';

@Component({
  selector: 'app-card-list',
  templateUrl: './card-list.component.html',
  styleUrls: ['./card-list.component.scss']
})
export class CardListComponent<T> implements OnInit {

  @ContentChild('itemElem') itemElem : TemplateRef<any>;
  
  @Input() itemList: T[] = [];

  @Input() newItemFunc = () => { this.itemList?.push({} as T) };

  @Input() trackByFn: (index: number, item:any) => any;


  constructor() { }

  ngOnInit(): void {
    
  }

}
