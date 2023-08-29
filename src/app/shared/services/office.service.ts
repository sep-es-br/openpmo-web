import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Injector } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';
import { IOffice } from '../interfaces/IOffice';
import { ITreeViewScopeOffice } from '../interfaces/ITreeScopePersons';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class OfficeService extends BaseService<IOffice> {

  private officesPermissionsUser = new BehaviorSubject<IOffice[]>(undefined);
  private currentIDOffice = new BehaviorSubject<number>(0);

  constructor(
    @Inject(Injector) injector: Injector,
    private locationSrv: Location,
    private authSrv: AuthService
  ) {
    super('offices', injector);
    this.checkURL(`#${this.locationSrv.path()}`);
    this.locationSrv.onUrlChange(url => this.checkURL(url));
  }

  checkURL(url: string) {
    const [ path, query ] = url.slice(2).split('?');
    if (query) {
      const queries = query.split('&');
      queries.map(q => {
        const [ key, value ] = q.split('=');
        if (key === 'idOffice' || (path === 'offices/office' && key === 'id')) {
          this.currentIDOffice.next(Number(value));
        }
      });
    } else if (path === 'offices') {
      this.currentIDOffice.next(0);
    }
  }

  observableIdOffice() {
    return this.currentIDOffice.pipe(distinctUntilChanged());
  }

  nextIDOffice(idOffice: number) {
    this.currentIDOffice.next(idOffice);
  }

  public async GetTreeScopePersons(idOffice: number): Promise<IHttpResult<ITreeViewScopeOffice>> {
    const result = await this.http.get(`${this.urlBase}/${idOffice}/tree-view`).toPromise();
    return result as IHttpResult<ITreeViewScopeOffice>;
  }

  async getCurrentOffice(idOffice) {
    const propertiesOfficeItem = localStorage.getItem('@pmo/propertiesCurrentOffice');
    if (propertiesOfficeItem && (JSON.parse(propertiesOfficeItem)).id === idOffice) {
       return JSON.parse(propertiesOfficeItem);
    } else {
      const {success, data} = await this.GetById(idOffice);
      if (success) {
        const propertiesOffice = data;
        localStorage.setItem('@pmo/propertiesCurrentOffice', JSON.stringify(propertiesOffice));
        return propertiesOffice;
      }
    }
  }

}
