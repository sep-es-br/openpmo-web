import { AuthService } from './../../../shared/services/auth.service';
import { SaveButtonComponent } from './../../../shared/components/save-button/save-button.component';
import { IconsEnum } from './../../../shared/enums/IconsEnum';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ICardItemPermission } from './../../../shared/interfaces/ICardItemPermission';
import { IWorkpackShared } from './../../../shared/interfaces/IWorkpackShared';
import { WorkpackSharedService } from './../../../shared/services/workpack-shared.service';
import { IWorkpack } from 'src/app/shared/interfaces/IWorkpack';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { OfficeService } from 'src/app/shared/services/office.service';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { IPlan } from 'src/app/shared/interfaces/IPlan';
import { PlanService } from 'src/app/shared/services/plan.service';
import { share, takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ActivatedRoute } from '@angular/router';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { ICard } from 'src/app/shared/interfaces/ICard';

@Component({
  selector: 'app-sharing',
  templateUrl: './sharing.component.html',
  styleUrls: ['./sharing.component.scss']
})
export class SharingComponent implements OnInit {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;

  idWorkpack: number;
  idWorkpackParent: number;
  idPlan: number;
  responsive: boolean;
  plan: IPlan;
  office: IOffice;
  workpack: IWorkpack;
  $destroy = new Subject();
  workpackSharing: IWorkpackShared[];
  workpackName: string;
  workpackFullName: string;
  cardItemSharing: ICardItemPermission[];
  workpackSharingCard: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: '',
    collapseble: false,
    initialStateCollapse: false
  };
  officeListOptionsSharing: IOffice[];
  editPermission = false;

  constructor(
    private breadcrumbSrv: BreadcrumbService,
    private actRouter: ActivatedRoute,
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private planSrv: PlanService,
    private officeSrv: OfficeService,
    private workpackSrv: WorkpackService,
    private workpackSharedSrv: WorkpackSharedService,
    private messageSrv: MessageService,
    private confirmationSrv: ConfirmationService,
    private authSrv: AuthService
  ) {
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idWorkpack = +queryParams.idWorkpack;
      this.idWorkpackParent = +queryParams.idWorkpackParent;
      this.idPlan = +queryParams.idPlan;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
  }

  async ngOnInit() {
    this.workpackSharedSrv.setParamsFromUrl(
      [':idWorkpack'],
      [this.idWorkpack]
    );
    if (this.idPlan) {
      await this.loadPlanProperties();
    }
    await this.loadWorkpackProperties();
    if (this.idWorkpackParent) {
      await this.setBreadcrumbFromWorkpack();
    }
    await this.loadWorkpackSharing();
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async loadPlanProperties() {
    const result = await this.planSrv.GetById(this.idPlan);
    if (result.success) {
      this.plan = result.data;
      const resultOffice = await this.officeSrv.GetById(this.plan.idOffice);
      if (resultOffice.success) {
        this.office = resultOffice.data;
      }
      this.setBreacrumbFromPlan();
    }
  }

  async loadWorkpackProperties() {
    const result = await this.workpackSrv.GetWorkpackById(this.idWorkpack, {'id-plan': this.idPlan});
    if (result.success) {
      this.workpack = result.data;
      this.editPermission = (await this.authSrv.isUserAdmin() || this.workpack.permissions && this.workpack.permissions.filter( p => p.level === 'EDIT').length > 0
        && !this.workpack.canceled)
      const propertyNameWorkpackModel = this.workpack?.model.properties.find(p => p.name === 'name' && p.session === 'PROPERTIES');
      const propertyNameWorkpack = this.workpack.properties.find(p => p.idPropertyModel === propertyNameWorkpackModel.id);
      this.workpackName = propertyNameWorkpack.value as string;
      const propertyFullNameWorkpackModel = this.workpack?.model.properties.find(p => p.name === 'fullName' && p.session === 'PROPERTIES');
      const propertyFullNameWorkpack = this.workpack.properties.find(p => p.idPropertyModel === propertyFullNameWorkpackModel.id);
      this.workpackFullName = propertyFullNameWorkpack.value as string;
      if (!this.idPlan) {
        this.idPlan = this.workpack.plan.id;
        await this.loadPlanProperties();
      }
    }
  }

  setBreacrumbFromPlan() {
    this.breadcrumbSrv.setMenu([
      {
        key: 'office',
        routerLink: ['/offices', 'office'],
        queryParams: { id: this.office.id },
        info: this.office?.name,
        tooltip: this.office?.fullName
      },
      {
        key: 'plan',
        routerLink: ['/plan'],
        queryParams: { id: this.idPlan },
        info: this.plan?.name,
        tooltip: this.plan?.fullName
      },
      {
        key: 'sharing',
        routerLink: ['/workpack/sharing'],
        queryParams: { idPlan: this.idPlan, idWorkpack: this.idWorkpack },
        info: 'sharing',
        tooltip: 'sharing'
      }
    ]);
  }

  async setBreadcrumbFromWorkpack() {
    this.breadcrumbSrv.setMenu([
      ... await this.getBreadcrumbs(),
      {
        key: 'sharing',
        routerLink: ['/workpack/sharing'],
        queryParams: { idWorkpack: this.idWorkpack, idWorkpackParent: this.idWorkpackParent },
        info: 'sharing',
        tooltip: 'sharing'
      }
    ]);
  }

  async getBreadcrumbs() {
    const { success, data } = await this.breadcrumbSrv.getBreadcrumbWorkpack(this.idWorkpackParent, {'id-plan': this.idPlan});
    return success
      ? data.map(p => ({
        key: p.type.toLowerCase(),
        info: p.name,
        tooltip: p.fullName,
        routerLink: this.getRouterLinkFromType(p.type),
        queryParams: { id: p.id, idWorkpackModelLinked: p.idWorkpackModelLinked, idPlan: this.idPlan }
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

  async loadWorkpackSharing() {
    const result = await this.workpackSharedSrv.GetAll();
    if (result.success) {
      this.workpackSharing = result.data;
    }
    await this.loadOfficeListForShare();
    this.loadSharedCardItems();
  }

  async loadOfficeListForShare() {
    const result = await this.officeSrv.GetAll();
    if (result.success) {
      this.officeListOptionsSharing = result.data;
      this.officeListOptionsSharing.unshift({
        id: null,
        name: this.translateSrv.instant('all'),
        fullName: 'All'
      });
    }
  }

  loadSharedCardItems() {
    this.cardItemSharing = [];
    if (this.workpackSharing) {
      this.cardItemSharing = this.workpackSharing.map(share => ({
        typeCardItem: 'sharedItem',
        levelListOptions: [
          { label: this.translateSrv.instant('read'), value: 'READ' },
          { label: this.translateSrv.instant('edit'), value: 'EDIT' }
        ],
        selectedOption: share.level,
        titleCardItem: share.office.name,
        iconMenu: 'fas fa-trash-alt',
        itemId: share.id,
        office: share.office,
        readOnly: !this.editPermission
      }));
    }
    if (!!this.editPermission) { 
      this.cardItemSharing.push(
        {
          typeCardItem: 'newCardItemShared',
          iconMenuItems: this.officeListOptionsSharing && this.officeListOptionsSharing.length > 0 ? this.officeListOptionsSharing.map(office => ({
            label: office.name,
            icon: `app-icon ${IconsEnum.Offices}`,
            command: () => this.handleCreateNewShared(office),
          })) : []
        }
      );
    }
  }

  handleCreateNewShared(office: IOffice) {
    this.cardItemSharing.pop();
    this.cardItemSharing.push({
      typeCardItem: 'sharedItem',
      levelListOptions: [
        { label: this.translateSrv.instant('read'), value: 'READ' },
        { label: this.translateSrv.instant('edit'), value: 'EDIT' }
      ],
      selectedOption: office.id === this.office.id ? 'EDIT' : '',
      titleCardItem: office.name,
      readOnly: office.id === this.office.id ? true : false,
      office
    });
    if (office.fullName === 'All') {
      this.cardItemSharing = Array.from(this.cardItemSharing.filter(card => card.titleCardItem === this.translateSrv.instant('all')));
    } else {
      this.cardItemSharing = Array.from(this.cardItemSharing.filter(card => card.titleCardItem !== this.translateSrv.instant('all')));
    }
    if (office.id === this.office.id) {
      this.handleShowSaveButton();
    } else {
      this.saveButton.hideButton();
    }
    const selectedOffices = this.cardItemSharing.map(card => card.titleCardItem);
    this.cardItemSharing.push({
      typeCardItem: 'newCardItemShared',
      iconMenuItems: this.officeListOptionsSharing && this.officeListOptionsSharing.length > 0 ? this.officeListOptionsSharing
        .filter(office => !selectedOffices.includes(office.name))
        .map(office => ({
          label: office.name,
          icon: `app-icon ${IconsEnum.Offices}`,
          command: () => this.handleCreateNewShared(office),
        })) : []
    })
  }

  async deleteWorkpackShared(event) {
    if (event.id) {
      const workpackShared = this.workpackSharing.find(shared => shared.id === event.id);
      const result = await this.workpackSharedSrv.deleteShareWorkpack({'id-shared-with': workpackShared.id !== this.idWorkpack ? workpackShared.id : undefined},
        {field: workpackShared.office.name, useConfirm: true});
      if (result.success) {
        this.cardItemSharing = Array.from(this.cardItemSharing.filter(card => card.itemId !== event.id));
      }
    } else {
      const message = event.office === this.translateSrv.instant('all') ? `${this.translateSrv.instant('messages.deleteSharedWithAllConfirmation')}?` :
        `${this.translateSrv.instant('messages.deleteSharedWithConfirmation')} ${event.office}?`
      this.confirmationSrv.confirm({
        message,
        key: 'deleteConfirm',
        acceptLabel: this.translateSrv.instant('yes'),
        rejectLabel: this.translateSrv.instant('no'),
        accept: async () => {
          this.cardItemSharing = Array.from(this.cardItemSharing.filter(card => !card.titleCardItem || card.titleCardItem !== event.office));
          setTimeout(() => {
            this.messageSrv.add({
              severity: 'success',
              summary: this.translateSrv.instant('success'),
              detail: this.translateSrv.instant('messages.deleteSuccessful')
            });
          }, 300);
        },
        reject: () => {
          return;
        }
      });
    }

  }

  handleShowSaveButton() {
    if (this.cardItemSharing.filter(card => card.typeCardItem === 'sharedItem' && (!card.selectedOption || card.selectedOption === '')).length === 0) {
      this.saveButton.showButton();
    }
  }

  async saveWorkpackSharing() {
    this.saveButton.hideButton();
    const sharedWithSender: IWorkpackShared[] = this.cardItemSharing.filter(card => card.typeCardItem === 'sharedItem').map(share => ({
      id: share.itemId,
      office: share.office,
      level: share.selectedOption
    }));
    const result = await this.workpackSharedSrv.shareWorkpack(sharedWithSender);
    if (result.success) {
      await this.loadWorkpackSharing();
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.registerSaved')
      });
    }

  }

}
