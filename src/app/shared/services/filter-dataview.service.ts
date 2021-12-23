import { PropertyTemplateModel } from './../models/PropertyTemplateModel';
import { Observable, Subject } from 'rxjs';
import { IFilterDataview } from '../interfaces/IFilterDataview';
import { IHttpResult } from '../interfaces/IHttpResult';
import { Injectable, Inject, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';

@Injectable({ providedIn: 'root' })
export class FilterDataviewService extends BaseService<IFilterDataview> {

  private currentFilterProperties: Subject<PropertyTemplateModel[]> = new Subject<PropertyTemplateModel[]>();
  private key: string = '@pmo/filter-properties';

  constructor(
    @Inject(Injector) injector: Injector
  ) {
    super('filter', injector);
  }

  public async getAllFilters(entityName: string): Promise<IHttpResult<IFilterDataview[]>> {
    const result = await this.http.get(`${this.urlBase}/${entityName}`).toPromise();
    return result as IHttpResult<IFilterDataview[]>;
  }

  public async getFilterById(entityName: string, idFilter: number): Promise<IHttpResult<IFilterDataview>> {
    const result = await this.http.get(`${this.urlBase}/${entityName}/${idFilter}`).toPromise();
    return result as IHttpResult<IFilterDataview>;
  }

  public async putFilter(entityName: string, filter: IFilterDataview): Promise<IHttpResult<IFilterDataview>> {
    return this.http.put<IHttpResult<IFilterDataview>>(`${this.urlBase}/${entityName}`, filter).toPromise();
  }

  public async postFilter(entityName: string, filter: IFilterDataview): Promise<IHttpResult<IFilterDataview>> {
    return this.http.post<IHttpResult<IFilterDataview>>(`${this.urlBase}/${entityName}`, filter).toPromise();
  }

  public async deleteFilter(entityName: string, idFilter: Number): Promise<IHttpResult<IFilterDataview>> {
    return new Promise(async (resolve, reject) => {
      this.confirmationSrv.confirm({
        message: `${this.translateSrv.instant('messages.deleteConfirmation')}?`,
        key: 'deleteConfirm',
        acceptLabel: this.translateSrv.instant('yes'),
        rejectLabel: this.translateSrv.instant('no'),
        accept: async () => {
          const result = await this.http.delete<IHttpResult<IFilterDataview>>(`${this.urlBase}/${entityName}/${idFilter}`).toPromise();
          if (result.success) {
            setTimeout(() => {
              this.messageSrv.add({
                severity: 'success',
                summary: this.translateSrv.instant('success'),
                detail: this.translateSrv.instant('messages.deleteSuccessful')
              });
            }, 300);
          }
          resolve(result);
        },
        reject: () => {
          resolve({ success: false, data: undefined });
        }
      });

    });
  }

  setFilterProperties(filterProperties: PropertyTemplateModel[]) {
    localStorage.setItem(this.key, JSON.stringify(filterProperties));
    this.currentFilterProperties.next(filterProperties);
  }

  get get(): PropertyTemplateModel[] {
    let filterProperties: PropertyTemplateModel[];
    try {
      filterProperties = JSON.parse(localStorage.getItem(this.key));
      return filterProperties;
    } catch (error) {
      filterProperties = [];
      return filterProperties;
    }
  }

  get ready(): Observable<PropertyTemplateModel[]> {
    return this.currentFilterProperties.asObservable();
  }

}
