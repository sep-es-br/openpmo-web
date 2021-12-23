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
import { FilterDataviewService } from 'src/app/shared/services/filter-dataview.service';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { FilterDataviewPropertiesEntity } from 'src/app/shared/constants/filterDataviewPropertiesEntity';
import { ControlChangeBoardService } from 'src/app/shared/services/control-change-board.service';
import { IControlChangeBoard } from 'src/app/shared/interfaces/IControlChangeBoard';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IPerson } from 'src/app/shared/interfaces/IPerson';

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
    showFilters: true
  };
  idOffice: number;
  projectName: string;
  cardItemsProperties: ICardItem[];
  isUserAdmin: boolean;
  editPermission: boolean;
  $destroy = new Subject();
  responsive: boolean;
  collapsePanelsStatus = true;
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;
  idFilterSelected: number;
  idProject: number;
  showInactive = false;
  idPlan: number;

  constructor(
    private controlChangeBoardSvr: ControlChangeBoardService,
    private translateSvr: TranslateService,
    private activeRoute: ActivatedRoute,
    private breadcrumbSrv: BreadcrumbService,
    private responsiveSrv: ResponsiveService,
    private filterSrv: FilterDataviewService,
    private router: Router,
    private workpackSrv: WorkpackService,
    private authSrv: AuthService,
  ) {
    this.activeRoute.queryParams.subscribe(params => {
      this.idProject = +params.idProject;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
  }

  async ngOnInit() {
    await this.loadPropertiesProject();
    await this.loadControlChangeBoard();
    this.breadcrumbSrv.setMenu([
      ...await this.getBreadcrumbs(this.idProject),
      ...[{
        key: 'changeControlBoard',
        routerLink: ['/workpack/change-control-board'],
        queryParams: {
          idProject: this.idProject,
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
    const { success, data } = await this.workpackSrv.GetWorkpackById(this.idProject, { 'id-plan': this.idPlan });
    if (success) {
      const propertyNameWorkpackModel = data.model.properties.find(p => p.name === 'name' && p.session === 'PROPERTIES');
      const propertyNameWorkpack = data.properties.find(p => p.idPropertyModel === propertyNameWorkpackModel.id);
      this.projectName = propertyNameWorkpack.value as string;
      if (this.isUserAdmin) {
        this.editPermission = true;
      } else {
        this.editPermission = data.permissions && data.permissions.filter(p => p.level === 'EDIT').length > 0;
      }
    }
  }

  async getBreadcrumbs(idWorkpack: number) {
    const { success, data } = await this.breadcrumbSrv.getBreadcrumbWorkpack(idWorkpack, { 'id-plan': this.idPlan });
    return success
      ? data.map(p => ({
        key: !p.modelName ? p.type.toLowerCase() : p.modelName,
        info: p.name,
        tooltip: p.fullName,
        routerLink: this.getRouterLinkFromType(p.type),
        queryParams: { id: p.id, idWorkpackModelLinked: p.idWorkpackModelLinked },
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
        ],
      }
    ] : [];
    this.cardProperties.showCreateNemElementButton = this.editPermission;
    if (success) {

      itemsProperties.unshift(...data.map(controlChangeBoard => ({
        typeCardItem: 'listControlChangeBoard',
        iconSvg: true,
        icon: IconsEnum.CCBMember,
        nameCardItem: controlChangeBoard.person.name,
        fullNameCardItem: controlChangeBoard.person.fullName,
        roles: controlChangeBoard?.memberAs?.
        filter(ccb=> ccb.active).
        map(ccb => `${ccb.workLocation || ''} ${ccb.role}`),
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
        ],
        active: controlChangeBoard.active
      } as ICardItem)));
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

  handleEditFilter(event) {
    const idFilter = event.filter;
    if (idFilter) {
      const filterProperties = this.loadFilterPropertiesList();
      this.filterSrv.setFilterProperties(filterProperties);
      this.setBreadcrumbStorage();
      this.router.navigate(['/filter-dataview'], {
        queryParams: {
          id: idFilter,
          entityName: 'controlChangeBoard'
        }
      });
    }
  }

  async handleSelectedFilter(event) {
    const idFilter = event.filter;
    if (idFilter) {
      this.idFilterSelected = idFilter;
      await this.loadControlChangeBoard();
    }
  }

  handleNewFilter() {
    const filterProperties = this.loadFilterPropertiesList();
    this.filterSrv.setFilterProperties(filterProperties);
    this.setBreadcrumbStorage();
    this.router.navigate(['/filter-dataview'], {
      queryParams: {
        entityName: 'controlChangeBoard'
      }
    });
  }

  loadFilterPropertiesList() {
    const listProperties = FilterDataviewPropertiesEntity.domains;
    const filterPropertiesList = listProperties.map(prop => {
      const property = new PropertyTemplateModel();
      property.type = prop.type;
      property.label = prop.label;
      property.name = prop.apiValue;
      property.active = true;
      return property;
    });
    return filterPropertiesList;
  }

  setBreadcrumbStorage() {
    this.breadcrumbSrv.setBreadcrumbStorage([{
      key: 'changeControlBoard',
      routerLink: ['/workpack/change-control-board'],
      queryParams: {
        idProject: this.idProject,
      },
    }, {
      key: 'filter',
      routerLink: ['filter-dataview']
    }]);
  }

  createNewControlChangeBoard() {
    this.router.navigate(['/workpack/change-control-board/member'], { queryParams: { idProject: this.idProject } });
  }

}
