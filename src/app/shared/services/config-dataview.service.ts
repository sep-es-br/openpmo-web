import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigDataViewService {

  private collapsePanelsStatus = new BehaviorSubject<string>('collapse');
  private displayModeAll = new BehaviorSubject<string>('list');
  private pageSize = new BehaviorSubject<number>(5);
  private panelStatus = 'collapse';

  get observableCollapsePanelsStatus() {
    return this.collapsePanelsStatus.asObservable();
  }

  nextCollapsePanelsStatus(nextValue: string) {
    this.panelStatus = nextValue;
    this.collapsePanelsStatus.next(nextValue);
  }

  getPanelStatus() {
    return this.panelStatus;
  }

  get observableDisplayModeAll() {
    return this.displayModeAll.asObservable();
  }

  nextDisplayModeAll(nextValue: string) {
    this.displayModeAll.next(nextValue)
  }

  get observablePageSize() {
    return this.pageSize.asObservable();
  }

  nextPageSize(nextValue: number) {
    this.pageSize.next(nextValue)
  }
}