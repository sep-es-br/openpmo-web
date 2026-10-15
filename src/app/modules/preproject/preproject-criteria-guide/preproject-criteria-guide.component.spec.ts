import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PreprojectCriterion, PreprojectCriterionGroup } from 'src/app/shared/services/preproject-criteria-config.service';
import { PreprojectCriteriaGuideComponent } from './preproject-criteria-guide.component';

@Component({ selector: 'app-preproject-criteria-group', template: '' })
class CriteriaGroupStubComponent implements OnChanges {
  @Input() group: PreprojectCriterionGroup;
  @Input() showCardTitle = true;
  @Input() displayMode: string;
  @Input() readOnly: boolean;
  @Output() changed = new EventEmitter<void>();
  changes = 0;

  ngOnChanges(): void {
    this.changes++;
  }
}

@Component({ template: '<app-preproject-criteria-guide [guide]="guide" [readOnly]="readOnly" (changed)="changes = changes + 1"></app-preproject-criteria-guide>' })
class GuideHostComponent {
  readOnly = false;
  changes = 0;
  guide: PreprojectCriterion = {
    id: 1, name: 'Guia', position: 1, icon: '', weight: 1, operation: 'SUM',
    properties: [{ id: 10, type: 'TextModel', name: 'Texto', label: 'Texto', active: true }],
    groups: []
  };
}

describe('Preproject criterion root properties', () => {
  let fixture: ComponentFixture<GuideHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [GuideHostComponent, PreprojectCriteriaGuideComponent, CriteriaGroupStubComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(GuideHostComponent);
  });

  it('keeps the root renderer stable instead of rebuilding fields on every view check', () => {
    fixture.detectChanges();
    const root = fixture.debugElement.query(By.directive(CriteriaGroupStubComponent)).componentInstance as CriteriaGroupStubComponent;
    const wrapper = root.group;
    for (let count = 0; count < 5; count++) {
      fixture.detectChanges();
    }
    expect(root.changes).toBe(1);
    expect(root.group).toBe(wrapper);
    expect(root.group.properties).toBe(fixture.componentInstance.guide.properties);
    expect(root.showCardTitle).toBe(false);
    expect(fixture.componentInstance.guide.groups).toEqual([]);

    root.changed.emit();
    expect(fixture.componentInstance.changes).toBe(1);
  });

  it('refreshes root properties when the guide changes without removing configured groups', () => {
    fixture.detectChanges();
    fixture.componentInstance.guide = {
      ...fixture.componentInstance.guide,
      properties: [{ id: 20, type: 'SdgListModel', name: 'ODS', label: 'ODS', active: true }],
      groups: [{
        title: 'Grupo', sortIndex: 1, weight: 1, operation: 'SUM',
        enablementKey: true, disabledValue: '', legend: '', properties: []
      }]
    };
    fixture.detectChanges();
    const renderers = fixture.debugElement.queryAll(By.directive(CriteriaGroupStubComponent));
    expect(renderers.length).toBe(2);
    expect(renderers[0].componentInstance.group.properties[0].id).toBe(20);
    expect(renderers[1].componentInstance.group.title).toBe('Grupo');
  });

  it('clears the root renderer when there are no direct properties', () => {
    fixture.detectChanges();
    fixture.componentInstance.guide = { ...fixture.componentInstance.guide, properties: [] };
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(CriteriaGroupStubComponent))).toBeNull();
  });
});
