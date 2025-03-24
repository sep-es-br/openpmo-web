import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { enterLeave } from '../../animations/enterLeave.animation';
import { ResponsiveService } from '../../services/responsive.service';

@Component({
  selector: 'app-cancel-button',
  templateUrl: './cancel-button.component.html',
  styleUrls: ['./cancel-button.component.scss'],
  animations: [
    enterLeave(
      { opacity: 0, pointerEvents: 'none', transform: 'translateY(100%)' },
      { opacity: 1, pointerEvents: 'all', transform: 'translateY(0)' },
      300
    )
  ]
})
export class CancelButtonComponent implements OnDestroy {

  @Input() set form(form: FormGroup) {
    if (form && form instanceof FormGroup) {
      form.valueChanges
        .pipe(filter(() => form.dirty), takeUntil(this.$destroy))
        .subscribe(() => this.showButton());
    }
  };
  @Output() cancel = new EventEmitter();
  isShowingButton = false;
  $destroy = new Subject();
  responsive = false;

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
    this.cancel.next();
    this.hideButton();
  }

  showButton() {
    setTimeout(() => this.isShowingButton = true, 0);
  }

  hideButton() {
    setTimeout(() => this.isShowingButton = false, 0);
  }

}

