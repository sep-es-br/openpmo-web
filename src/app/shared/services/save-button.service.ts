import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SaveButtonService {

  private showSaveButton = new BehaviorSubject<boolean>(false);
  private saveButtonClicked = new BehaviorSubject<boolean>(false);
  private cancelButtonClicked = new BehaviorSubject<boolean>(false);
  private showCancelButton = new BehaviorSubject<boolean>(false);

  get observableShowSaveButton() {
    return this.showSaveButton.asObservable();
  }

  nextShowSaveButton(nextValue: boolean) {
    this.showSaveButton.next(nextValue)
  }

  get observableSaveButtonClicked() {
    return this.saveButtonClicked.asObservable();
  }

  nextSaveButtonClicked(nextValue: boolean) {
    this.saveButtonClicked.next(nextValue)
  }

  get observableCancelButtonClicked() {
    return this.cancelButtonClicked.asObservable();
  }

  nextCancelButtonClicked(nextValue: boolean) {
    this.cancelButtonClicked.next(nextValue)
  }

  get observableShowCancelButton() {
    return this.showCancelButton.asObservable();
  }

  nextShowCancelButton(nextValue: boolean) {
    this.showCancelButton.next(nextValue)
  }
}