import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';

import { ICard } from 'src/app/shared/interfaces/ICard';
import { IPropertyListItem } from 'src/app/shared/interfaces/IPropertyListItem';
import { IWorkpackModelProperty } from 'src/app/shared/interfaces/IWorkpackModelProperty';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { PreprojectCriterionGroup } from 'src/app/shared/services/preproject-criteria-config.service';
import { TypePropertModelEnum } from 'src/app/shared/enums/TypePropertModelEnum';
import { TypePropertyModelEnum } from 'src/app/shared/enums/TypePropertyModelEnum';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';

@Component({
  selector: 'app-preproject-criteria-group',
  templateUrl: './preproject-criteria-group.component.html',
  styleUrls: ['./preproject-criteria-group.component.scss']
})
export class PreprojectCriteriaGroupComponent implements OnInit, OnChanges, OnDestroy {

  @Input() group: PreprojectCriterionGroup;
  @Input() displayMode: string = 'grid';
  @Input() showCardTitle: boolean = true;

  @Output() changed: EventEmitter<void> = new EventEmitter<void>();
  @Output() listAddRequested: EventEmitter<IWorkpackModelProperty> = new EventEmitter<IWorkpackModelProperty>();

  enabled: boolean = true;
  cardProperties: ICard;
  properties: Array<{ config: IWorkpackModelProperty; value?: PropertyTemplateModel }> = [];

  private readonly toggleChanged: EventEmitter<boolean> = new EventEmitter<boolean>();

  ngOnInit(): void {
    this.toggleChanged.subscribe((enabled: boolean) => this.handleToggle(enabled));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.group?.currentValue) {
      this.enabled = true;
      this.buildCard();
      this.buildProperties();
    }
  }

  ngOnDestroy(): void {
    this.toggleChanged.complete();
  }

  isListProperty(property: IWorkpackModelProperty): boolean {
    return property.type === TypePropertModelEnum.ChallengeListModel
      || property.type === TypePropertModelEnum.SdgListModel;
  }

  getListIcon(property: IWorkpackModelProperty): string {
    return property.type === TypePropertModelEnum.SdgListModel ? IconsEnum.Cog : IconsEnum.Selection;
  }

  updateListItems(property: IWorkpackModelProperty, items: IPropertyListItem[]): void {
    property.selectedListItems = items;
    this.changed.emit();
  }

  propertyChanged(): void {
    this.changed.emit();
  }

  private buildCard(): void {
    this.cardProperties = {
      cardTitle: this.group.title,
      notShowCardTitle: !this.showCardTitle,
      collapseble: this.showCardTitle,
      initialStateCollapse: false,
      toggleable: this.group.enablementKey,
      collapseOnToggle: false,
      initialStateToggle: this.enabled,
      toggleLabel: '',
      onToggle: this.toggleChanged
    };
  }

  private buildProperties(): void {
    this.properties = (this.group.properties || [])
      .filter((property: IWorkpackModelProperty) => property.active !== false)
      .sort((first: IWorkpackModelProperty, second: IWorkpackModelProperty) =>
        (first.sortIndex || 0) - (second.sortIndex || 0))
      .map((config: IWorkpackModelProperty) => ({
        config,
        value: this.isListProperty(config) ? undefined : this.toPropertyTemplate(config)
      }));
  }

  private toPropertyTemplate(config: IWorkpackModelProperty): PropertyTemplateModel {
    const property: PropertyTemplateModel = Object.assign(new PropertyTemplateModel(), config, {
      type: this.toRuntimeType(config.type),
      disabled: !this.enabled,
      possibleValues: (config.possibleValuesOptions || []).map((value: string) => ({ label: value, value })),
      value: config.defaultValue
    });
    return property;
  }

  private toRuntimeType(type: string): string {
    const types: { [key: string]: string } = {
      [TypePropertModelEnum.IntegerModel]: TypePropertyModelEnum.IntegerModel,
      [TypePropertModelEnum.TextModel]: TypePropertyModelEnum.TextModel,
      [TypePropertModelEnum.DateModel]: TypePropertyModelEnum.DateModel,
      [TypePropertModelEnum.ToggleModel]: TypePropertyModelEnum.ToggleModel,
      [TypePropertModelEnum.UnitSelectionModel]: TypePropertyModelEnum.UnitSelectionModel,
      [TypePropertModelEnum.SelectionModel]: TypePropertyModelEnum.SelectionModel,
      [TypePropertModelEnum.TextAreaModel]: TypePropertyModelEnum.TextAreaModel,
      [TypePropertModelEnum.NumberModel]: TypePropertyModelEnum.NumberModel,
      [TypePropertModelEnum.CurrencyModel]: TypePropertyModelEnum.CurrencyModel,
      [TypePropertModelEnum.LocalitySelectionModel]: TypePropertyModelEnum.LocalitySelectionModel,
      [TypePropertModelEnum.OrganizationSelectionModel]: TypePropertyModelEnum.OrganizationSelectionModel
    };
    return types[type] || type;
  }

  private handleToggle(enabled: boolean): void {
    this.enabled = enabled;
    this.properties.forEach(item => {
      if (item.value) {
        item.value.disabled = !enabled;
        if (!enabled) {
          item.value.value = this.group.disabledValue;
        }
      }
    });
    this.changed.emit();
  }
}
