import { HttpHeaders } from '@angular/common/http';
import { Injectable, Inject, Injector, OnDestroy } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IFile } from '../interfaces/IFile';
import { IHttpResult } from '../interfaces/IHttpResult';
import { IOffice } from '../interfaces/IOffice';
import { IPerson, IWorkLocal } from '../interfaces/IPerson';
import { IPersonProfile } from '../interfaces/IPersonProfile';
import { PrepareHttpParams } from '../utils/query.util';
import { BehaviorSubject, forkJoin, Observable, Subject } from 'rxjs';
import { IPreferences } from '../interfaces/preferences.interface';
import { finalize, map, mergeMap, take, takeUntil, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PersonService extends BaseService<IPerson>{

  private avatarChanged = new BehaviorSubject<boolean>(false);
  avatarFile: IFile;
  private readonly _preferences = new BehaviorSubject<IPreferences>(undefined);
  

  constructor(
    @Inject(Injector) injector: Injector
  ) {
    super('persons', injector);
  }

  get avatarChangedObservable() {
    return this.avatarChanged.asObservable();
  }

  avatarChangedNext(nextValue: boolean) {
    this.avatarChanged.next(nextValue)
  }


  public async GetAllPersons(idOffice: number, options, paramsBody? ): Promise<IHttpResult<IPerson[]>> {
    const result = await this.http.post<IHttpResult<IPerson[]>>(`${this.urlBase}/office/${idOffice}?${PrepareHttpParams(options)}`, paramsBody).toPromise();
    if (!result.data?.length) {
      result.data = [];
    }
    return result;
  }

  public async GetByKey(email: string, options?): Promise<IHttpResult<IPerson>> {
    const result = await this.http.get(`${this.urlBase}/${email}`,
      {
        params: PrepareHttpParams(options)
      }).toPromise();
    return result as IHttpResult<IPerson>;
  }

  public async GetPersonByFullName(options): Promise<IHttpResult<IPerson[]>> {
    const result = await this.http.get<IHttpResult<IPerson[]>>(`${this.urlBase}/fullname`,
      {
        params: PrepareHttpParams(options)
      }).toPromise();
    if (!result.data?.length) {
      result.data = [];
    }
    return result;
  }

  public async GetByIdAndOffice(idPerson: number, idOffice: number): Promise<IHttpResult<IPerson>> {
    const result = await this.http.get(`${this.urlBase}/${idPerson}/office/${idOffice}`).toPromise();
    return result as IHttpResult<IPerson>;
  }

  public async GetProfile(email: string, idOffice): Promise<IHttpResult<IPerson>> {
    const result = await this.http.get(`${this.urlBase}/${email}/${idOffice}`).toPromise();
    return result as IHttpResult<IPerson>;
  }

  public async GetOffices(email: string): Promise<IHttpResult<IOffice[]>> {
    const result = await this.http.get(`${this.urlBase}/offices/${email}`).toPromise();
    return result as IHttpResult<IOffice[]>;
  }

  async putProfile(data: IPersonProfile, email: string, idOffice: number) {
    const result = await this.http.put(`${this.urlBase}/${email}/${idOffice}`, data).toPromise();
    return result as IHttpResult<IPersonProfile>;
  }

  async PutWithContactOffice(data: IPerson) {
    const result = await this.http.put(`${this.urlBase}/office`, data).toPromise();
    return result as IHttpResult<IPerson>;
  }

  public async updateNameAdministradorPerson(idPerson: number, name: string) {
    const result = await this.http.patch(`${this.urlBase}/${idPerson}`, { name }).toPromise();
    return result as IHttpResult<any>;
  }

  async DeleteAllPermissions(model: IPerson, idPerson: number, idOffice: number) {
    const message = 'messages.deletePermissionsConfirmation';
    const useConfirm = true;

    return new Promise(async (resolve, reject) => {
      if (useConfirm) {
        this.confirmationSrv.confirm({
          message: this.translateSrv.instant(message) + `?`,
          key: 'deleteConfirm',
          acceptLabel: this.translateSrv.instant('yes'),
          rejectLabel: this.translateSrv.instant('no'),
          accept: async () => {
            const result = await this.http.delete<IHttpResult<IPerson>>
              (`${this.urlBase}/${idPerson}/office/${idOffice}/permissions`).toPromise();
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
      } else {
        const result = await this.http.delete<IHttpResult<IPerson>>
          (`${this.urlBase}/${idPerson}/office/${idOffice}/permissions`).toPromise();
        resolve(result);
      }
    });
  }

  async getAvatar(idPerson: number): Promise<IHttpResult<IFile>> {
    if (this.avatarFile && this.avatarFile.file) {
      return {
        success: true,
        data: this.avatarFile
      };
    }
    const result = await this.http.get(`${this.urlBase}/${idPerson}/avatar`).toPromise() as IHttpResult<IFile>;
    this.avatarFile = result.data as IFile;
    return result as IHttpResult<IFile>;
  }

  async putAvatar(file: FormData, idPerson: number, options?): Promise<IHttpResult<IFile>> {
    const headers = new HttpHeaders({
      'Form-Data': 'true'
    });
    const result = await this.http.put(`${this.urlBase}/${idPerson}/avatar`,
    file, { headers, params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<IFile>;
  }

  async postAvatar(file: FormData, idPerson: number, options?): Promise<IHttpResult<IFile>> {
    const headers = new HttpHeaders({
      'Form-Data': 'true'
    });
    const result = await this.http.post(`${this.urlBase}/${idPerson}/avatar`, file, { headers, params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<IFile>;
  }

  async deleteAvatar(idPerson: number, options?): Promise<IHttpResult<IFile>> {
    const result = await this.http.delete(`${this.urlBase}/${idPerson}/avatar`,
      {
        params: PrepareHttpParams(options)
      }
    ).toPromise();
    return result as IHttpResult<IFile>;
  }

  async getOfficesByPerson(idPerson: number): Promise<IHttpResult<IOffice[]>> {
    const result = await this.http.get(`${this.urlBase}/${idPerson}/offices`).toPromise();
    return result as IHttpResult<IOffice[]>;
  }

  async getPersonsAdministrators(): Promise<IHttpResult<IPerson[]>> {
    const result = await this.http.get(`${this.urlBase}/administrator`).toPromise();
    return result as IHttpResult<IPerson[]>;
  }

  async deletePersonAdministrator(model: IPerson, idPerson: number): Promise<IHttpResult<any>> {
    const message = 'messages.deleteConfirmation';
    const useConfirm = true;

    return new Promise(async (resolve, reject) => {
      if (useConfirm) {
        this.confirmationSrv.confirm({
          message: `${this.translateSrv.instant(message)} ${model.name} ?`,
          key: 'deleteConfirm',
          acceptLabel: this.translateSrv.instant('yes'),
          rejectLabel: this.translateSrv.instant('no'),
          accept: async () => {
            const result = await this.http.delete<IHttpResult<IPerson>>
              (`${this.urlBase}/${idPerson}/administrators`).toPromise();
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
      } else {
        const result = await this.http.delete<IHttpResult<IPerson>>
          (`${this.urlBase}/${idPerson}/administrators`).toPromise();
        resolve(result);
      }
    });
  }

  async putPersonAdministrator(data: IPerson): Promise<IHttpResult<any>> {
    const result = await this.http.put(`${this.urlBase}/administrators`, data).toPromise();
    return result as IHttpResult<any>;
  }

  async setPersonAdministrator(idPerson: number, administrator: boolean): Promise<IHttpResult<any>> {
    return await this.http.patch<IHttpResult<any>>(`${this.urlBase}/administrator/${idPerson}`, { administrator }).toPromise();
  }

  async setPersonWorkLocal(workLocal: IWorkLocal): Promise<IHttpResult<any>> {
    const infoPerson = localStorage.getItem('@PMO/infoPerson');
    if (infoPerson) {
      const person = JSON.parse(infoPerson);
      person.workLocal = workLocal;
      localStorage.setItem('@PMO/infoPerson', JSON.stringify(person));
    }
    return await this.http.patch<IHttpResult<any>>(`${this.urlBase}/work-local`, workLocal).toPromise();
  }

  get $preferences() {
    return this._preferences.asObservable();
  }

  nextPreferences(preferences : Partial<IPreferences>) {
    this._preferences.pipe(take(1)).subscribe({
        next: (inPreferences) => {
            inPreferences = inPreferences ?? {} as IPreferences;

            Object.assign(inPreferences, preferences);
            
            this._preferences.next(inPreferences as IPreferences);
        }
    })    
  }

  nextAndSavePreferences(preferences : Partial<IPreferences>) {
    forkJoin({
        preferencesResp: this.updatePreferences()
    }).pipe(map(({preferencesResp}) => ({inPreferences: preferencesResp.data})))
    .subscribe({
        next: ({inPreferences}) => {
            inPreferences = inPreferences ?? {} as IPreferences;

            Object.assign(inPreferences, preferences);
            
            this._preferences.next(inPreferences as IPreferences);

            this.http.put(`${this.urlBase}/preferences`, inPreferences).subscribe();
        }
    })
       
  }

  updatePreferences() : Observable<IHttpResult<IPreferences>> {
    return this.http.get<IHttpResult<IPreferences>>(`${this.urlBase}/preferences`)
    .pipe(tap(({success, data}) => success ? this._preferences.next(data) : undefined))
     
  }

}



