import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ResponsiveService {

  private isMobileView = new BehaviorSubject<boolean>(false);
  private resizeEventSub = new Subject<any>();

  get observable() {
    return this.isMobileView.asObservable();
  }

  next(nextValue: boolean) {
    setTimeout(() => this.isMobileView.next(nextValue), 0);
  }

  get resizeEvent() {
    return this.resizeEventSub.asObservable();
  }

  nextResizeEvent(nextValue: any) {
    this.resizeEventSub.next(nextValue);
  }
}
