import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabviewScrolledComponent } from './tabview-scrolled.component';

describe('TabviewScrolledComponent', () => {
  let component: TabviewScrolledComponent;
  let fixture: ComponentFixture<TabviewScrolledComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TabviewScrolledComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TabviewScrolledComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
