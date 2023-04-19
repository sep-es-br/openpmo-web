import { IWorkpackData } from './../interfaces/IWorkpackDataParams';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { BreadcrumbService } from './breadcrumb.service';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IWorkpackParams } from '../interfaces/IWorkpackDataParams';

@Injectable({
  providedIn: 'root'
})
export class WorkpackBreadcrumbStorageService {

  private workpackParams: IWorkpackParams;
  private workpackData: IWorkpackData;
  private workpackName: { name: string; fullName: string };

  constructor(
    private breadcrumbSrv: BreadcrumbService,
    private workpackSrv: WorkpackService
  ) {
  }

  public async setBreadcrumbStorage() {
    this.breadcrumbSrv.setBreadcrumbStorage([
      ... await this.getBreadcrumbs(),
      ... this.workpackParams.idWorkpack
        ? []
        : [{
          key: this.workpackData.workpackModel?.type?.toLowerCase().replace('model', ''),
          info: this.workpackName.name,
          tooltip: this.workpackName.fullName,
          routerLink: ['/workpack'],
          queryParams: {
            idPlan: this.workpackParams.idPlan,
            idWorkpackModel: this.workpackParams.idWorkpackModel,
            idWorkpackParent: this.workpackParams.idWorkpackParent,
            idWorkpackModelLinked: this.workpackParams.idWorkpackModelLinked
          },
          modelName: this.workpackData.workpackModel?.modelName
        }],
      ...[{
        key: 'filter',
        routerLink: ['/filter-dataview'],
      }]
    ]);
  }

  public async getBreadcrumbs() {
    this.workpackParams = this.workpackSrv.getWorkpackParams();
    this.workpackData = this.workpackSrv.getWorkpackData();
    this.workpackName = this.workpackSrv.getNameWorkpack();
    const id = this.workpackParams.idWorkpack || this.workpackParams.idWorkpackParent;
    if (!id) {
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
        }
      ];
    }
    const { success, data } = await this.breadcrumbSrv.getBreadcrumbWorkpack(id, { 'id-plan': this.workpackParams.idPlan });
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
    this.breadcrumbSrv.setMenu([
      ... await this.getBreadcrumbs(),
      ... this.workpackParams.idWorkpack
        ? []
        : [{
          key: this.workpackData.workpackModel?.type?.toLowerCase().replace('model', ''),
          info: this.workpackName.name,
          tooltip: this.workpackName.fullName,
          routerLink: ['/workpack'],
          queryParams: {
            idPlan: this.workpackParams.idPlan,
            idWorkpackModel: this.workpackParams.idWorkpackModel,
            idWorkpackParent: this.workpackParams.idWorkpackParent
          },
          modelName: this.workpackData.workpackModel?.modelName
        }]
    ]);
  }
}