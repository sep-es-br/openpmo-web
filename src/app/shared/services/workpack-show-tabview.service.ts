import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkpackShowTabviewService {

  private showTabView = new BehaviorSubject<boolean>(false);

  get observable() {
    return this.showTabView.asObservable();
  }

  next(nextValue: boolean) {
    setTimeout(() => this.showTabView.next(nextValue), 0);
  }
}
