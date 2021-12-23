import { PrepareHttpParams } from './../utils/query.util';
import { IBaseline, IBaselineUpdates } from './../interfaces/IBaseline';
import { IHttpResult } from './../interfaces/IHttpResult';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IWorkpackBaselines } from '../interfaces/IWorkpackBaselines';

@Injectable({
  providedIn: 'root'
})
export class BaselineService extends BaseService<IBaseline> {

  constructor(
    @Inject(Injector) injector: Injector,
  ) {
    super('baselines', injector);
  }

  public async getBaselinesFromCcbMember(): Promise<IHttpResult<IWorkpackBaselines[]>> {
    return this.http.get<IHttpResult<IWorkpackBaselines[]>>(`${this.urlBase}/ccb-member`).toPromise();
  }

  // public async GetBaselines(options?): Promise<IHttpResult<IBaseline[]>> {
  //   return {
  //     success: true,
  //     data: [
  //       {
  //         id: 1,
  //         idWorkpack: 1,
  //         name: 'Primeira',
  //         description: '',
  //         status: 'APPROVED',
  //         proposalDate: '20/05/2019'
  //       },
  //       {
  //         id: 2,
  //         idWorkpack: 1,
  //         name: 'Segunda',
  //         description: '',
  //         status: 'APPROVED',
  //         proposalDate: '20/05/2020',
  //         active: true,
  //         activationDate: '31/01/2020'
  //       },
  //       {
  //         id: 3,
  //         idWorkpack: 1,
  //         name: 'Terceira',
  //         description: '',
  //         status: 'DRAFT',
  //         proposalDate: '20/05/2020',
  //         active: false,
  //       },
  //       {
  //         id: 4,
  //         idWorkpack: 1,
  //         name: 'Quarta',
  //         description: '',
  //         status: 'PROPOSED',
  //         cancelation: true,
  //         proposalDate: '20/05/2020',
  //         active: false,
  //       },
  //     ]
  //   }
  // }

  public async getUpdates(options): Promise<IBaselineUpdates[]> {
    const { success, data } = await
      this.http.get<IHttpResult<IBaselineUpdates[]>>(`${this.urlBase}/updates`, { params: PrepareHttpParams(options) }).toPromise();
    return success ? data : [];
    // return [
    //   {
    //     idWorkpack: 1,
    //     icon: 'fas fa-folder-open',
    //     description: 'Entrega Scratch com nome maior',
    //     status: 'CHANGED'
    //   },
    //   {
    //     idWorkpack: 2,
    //     icon: 'fas fa-boxes',
    //     description: 'Entrega Importante',
    //     status: 'NEW'
    //   }
    // ]
  }

  public putBaseline(idBaseline: number, model: IBaseline): Promise<IHttpResult<IBaseline>> {
    return this.http.put<IHttpResult<IBaseline>>(`${this.urlBase}/${idBaseline}`, model).toPromise();
  }

  public async submitBaseline(idBaseline: number, updates: IBaselineUpdates[]): Promise<IHttpResult<IBaseline>> {
    return this.http.put<IHttpResult<IBaseline>>(`${this.urlBase}/${idBaseline}/submit`, {updates}).toPromise();
  }

  public async submitBaselineCancelling(baseline: IBaseline): Promise<IHttpResult<IBaseline>> {
    return this.http.post<IHttpResult<IBaseline>>(`${this.urlBase}/submit-cancelling`, baseline).toPromise();
  }

  public async getBaselineView(idBaseline: number): Promise<IHttpResult<IBaseline>> {
    // return {
    //   success: true,
    //   data: {
    //     id: 1,
    //     idWorkpack: 1,
    //     projectName: 'Project 1',
    //     description: 'Terceira baseline do projeto, para refletir os ajustes decorrentes  da covid-19',
    //     message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident',
    //     proposer: 'José da Silva (Project Manager)',
    //     status: 'REJECTED',
    //     name: 'Terceira',
    //     cancelation: false,
    //     cost: {
    //       variation: 20,
    //       currentValue: 500,
    //       proposedValue: 430,
    //       costDetails: [
    //         {
    //           icon: 'fas fa-boxes',
    //           description: 'Entrega 1',
    //           currentValue: 20000000,
    //         },
    //         {
    //           icon: 'fas fa-boxes',
    //           description: 'Entrega 2',
    //           currentValue: 20000000,
    //           proposedValue: 21000000,
    //           variation: 10
    //         },
    //         {
    //           icon: 'fas fa-boxes',
    //           description: 'Entrega 3',
    //           proposedValue: 50000000,
    //         },
    //         {
    //           icon: 'fas fa-boxes',
    //           description: 'Entrega 4',
    //           currentValue: 20000000,
    //           proposedValue: 19000000,
    //           variation: -5
    //         },
    //       ]
    //     },
    //     schedule: {
    //       variation: 30,
    //       currentStartDate: '2021-01-01',
    //       currentEndDate: '2021-12-10',
    //       proposedStartDate: '2021-01-01',
    //       proposedEndDate: '2021-11-10',
    //       currentValue: 11,
    //       proposedValue: 10,
    //       scheduleDetails: [
    //         {
    //           icon: 'fas fa-boxes',
    //           description: 'Entrega 1',
    //           currentDate: '2021-01-01',
    //         },
    //         {
    //           icon: 'fas fa-boxes',
    //           description: 'Entrega 2',
    //           currentDate: '2021-03-01',
    //           proposedDate: '2021-05-10',
    //           variation: -30
    //         },
    //         {
    //           icon: 'fas fa-boxes',
    //           description: 'Entrega 3',
    //           proposedDate: '2021-04-10'
    //         },
    //         {
    //           icon: 'fas fa-boxes',
    //           description: 'Entrega 4',
    //           currentDate: '2021-03-01',
    //           proposedDate: '2021-05-10',
    //           variation: 10
    //         },
    //       ]
    //     },
    //     scope: {
    //       variation: 40,
    //       currentScopePercent: 100,
    //       proposedScopePercent: 60,
    //       scopeDetails: [
    //         {
    //           icon: 'fas fa-boxes',
    //           description: 'Entrega a',
    //           currentValue: 20000000,
    //         },
    //         {
    //           icon: 'fas fa-boxes',
    //           description: 'Entrega b',
    //           currentValue: 20000000,
    //           proposedValue: 21000000,
    //           variation: 10
    //         },
    //         {
    //           icon: 'fas fa-boxes',
    //           description: 'Entrega c',
    //           proposedValue: 50000000,
    //         },
    //         {
    //           icon: 'fas fa-boxes',
    //           description: 'Entrega d',
    //           currentValue: 20000000,
    //           proposedValue: 19000000,
    //           variation: -5
    //         },
    //       ]
    //     },
    //     evaluations: [
    //       {
    //         ccbMemberName: 'Maria',
    //         decision: 'APPROVED',
    //       },
    //       {
    //         ccbMemberName: 'José',
    //         decision: 'REJECTED',
    //       },
    //       {
    //         ccbMemberName: 'João',
    //         decision: 'APPROVED',
    //         comment: 'Comentário importante!'
    //       },
    //       {
    //         ccbMemberName: 'Giwberto',
    //         decision: 'APPROVED',
    //         myEvaluation: false
    //       }
    //     ]
    //   }
    // };
    return this.http.get<IHttpResult<IBaseline>>(`${this.urlBase}/${idBaseline}/ccb-member-view`).toPromise();
  }

  public async evaluateBaseline(idBaseline: number, model: {decision: string; comment: string}): Promise<IHttpResult<IBaseline>> {
    return this.http.put<IHttpResult<IBaseline>>(`${this.urlBase}/${idBaseline}/evaluate`, model).toPromise();
  }
}
