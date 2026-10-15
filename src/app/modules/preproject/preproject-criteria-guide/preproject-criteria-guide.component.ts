import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import { PreprojectCriterion, PreprojectCriterionGroup } from 'src/app/shared/services/preproject-criteria-config.service';

@Component({
  selector: 'app-preproject-criteria-guide',
  templateUrl: './preproject-criteria-guide.component.html',
  styleUrls: ['./preproject-criteria-guide.component.scss']
})
export class PreprojectCriteriaGuideComponent implements OnChanges {
  @Input() guide: PreprojectCriterion;
  @Input() displayMode: string = 'grid';
  @Input() readOnly: boolean = false;

  @Output() changed: EventEmitter<void> = new EventEmitter<void>();

  directPropertiesGroup: PreprojectCriterionGroup | undefined;
  groups: PreprojectCriterionGroup[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.guide) {
      return;
    }

    // This wrapper only reuses the group renderer for root properties; it is
    // not a configured group. Keep its identity stable between view checks.
    this.directPropertiesGroup = this.guide?.properties?.length ? {
      propertyModelType: 'CriteriaGroupModel',
      title: '',
      sortIndex: 0,
      weight: 1,
      operation: this.guide.operation,
      enablementKey: false,
      disabledValue: '',
      legend: '',
      properties: this.guide.properties
    } : undefined;
    this.groups = [...(this.guide?.groups || [])]
      .sort((first, second) => first.sortIndex - second.sortIndex);
  }
}
