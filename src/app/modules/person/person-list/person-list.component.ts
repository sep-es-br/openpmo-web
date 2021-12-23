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

@Component({
  selector: 'app-person-list',
  templateUrl: './person-list.component.html',
  styleUrls: ['./person-list.component.scss']
})
export class PersonListComponent implements OnInit, OnDestroy {
  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    collapseble: true,
    initialStateCollapse: false
  };
  cardItemsProperties: ICardItem[];
  isListEmpty = false;
  collapsePanelsStatus = true;
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;

  idOffice: number;
  responsive: boolean;
  $destroy = new Subject();

  treeViewScope: TreeNode[] = [];
  optionsAccess: SelectItem[] = [];
  optionsStakeholder: SelectItem[] = [];
  formSearch: FormGroup;

  allSelected: TreeNode[] = [];
  selectedOffices: TreeNode[] = [];
  selectedPlans: TreeNode[] = [];
  selectedWorkpacks: TreeNode[] = [];

  constructor(
    private personSrv: PersonService,
    private router: Router,
    private officeSrv: OfficeService,
    private activeRoute: ActivatedRoute,
    private responsiveSvr: ResponsiveService,
    private translateSrv: TranslateService,
    private formBuilder: FormBuilder,
    private breadcrumbSrv: BreadcrumbService
  ) {
    this.activeRoute.queryParams.subscribe(async({ idOffice }) => {
      this.idOffice = +idOffice;
      await this.loads();
    });
    this.formSearch = this.formBuilder.group({
      userStatus: [OptionsAccessEnum.All, Validators.required],
      stakeholderStatus: [OptionsStakeholderEnum.All, Validators.required],
      name: ['']
    });
    this.responsiveSvr.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async loads() {
    await this.loadTreeViewScope();
    await this.loadPersons();
    this.loadOptions();
    this.setBreadcrumb();
  }

  async loadPersons() {
    const { success, data } = await this.personSrv.GetAllPersons(this.idOffice, {
      ...this.formSearch?.value,
      officeScope: this.selectedOffices.map(office => office.data),
      planScope: this.selectedPlans.map(plan => plan.data),
      workpackScope: this.selectedWorkpacks.map(workpack => workpack.data),
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
    }

    this.cardItemsProperties = itemsProperties;
    this.totalRecords = this.cardItemsProperties && this.cardItemsProperties.length;
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
        type: 'office'
      };
      node.children = data.plans.map(plan => ({
        label: plan.name,
        data: plan.id,
        icon: `app-icon ${IconsEnum.Plan}`,
        parent: node,
        children: this.loadTreeChildrens(plan.workpacks),
        selectable: true,
        type: 'plan'

      }) as TreeNode);
      this.treeViewScope = [{ ...node }];
      this.allSelected = this.treeViewScope;
      this.getSelectedsNode();
    }
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
            type: 'workpack'
          };
          node.children = this.loadTreeChildrens(worckpack.children, node);
          return node;
        }
        return { label: worckpack.name, data: worckpack.id, children: undefined, parent, icon: worckpack.icon, selectable: true };
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
  }

  setBreadcrumb() {
    this.breadcrumbSrv.setMenu([
      {
        key: 'administration',
        routerLink: ['/configuration-office'],
        queryParams: { idOffice: this.idOffice }
      },
      {
        key: 'configuration',
        routerLink: ['/persons'],
        queryParams: { idOffice: this.idOffice }
      },
    ]);
  }

  navigateToPage(url: string, idPerson: number) {
    this.router.navigate([`${url}`]);
    this.router.navigate([url], { queryParams: { idPerson } });
  }

  handleChangeCollapseExpandPanel(event) {
    this.collapsePanelsStatus = event.mode === 'collapse' ? true : false;
    this.cardProperties = Object.assign({}, {
      ...this.cardProperties,
      initialStateCollapse: this.collapsePanelsStatus
    });
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
    this.selectedWorkpacks = this.allSelected.filter(node => node.type === 'workpack');
  }
}
