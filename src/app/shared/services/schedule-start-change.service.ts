import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScheduleStartChangeService {

  private startDateChanged = new BehaviorSubject<boolean>(false);

  get observable() {
    return this.startDateChanged.asObservable();
  }

  next(nextValue: boolean) {
    setTimeout(() => this.startDateChanged.next(nextValue), 0);
  }
}