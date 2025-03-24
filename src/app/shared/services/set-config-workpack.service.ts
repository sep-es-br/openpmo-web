import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PlanService } from './plan.service';
import { OfficeService } from './office.service';
import { BreadcrumbService } from './breadcrumb.service';
import { WorkpackBreadcrumbStorageService } from './workpack-breadcrumb-storage.service';


@Injectable({ providedIn: 'root' })
export class SetConfigWorkpackService {

  constructor(
    private planSrv: PlanService,
    private officeSrv: OfficeService,
    private breadcrumbSrv: BreadcrumbService,
    private breadcrumbStorageSrv: WorkpackBreadcrumbStorageService
  ) {
  }

  public async setWorkpackConfig(idPlan: number, idWorkpack) {
    this.planSrv.nextIDPlan(idPlan);
    const propertiesPlan = await this.planSrv.getCurrentPlan(idPlan);
    const propertiesOffice = propertiesPlan && await this.officeSrv.getCurrentOffice(propertiesPlan.idOffice);
    await this.loadBreadcrumb(idWorkpack, propertiesPlan, propertiesOffice);
  }

  async loadBreadcrumb(idWorkpack, propertiesPlan, propertiesOffice) {
    const breadcrumbItems = await this.breadcrumbSrv.loadWorkpackBreadcrumbs(idWorkpack, propertiesPlan.id);
    const breadcrumb = [
      ...[
      {
        key: 'office',
        info: propertiesOffice.name,
        tooltip: propertiesOffice.fullName,
        routerLink: ['/offices', 'office'],
        queryParams: { id: propertiesOffice.id },
      },
      {
        key: 'plan',
        info: propertiesPlan.name,
        tooltip: propertiesPlan.fullName,
        routerLink: ['/plan'],
        queryParams: { id: propertiesPlan.id },
      },
    ],
    ...breadcrumbItems];
    this.breadcrumbSrv.setMenu(breadcrumb);
    this.breadcrumbStorageSrv.setBreadcrumbStorage(breadcrumb);
  }

}
