import { OfficePermissionService } from './../../../shared/services/office-permission.service';
import { AuthService } from './../../../shared/services/auth.service';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItemOffice } from 'src/app/shared/interfaces/ICardItemOffice';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { PersonService } from 'src/app/shared/services/person.service';
import { OfficeService } from 'src/app/shared/services/office.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { SelectItem, TreeNode } from 'primeng/api';
import { ITreeViewScopeWorkpack } from 'src/app/shared/interfaces/ITreeScopePersons';
import { OptionsAccessEnum, OptionsStakeholderEnum } from 'src/app/shared/enums/OptionsSelectItemEnuns';
import { TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { CitizenUserService } from 'src/app/shared/services/citizen-user.service';

@Component({
  selector: 'app-person-list',
  templateUrl: './person-list.component.html',
  styleUrls: ['./person-list.component.scss']
})
export class PersonListComponent implements OnInit, OnDestroy {
  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    collapseble: false,
    initialStateCollapse: false
  };
  cardItemsProperties: ICardItem[] = [];
  isListEmpty = false;
  displayModeAll = 'grid';
  pageSize = 5;
  page = 0;
  totalRecords: number;

  idOffice: number;
  propertiesOffice: IOffice;
  responsive: boolean;
  $destroy = new Subject();

  treeViewScope: TreeNode[] = [];
  optionsAccess: SelectItem[] = [];
  optionsStakeholder: SelectItem[] = [];
  optionsCCBMember: SelectItem[] = [];
  formSearch: FormGroup;
  selectedOffices;
  selectedPlans;
  selectedWorkpacks;
  allSelected: TreeNode[] = [];
  scope = [];
  scopeNameOptions: string[];
  isLoading = true;
  first = 0;

  constructor(
    private personSrv: PersonService,
    private router: Router,
    private officeSrv: OfficeService,
    private activeRoute: ActivatedRoute,
    private responsiveSvr: ResponsiveService,
    private translateSrv: TranslateService,
    private formBuilder: FormBuilder,
    private breadcrumbSrv: BreadcrumbService,
    private authSrv: AuthService,
    private officePermissionSrv: OfficePermissionService,
    private configDataViewSrv: ConfigDataViewService,
    private citizenUserSrv: CitizenUserService
  ) {
    this.configDataViewSrv.observableDisplayModeAll.pipe(takeUntil(this.$destroy)).subscribe(displayMode => {
      this.displayModeAll = displayMode;
    });
    this.configDataViewSrv.observablePageSize.pipe(takeUntil(this.$destroy)).subscribe(pageSize => {
      if (this.pageSize !== pageSize) {
        this.pageSize = pageSize;
        this.page = 0;
        this.first = 0;
        this.loadPersons();
      }

    });
    this.citizenUserSrv.loadCitizenUsers();
    localStorage.removeItem('@currentPlan');
    localStorage.removeItem('@pmo/propertiesCurrentPlan');
    this.formSearch = this.formBuilder.group({
      scopeName: '',
      userStatus: [OptionsAccessEnum.All],
      stakeholderStatus: [OptionsStakeholderEnum.All],
      ccbMemberStatus: 'ALL',
      name: ['']
    });
    this.activeRoute.queryParams.subscribe(async ({ idOffice }) => {
      this.idOffice = +idOffice;
      this.scope = [this.idOffice];
      await this.loads();
    });

    this.responsiveSvr.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
  }

  async ngOnInit() {
    const isUserAdmin = await this.authSrv.isUserAdmin();
    const editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
    if (!isUserAdmin && !editPermission) {
      this.router.navigate(['/offices']);
    }
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async loads() {
    if (this.idOffice) {
      this.loadTreeViewScope();
      this.loadOptions();
      await this.getOfficeById();
      this.setBreadcrumb();
    }
  }

  async loadPersons(event?) {
    if (!this.idOffice) return;
    if (event) {
      this.page = event.first / this.pageSize;
      this.first = event.first;
    }
    this.isLoading = true;
    this.cardItemsProperties = [];
    
    const { success, data, pagination } = await this.personSrv.GetAllPersons(this.idOffice,
      {
        page: this.page,
        size: this.pageSize
      },
      {
        ... this.formSearch?.value,
        scope: this.scope
      });
    const itemsProperties: ICardItemOffice[] = [];
    this.cardProperties.showCreateNemElementButton = false;
    if (success) {
      this.isListEmpty = !data.length;
      itemsProperties.unshift(...data.map(person => {
        const personCardItem = {
          typeCardItem: 'listPersons',
          iconSvg: true,
          icon: IconsEnum.OpenPMO,
          nameCardItem: person.name,
          fullNameCardItem: person.fullName,
          avatar: person.avatar,
          itemId: person.id,
          urlCard: 'person',
          paramsUrlCard: [
            {
              name: 'idPerson',
              value: person.id
            },
            {
              name: 'idOffice',
              value: this.idOffice
            }
          ],
        } as ICardItem;
        return personCardItem;
      }));
      this.totalRecords = pagination.totalRecords;
      this.isLoading = false;
      
    }

    this.cardItemsProperties = itemsProperties;
  }

  async loadTreeViewScope() {
    const { data, success } = await this.officeSrv.GetTreeScopePersons(this.idOffice);
    if (success) {
      const node = {
        label: data.name,
        data: data.id,
        icon: `app-icon ${IconsEnum.Offices}`,
        parent: undefined,
        children: undefined,
        selectable: true,
        expanded: true,
        type: 'office'
      };
      node.children = data.plans.map(plan => ({
        label: plan.name,
        data: plan.id,
        icon: `app-icon ${IconsEnum.Plan}`,
        parent: node,
        expanded: true,
        children: this.loadTreeChildrens(plan.workpacks),
        selectable: true,
        type: 'plan'

      }) as TreeNode);
      this.treeViewScope = [{ ...node }];
      this.allSelected = this.setSelectedNodes(this.treeViewScope);
      this.selectedOffices = this.allSelected.filter(node => node.type === 'office');
      if (this.selectedOffices && this.selectedOffices.length > 0) {
        this.formSearch.controls.scopeName.setValue(this.selectedOffices[0].label);
      }
    }
  }

  setSelectedNodes(list: TreeNode[]) {
    let result = [];
    list.forEach(l => {
      result.push(l)
      if (l.children && l.children.length > 0) {
        const resultChildren = this.setSelectedNodes(l.children);
        result = result.concat(resultChildren);
      }
    });
    return result;
  }

  loadTreeChildrens(worckpackList: ITreeViewScopeWorkpack[], parent?: TreeNode): TreeNode[] {
    if (worckpackList) {
      const list = worckpackList.map(worckpack => {
        if (worckpack.children) {
          const node = {
            label: worckpack.name,
            icon: worckpack.icon,
            data: worckpack.id,
            children: undefined,
            parent,
            selectable: true,
            expanded: true,
            type: 'workpack'
          };
          node.children = this.loadTreeChildrens(worckpack.children, node);
          return node;
        }
        return {
          label: worckpack.name,
          data: worckpack.id,
          children: undefined,
          parent,
          icon: worckpack.icon,
          selectable: true
        };
      });
      return list;
    }
    return [];
  }

  loadOptions() {
    this.optionsAccess = [
      { label: this.translateSrv.instant('all'), value: OptionsAccessEnum.All },
      { label: this.translateSrv.instant('users'), value: OptionsAccessEnum.User },
      { label: this.translateSrv.instant('noUsers'), value: OptionsAccessEnum.NoUser },
    ];
    this.optionsStakeholder = [
      { label: this.translateSrv.instant('all'), value: OptionsStakeholderEnum.All },
      { label: this.translateSrv.instant('stakeholders'), value: OptionsStakeholderEnum.Stakeholder },
      { label: this.translateSrv.instant('noStakeholders'), value: OptionsStakeholderEnum.NoStakeholder },
    ];
    this.optionsCCBMember = [
      { label: this.translateSrv.instant('all'), value: 'ALL' },
      { label: this.translateSrv.instant('members'), value: 'CCB_MEMBERS' },
      { label: this.translateSrv.instant('noMembers'), value: 'NON_CCB_MEMBERS' },
    ]
  }

  async getOfficeById() {
    this.propertiesOffice = await this.officeSrv.getCurrentOffice(this.idOffice);
  }

  setBreadcrumb() {
    this.breadcrumbSrv.setMenu([
      {
        key: 'administration',
        info: this.propertiesOffice?.name,
        tooltip: this.propertiesOffice?.fullName,
        routerLink: ['/configuration-office'],
        queryParams: { idOffice: this.idOffice }
      },
      {
        key: 'configuration',
        info: 'persons',
        tooltip: this.translateSrv.instant('measureUnits'),
        routerLink: ['/persons'],
        queryParams: { idOffice: this.idOffice }
      }
    ]);
  }

  navigateToPage(url: string, idPerson: number) {
    this.router.navigate([`${url}`]);
    this.router.navigate([url], { queryParams: { idPerson } });
  }

  handleChangeDisplayMode(event) {
    this.displayModeAll = event.displayMode;
  }

  handleChangePageSize(event) {
    this.pageSize = event.pageSize;
  }

  async handleHideOverlayScope(event?) {
    this.getSelectedsNode();
    await this.loadPersons();
  }

  getSelectedsNode() {
    this.selectedOffices = this.allSelected.filter(node => node.type === 'office');
    this.selectedPlans = this.allSelected.filter(node => node.type === 'plan');
    this.selectedWorkpacks = this.allSelected.filter(node => !node.type || node.type === 'workpack');
    if (this.selectedOffices && this.selectedOffices.length > 0) {
      this.formSearch.controls.scopeName.setValue(this.selectedOffices[0].label);
    } else if (this.selectedPlans && this.selectedPlans.length > 0) {
      this.formSearch.controls.scopeName.setValue(this.selectedPlans[0].label);
    } else if (this.selectedWorkpacks && this.selectedWorkpacks.length > 0) {
      this.formSearch.controls.scopeName.setValue(this.selectedWorkpacks[0].label);
    } else {
      this.formSearch.controls.scopeName.setValue('');
    }
    this.scope = [...this.selectedOffices, ...this.selectedPlans, ...this.selectedWorkpacks];
    const scopeSelected = [...this.scope];
    scopeSelected.forEach(item => {
      if (item.children) {
        const children = item.children.map(child => child.data);
        this.scope = this.scope.filter(itemScope => !children.includes(itemScope.data));
      }
    });
    this.scope = this.scope.map(item => item.data);
  }
}
