import { CitizenUserService } from './../../../../shared/services/citizen-user.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { takeUntil } from 'rxjs/operators';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ControlChangeBoardService } from 'src/app/shared/services/control-change-board.service';
import { IControlChangeBoard } from 'src/app/shared/interfaces/IControlChangeBoard';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';

@Component({
  selector: 'app-control-change-board-list',
  templateUrl: './control-change-board-list.component.html',
  styleUrls: ['./control-change-board-list.component.scss']
})
export class ControlChangeBoardListComponent implements OnInit, OnDestroy {
  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'members',
    collapseble: true,
    initialStateCollapse: false,
    showFilters: false,
    showCreateNemElementButton: false
  };
  idOffice: number;
  projectName: string;
  cardItemsProperties: ICardItem[];
  isUserAdmin: boolean;
  editPermission: boolean;
  $destroy = new Subject();
  responsive: boolean;
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;
  idFilterSelected: number;
  idProject: number;
  showInactive = false;
  idPlan: number;
  isLoading = false;

  constructor(
    private controlChangeBoardSvr: ControlChangeBoardService,
    private translateSvr: TranslateService,
    private activeRoute: ActivatedRoute,
    private breadcrumbSrv: BreadcrumbService,
    private responsiveSrv: ResponsiveService,
    private router: Router,
    private workpackSrv: WorkpackService,
    private authSrv: AuthService,
    private citizenUserSrv: CitizenUserService,
    private configDataViewSrv: ConfigDataViewService
  ) {
    this.configDataViewSrv.observableDisplayModeAll.pipe(takeUntil(this.$destroy)).subscribe(displayMode => {
      this.displayModeAll = displayMode;
    });
    this.configDataViewSrv.observablePageSize.pipe(takeUntil(this.$destroy)).subscribe(pageSize => {
      this.pageSize = pageSize;
    });
    this.citizenUserSrv.loadCitizenUsers();
    this.activeRoute.queryParams.subscribe(params => {
      this.idProject = +params.idProject;
      this.idOffice = +params.idOffice;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
  }

  async ngOnInit() {
    this.isLoading = true;
    await this.loadPropertiesProject();
    await this.loadControlChangeBoard();
    let breadcrumbItems = this.breadcrumbSrv.get;
    if (!breadcrumbItems || breadcrumbItems.length === 0) {
      breadcrumbItems = await this.breadcrumbSrv.loadWorkpackBreadcrumbs(this.idProject, this.idPlan)
    }
    this.breadcrumbSrv.setMenu([
      ...breadcrumbItems,
      ...[{
        key: 'changeControlBoard',
        info: 'ccbMembers',
        routerLink: ['/workpack/change-control-board'],
        queryParams: {
          idProject: this.idProject,
          idOffice: this.idOffice
        },
      }]
    ]);
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async loadPropertiesProject() {
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    this.idPlan = Number(localStorage.getItem('@currentPlan'));
    const { success, data } = await this.workpackSrv.GetWorkpackName(this.idProject, { 'id-plan': this.idPlan });
    if (success) {
      const workpackName = data.name;
      this.projectName = workpackName;
      const resultPermissions = await this.workpackSrv.GetWorkpackPermissions(this.idProject, { 'id-plan': this.idPlan });
      const permissionsList = resultPermissions.success && resultPermissions.data;
      if (this.isUserAdmin) {
        this.editPermission = true;
      } else {
        this.editPermission = permissionsList.permissions && permissionsList.permissions.filter(p => p.level === 'EDIT').length > 0;
      }
    }
  }

  handleChangeDisplayMode(event) {
    this.displayModeAll = event.displayMode;
  }

  handleChangePageSize(event) {
    this.pageSize = event.pageSize;
  }

  async loadControlChangeBoard() {
    const { success, data } = await this.controlChangeBoardSvr.getAllCcbMembers(this.idProject);
    const itemsProperties: ICardItem[] = this.editPermission ? [
      {
        typeCardItem: 'newCardItem',
        iconSvg: true,
        icon: IconsEnum.Plus,
        urlCard: '/workpack/change-control-board/member',
        active: true,
        paramsUrlCard: [
          { name: 'idProject', value: this.idProject },
          { name: 'idOffice', value: this.idOffice}
        ],
      }
    ] : [];
    if (success) {
      itemsProperties.unshift(...data.map(controlChangeBoard => ({
        typeCardItem: 'listControlChangeBoard',
        iconSvg: true,
        icon: IconsEnum.CCBMember,
        nameCardItem: controlChangeBoard.person.name,
        fullNameCardItem: controlChangeBoard.person.fullName,
        roles: controlChangeBoard?.memberAs?.
          filter(ccb => ccb.active).
          map(ccb => `${ccb.workLocation || ''} ${this.translateSvr.instant(ccb.role)}`),
        itemId: controlChangeBoard.person.id,
        menuItems: [{
          label: this.translateSvr.instant('delete'), icon: 'fas fa-trash-alt',
          command: () => this.deleteControlChangeBoard(controlChangeBoard, controlChangeBoard.person.id),
          disabled: !this.editPermission
        }] as MenuItem[],
        urlCard: 'member',
        paramsUrlCard: [
          { name: 'idProject', value: this.idProject },
          { name: 'idPerson', value: controlChangeBoard.person.id },
          { name: 'idOffice', value: this.idOffice },
        ],
        active: controlChangeBoard.active
      } as ICardItem)));
      this.isLoading = false;
    } else {
      this.isLoading = false;
    }
    this.cardItemsProperties = itemsProperties;
    this.totalRecords = this.cardItemsProperties && this.cardItemsProperties.length;

  }

  async deleteControlChangeBoard(controlChangeBoard: IControlChangeBoard, idPerson: number) {
    const { success } = await this.controlChangeBoardSvr.Delete(controlChangeBoard, {
      'id-person': idPerson,
      'id-workpack': this.idProject,
    });
    if (success) {
      this.cardItemsProperties = Array.from(this.cardItemsProperties.filter(element => element.itemId !== controlChangeBoard.person.id));
      this.totalRecords = this.cardItemsProperties && this.cardItemsProperties.length;
    }
  };

  createNewControlChangeBoard() {
    this.router.navigate(['/workpack/change-control-board/member'], { queryParams: { idProject: this.idProject } });
  }

}
