import { takeUntil } from 'rxjs/operators';
import { Component, Input, OnInit } from '@angular/core';
import { ResponsiveService } from '../../services/responsive.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-buttons-container',
  templateUrl: './buttons-container.component.html',
  styleUrls: ['./buttons-container.component.scss']
})
export class ButtonsContainerComponent implements OnInit {

  @Input() compact = false;

  @Input() inline = false;

  responsive = false;
  $destroy = new Subject();


  constructor(
    private responsiveSrv: ResponsiveService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(resp => this.responsive = resp);
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

}
