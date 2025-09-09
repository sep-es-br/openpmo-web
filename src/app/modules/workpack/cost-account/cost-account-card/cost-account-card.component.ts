import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { IInstrument } from 'src/app/shared/services/pentaho.service';

@Component({
  selector: 'app-cost-account-card-instrument',
  templateUrl: './cost-account-card.component.html',
  styleUrls: ['./cost-account-card.component.scss']
})
export class CostAccountCardInstrumentComponent implements OnInit {

  @Input() instrument : IInstrument;
  @Input() instrumentList : IInstrument[];

  @Output() updateInstrument = new EventEmitter<IInstrument>();

  isMobile = window.innerWidth <= 768;

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 768;
  }

  constructor() { }

  triggerUpdate(newInstrumentCode : string) {
    this.instrument = this.instrumentList.find(i => i.sigefesCode === newInstrumentCode);

    this.updateInstrument.emit(this.instrument);
  }

  ngOnInit(): void {
  }

}
