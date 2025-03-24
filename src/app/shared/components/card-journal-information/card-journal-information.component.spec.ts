import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardJournalInformationComponent } from './card-journal-information.component';

describe('CardJournalInformationComponent', () => {
  let component: CardJournalInformationComponent;
  let fixture: ComponentFixture<CardJournalInformationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardJournalInformationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardJournalInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
