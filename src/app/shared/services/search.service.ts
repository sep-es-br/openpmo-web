import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IUniversalSearch } from '../interfaces/universal-search.interface';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { PlanService } from './plan.service';
import { catchError, debounceTime, distinctUntilChanged, finalize, shareReplay, skipWhile, switchMap, take, tap } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { IHttpResult } from '../interfaces/IHttpResult';
import { ActivatedRoute } from '@angular/router';
import { IPlan } from '../interfaces/IPlan';
import { IOffice } from '../interfaces/IOffice';

export type PageDef = {page: number, pageSize : number};

@Injectable({
  providedIn: 'root'
})
export class SearchService extends BaseService<IUniversalSearch> {

  private _loading$ = new BehaviorSubject<boolean>(false);
  get loading$() {
    return this._loading$.asObservable();
  }

  private _minLength = 3;
  get minLength() {
    return this._minLength;
  }

  private _searchTerm = new BehaviorSubject<string>(undefined);
  private _pageData: PageDef;
  private _result$ = new BehaviorSubject<IHttpResult<any>>(undefined);
  private _totalCount$ = new BehaviorSubject<number>(undefined);
  private _propertiesPlan: IPlan;

  constructor(
    @Inject(Injector) injector: Injector,
    private msgSrv: MessageService
  ) {
    super('search', injector);
  }

  public doSimpleSearch(term: string, workpackId?: number, pageData? : PageDef) {

    if(this._loading$.value) return this.result$;
    
    const storedPlan = localStorage.getItem('@pmo/propertiesCurrentPlan');
    this._propertiesPlan = storedPlan ? JSON.parse(storedPlan) : undefined;

    return of(this._propertiesPlan).pipe(
      tap(() => this._loading$.next(true)),
      switchMap(({ id }) => {
        let params = new HttpParams().set('id-plan', id.toString());
        if (workpackId) params = params.set('id-workpack', workpackId.toString());
        if (term) params = params.set('term', term);
        pageData = pageData ?? this._pageData;
        if (pageData) {
          params = params.set('page', pageData.page.toString());
          params = params.set('pageSize', pageData.pageSize.toString());
        }
        return this.http.get<IHttpResult<any>>(this.urlBase, { params });
      }),
      catchError((err) => {
        this.msgSrv.add({
          summary: this.translateSrv.instant('error'),
          severity: 'error',
          detail: 'Erro ao efetuar busca'
        });
        console.error(err);
        return throwError(err);
      }),
      tap((result) => {
        this._result$.next(result); 
        this._totalCount$.next(result?.data?.totalRecords)// atualiza os resultados explicitamente
        this.msgSrv.add({
          summary: this.translateSrv.instant('success'),
          severity: 'success',
          detail: 'Busca concluída'
        });
      }),
      finalize(() => this._loading$.next(false))
    );
  }

  public setSearchTerm(term: string) {
    this._searchTerm.next(term);
  }

  public setPageData(pageData: PageDef) {
    this._pageData = pageData;
  }

  public triggerSearch(workpackId?: number) {
    this.doSimpleSearch(this._searchTerm.value, workpackId).pipe(take(1)).subscribe();
    return this.result$;
  }

  public get result$() {
    return this._result$.asObservable();
  }

  public get totalCount$() {
    return this._totalCount$.asObservable()
  }

  public get searchTerm$() {
    return this._searchTerm;
  }

  public get propertiesPlan() {
    return this._propertiesPlan;
  }

  public get pageData() {
    return this._pageData;
  }
}

