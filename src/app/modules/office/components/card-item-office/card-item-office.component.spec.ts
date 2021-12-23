import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardItemOfficeComponent } from './card-item-office.component';

describe('CardItemOfficeComponent', () => {
  let component: CardItemOfficeComponent;
  let fixture: ComponentFixture<CardItemOfficeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardItemOfficeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardItemOfficeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
