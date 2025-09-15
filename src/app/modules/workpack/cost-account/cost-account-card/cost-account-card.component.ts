import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { IInstrument } from 'src/app/shared/services/pentaho.service';

@Component({
  selector: 'app-cost-account-card-instrument',
  templateUrl: './cost-account-card.component.html',
  styleUrls: ['./cost-account-card.component.scss']
})
export class CostAccountCardInstrumentComponent {

  @Input() instrument : IInstrument;
  @Input() instrumentList : IInstrument[];
  @Input() selectedInstrumentList : IInstrument[];

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

  get modifiedInstrumentList() {
    if(this.instrument?.sigefesCode && !this.filteredInstrumentList.some(i => i.sigefesCode === this.instrument.sigefesCode))
      return [this.instrument, ...this.filteredInstrumentList]
    else
      return this.filteredInstrumentList;
  }

  get filteredInstrumentList() {
      return this.instrumentList
        .filter(instrument => !this.selectedInstrumentList?.some(_inst => _inst.sigefesCode === instrument.sigefesCode))
  }

}
