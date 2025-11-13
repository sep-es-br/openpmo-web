import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { LazyLoadEvent } from 'primeng/api';
import { DataView } from 'primeng/dataview';
import { Subject } from 'rxjs';
import { debounceTime, finalize, takeUntil } from 'rxjs/operators';
import { IPlan } from 'src/app/shared/interfaces/IPlan';
import { IUniversalSearch } from 'src/app/shared/interfaces/universal-search.interface';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { PageDef, SearchService } from 'src/app/shared/services/search.service';

@Component({
  selector: 'app-universal-search',
  templateUrl: './universal-search.component.html',
  styleUrls: ['./universal-search.component.scss']
})
export class UniversalSearchComponent implements OnDestroy {
  @ViewChild(DataView) dataView: DataView;

  searchTerm;

  loading = false;

  totalCount: number;

  result: IUniversalSearch[];

  propertiesPlan: IPlan;

  pageData: PageDef = {} as PageDef;

  first: number;

  $destroy = new Subject<void>();

  searchControl = new FormControl();

  canLoad = false;

  constructor(
    private translateSrv: TranslateService,
    private searchSrv: SearchService,
    private breadcrumbSrv: BreadcrumbService,
    private configDataViewSrv: ConfigDataViewService
  ) {
    this.setBreadcrumb();
    this.configDataViewSrv.observablePageSize
      .pipe(takeUntil(this.$destroy))
      .subscribe(pgSize => {
        if (this.canLoad) this.onLazyLoadPage({ first: 0, rows: pgSize } as LazyLoadEvent);
        this.pageData.pageSize = pgSize;
        this.first = 0;
      }
    );

    this.searchControl.valueChanges.pipe(
      takeUntil(this.$destroy),
      debounceTime(1000)
    ).subscribe(value => this.onSearchInput(value));
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
    if (term.length < 3) return;
    if (!this.canLoad) {
      this.canLoad = true;
      return;
    }

    if (term?.trim().length < this.searchSrv.minLength) return;
    const pageData = { page: 0, pageSize: this.pageData.pageSize };
    this.doSearch(term, pageData);
  }

  onLazyLoadPage(event: LazyLoadEvent) {
    if (this.searchControl.value?.length < 3) return;
    if (!this.canLoad) {
      this.canLoad = true;
      return;
    }

    const pageData: PageDef = {
      page: event.first / event.rows,
      pageSize: event.rows
    };

    this.doSearch(this.searchControl.value, pageData);
  }

  doSearch(term?: any, dataPage?: any) {
    this.loading = true;
    this.searchSrv.doSimpleSearch(term ?? this.searchTerm, undefined, dataPage ?? this.pageData)
      .pipe(finalize(() => this.loading = false))
      .subscribe(_result => {
          if (_result?.success) {
            this.result = _result.data.data;
            this.totalCount = _result.data.totalRecords;
          } else {
            this.result = [];
          }
      }
    );
  }
}
