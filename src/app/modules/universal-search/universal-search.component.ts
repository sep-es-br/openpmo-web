import { AfterViewInit, Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MenuService } from 'src/app/shared/services/menu.service';

@Component({
  selector: 'app-universal-search',
  templateUrl: './universal-search.component.html',
  styleUrls: ['./universal-search.component.scss']
})
export class UniversalSearchComponent implements OnInit, AfterViewInit {

  searchTerm : string;

  constructor(
    private menuSrv : MenuService,
    public translateSrv : TranslateService
  ) {
    
   }

  ngOnInit() {
    
  }

  ngAfterViewInit(): void {
  }

  handleSearchText() {
    alert(this.searchTerm)
  }

}
