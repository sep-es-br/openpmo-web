import { takeUntil } from 'rxjs/operators';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ResponsiveService } from '../../services/responsive.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-buttons-container',
  templateUrl: './buttons-container.component.html',
  styleUrls: ['./buttons-container.component.scss']
})
export class ButtonsContainerComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() compact = false;

  @Input() inline = false;

  responsive = false;
  $destroy = new Subject();
  @ViewChild('buttonLayout', { static: true }) buttonLayout: ElementRef;
  @ViewChild('buttonWrapper', { static: true }) buttonWrapper: ElementRef;
  private resizeObserver: any;


  constructor(
    private responsiveSrv: ResponsiveService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(resp => this.responsive = resp);
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.alignButtonsToContent();
    const ResizeObserverConstructor = (window as any).ResizeObserver;
    if (ResizeObserverConstructor) {
      this.resizeObserver = new ResizeObserverConstructor(() => this.alignButtonsToContent());
      this.resizeObserver.observe(this.buttonLayout.nativeElement);
    }
    window.addEventListener('resize', this.alignButtonsToContent);
  }

  private alignButtonsToContent = (): void => {
    const content = this.buttonLayout.nativeElement.getBoundingClientRect();
    const wrapper = this.buttonWrapper.nativeElement.style;
    wrapper.setProperty('left', `${content.left}px`, 'important');
    wrapper.setProperty('right', 'auto', 'important');
    wrapper.setProperty('width', `${content.width}px`, 'important');
    wrapper.setProperty('justify-content', 'flex-start', 'important');
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.alignButtonsToContent);
    this.$destroy.next();
    this.$destroy.complete();
  }

}
