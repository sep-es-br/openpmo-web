import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ResponsiveService {

  private isMobileView = new BehaviorSubject<boolean>(false);

  get observable() {
    return this.isMobileView.asObservable();
  }

  next(nextValue: boolean) {
    setTimeout(() => this.isMobileView.next(nextValue), 0);
  }
}
