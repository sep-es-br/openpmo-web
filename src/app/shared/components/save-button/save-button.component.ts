import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { enterLeave } from '../../animations/enterLeave.animation';
import { ResponsiveService } from '../../services/responsive.service';

@Component({
  selector: 'app-save-button',
  templateUrl: './save-button.component.html',
  styleUrls: ['./save-button.component.scss'],
  animations: [
    enterLeave({ opacity: 0, pointerEvents: 'none' }, { opacity: 1, pointerEvents: 'all' }, 300)
  ]
})
export class SaveButtonComponent implements OnDestroy {

  @Input() set form(form: FormGroup) {
    if (form && form instanceof FormGroup) {
      form.valueChanges
        .pipe(filter(() => form.dirty), takeUntil(this.$destroy))
        .subscribe(() => this.showButton());
    }
  };
  @Output() save = new EventEmitter();
  isShowingButton = false;
  responsive = false;
  $destroy = new Subject();

  constructor(
    private responsiveSrv: ResponsiveService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(resp => this.responsive = resp);
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  handleClick() {
    this.save.next();
    this.hideButton();
  }

  showButton() {
    setTimeout(() => this.isShowingButton = true, 0);
  }

  hideButton() {
    setTimeout(() => this.isShowingButton = false, 0);
  }

}
