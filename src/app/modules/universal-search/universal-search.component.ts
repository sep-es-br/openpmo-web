import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Data } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LazyLoadEvent } from 'primeng/api';
import { DataView } from 'primeng/dataview';
import { Observable, OperatorFunction, Subject } from 'rxjs';
import { debounceTime, delay, distinctUntilChanged, map, take, takeUntil, tap } from 'rxjs/operators';
import { IHttpResult } from 'src/app/shared/interfaces/IHttpResult';
import { IPlan } from 'src/app/shared/interfaces/IPlan';
import { IBreadCrumb, IUniversalSearch } from 'src/app/shared/interfaces/universal-search.interface';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { PageDef, SearchService } from 'src/app/shared/services/search.service';

@Component({
  selector: 'app-universal-search',
  templateUrl: './universal-search.component.html',
  styleUrls: ['./universal-search.component.scss']
})
export class UniversalSearchComponent implements OnDestroy, AfterViewInit {

    @ViewChild(DataView) dataView : DataView;
  

    // searchTerm$ = this.searchSrv.searchTerm$;
    searchTerm;
    loading$ = this.searchSrv.loading$;
    totalCount : number;
    result : IUniversalSearch[];
    propertiesPlan:IPlan;
    pageData : PageDef = {} as PageDef;
    first : number;

    $destroy = new Subject<void>();

    searchControl = new FormControl();
  

  constructor(
    private translateSrv : TranslateService,
    private searchSrv : SearchService,
    private breadcrumbSrv : BreadcrumbService,
    private configDataViewSrv : ConfigDataViewService
  ) {
    this.setBreadcrumb();
    this.searchSrv.searchTerm$.pipe(takeUntil(this.$destroy)).subscribe(term => this.searchTerm = term);
    this.searchSrv.totalCount$.pipe(takeUntil(this.$destroy)).subscribe(total => this.totalCount = total);
    this.configDataViewSrv.observablePageSize.pipe(takeUntil(this.$destroy)).subscribe(pgSize => {
        this.onLazyLoadPage({first: 0, rows: pgSize} as LazyLoadEvent)
        this.pageData.pageSize = pgSize;
        this.first = 0;        
    })
    this.searchSrv.result$.pipe(take(1)).subscribe(_result => this.result = _result?.data?.data);

    this.pageData.page = 0;
    
    if(this.searchSrv.pageData) {
        this.pageData = this.searchSrv.pageData;
        this.configDataViewSrv.nextPageSize(this.pageData.pageSize);
    }

    this.searchControl.valueChanges.pipe(
        takeUntil(this.$destroy),
        debounceTime(1000)
    ).subscribe(value => this.onSearchInput(value))
   }

   ngAfterViewInit(): void {

        const { page, pageSize } = this.searchSrv.pageData;

        const first = page * pageSize;
        this.dataView.onLazyLoad.emit({
            first,
            rows: pageSize
        })


   }

   ngOnDestroy(): void {
       this.$destroy.next();
       this.$destroy.complete();
   }
  
  setBreadcrumb() {

    const storedOffice = localStorage.getItem('@pmo/propertiesCurrentOffice');
    const storedPlan = localStorage.getItem('@pmo/propertiesCurrentPlan');

    const propertiesOffice = storedOffice ? JSON.parse(storedOffice) : undefined;
    this.propertiesPlan = storedPlan ? JSON.parse(storedPlan) : undefined;

    if (propertiesOffice && this.propertiesPlan) {
      this.breadcrumbSrv.setMenu([
        {
          key: 'office',
          routerLink: ['/offices', 'office'],
          queryParams: { id: propertiesOffice.id },
          info: propertiesOffice?.name,
          tooltip: propertiesOffice?.fullName
        },
        {
          key: 'plan',
          routerLink: ['/plan'],
          queryParams: { id: this.propertiesPlan.id },
          info: this.propertiesPlan.name,
          tooltip: this.propertiesPlan.fullName
        },
        {
          key: 'action',
          routerLink: ['/search'],
          queryParams: { idPlan: this.propertiesPlan.id },
          info: 'search',
          tooltip: this.translateSrv.instant('search')
        },
      ]);
    }
  }

    onSearchInput(term: string) {
        if (term?.trim().length < this.searchSrv.minLength) return;
        
        
        if (term !== this.searchSrv.searchTerm$.value) {
            this.searchSrv.setSearchTerm(term);
            this.searchSrv.setPageData({ page: 0, pageSize: this.pageData.pageSize }); // sempre volta pra primeira página
            this.searchSrv.triggerSearch().subscribe(_result => {
                if(_result?.success) {
                    this.result = _result.data.data;
                } else {
                    this.result = [];
                }
            });
        }

        
    }   

    onLazyLoadPage(event: LazyLoadEvent) {
        const currentTerm = this.searchSrv.searchTerm$.value;

        const pageData: PageDef = {
            page: event.first / event.rows,
            pageSize: event.rows
        };

        if (
            this.searchSrv.pageData?.page !== pageData.page ||
            this.searchSrv.pageData?.pageSize !== pageData.pageSize
        ) {
            this.searchSrv.setPageData(pageData);
            this.searchSrv.triggerSearch().subscribe(_result => {
                    if(_result?.success) {
                        this.result = _result.data.data;
                    } else {
                        this.result = [];
                    }
                });
        }
    }


}
