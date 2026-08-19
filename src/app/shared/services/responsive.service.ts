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
    this.isMobileView.next(nextValue);
  }

  get resizeEvent() {
    return this.resizeEventSub.asObservable();
  }

  nextResizeEvent(nextValue: any) {
    this.resizeEventSub.next(nextValue);
  }
}
