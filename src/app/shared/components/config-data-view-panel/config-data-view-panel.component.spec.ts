import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigDataViewPanelComponent } from './config-data-view-panel.component';

describe('ConfigDataViewPanelComponent', () => {
  let component: ConfigDataViewPanelComponent;
  let fixture: ComponentFixture<ConfigDataViewPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfigDataViewPanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigDataViewPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
