import { IWorkpackData, IWorkpackParams } from '../../../../shared/interfaces/IWorkpackDataParams';
import { IFilterProperty } from '../../../../shared/interfaces/IFilterProperty';
import { FilterDataviewPropertiesEntity } from '../../../../shared/constants/filterDataviewPropertiesEntity';
import { IconsEnum } from '../../../../shared/enums/IconsEnum';
import { MenuItem } from 'primeng/api';
import { RisksPropertiesOptions } from '../../../../shared/constants/risksPropertiesOptions';
import { RiskService } from '../../../../shared/services/risk.service';
import { IRisk } from '../../../../shared/interfaces/IRisk';
import { ResponsiveService } from '../../../../shared/services/responsive.service';
import { WorkpackBreadcrumbStorageService } from '../../../../shared/services/workpack-breadcrumb-storage.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { TranslateService } from '@ngx-translate/core';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { Router } from '@angular/router';
import { FilterDataviewService } from '../../../../shared/services/filter-dataview.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ISection } from '../../../../shared/interfaces/ISectionWorkpack';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { WorkpackShowTabviewService } from 'src/app/shared/services/workpack-show-tabview.service';

@Component({
  selector: 'app-workpack-section-risks',
  templateUrl: './workpack-section-risks.component.html',
  styleUrls: ['./workpack-section-risks.component.scss']
})
export class WorkpackSectionRisksComponent implements OnInit, OnDestroy {

  sectionRisk: ISection;
  workpackData: IWorkpackData;
  workpackParams: IWorkpackParams;
  $destroy = new Subject();
  collapsePanelsStatus: boolean;
  displayModeAll: string;
  pageSize: number;
  responsive = false;
  riskSectionShowClosed = false;
  totalRecordsRisks: number;
  risks: IRisk[];
  showTabview = false;

  constructor(
    private filterSrv: FilterDataviewService,
    private router: Router,
    private workpackSrv: WorkpackService,
    private translateSrv: TranslateService,
    private configDataViewSrv: ConfigDataViewService,
    private workpackBreadcrumbStorageSrv: WorkpackBreadcrumbStorageService,
    private responsiveSrv: ResponsiveService,
    private riskSrv: RiskService,
    private workpackShowTabviewSrv: WorkpackShowTabviewService
  ) {
    this.workpackShowTabviewSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.showTabview = value;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(responsive => this.responsive = responsive);
    this.workpackSrv.observableResetWorkpack.pipe(takeUntil(this.$destroy)).subscribe(reset => {
      if (reset) {
        this.workpackData = this.workpackSrv.getWorkpackData();
        this.workpackParams = this.workpackSrv.getWorkpackParams();
        if (this.workpackData && this.workpackData?.workpack?.id && this.workpackData?.workpackModel &&
          this.workpackData.workpackModel.riskAndIssueManagementSessionActive) {
          if (!this.workpackParams.idWorkpackModelLinked || (this.workpackSrv.getEditPermission() && !!this.workpackParams.idWorkpackModelLinked)) {
            this.loadRiskSection();
          }
        }
      }
    });
    this.configDataViewSrv.observableCollapsePanelsStatus.pipe(takeUntil(this.$destroy)).subscribe(collapsePanelStatus => {
      this.collapsePanelsStatus = collapsePanelStatus === 'collapse' ? true : false;
      this.sectionRisk = this.sectionRisk && Object.assign({}, {
        ...this.sectionRisk,
        cardSection: {
          ...this.sectionRisk.cardSection,
          initialStateCollapse: this.showTabview ? false : this.collapsePanelsStatus
        }
      });
    });
    this.configDataViewSrv.observableDisplayModeAll.pipe(takeUntil(this.$destroy)).subscribe(displayMode => {
      this.displayModeAll = displayMode;
    });
    this.configDataViewSrv.observablePageSize.pipe(takeUntil(this.$destroy)).subscribe(pageSize => {
      this.pageSize = pageSize;
    });
  }

  ngOnInit(): void {
  }

  handleCreateNewRisk() {
    this.router.navigate(['/workpack/risks'], {
      queryParams: {
        idWorkpack: this.workpackParams.idWorkpack,
        edit: this.workpackSrv.getEditPermission(),
      }
    });
  }

  async deleteRisk(risk: IRisk) {
    const result = await this.riskSrv.delete(risk, { useConfirm: true });
    if (result.success) {
      this.sectionRisk.cardItemsSection = Array.from(this.sectionRisk.cardItemsSection.filter(r => r.itemId !== risk.id));
    }
  }

  async handleRiskShowClosedToggle() {
    this.sectionRisk.cardItemsSection = await this.loadSectionRisksCards(this.riskSectionShowClosed);
  }

  async handleSelectedFilterRisk(event) {
    const idFilter = event.filter;
    this.sectionRisk = Object.assign({}, {
      ...this.sectionRisk,
      cardItemsSection: await this.loadSectionRisksCards(this.riskSectionShowClosed, idFilter)
    });
    this.totalRecordsRisks = this.sectionRisk.cardItemsSection && this.sectionRisk.cardItemsSection.length;
  }

  async loadRiskSection() {
    const resultFilters = await this.filterSrv.getAllFilters(`workpackModels/${this.workpackData.workpack.model.id}/risks`);
    const filters = resultFilters.success && Array.isArray(resultFilters.data) ? resultFilters.data : [];
    const idFilterSelected = filters.find(defaultFilter => !!defaultFilter.favorite) ?
      filters.find(defaultFilter => !!defaultFilter.favorite).id : undefined;

    this.sectionRisk = {
      cardSection: {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: this.showTabview ? '' : 'risks',
        collapseble: this.showTabview ? false : true,
        initialStateCollapse: this.showTabview ? false : this.collapsePanelsStatus,
        showFilters: true,
        isLoading: true,
        filters: filters && filters.length > 0 ? filters : [],
        showCreateNemElementButton: this.workpackSrv.getEditPermission() ? true : false,
      }
    };
    this.sectionRisk = {
      ...this.sectionRisk,
      cardSection: {
        ...this.sectionRisk.cardSection,
        isLoading: false,
      },
      cardItemsSection: await this.loadSectionRisksCards(this.riskSectionShowClosed, idFilterSelected)
    }
    this.totalRecordsRisks = this.sectionRisk.cardItemsSection && this.sectionRisk.cardItemsSection.length;
  }

  async loadSectionRisksCards(showClosed: boolean, idFilterSelected?: number) {
    const resultRisks = await this.riskSrv.GetAll({ 'id-workpack': this.workpackParams.idWorkpack, idFilter: idFilterSelected });
    this.risks = resultRisks.success ? resultRisks.data : [];
    if (this.risks && this.risks.length > 0) {
      const cardItems = !showClosed ? this.risks.filter(r => RisksPropertiesOptions.status[r.status].label === 'open').map(risk => ({
        typeCardItem: 'listItem',
        icon: RisksPropertiesOptions.status[risk.status].icon,
        iconColor: RisksPropertiesOptions.importance[risk.importance].label,
        iconSvg: false,
        nameCardItem: risk.name,
        itemId: risk.id,
        menuItems: [{
          label: this.translateSrv.instant('delete'),
          icon: 'fas fa-trash-alt',
          command: (event) => this.deleteRisk(risk),
          disabled: !this.workpackSrv.getEditPermission()
        }] as MenuItem[],
        urlCard: '/workpack/risks',
        paramsUrlCard: [
          { name: 'idWorkpack', value: this.workpackParams.idWorkpack },
          { name: 'idWorkpackModelLinked', value: this.workpackParams.idWorkpackModelLinked },
          { name: 'id', value: risk.id },
        ]
      })) :
        this.risks.map(risk => ({
          typeCardItem: 'listItem',
          icon: RisksPropertiesOptions.status[risk.status].icon,
          iconColor: RisksPropertiesOptions.importance[risk.importance].label,
          iconSvg: false,
          nameCardItem: risk.name,
          itemId: risk.id,
          menuItems: [{
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: (event) => this.deleteRisk(risk),
            disabled: !this.workpackSrv.getEditPermission()
          }] as MenuItem[],
          urlCard: '/workpack/risks',
          paramsUrlCard: [
            { name: 'idWorkpack', value: this.workpackParams.idWorkpack },
            { name: 'idWorkpackModelLinked', value: this.workpackParams.idWorkpackModelLinked },
            { name: 'id', value: risk.id },
          ]
        }));
      if (this.workpackSrv.getEditPermission() && !this.workpackData.workpack.canceled) {
        cardItems.push({
          typeCardItem: 'newCardItem',
          icon: IconsEnum.Plus,
          iconColor: null,
          iconSvg: true,
          nameCardItem: null,
          itemId: null,
          menuItems: null,
          urlCard: '/workpack/risks',
          paramsUrlCard: [
            { name: 'idWorkpack', value: this.workpackParams.idWorkpack },
            { name: 'idWorkpackModelLinked', value: this.workpackParams.idWorkpackModelLinked },
          ]
        });
      }
      this.sectionRisk.cardSection.isLoading = false;
      return cardItems;
    } else {
      if (this.workpackSrv.getEditPermission() && !this.workpackData.workpack.canceled) {
        const cardItem = [{
          typeCardItem: 'newCardItem',
          icon: IconsEnum.Plus,
          iconSvg: true,
          nameCardItem: null,
          itemId: null,
          menuItems: null,
          urlCard: '/workpack/risks',
          paramsUrlCard: [
            { name: 'idWorkpack', value: this.workpackParams.idWorkpack },
            { name: 'idWorkpackModelLinked', value: this.workpackParams.idWorkpackModelLinked },
          ]
        }];
        this.sectionRisk.cardSection.isLoading = false;
        return cardItem;
      } else { 
        this.sectionRisk.cardSection.isLoading = false;
        return [];
      };
    }
  }

  async handleEditFilterEntity(event, entityName: string) {
    const idFilter = event.filter;
    if (idFilter) {
      const filterProperties = this.loadFilterPropertiesList(entityName);
      this.filterSrv.setFilterProperties(filterProperties);
      await this.workpackBreadcrumbStorageSrv.setBreadcrumbStorage();
      this.router.navigate(['/filter-dataview'], {
        queryParams: {
          id: idFilter,
          entityName,
          idWorkpackModel: this.workpackData.workpack.model.id,
          idOffice: this.workpackParams.idOffice
        }
      });
    }
  }

  async handleNewFilterEntity(entityName: string) {
    await this.workpackBreadcrumbStorageSrv.setBreadcrumbStorage();
    const filterProperties = this.loadFilterPropertiesList(entityName);
    this.filterSrv.setFilterProperties(filterProperties);
    this.router.navigate(['/filter-dataview'], {
      queryParams: {
        entityName,
        idWorkpackModel: this.workpackData.workpack.model.id,
        idOffice: this.workpackParams.idOffice
      }
    });
  }

  loadFilterPropertiesList(entityName: string) {
    const listProperties = FilterDataviewPropertiesEntity[entityName];
    const filterPropertiesList = listProperties.map(prop => {
      const property: IFilterProperty = {
        type: prop.type,
        label: prop.label,
        name: prop.apiValue,
        active: true,
        possibleValues: prop.possibleValues && prop.possibleValues.map( option => ({
          ...option,
          label: this.translateSrv.instant(option.label)
        }))
      };
      return property;
    });
    return filterPropertiesList;
  }

  ngOnDestroy(): void {
    this.$destroy.complete();
    this.$destroy.unsubscribe();
  }

}
