import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { IUniversalSearch } from 'src/app/shared/interfaces/universal-search.interface';

@Component({
  selector: 'app-search-item-card',
  templateUrl: './search-item-card.component.html',
  styleUrls: ['./search-item-card.component.scss']
})
export class SearchItemCardComponent implements OnInit {

    @Input() item! : IUniversalSearch;

    @Output() onRedirect = new EventEmitter<void>();

  constructor(
    private router : Router
  ) { }

  @HostListener('click')
  handleRedirect() {
    this.router.navigateByUrl(`workpack?id=${this.item.id}&idPlan=${this.item.planId}`);
    this.onRedirect.emit();
  }



  ngOnInit() {
  }

}
