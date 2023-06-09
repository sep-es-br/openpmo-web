import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardItemSourceFileComponent } from './card-item-source-file.component';

describe('CardItemSourceFileComponent', () => {
  let component: CardItemSourceFileComponent;
  let fixture: ComponentFixture<CardItemSourceFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardItemSourceFileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardItemSourceFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
