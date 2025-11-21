import {IMeasureUnit} from './../interfaces/IMeasureUnit';
import {IWorkpackData, IWorkpackParams} from './../interfaces/IWorkpackDataParams';
import {Injectable, Inject, Injector} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {BaseService} from '../base/base.service';
import {StoreKeys} from '../constants';
import {IHttpResult} from '../interfaces/IHttpResult';
import {IWorkpack, IWorkpackListCard} from '../interfaces/IWorkpack';
import {PrepareHttpParams} from '../utils/query.util';
import {IWorkpackFavorite} from '../interfaces/IWorkpackFavorite';
import { finalize, shareReplay, tap } from 'rxjs/operators';


@Injectable({providedIn: 'root'})
export class WorkpackService extends BaseService<IWorkpack> {

  private workpackCuted: IWorkpackListCard;
  private resetWorkpack = new BehaviorSubject<boolean>(false);
  private canEditCheckCompleted = new BehaviorSubject<boolean>(false);
  private checkCompletedChanged = new BehaviorSubject<boolean>(false);
  private reloadProperties = new BehaviorSubject<boolean>(false);
  private pendingChanges = new BehaviorSubject<boolean>(false);
  private loadingWorkpack = new BehaviorSubject<boolean>(false);
  private workpackData: IWorkpackData;
  private workpackParams: IWorkpackParams;
  private editPermission: boolean;
  private unitMeansure: IMeasureUnit;
  private permissionLevel: String;

  constructor(
    @Inject(Injector) injector: Injector
  ) {
    super('workpack', injector);
  }

  get observableResetWorkpack() {
    return this.resetWorkpack.asObservable();
  }

  nextResetWorkpack(nextValue: boolean) {
    this.resetWorkpack.next(nextValue);
  }

  get observablePendingChanges() {
    return this.pendingChanges.asObservable();
  }

  get observableLoadingWorkpack() {
    return this.loadingWorkpack.asObservable();
  }

  nextLoadingWorkpack(value: boolean) {
    this.loadingWorkpack.next(value);
  }


  nextPendingChanges(nextValue: boolean) {
    this.pendingChanges.next(nextValue);
  }

  get observableCanEditCheckCompleted() {
    return this.canEditCheckCompleted.asObservable();
  }

  nextCanEditCheckCompleted(nextValue: boolean) {
    this.canEditCheckCompleted.next(nextValue);
  }

  get observableCheckCompletedChanged() {
    return this.checkCompletedChanged.asObservable();
  }

  nextCheckCompletedChanged(nextValue: boolean) {
    this.checkCompletedChanged.next(nextValue);
  }

  get observableReloadProperties() {
    return this.reloadProperties.asObservable();
  }

  nextReloadProperties(nextValue: boolean) {
    this.reloadProperties.next(nextValue);
  }

  public setWorkpackData(workpackData, reset?: boolean) {
    this.workpackData = reset ? {} as IWorkpackData : {
      ...workpackData
    };
  }

  public getWorkpackData() {
    return this.workpackData;
  }

  public setEditPermission(edit: boolean) {
    this.editPermission = edit;
  }

  public getEditPermission() {
    return this.editPermission;
  }

  public setWorkpackParams(params) {
    this.workpackParams = {
      ...params
    };
  }

  public getWorkpackParams() {
    return this.workpackParams;
  }

  public setUnitMeansure(unit: IMeasureUnit, reset?: boolean) {
    this.unitMeansure = reset ? {} as IMeasureUnit :unit;
  }

  public getUnitMeansure() {
    return this.unitMeansure;
  }

  public setPermissionLevel(permissionLevel: String) {
    this.permissionLevel = permissionLevel;
  }

  public getPermissionLevel() {
    return this.permissionLevel;
  }

  public async GetWorkpackDataById(idWorkpack: number, options?): Promise<IHttpResult<IWorkpack>> {
    const result = await this.http.get<IHttpResult<IWorkpack>>(`${this.urlBase}/${idWorkpack}`,
    {params: PrepareHttpParams(options)}).toPromise();
    return result as IHttpResult<IWorkpack>;
  }

  public async GetWorkpackListCards(options?): Promise<IHttpResult<IWorkpackListCard[]>> {
    const result = await this.http.get<IHttpResult<IWorkpackListCard[]>>(`${this.urlBase}`,
    {params: PrepareHttpParams(options)}).toPromise();
    if (!result.data?.length) {
      result.data = [];
    }
    return result;
  }

  public async GetWorkpackPermissions(idWorkpack: number, options?): Promise<IHttpResult<any>> {
    const result = await this.http.get(`${this.urlBase}/${idWorkpack}/permissions`, {params: PrepareHttpParams(options)}).toPromise();
    return result as IHttpResult<any>;
  }

  public async GetWorkpackName(idWorkpack: number, options?): Promise<IHttpResult<any>> {
    const result = await this.http.get(`${this.urlBase}/${idWorkpack}/name`, {params: PrepareHttpParams(options)}).toPromise();
    return result as IHttpResult<any>;
  }

  public async GetWorkpacksByParent(options?): Promise<IHttpResult<IWorkpackListCard[]>> {
    const result = await this.http.get(`${this.urlBase}/parent`, {params: PrepareHttpParams(options)}).toPromise();
    return result as IHttpResult<IWorkpackListCard[]>;
  }

  public async GetWorkpackById(idWorkpack: number, options?): Promise<IHttpResult<IWorkpack>> {
    const result = await this.http.get(`${this.urlBase}/${idWorkpack}`, {params: PrepareHttpParams(options)}).toPromise();
    return result as IHttpResult<IWorkpack>;
  }

  public async checkWorkpackHasChildren(idWorkpack: number): Promise<IHttpResult<{ hasChildren: boolean; hasOnlyBasicRead: boolean }>> {
    const result = await this.http.get(`${this.urlBase}/${idWorkpack}/has-children`).toPromise();
    return result as IHttpResult<{ hasChildren: boolean; hasOnlyBasicRead: boolean }>;
  }

  public async GetWorkpackLinked(idWorkpack, options?): Promise<IHttpResult<IWorkpack>> {
    const result = await this.http.get(`${this.urlBase}/linked/${idWorkpack}`, {params: PrepareHttpParams(options)}).toPromise();
    return result as IHttpResult<IWorkpack>;
  }

  public async GetSharedWorkpacks(options?): Promise<IHttpResult<{ id: number; name: string; icon: string }[]>> {
    const result = await this.http.get(`${this.urlBase}/can-be-linked`, {params: PrepareHttpParams(options)}).toPromise();
    return result as IHttpResult<{ id: number; name: string; icon: string }[]>;
  }

  public linkWorkpack(idWorkpack, idWorkpackModel, options): Promise<IHttpResult<IWorkpack>> {
    return this.http.post<IHttpResult<IWorkpack>>(`${this.urlBase}/${idWorkpack}/link/to/workpackModel/${idWorkpackModel}`, {},
      {
        params: PrepareHttpParams(options)
      }).toPromise();
  }

  public unlinkWorkpack(idWorkpack, idWorkpackModel, options): Promise<IHttpResult<IWorkpack>> {
    return this.http.post<IHttpResult<IWorkpack>>(`${this.urlBase}/${idWorkpack}/unlink/to/workpackModel/${idWorkpackModel}`, {},
      {
        params: PrepareHttpParams(options)
      }).toPromise();
  }

  public async cancelWorkpack(idWorkpack: number) {
    const result = await this.http.patch(`${this.urlBase}/${idWorkpack}/cancel`, {}).toPromise();
    return result as IHttpResult<any>;
  }

  public async restoreWorkpack(idWorkpack: number) {
    const result = await this.http.patch(`${this.urlBase}/${idWorkpack}/restore`, {}).toPromise();
    return result as IHttpResult<any>;
  }

  public async pasteWorkpack(idWorkpack: number, idWorkpackModelTo: number, options?): Promise<IHttpResult<any>> {
    const result = await this.http.post(`${this.urlBase}/${idWorkpack}/paste-to/${idWorkpackModelTo}`,
      {},
      {params: PrepareHttpParams(options)}).toPromise();
    return result as IHttpResult<any>;
  }


  public async getItemsFavorites(idPlan: number): Promise<IHttpResult<IWorkpackFavorite[]>> {

    return await this.http.get<IHttpResult<any>>(`${this.urlBase}/favorites?id-plan=${idPlan}`)
                .toPromise();  

  }

  public async patchToggleWorkpackFavorite(idWorkpack: number, idPlan: number): Promise<IHttpResult<any>> {
    return await this.http.patch<IHttpResult<any>>(`${this.urlBase}/${idWorkpack}/favorite`, {idPlan}).toPromise();
  }


  setWorkpackCuted(workpack: IWorkpackListCard) {
    this.workpackCuted = workpack;
    localStorage.setItem(StoreKeys.WORKPACK_CUTED, JSON.stringify(workpack));
  }

  getWorkpackCuted(): IWorkpackListCard {
    return this.workpackCuted || JSON.parse(localStorage.getItem(StoreKeys.WORKPACK_CUTED));
  }

  removeWorkpackCuted() {
    localStorage.removeItem(StoreKeys.WORKPACK_CUTED);
  }

  public async endManagementDeliverable(
    endManagementWorkpack: {
      idWorkpack: number;
      reason: string;
      endManagementDate: string;
    }): Promise<IHttpResult<any>> {
    const result = await this.http.patch(`${this.urlBase}/end-deliverable-management/${endManagementWorkpack.idWorkpack}`,
      {endManagementDate: endManagementWorkpack.endManagementDate, reason: endManagementWorkpack.reason}).toPromise();
    return result as IHttpResult<any>;
  }

  public async completeDeliverable(idWorkpack: number, completed, date?: string): Promise<IHttpResult<any>> {
    const result = await this.http.patch(`${this.urlBase}/complete-deliverable/${idWorkpack}`,
      {completed, date}).toPromise();
    return result as IHttpResult<any>;
  }

  async patchMilestoneReason(idMilestone: number, dateReason: {
    date: string;
    reason?: string;
  }): Promise<IHttpResult<any>> {
    const result = await this.http.patch(`${this.urlBase}/milestone/${idMilestone}`, {
      date: dateReason.date,
      reason: dateReason.reason
    }).toPromise();
    return result as IHttpResult<any>;
  }

  public async deleteWorkpackCard(model: IWorkpackListCard, options?:
  { message?: string; field?: string; useConfirm?: boolean }): Promise<IHttpResult<IWorkpackListCard>> {
    const message = options?.message;
    const field: string = options?.field;
    const useConfirm: boolean = options?.useConfirm || true;

    return new Promise(async(resolve, reject) => {
      if (useConfirm) {
        this.confirmationSrv.confirm({
          message: message || `${this.translateSrv.instant('messages.deleteConfirmation')} ${model[field ? field : 'name'] || ''}?`,
          key: 'deleteConfirm',
          acceptLabel: this.translateSrv.instant('yes'),
          rejectLabel: this.translateSrv.instant('no'),
          accept: async() => {
            const result = await this.http.delete<IHttpResult<IWorkpackListCard>>(`${this.urlBase}/${model['id']}`).toPromise();
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
        const result = await this.http.delete<IHttpResult<IWorkpackListCard>>(`${this.urlBase}/${model['id']}`).toPromise();
        resolve(result);
      }
    });
  }
  /* eslint-enable @typescript-eslint/dot-notation */

}

