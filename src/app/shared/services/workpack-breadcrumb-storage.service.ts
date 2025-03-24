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

  currentBreadcrumbItems: IBreadcrumb[];
  idParent: number;
  private workpackParams: IWorkpackParams;
  private workpackData: IWorkpackData;
  private key = '@pmo/current-breadcrumb';


  constructor(
    private breadcrumbSrv: BreadcrumbService,
    private workpackSrv: WorkpackService,
  ) {
  }

  public async setBreadcrumbStorage(breadcrumb?) {
    const breadcrumbItems = breadcrumb ? breadcrumb : await this.getCurrentBreadcrumb();
    localStorage.setItem(this.key, JSON.stringify(breadcrumbItems));
  }

  public async getBreadcrumbs(idWorkpack, idPlan) {
    const { success, data } = await this.breadcrumbSrv.getBreadcrumbWorkpack(idWorkpack, { 'id-plan': idPlan });
    if (success) {
      const breadcrumbItemsWorkpack = data.map(p => ({
        key: !p.modelName ? p.type.toLowerCase() : p.modelName,
        info: p.name,
        tooltip: p.fullName,
        routerLink: this.getRouterLinkFromType(p.type),
        queryParams: { id: p.id, idWorkpackModelLinked: p.idWorkpackModelLinked, idPlan },
        modelName: p.modelName
      }));
      return [...breadcrumbItemsWorkpack];
    }

    return [];
  }

  async getCurrentBreadcrumb(linkEvent = false) {
    this.workpackData = this.workpackSrv.getWorkpackData();
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
        const breadcrumbOfficeIndex =
          this.currentBreadcrumbItems.findIndex(item => item.key === 'office' && item.queryParams?.id === idOffice);
        const breadcrumbPlanIndex = this.currentBreadcrumbItems.findIndex(item => item.key === 'plan' && item.queryParams?.id === idPlan);
        const breadcrumbParentIndex =
          this.currentBreadcrumbItems
          .findIndex(item => !['office', 'plan'].includes(item.key) && this.idParent && item.queryParams?.id === this.idParent);
        if (breadcrumbOfficeIndex > -1 && breadcrumbPlanIndex > -1 && (breadcrumbParentIndex > -1)) {
          breadcrumb = [...this.currentBreadcrumbItems.slice(0, breadcrumbParentIndex + 1),
          ... this.workpackParams.idWorkpack
            ? [
              {
                key: this.workpackData.workpackModel?.type?.toLowerCase().replace('model', ''),
                info: this.workpackData?.workpack?.name,
                tooltip: this.workpackData?.workpack?.fullName,
                routerLink: ['/workpack'],
                queryParams: this.workpackParams.idWorkpackModelLinked ? {
                  id: this.workpackParams?.idWorkpack,
                  idPlan: this.workpackParams?.idPlan,
                  idWorkpackModelLinked: this.workpackParams.idWorkpackModelLinked,
                  idWorkpackLinkedParent: this.workpackParams.idWorkpackLinkedParent
                } :
                  {
                    id: this.workpackParams?.idWorkpack,
                    idPlan: this.workpackParams?.idPlan,
                  },
                modelName: this.workpackData.workpackModel?.modelName
              }
            ]
            : [{
              key: this.workpackData.workpackModel?.type?.toLowerCase().replace('model', ''),
              info: this.workpackData?.workpack?.name,
              tooltip: this.workpackData?.workpack?.fullName,
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
          if(linkEvent) {
            breadcrumb = [...this.currentBreadcrumbItems,
              ... [{
                    key: this.workpackData.workpackModel?.type?.toLowerCase().replace('model', ''),
                    info: this.workpackData?.workpack?.name,
                    tooltip: this.workpackData?.workpack?.fullName,
                    routerLink: ['/workpack'],
                    queryParams: this.workpackParams.idWorkpackModelLinked ? {
                      id: this.workpackParams?.idWorkpack,
                      idPlan: this.workpackParams?.idPlan,
                      idWorkpackModelLinked: this.workpackParams.idWorkpackModelLinked,
                      idWorkpackLinkedParent: this.workpackParams.idWorkpackLinkedParent
                    } :
                      {
                        id: this.workpackParams?.idWorkpack,
                        idPlan: this.workpackParams?.idPlan,
                      },
                    modelName: this.workpackData.workpackModel?.modelName
                  }]
            ];
          } else {
            breadcrumb = this.startNewBreadcrumb();
          }

        }
      }
      return breadcrumb;
    } else {
      breadcrumb = !this.idParent ? this.startNewBreadcrumb() : await this.getBreadcrumbs(idWorkpack, idPlan);
      return breadcrumb;
    }
  }

  startNewBreadcrumb() {
    let breadcrumbItems;
    if (this.workpackParams.idWorkpack) {
      breadcrumbItems = this.getBreadcrumbs(this.workpackParams.idWorkpack, this.workpackParams.idPlan);
    } else {
      if (this.idParent) {
        breadcrumbItems = this.getBreadcrumbs(this.idParent, this.workpackParams.idPlan);
        breadcrumbItems.push({
          key: this.workpackData.workpackModel?.type?.toLowerCase().replace('model', ''),
          info: this.workpackData?.workpack?.name,
          tooltip: this.workpackData?.workpack?.fullName,
          routerLink: ['/workpack'],
          queryParams: {
            idPlan: this.workpackParams.idPlan,
            idWorkpackModel: this.workpackParams.idWorkpackModel,
            idWorkpackParent: this.idParent
          },
          modelName: this.workpackData.workpackModel?.modelName
        });
      } else {
        breadcrumbItems = [{
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
        {
          key: this.workpackData.workpackModel?.type?.toLowerCase().replace('model', ''),
          info: this.workpackData?.workpack?.name,
          tooltip: this.workpackData?.workpack?.fullName,
          routerLink: ['/workpack'],
          queryParams: {
            idPlan: this.workpackParams.idPlan,
            idWorkpackModel: this.workpackParams.idWorkpackModel,
            idWorkpackParent: this.idParent
          },
          modelName: this.workpackData.workpackModel?.modelName
        }];
      }
    }
    return breadcrumbItems;
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

  public async setBreadcrumb(linkEvent = false) {
    const breadcrumb = await this.getCurrentBreadcrumb(linkEvent);
    this.breadcrumbSrv.setMenu([
      ...breadcrumb,
    ]);
    this.setBreadcrumbStorage(breadcrumb);
  }

}
