import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Injector } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { BaseService } from '../base/base.service';
import { IOffice } from '../interfaces/IOffice';
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
    this.locationSrv.onUrlChange(url => {
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
    });
  }

  observableIdOffice() {
    return this.currentIDOffice.pipe(distinctUntilChanged());
  }

  nextIDOffice(idOffice: number) {
    this.currentIDOffice.next(idOffice);
  }
}
