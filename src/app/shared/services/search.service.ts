import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IUniversalSearch } from '../interfaces/universal-search.interface';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { PlanService } from './plan.service';
import { catchError, distinctUntilChanged, finalize, shareReplay, skipWhile, switchMap, take, tap } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { IHttpResult } from '../interfaces/IHttpResult';
import { ActivatedRoute } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SearchService extends BaseService<IUniversalSearch>{

  private _loading$ = new BehaviorSubject<boolean>(false);
  get loading$() {
    return this._loading$.asObservable();
  }
  
private _searchTerm$ = new BehaviorSubject<string>('guarapari');

  private _result$ = this._searchTerm$.pipe(
    distinctUntilChanged((a, b) => a === b),
    switchMap((term) => this.doSimpleSearch(term)),
    shareReplay(1)
  );
  
  constructor(
    @Inject(Injector) injector : Injector,
    private planSrv : PlanService,
    private msgSrv : MessageService,
    private router : ActivatedRoute
  ) { 
    super('search', injector);
  }

  doSimpleSearch(term: string, workpackId?: number) {
    return this.router.queryParams.pipe(
            skipWhile(({idPlan}) => !idPlan),
            take(1),
            tap(() => this._loading$.next(true)),
            switchMap(({idPlan}) => {
              let params = new HttpParams().set('id-plan', idPlan.toString());
              if (workpackId) params = params.set('id-workpack', workpackId.toString())
              if (term) params = params.set('term', term);
              return this.http.get<IHttpResult<IUniversalSearch[]>>(this.urlBase, { params });
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
            tap(() => {
                this.msgSrv.add({
                    summary: this.translateSrv.instant('success'),
                    severity: 'success',
                    detail: 'Busca concluída'
                })
            }),
            finalize(() => this._loading$.next(false))
          )
  }


  public doUniversalSearch(term: string) {
    this._searchTerm$.next(term);
    return this._result$;
  }

  private doSearch(term) {

  }

  public get result$() {
    return this._result$;
  }

  public get searchTerm$() {
    return this._searchTerm$.asObservable();
  }

}

