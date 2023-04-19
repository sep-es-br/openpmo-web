import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SaveButtonService {

  private showSaveButton = new BehaviorSubject<boolean>(false);
  private saveButtonClicked = new BehaviorSubject<boolean>(false);

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
}