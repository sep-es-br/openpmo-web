import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardItemFileComponent } from './card-item-file.component';

describe('CardItemFileComponent', () => {
  let component: CardItemFileComponent;
  let fixture: ComponentFixture<CardItemFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardItemFileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardItemFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
