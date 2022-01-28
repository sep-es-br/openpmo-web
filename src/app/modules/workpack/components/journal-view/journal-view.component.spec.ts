import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JournalViewComponent } from './journal-view.component';

describe('JournalViewComponent', () => {
  let component: JournalViewComponent;
  let fixture: ComponentFixture<JournalViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JournalViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JournalViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
