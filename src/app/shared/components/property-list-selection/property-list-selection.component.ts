import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MenuItem } from 'primeng/api';

import { ICardItem } from '../../interfaces/ICardItem';
import { IPropertyListItem } from '../../interfaces/IPropertyListItem';
import { IconsEnum } from '../../enums/IconsEnum';

@Component({
  selector: 'app-property-list-selection',
  templateUrl: './property-list-selection.component.html',
  styleUrls: ['./property-list-selection.component.scss']
})
export class PropertyListSelectionComponent implements OnChanges {

  @Input() label: string = '';
  @Input() items: IPropertyListItem[] = [];
  @Input() displayMode: 'grid' | 'list' | string = 'grid';
  @Input() itemIcon: string = IconsEnum.Selection;
  @Input() disabled: boolean = false;

  @Output() itemsChange: EventEmitter<IPropertyListItem[]> = new EventEmitter<IPropertyListItem[]>();
  @Output() addRequested: EventEmitter<void> = new EventEmitter<void>();

  cardItems: ICardItem[] = [];

  ngOnChanges(_changes: SimpleChanges): void {
    this.refreshCards();
  }

  private refreshCards(): void {
    const cards: ICardItem[] = (this.items || []).map((item: IPropertyListItem) => ({
      typeCardItem: 'listItem',
      icon: this.itemIcon,
      iconSvg: true,
      itemId: item.id,
      nameCardItem: item.name,
      fullNameCardItem: item.fullName || item.name,
      menuItems: this.disabled ? undefined : this.createItemMenu(item)
    }));

    if (!this.disabled) {
      cards.push({
        typeCardItem: 'newCardItem',
        icon: IconsEnum.Plus,
        onClick: () => this.addRequested.emit()
      });
    }

    this.cardItems = cards;
  }

  private createItemMenu(item: IPropertyListItem): MenuItem[] {
    return [{
      label: 'Excluir',
      icon: 'fas fa-trash-alt',
      command: () => this.remove(item)
    }];
  }

  private remove(item: IPropertyListItem): void {
    const nextItems: IPropertyListItem[] = (this.items || [])
      .filter((current: IPropertyListItem) => current.id !== item.id);

    this.items = nextItems;
    this.itemsChange.emit(nextItems);
    this.refreshCards();
  }
}
