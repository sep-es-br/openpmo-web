import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IUniversalSearch } from '../interfaces/universal-search.interface';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { PlanService } from './plan.service';
import { catchError, distinctUntilChanged, finalize, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class SearchService extends BaseService<IUniversalSearch>{

  private _loading$ = new BehaviorSubject<boolean>(false);
  get loading$() {
    return this._loading$.asObservable();
  }
  
private _searchTerm$ = new Subject<string>();

  private _result$ = this._searchTerm$.pipe(
    distinctUntilChanged((a, b) => a === b),
    switchMap((term) => {
        this._loading$.next(true);
        return this.planSrv.observableIdPlan().pipe(
            take(1),
            switchMap(planId => {
              let params = new HttpParams().set('id-plan', planId.toString());
              if (term) params = params.set('term', term);
              return this.http.get<IUniversalSearch[]>(this.urlBase, { params });
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
            tap(() => this.msgSrv.add({
              summary: this.translateSrv.instant('success'),
              severity: 'success',
              detail: 'Busca concluída'
            })),
            finalize(() => this._loading$.next(false))
          )
    }),
    shareReplay(1)
  );
  
  constructor(
    @Inject(Injector) injector : Injector,
    private planSrv : PlanService,
    private msgSrv : MessageService
  ) { 
    super('search', injector);
    this._searchTerm$.next('guarapari');
  }

  doSimpleSearch(term: string, workpackId?: number) {
    return this.planSrv.observableIdPlan().pipe(
            take(1),
            switchMap(planId => {
              let params = new HttpParams().set('id-plan', planId.toString());
              if (workpackId) params = params.set('id-workpack', workpackId.toString());
              if (term) params = params.set('term', term);
              return this.http.get<IUniversalSearch[]>(this.urlBase, { params });
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
            tap(() => this.msgSrv.add({
              summary: this.translateSrv.instant('success'),
              severity: 'success',
              detail: 'Busca concluída'
            })),
            finalize(() => this._loading$.next(false))
          )
  }


  public doUniversalSearch(term: string) {
    this._searchTerm$.next(term);
    return this._result$;
  }

  public get result$() {
    return this._result$;
  }

  public get searchTerm$() {
    return this._searchTerm$.asObservable();
  }

}

