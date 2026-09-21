import { Component, EventEmitter, Input, Output } from '@angular/core';

import { PreprojectCriterion, PreprojectCriterionGroup } from 'src/app/shared/services/preproject-criteria-config.service';

@Component({
  selector: 'app-preproject-criteria-guide',
  templateUrl: './preproject-criteria-guide.component.html',
  styleUrls: ['./preproject-criteria-guide.component.scss']
})
export class PreprojectCriteriaGuideComponent {
  @Input() guide: PreprojectCriterion;
  @Input() displayMode: string = 'grid';
  @Input() readOnly: boolean = false;

  @Output() changed: EventEmitter<void> = new EventEmitter<void>();

  get directPropertiesGroup(): PreprojectCriterionGroup | undefined {
    if (!this.guide?.properties?.length) {
      return undefined;
    }

    return {
      propertyModelType: 'CriteriaGroupModel',
      title: '',
      sortIndex: 0,
      weight: 1,
      operation: this.guide.operation,
      enablementKey: false,
      disabledValue: '',
      legend: '',
      properties: this.guide.properties
    };
  }

  get groups(): PreprojectCriterionGroup[] {
    return [...(this.guide?.groups || [])]
      .sort((first, second) => first.sortIndex - second.sortIndex);
  }
}
