import { IFilterProperty } from '../../../../shared/interfaces/IFilterProperty';
import { FilterDataviewPropertiesEntity } from '../../../../shared/constants/filterDataviewPropertiesEntity';
import { IconsEnum } from '../../../../shared/enums/IconsEnum';
import { MenuItem } from 'primeng/api';
import { takeUntil } from 'rxjs/operators';
import { ProcessService } from '../../../../shared/services/process.service';
import { ResponsiveService } from '../../../../shared/services/responsive.service';
import { WorkpackBreadcrumbStorageService } from '../../../../shared/services/workpack-breadcrumb-storage.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { TranslateService } from '@ngx-translate/core';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { Router } from '@angular/router';
import { FilterDataviewService } from '../../../../shared/services/filter-dataview.service';
import { Subject } from 'rxjs';
import { IWorkpackData, IWorkpackParams } from '../../../../shared/interfaces/IWorkpackDataParams';
import { ISection } from '../../../../shared/interfaces/ISectionWorkpack';
import { IProcess } from '../../../../shared/interfaces/IProcess';
import { Component, OnInit } from '@angular/core';
import { WorkpackShowTabviewService } from 'src/app/shared/services/workpack-show-tabview.service';

@Component({
  selector: 'app-workpack-section-processes',
  templateUrl: './workpack-section-processes.component.html',
  styleUrls: ['./workpack-section-processes.component.scss']
})
export class WorkpackSectionProcessesComponent implements OnInit {

  totalRecordsProcesses: number;
  processes: IProcess[];
  sectionProcess: ISection;
  workpackData: IWorkpackData;
  workpackParams: IWorkpackParams;
  $destroy = new Subject();
  collapsePanelsStatus: boolean;
  displayModeAll: string;
  pageSize: number;
  responsive = false;
  showTabview = false;

  constructor(
    private filterSrv: FilterDataviewService,
    private router: Router,
    private workpackSrv: WorkpackService,
    private translateSrv: TranslateService,
    private configDataViewSrv: ConfigDataViewService,
    private workpackBreadcrumbStorageSrv: WorkpackBreadcrumbStorageService,
    private responsiveSrv: ResponsiveService,
    private processSrv: ProcessService,
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
          this.workpackData.workpackModel.processesManagementSessionActive) {
          if (!this.workpackParams.idWorkpackModelLinked || (this.workpackSrv.getEditPermission() && !!this.workpackParams.idWorkpackModelLinked)) {
            this.loadProcessSection();
          }
        }
      }
    });
    this.configDataViewSrv.observableCollapsePanelsStatus.pipe(takeUntil(this.$destroy)).subscribe(collapsePanelStatus => {
      this.collapsePanelsStatus = collapsePanelStatus === 'collapse' ? true : false;
      this.sectionProcess = this.sectionProcess && Object.assign({}, {
        ...this.sectionProcess,
        cardSection: {
          ...this.sectionProcess.cardSection,
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

  handleCreateNewProcess() {
    this.router.navigate(['/workpack/processes'], {
      queryParams: {
        idWorkpack: this.workpackParams.idWorkpack
      }
    })
  }

  async deleteProcess(process: IProcess) {
    const result = await this.processSrv.delete(process, { useConfirm: true });
    if (result.success) {
      this.sectionProcess.cardItemsSection = Array.from(this.sectionProcess.cardItemsSection.filter(i => i.itemId !== process.id));
    }
  }

  async handleSelectedFilterProcess(event) {
    const idFilter = event.filter;
    this.sectionProcess = Object.assign({}, {
      ...this.sectionProcess,
      cardItemsSection: await this.loadSectionProcessesCards(idFilter)
    });
    this.totalRecordsProcesses = this.sectionProcess.cardItemsSection && this.sectionProcess.cardItemsSection.length;
  }

  async loadProcessSection() {
    const resultFilters = await this.filterSrv.getAllFilters(`workpackModels/${this.workpackData.workpack.model.id}/processes`);
    const filters = resultFilters.success && Array.isArray(resultFilters.data) ? resultFilters.data : [];
    const idFilterSelected = filters.find(defaultFilter => !!defaultFilter.favorite) ?
      filters.find(defaultFilter => !!defaultFilter.favorite).id : undefined;

    this.sectionProcess = {
      cardSection: {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: this.showTabview ? '' : 'processes',
        collapseble: this.showTabview ? false : true,
        initialStateCollapse: this.showTabview ? false : this.collapsePanelsStatus,
        showFilters: true,
        isLoading: true,
        filters: filters && filters.length > 0 ? filters : [],
        showCreateNemElementButton: this.workpackSrv.getEditPermission() ? true : false,
      }
    };
    this.sectionProcess = {
      ...this.sectionProcess,
      cardSection: {
        ...this.sectionProcess.cardSection,
        isLoading: false
      },
      cardItemsSection: await this.loadSectionProcessesCards(idFilterSelected)
    }
    this.totalRecordsProcesses = this.sectionProcess.cardItemsSection && this.sectionProcess.cardItemsSection.length;
  }

  async loadSectionProcessesCards(idFilterSelected: number) {
    const resultProcess = await this.processSrv.GetAll({ 'id-workpack': this.workpackParams.idWorkpack, idFilter: idFilterSelected });
    this.processes = resultProcess.success ? resultProcess.data : [];
    if (this.processes && this.processes.length > 0) {
      const cardItems = this.processes.map(proc => ({
        typeCardItem: 'listItemProcess',
        icon: 'process',
        iconSvg: true,
        nameCardItem: proc.name,
        subtitleCardItem: proc.processNumber,
        organizationName: proc.currentOrganization,
        itemId: proc.id,
        priority: proc.priority,
        menuItems: [{
          label: this.translateSrv.instant('delete'),
          icon: 'fas fa-trash-alt',
          command: (event) => this.deleteProcess(proc),
          disabled: !this.workpackSrv.getEditPermission()
        }] as MenuItem[],
        urlCard: '/workpack/processes',
        paramsUrlCard: [
          { name: 'idWorkpack', value: this.workpackParams.idWorkpack },
          { name: 'id', value: proc.id },
        ]
      }));
      if (this.workpackSrv.getEditPermission() && !this.workpackData.workpack.canceled) {
        cardItems.push({
          typeCardItem: 'newCardItem',
          icon: IconsEnum.Plus,
          iconSvg: true,
          nameCardItem: null,
          subtitleCardItem: null,
          organizationName: null,
          itemId: null,
          priority: false,
          menuItems: null,
          urlCard: '/workpack/processes',
          paramsUrlCard: [
            { name: 'idWorkpack', value: this.workpackParams.idWorkpack },
          ]
        });
      }
      return cardItems;
    } else {
      const cardItem = (this.workpackSrv.getEditPermission() && !this.workpackData.workpack.canceled) ? [{
        typeCardItem: 'newCardItem',
        icon: IconsEnum.Plus,
        iconSvg: true,
        nameCardItem: null,
        itemId: null,
        menuItems: null,
        urlCard: '/workpack/processes',
        paramsUrlCard: [
          { name: 'idWorkpack', value: this.workpackParams.idWorkpack },
        ]
      }] : [];
      return cardItem;
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
        possibleValues: prop.possibleValues
      };
      return property;
    });
    return filterPropertiesList;
  }

}
