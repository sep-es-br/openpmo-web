import { IWorkpackData } from './../interfaces/IWorkpackDataParams';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { BreadcrumbService } from './breadcrumb.service';
import { Injectable } from '@angular/core';
import { IWorkpackParams } from '../interfaces/IWorkpackDataParams';
import { IBreadcrumb } from '../interfaces/IBreadcrumb';
import { IWorkpack } from '../interfaces/IWorkpack';
import { PreprojectService } from './preproject.service';
import { TranslateService } from '@ngx-translate/core';
import { TypeWorkpackEnum } from '../enums/TypeWorkpackEnum';

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
    private preprojectSrv: PreprojectService,
    private translateSrv: TranslateService,
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
      return await this.getPreprojectChildBreadcrumb(idWorkpack, idPlan, breadcrumbItemsWorkpack)
        || await this.getStructuringBreadcrumb(idWorkpack, idPlan, breadcrumbItemsWorkpack)
        || breadcrumbItemsWorkpack;
    }

    return await this.getPreprojectChildBreadcrumb(idWorkpack, idPlan, [])
      || await this.getStructuringBreadcrumb(idWorkpack, idPlan, [])
      || [];
  }

  private async getPreprojectChildBreadcrumb(
    idWorkpack: number, idPlan: number, apiBreadcrumb: IBreadcrumb[]
  ): Promise<IBreadcrumb[] | null> {
    const current = this.breadcrumbSrv.get || [];
    if (!current.some(item => item.key === 'preproject')) {
      return null;
    }

    const currentIndex = current.findIndex(item =>
      +item.queryParams?.id === +idWorkpack && +item.queryParams?.idPlan === +idPlan
    );
    if (currentIndex > -1) {
      return current.slice(0, currentIndex + 1);
    }

    const descendants: IWorkpack[] = [];
    const visited = new Set<number>();
    let nextId = idWorkpack;
    while (nextId && !visited.has(nextId)) {
      visited.add(nextId);
      let response;
      try {
        response = await this.workpackSrv.GetWorkpackDataById(nextId, { 'id-plan': idPlan });
      } catch {
        return null;
      }
      if (!response.success || !response.data) {
        return null;
      }
      const workpack = response.data;
      descendants.unshift(workpack);
      const parentIndex = current.findIndex(item =>
        +item.queryParams?.id === workpack.idParent && +item.queryParams?.idPlan === +idPlan
      );
      if (parentIndex > -1) {
        return [
          ...current.slice(0, parentIndex + 1),
          ...descendants.map(child =>
            apiBreadcrumb.find(item => +item.queryParams?.id === child.id)
            || this.workpackCrumb(child, idPlan)
          )
        ];
      }
      nextId = workpack.idParent;
    }
    return null;
  }

  private async getStructuringBreadcrumb(
    idWorkpack: number, idPlan: number, apiBreadcrumb: IBreadcrumb[]
  ): Promise<IBreadcrumb[] | null> {
    const officeId = this.workpackSrv.getWorkpackParams()?.idOffice
      || apiBreadcrumb.find(item => item.key === 'office')?.queryParams?.id;
    if (!officeId) {
      return null;
    }

    const descendants: IWorkpack[] = [];
    const visited = new Set<number>();
    let nextId = +idWorkpack;
    while (nextId && !visited.has(nextId)) {
      visited.add(nextId);
      const loaded = this.workpackSrv.getWorkpackData()?.workpack;
      let workpack = loaded?.id === nextId ? loaded : null;
      if (!workpack) {
        try {
          const response = await this.workpackSrv.GetWorkpackDataById(nextId, { 'id-plan': idPlan });
          workpack = response.success ? response.data : null;
        } catch {
          return null;
        }
      }
      if (!workpack) {
        return null;
      }
      descendants.unshift(workpack);
      nextId = workpack.idParent;
    }

    const projectIndex = descendants.findIndex(item => item.type === TypeWorkpackEnum.ProjectModel);
    if (projectIndex < 0) {
      return null;
    }
    const project = descendants[projectIndex];
    if (apiBreadcrumb.some(item => +item.queryParams?.id === project.id)) {
      return null;
    }

    let preprojects;
    try {
      const response = await this.preprojectSrv.findAllByOfficeId(+officeId);
      preprojects = response.success ? response.data : [];
    } catch {
      return null;
    }
    if (!preprojects?.some(item =>
      +item.idWorkpack === project.id && item.status === 'Estruturação'
    )) {
      return null;
    }

    const structuring = this.translateSrv.instant('structuring');
    return [
      ...apiBreadcrumb.filter(item => ['office', 'plan'].includes(item.key)),
      { key: 'preproject', routerLink: ['/preproject'], queryParams: { idOffice: +officeId } },
      {
        key: 'project', info: structuring, tooltip: structuring,
        routerLink: ['/workpack'], queryParams: { id: project.id, idPlan }
      },
      ...descendants.slice(projectIndex + 1).map(child =>
        apiBreadcrumb.find(item => +item.queryParams?.id === child.id)
        || this.workpackCrumb(child, idPlan)
      )
    ];
  }

  private workpackCrumb(workpack: IWorkpack, idPlan: number, modelName?: string): IBreadcrumb {
    const name = modelName || workpack.model?.modelName;
    return {
      key: name || workpack.type.toLowerCase(),
      info: workpack.name,
      tooltip: workpack.fullName,
      routerLink: ['/workpack'],
      queryParams: { id: workpack.id, idPlan },
      modelName: name
    };
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
        if (idWorkpack && idPlan && !breadcrumb.some(item => item.key === 'preproject')
          && (this.workpackData?.workpack?.type === TypeWorkpackEnum.ProjectModel
            || (this.idParent && !breadcrumb.some(item => +item.queryParams?.id === this.idParent)))) {
          const rebuilt = await this.getBreadcrumbs(idWorkpack, idPlan);
          if (rebuilt.some(item => item.key === 'preproject')) {
            return rebuilt;
          }
        }
      } else {
        const breadcrumbOfficeIndex =
          this.currentBreadcrumbItems.findIndex(item => item.key === 'office' && item.queryParams?.id === idOffice);
        const breadcrumbPlanIndex = this.currentBreadcrumbItems.findIndex(item => item.key === 'plan' && item.queryParams?.id === idPlan);
        const breadcrumbParentIndex =
          this.currentBreadcrumbItems
          .findIndex(item => !['office', 'plan'].includes(item.key) && this.idParent && item.queryParams?.id === this.idParent);
        if (breadcrumbParentIndex < 0 && idWorkpack && this.currentBreadcrumbItems.some(item => item.key === 'preproject')) {
          const descendantBreadcrumb = await this.getPreprojectChildBreadcrumb(idWorkpack, idPlan, []);
          if (descendantBreadcrumb) {
            return descendantBreadcrumb;
          }
        }
        const parentCrumb = this.currentBreadcrumbItems[breadcrumbParentIndex];
        if (
          this.currentBreadcrumbItems.some(item => item.key === 'preproject')
          && parentCrumb?.queryParams?.idPlan === idPlan
          && this.workpackData?.workpack && idWorkpack
        ) {
          const childCrumb = this.workpackCrumb(
            this.workpackData.workpack, idPlan, this.workpackData.workpackModel?.modelName
          );
          if (this.workpackParams.idWorkpackModelLinked) {
            childCrumb.queryParams = {
              ...childCrumb.queryParams,
              idWorkpackModelLinked: this.workpackParams.idWorkpackModelLinked,
              idWorkpackLinkedParent: this.workpackParams.idWorkpackLinkedParent
            };
          }
          breadcrumb = [
            ...this.currentBreadcrumbItems.slice(0, breadcrumbParentIndex + 1),
            childCrumb
          ];
        } else if (breadcrumbOfficeIndex > -1 && breadcrumbPlanIndex > -1 && (breadcrumbParentIndex > -1)) {
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
