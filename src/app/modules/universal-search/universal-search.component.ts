import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { delay, map, take } from 'rxjs/operators';
import { IHttpResult } from 'src/app/shared/interfaces/IHttpResult';
import { IBreadCrumb, IUniversalSearch } from 'src/app/shared/interfaces/universal-search.interface';
import { MenuService } from 'src/app/shared/services/menu.service';
import { PlanService } from 'src/app/shared/services/plan.service';
import { SearchService } from 'src/app/shared/services/search.service';

@Component({
  selector: 'app-universal-search',
  templateUrl: './universal-search.component.html',
  styleUrls: ['./universal-search.component.scss']
})
export class UniversalSearchComponent {

  
  minLength = 3;

    searchTerm = this.searchSrv.searchTerm$;
    loading$ = this.searchSrv.loading$;
    result$ = this.searchSrv.result$.pipe(
        map(({success, data} : IHttpResult<IUniversalSearch[]>) => 
            success ? data.map((item) => ({...item, breadcrumbs: (item.breadcrumbs as IBreadCrumb[])
                                                                    .map(b => b.nome)
                                                                    .join(' > ')})) : []
    )
    );
  

  constructor(
    public translateSrv : TranslateService,
    private searchSrv : SearchService,
    private route : ActivatedRoute,
    private planSrv : PlanService
  ) {
   }


  async ngAfterViewInit() {
    
  }

  handleSearchText(term : string) {
    if(term.trim().length < this.minLength) return;

    this.searchSrv.doUniversalSearch(term);

  }

}
