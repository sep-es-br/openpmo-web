import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MilestoneChangeService {

  private delayInDays = new BehaviorSubject<number>(null);

  get observable() {
    return this.delayInDays.asObservable();
  }

  next(nextValue: number) {
    this.delayInDays.next(nextValue)
  }

}