import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkpackSectionJournalComponent } from './workpack-section-journal.component';

describe('WorkpackSectionJournalComponent', () => {
  let component: WorkpackSectionJournalComponent;
  let fixture: ComponentFixture<WorkpackSectionJournalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkpackSectionJournalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkpackSectionJournalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
