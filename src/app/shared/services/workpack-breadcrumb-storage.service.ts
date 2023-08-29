import { IWorkpackData } from './../interfaces/IWorkpackDataParams';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { BreadcrumbService } from './breadcrumb.service';
import { Injectable } from '@angular/core';
import { IWorkpackParams } from '../interfaces/IWorkpackDataParams';
import { IBreadcrumb } from '../interfaces/IBreadcrumb';

@Injectable({
  providedIn: 'root'
})
export class WorkpackBreadcrumbStorageService {

  private workpackParams: IWorkpackParams;
  private workpackData: IWorkpackData;
  private workpackName: { name: string; fullName: string };
  currentBreadcrumbItems: IBreadcrumb[];
  idParent: number;
  private key = '@pmo/current-breadcrumb';

  constructor(
    private breadcrumbSrv: BreadcrumbService,
    private workpackSrv: WorkpackService
  ) {
  }

  public async setBreadcrumbStorage(breadcrumb?) {
    const breadcrumbItems = breadcrumb ? breadcrumb : await this.getCurrentBreadcrumb();
    localStorage.setItem(this.key, JSON.stringify(breadcrumbItems));
  }

  public async getBreadcrumbs(idWorkpack, idPlan) {
    const { success, data } = await this.breadcrumbSrv.getBreadcrumbWorkpack(idWorkpack, { 'id-plan': idPlan });
    return success
      ? data.map(p => ({
        key: !p.modelName ? p.type.toLowerCase() : p.modelName,
        info: p.name,
        tooltip: p.fullName,
        routerLink: this.getRouterLinkFromType(p.type),
        queryParams: { id: p.id, idWorkpackModelLinked: p.idWorkpackModelLinked, idPlan: this.workpackParams.idPlan },
        modelName: p.modelName
      }))
      : [];
  }

  getCurrentBreadcrumb() {
    this.workpackData = this.workpackSrv.getWorkpackData();
    this.workpackName = this.workpackSrv.getNameWorkpack();
    this.workpackParams = this.workpackSrv.getWorkpackParams();
    this.idParent = this.workpackData?.workpack?.idParent || this.workpackParams.idWorkpackParent;
    this.currentBreadcrumbItems = this.breadcrumbSrv.get;
    const { idOffice, idPlan, idWorkpack } = this.workpackParams;
    let breadcrumb;
    if (this.currentBreadcrumbItems && this.currentBreadcrumbItems.length > 0) {
      const breadcrumbIndex = this.currentBreadcrumbItems.findIndex(item => item.queryParams?.id === idWorkpack);
      if (breadcrumbIndex > -1) {
        breadcrumb = this.currentBreadcrumbItems.slice(0, breadcrumbIndex + 1);
      } else {
        const breadcrumbOfficeIndex = this.currentBreadcrumbItems.findIndex(item => item.key === 'office' && item.queryParams?.id === idOffice);
        const breadcrumbPlanIndex = this.currentBreadcrumbItems.findIndex(item => item.key === 'plan' && item.queryParams?.id === idPlan);
        const breadcrumbParentIndex = this.currentBreadcrumbItems.findIndex(item => !['office', 'plan'].includes( item.key) && this.idParent && item.queryParams?.id === this.idParent);
        if (breadcrumbOfficeIndex > -1 && breadcrumbPlanIndex > -1 && breadcrumbParentIndex > -1) {
          breadcrumb = [...this.currentBreadcrumbItems.slice(0, breadcrumbParentIndex + 1),
          ... this.workpackParams.idWorkpack
            ? [
              {
                key: this.workpackData.workpackModel?.type?.toLowerCase().replace('model', ''),
                info: this.workpackName.name,
                tooltip: this.workpackName.fullName,
                routerLink: ['/workpack'],
                queryParams: {
                  id: this.workpackParams.idWorkpack,
                  idPlan: this.workpackParams.idPlan,
                  idWorkpackModelLinked: this.workpackParams.idWorkpackModelLinked
                },
                modelName: this.workpackData.workpackModel?.modelName
              }
            ]
            : [{
              key: this.workpackData.workpackModel?.type?.toLowerCase().replace('model', ''),
              info: this.workpackName.name,
              tooltip: this.workpackName.fullName,
              routerLink: ['/workpack'],
              queryParams: {
                idPlan: this.workpackParams.idPlan,
                idWorkpackModel: this.workpackParams.idWorkpackModel,
                idWorkpackParent: this.idParent
              },
              modelName: this.workpackData.workpackModel?.modelName
            }]
          ];
        } else {
          breadcrumb = this.startNewBreadcrumb();
        }
      }
      return breadcrumb;
    } else {
      breadcrumb = this.startNewBreadcrumb();
      return breadcrumb;
    }
  }

  startNewBreadcrumb() {
    return [
      {
        key: 'office',
        info: this.workpackParams.propertiesOffice.name,
        tooltip: this.workpackParams.propertiesOffice.fullName,
        routerLink: ['/offices', 'office'],
        queryParams: { id: this.workpackParams.idOffice },
      },
      {
        key: 'plan',
        info: this.workpackParams.propertiesPlan.name,
        tooltip: this.workpackParams.propertiesPlan.fullName,
        routerLink: ['/plan'],
        queryParams: { id: this.workpackParams.propertiesPlan.id },
      },
      ... this.workpackParams.idWorkpack
        ? [
          {
            key: this.workpackData.workpackModel?.type?.toLowerCase().replace('model', ''),
            info: this.workpackName.name,
            tooltip: this.workpackName.fullName,
            routerLink: ['/workpack'],
            queryParams: {
              id: this.workpackParams.idWorkpack,
              idPlan: this.workpackParams.idPlan,
              idWorkpackModelLinked: this.workpackParams.idWorkpackModelLinked
            },
            modelName: this.workpackData.workpackModel?.modelName
          }
        ]
        : [{
          key: this.workpackData.workpackModel?.type?.toLowerCase().replace('model', ''),
          info: this.workpackName.name,
          tooltip: this.workpackName.fullName,
          routerLink: ['/workpack'],
          queryParams: {
            idPlan: this.workpackParams.idPlan,
            idWorkpackModel: this.workpackParams.idWorkpackModel,
            idWorkpackParent: this.idParent
          },
          modelName: this.workpackData.workpackModel?.modelName
        }]
    ]
  }


  getRouterLinkFromType(type: string): string[] {
    switch (type) {
      case 'office':
        return ['/offices', 'office'];
      case 'plan':
        return ['plan'];
      default:
        return ['/workpack'];
    }
  }

  public async setBreadcrumb() {
    const breadcrumb = await this.getCurrentBreadcrumb();
    this.breadcrumbSrv.setMenu([
      ...breadcrumb,
    ]);
    this.setBreadcrumbStorage(breadcrumb);
  }

}