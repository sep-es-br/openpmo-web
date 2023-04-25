import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MobileViewService {

  private isMobileView = new BehaviorSubject<boolean>(false);

  get observable() {
    return this.isMobileView.asObservable();
  }

  next(nextValue: boolean) {
    setTimeout(() => this.isMobileView.next(nextValue), 0);
  }

}