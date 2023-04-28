import { IWorkpackData, IWorkpackParams } from '../../../../shared/interfaces/IWorkpackDataParams';
import { ResponsiveService } from '../../../../shared/services/responsive.service';
import { WorkpackBreadcrumbStorageService } from '../../../../shared/services/workpack-breadcrumb-storage.service';
import { IconsEnum } from '../../../../shared/enums/IconsEnum';
import { OrganizationService } from '../../../../shared/services/organization.service';
import { ConfigDataViewService } from '../../../../shared/services/config-dataview.service';
import { takeUntil } from 'rxjs/operators';
import { FilterDataviewService } from '../../../../shared/services/filter-dataview.service';
import { TranslateService } from '@ngx-translate/core';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { MenuItem } from 'primeng/api';
import { ICostAccount } from '../../../../shared/interfaces/ICostAccount';
import { ISection } from '../../../../shared/interfaces/ISectionWorkpack';
import { CostAccountService } from '../../../../shared/services/cost-account.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { WorkpackShowTabviewService } from 'src/app/shared/services/workpack-show-tabview.service';

@Component({
  selector: 'app-workpack-section-cost-accounts',
  templateUrl: './workpack-section-cost-accounts.component.html',
  styleUrls: ['./workpack-section-cost-accounts.component.scss']
})
export class WorkpackSectionCostAccountsComponent implements OnInit, OnDestroy {

  sectionCostAccount: ISection;
  costAccounts: ICostAccount[];
  totalRecordsCostAccounts: number;
  workpackData: IWorkpackData;
  workpackParams: IWorkpackParams;
  $destroy = new Subject();
  collapsePanelsStatus: boolean;
  displayModeAll: string;
  pageSize: number;
  responsive = false;
  showTabview = false;

  constructor(
    private costAccountSrv: CostAccountService,
    private router: Router,
    private filterSrv: FilterDataviewService,
    private workpackSrv: WorkpackService,
    private translateSrv: TranslateService,
    private configDataViewSrv: ConfigDataViewService,
    private organizationSrv: OrganizationService,
    private workpackBreadcrumbStorageSrv: WorkpackBreadcrumbStorageService,
    private responsiveSrv: ResponsiveService,
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
        if (this.workpackData && this.workpackData?.workpack?.id && this.workpackData.workpackModel && this.workpackData.workpackModel?.costSessionActive) {
          this.loadCostAccountSection();
        }
      }
    });
    this.configDataViewSrv.observableCollapsePanelsStatus.pipe(takeUntil(this.$destroy)).subscribe(collapsePanelStatus => {
      this.collapsePanelsStatus = collapsePanelStatus === 'collapse' ? true : false;
      this.sectionCostAccount = this.sectionCostAccount && Object.assign({}, {
        ...this.sectionCostAccount,
        cardSection: {
          ...this.sectionCostAccount.cardSection,
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

  ngOnDestroy(): void {
    this.$destroy.complete();
    this.$destroy.unsubscribe();
  }

  async loadCostAccountSection() {
    const resultFilters = await this.filterSrv.getAllFilters(`workpackModels/${this.workpackData.workpack.model.id}/costAccounts`);
    const filters = resultFilters.success && resultFilters.data ? resultFilters.data : [];
    const idFilterSelected = filters.find(defaultFilter => !!defaultFilter.favorite) ?
      filters.find(defaultFilter => !!defaultFilter.favorite).id : undefined;
    this.sectionCostAccount = {
      cardSection: {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: !this.showTabview ? 'costAccounts' : '',
        collapseble: this.showTabview ? false : true,
        initialStateCollapse: this.showTabview ? false : this.collapsePanelsStatus,
        showFilters: true,
        filters,
        isLoading: true,
        showCreateNemElementButton: this.workpackSrv.getEditPermission() ? true : false
      }
    };
    this.sectionCostAccount = {
      ...this.sectionCostAccount,
      cardSection: {
        ...this.sectionCostAccount.cardSection,
        isLoading: false,
      },
      cardItemsSection: await this.loadCardItemsCostSession(idFilterSelected)
    }
    this.totalRecordsCostAccounts = this.sectionCostAccount.cardItemsSection ? this.sectionCostAccount.cardItemsSection.length + 1 : 1;
  }

  handleCreateNewCostAccount() {
    this.router.navigate(['/workpack/cost-account'], {
      queryParams: {
        idWorkpack: this.workpackParams.idWorkpack,
        idWorkpackModelLinked: this.workpackParams.idWorkpackModelLinked
      }
    });
  }

  moveCostAccountOutherWorkpackToEnd(costAccounts: ICostAccount[]) {
    const costAccountsOfWorkpack = Array.from(costAccounts.filter( cost => cost.idWorkpack === this.workpackParams.idWorkpack));
    const costAccountsOtherWorkpacks = Array.from(costAccounts.filter( cost => cost.idWorkpack !== this.workpackParams.idWorkpack))
    const reorderedCostAccounts = [...costAccountsOfWorkpack, ...costAccountsOtherWorkpacks];
    return reorderedCostAccounts;
  }

  async deleteCostAccount(cost: ICostAccount) {
    const result = await this.costAccountSrv.delete(cost);
    if (result.success) {
      this.sectionCostAccount.cardItemsSection =
        Array.from(this.sectionCostAccount.cardItemsSection.filter(item => item.itemId !== cost.id));
      this.totalRecordsCostAccounts = this.sectionCostAccount.cardItemsSection.length;
      return;
    }
  }

  async handleEditFilterCostAccount(event) {
    const idFilter = event.filter;
    if (idFilter) {
      await this.workpackBreadcrumbStorageSrv.setBreadcrumbStorage();
      this.router.navigate(['/filter-dataview'], {
        queryParams: {
          id: idFilter,
          entityName: `costAccounts`,
          idWorkpackModel: this.workpackData.workpack.model.id,
          idOffice: this.workpackParams.idOffice
        }
      });
    }
  }

  async handleSelectedFilterCostAccount(event) {
    const idFilter = event.filter;
    this.sectionCostAccount = Object.assign({}, {
      ...this.sectionCostAccount,
      cardItemsSection: await this.loadCardItemsCostSession(idFilter)
    });
    this.totalRecordsCostAccounts = this.sectionCostAccount.cardItemsSection && this.sectionCostAccount.cardItemsSection.length;
  }

  async handleNewFilterCostAccount() {
    await this.workpackBreadcrumbStorageSrv.setBreadcrumbStorage();
    this.router.navigate(['/filter-dataview'], {
      queryParams: {
        entityName: `costAccounts`,
        idWorkpackModel: this.workpackData.workpack.model.id,
        idOffice: this.workpackParams.idOffice
      }
    });
  }

  async loadCardItemsCostSession(idFilter?: number) {
    const result = await this.costAccountSrv.GetAll({ 'id-workpack': this.workpackParams.idWorkpack, idFilter });
    if (result.success && result.data.length > 0) {
      this.costAccounts = this.moveCostAccountOutherWorkpackToEnd(result.data);
      const funders = (this.workpackParams.idOffice || this.workpackParams.idOfficeOwnerWorkpackLinked) &&
        await this.loadOrganizationsOffice(this.workpackParams.idOfficeOwnerWorkpackLinked ? this.workpackParams.idOfficeOwnerWorkpackLinked : this.workpackParams.idOffice);
      const cardItems = this.costAccounts.map(cost => {
        const propertyName = cost.models.find(p => p.name === 'name');
        const propertyNameValue = propertyName && cost.properties.find(p => p.idPropertyModel === propertyName.id);
        const propertyfullName = cost.models.find(p => p.name === 'fullName');
        const propertyFullnameValue = propertyfullName && cost.properties.find(p => p.idPropertyModel === propertyfullName.id);
        const propertyNameWorkpack = cost.workpackModelName;
        const propertyLimit = cost.models.find(p => p.name.toLowerCase() === 'limit');
        const propertyLimitValue = propertyLimit && cost.properties.find(p => p.idPropertyModel === propertyLimit.id);
        const propertyFunder = cost.models.find(p => p.name.toLowerCase() === 'funder');
        const propertyFunderValue = propertyFunder && cost.properties.find(p => p.idPropertyModel === propertyFunder.id);
        const selectedFunder = propertyFunderValue && propertyFunderValue.selectedValues && (funders
          && funders.filter(org => org.value === propertyFunderValue.selectedValues[0]));
        const costThisWorkpack = cost.idWorkpack === this.workpackParams.idWorkpack;
        return {
          typeCardItem: 'listItemCostAccount',
          icon: 'fas fa-dollar-sign',
          iconSvg: false,
          nameCardItem: propertyNameValue && propertyNameValue.value as string,
          fullNameCardItem: costThisWorkpack ?
            propertyFullnameValue && propertyFullnameValue.value as string :
            propertyNameWorkpack && propertyNameWorkpack as string,
          subtitleCardItem: selectedFunder && selectedFunder[0]?.label,
          costAccountsValue: propertyLimitValue?.value as number,
          itemId: cost.id,
          idWorkpack: cost.idWorkpack.toString(),
          menuItems: [{
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: (event) => this.deleteCostAccount(cost),
            disabled: !this.workpackSrv.getEditPermission()
          }] as MenuItem[],
          urlCard: '/workpack/cost-account',
          paramsUrlCard: [
            { name: 'idWorkpack', value: cost.idWorkpack },
            { name: 'idWorkpackModelLinked', value: this.workpackParams.idWorkpackModelLinked }
          ],
          iconMenuItems: null
        };
      });
      if (this.workpackSrv.getEditPermission() && !this.workpackData.workpack.canceled) {
        cardItems.push({
          typeCardItem: 'newCardItem',
          icon: IconsEnum.Plus,
          iconSvg: true,
          nameCardItem: null,
          fullNameCardItem: null,
          subtitleCardItem: null,
          costAccountsValue: null,
          itemId: null,
          idWorkpack: this.workpackParams.idWorkpack.toString(),
          menuItems: [],
          urlCard: '/workpack/cost-account',
          paramsUrlCard: [
            { name: 'idWorkpack', value: this.workpackParams.idWorkpack },
            { name: 'idWorkpackModelLinked', value: this.workpackParams.idWorkpackModelLinked }
          ],
          iconMenuItems: null
        });
      }
      return cardItems;
    }
    const cardItemsNew = this.workpackSrv.getEditPermission() && !this.workpackData.workpack.canceled ? [{
      typeCardItem: 'newCardItem',
      icon: IconsEnum.Plus,
      iconSvg: true,
      nameCardItem: null,
      subtitleCardItem: null,
      costAccountsValue: null,
      itemId: null,
      idWorkpack: this.workpackParams.idWorkpack.toString(),
      menuItems: [],
      urlCard: '/workpack/cost-account',
      paramsUrlCard: [
        { name: 'idWorkpack', value: this.workpackParams.idWorkpack },
        { name: 'idWorkpackModelLinked', value: this.workpackParams.idWorkpackModelLinked }
      ],
      iconMenuItems: null
    }] : [];
    return cardItemsNew;
  }

  async loadOrganizationsOffice(idOffice) {
    const result = await this.organizationSrv.GetAll({ 'id-office': idOffice });
    if (result.success) {
      const organizationsOffice = result.data;
      return organizationsOffice.map(org => ({
        label: org.name,
        value: org.id
      }));
    }
  }

}