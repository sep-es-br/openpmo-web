import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { PanelModule } from 'primeng/panel';
import { Subject } from 'rxjs';
import { FromStringArrayToSelectItemPipe } from '../../pipes/fromStringArrayToSelectItemPipe';
import { ResponsiveService } from '../../services/responsive.service';
import { PropertyModelComponent } from './property-model.component';

describe('PropertyModelComponent weight visibility', () => {
  let fixture: ComponentFixture<PropertyModelComponent>;
  let component: PropertyModelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule, FormsModule, NoopAnimationsModule, TranslateModule.forRoot(),
        PanelModule, InputNumberModule, InputSwitchModule, CheckboxModule, DropdownModule
      ],
      declarations: [PropertyModelComponent, FromStringArrayToSelectItemPipe],
      providers: [{ provide: ResponsiveService, useValue: { observable: new Subject<boolean>() } }],
      schemas: [NO_ERRORS_SCHEMA]
    }).overrideComponent(PropertyModelComponent, {
      set: {
        styleUrls: [],
        styles: [':host ::ng-deep *, :host ::ng-deep *::before, :host ::ng-deep *::after { font-family: sans-serif !important; }']
      }
    }).compileComponents();
    fixture = TestBed.createComponent(PropertyModelComponent);
    component = fixture.componentInstance;
    component.showWeight = true;
    component.scoredPossibleValues = true;
  });

  afterEach(() => fixture.destroy());

  function weightFields(type: string): Element[] {
    component.property = {
      id: 1, type, name: type, label: type, active: true,
      isCollapsed: false, weight: 1, sortIndex: 1,
      possibleValuesOptions: [], possibleValuesDetails: []
    };
    fixture.detectChanges();
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('label'))
      .filter((label: Element) => label.textContent.trim().startsWith('weight'));
  }

  ['CurrencyModel', 'IntegerModel', 'TextModel', 'TextAreaModel', 'NumberModel'].forEach(type => {
    it('hides weight for ' + type + ' even if the caller requests it', () => {
      expect(weightFields(type).length).toBe(0);
    });
  });

  ['CriteriaSelectionModel', 'SdgListModel', 'ChallengeListModel'].forEach(type => {
    it('shows weight for ' + type, () => {
      expect(weightFields(type).length).toBe(1);
    });
  });

  it('keeps weight hidden in screens that do not request scoring', () => {
    component.showWeight = false;
    expect(weightFields('CriteriaSelectionModel').length).toBe(0);
  });
});
