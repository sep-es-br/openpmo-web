import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueResponseComponent } from './issue-response.component';

describe('IssueResponseComponent', () => {
  let component: IssueResponseComponent;
  let fixture: ComponentFixture<IssueResponseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IssueResponseComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IssueResponseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
