import { takeUntil } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { IPlan } from 'src/app/shared/interfaces/IPlan';
import { ReportModelService } from 'src/app/shared/services/report-model.service';
import { IReportModel } from 'src/app/shared/interfaces/IReportModel';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';

@Component({
  selector: 'app-report-list',
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.scss']
})
export class ReportListComponent implements OnInit {

  collapsePanelsStatus = true;
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;
  reportModelsProperties: ICard;
  cardItemsReportModels: ICardItem[];
  $destroy = new Subject();
  responsive = false;
  propertiesPlan: IPlan;
  reports: IReportModel[];

  constructor(
    private responsiveSvr: ResponsiveService,
    private breadcrumbSrv: BreadcrumbService,
    private reportModelSrv: ReportModelService,
    private configDataViewSrv: ConfigDataViewService
  ) {
    this.responsiveSvr.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.configDataViewSrv.observableDisplayModeAll.pipe(takeUntil(this.$destroy)).subscribe(displayMode => {
      this.displayModeAll = displayMode;
    });
    this.setBreadcrumb();
    this.loadCardProperties();
   }

  ngOnInit(): void {
    this.loadReportModels();
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  setBreadcrumb() {
    const storedOffice = localStorage.getItem('@pmo/propertiesCurrentOffice');
    const propertiesOffice = storedOffice ? JSON.parse(storedOffice) : undefined;
    const storedPlan = localStorage.getItem('@pmo/propertiesCurrentPlan');
    this.propertiesPlan = storedPlan ? JSON.parse(storedPlan) : undefined;
    if (propertiesOffice && this.propertiesPlan) {
      this.breadcrumbSrv.setMenu([
        {
          key: 'office',
          routerLink: ['/offices', 'office'],
          queryParams: { id: propertiesOffice.id },
          info: propertiesOffice?.name,
          tooltip: propertiesOffice?.fullName
        },
        {
          key: 'plan',
          routerLink: ['/plan'],
          queryParams: { id: this.propertiesPlan.id },
          info: this.propertiesPlan.name,
          tooltip: this.propertiesPlan.fullName
        },
        {
          key: 'action',
          routerLink: ['/reports'],
          queryParams: { idPlan: this.propertiesPlan.id },
          info: 'action',
          tooltip: 'action'
        },
      ]);
    }
  }

  loadCardProperties() {
    this.reportModelsProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'models',
      collapseble: false,
      isLoading: true,
      initialStateCollapse: false,
    };
  }

  async loadReportModels() {
    const result = await this.reportModelSrv.getActiveReports({
      idPlanModel: this.propertiesPlan.planModel.id
    });
    if (result.success) {
      this.reports = result.data;
      if (this.reports) {
        const cardItems: ICardItem[] = this.reports.map(report => (
          {
            typeCardItem: 'listItem',
            icon: 'fas fa-file-invoice',
            iconColor: '#888e96',
            nameCardItem: report.name,
            fullNameCardItem: report.fullName,
            itemId: report.id,
            urlCard: '/reports/report-view',
            paramsUrlCard: [
              { name: 'id', value: report.id },
            ],
          }
        ));
        this.cardItemsReportModels = cardItems;
        this.reportModelsProperties.isLoading = false;
      } else {
        this.reportModelsProperties.isLoading = false;
      }
    }
  }

}
