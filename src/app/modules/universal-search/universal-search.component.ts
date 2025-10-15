import { AfterViewInit, Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { delay } from 'rxjs/operators';
import { MenuService } from 'src/app/shared/services/menu.service';
import { SearchService } from 'src/app/shared/services/search.service';

@Component({
  selector: 'app-universal-search',
  templateUrl: './universal-search.component.html',
  styleUrls: ['./universal-search.component.scss']
})
export class UniversalSearchComponent implements OnInit, AfterViewInit {

  searchTerm;
  minLength = 3;

  loading$ = this.searchSrv.loading$;
  result$ = this.searchSrv.result$;
  

  constructor(
    public translateSrv : TranslateService,
    private searchSrv : SearchService
  ) {
    
   }



  ngOnInit() {
    
  }

  ngAfterViewInit(): void {
    this.searchSrv.searchTerm$.pipe(delay(500)).subscribe(value => this.searchTerm = value)
  }

  handleSearchText(term : string) {
    if(term.trim().length < this.minLength) return;

    this.searchSrv.doUniversalSearch(term);

  }

}
