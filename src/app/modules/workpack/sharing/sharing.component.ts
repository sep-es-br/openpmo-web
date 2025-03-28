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
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';

@Component({
  selector: 'app-sharing',
  templateUrl: './sharing.component.html',
  styleUrls: ['./sharing.component.scss']
})
export class SharingComponent implements OnInit, OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;

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
  isLoading = false;
  formIsSaving = false;

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
    this.isLoading = true;
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
    const storedPlan = localStorage.getItem('@pmo/propertiesCurrentPlan');
    this.plan = storedPlan ? JSON.parse(storedPlan) : undefined;
    if (!this.plan) {
      this.plan = await this.planSrv.getCurrentPlan(this.idPlan);
    }
    this.office = await this.officeSrv.getCurrentOffice(this.plan.idOffice);
    this.setBreacrumbFromPlan();
  }

  async loadWorkpackProperties() {
    const result = await this.workpackSrv.GetWorkpackById(this.idWorkpack, { 'id-plan': this.idPlan });
    if (result.success) {
      this.workpack = result.data;
      this.editPermission = (await this.authSrv.isUserAdmin() ||
        this.workpack.permissions && this.workpack.permissions.filter(p => p.level === 'EDIT').length > 0
        && !this.workpack.canceled);
      this.workpackName = this.workpack.name;
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
    let breadcrumbItems = this.breadcrumbSrv.get;
    if (!breadcrumbItems || breadcrumbItems.length === 0) {
      breadcrumbItems = await this.breadcrumbSrv.loadWorkpackBreadcrumbs(this.idWorkpack, this.idPlan);
    }
    this.breadcrumbSrv.setMenu([
      ... breadcrumbItems,
      {
        key: 'sharing',
        routerLink: ['/workpack/sharing'],
        queryParams: { idWorkpack: this.idWorkpack, idWorkpackParent: this.idWorkpackParent },
        info: 'sharing',
        tooltip: 'sharing'
      }
    ]);
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
      this.officeListOptionsSharing = Array.from([...result.data]);
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
        readOnly: !this.editPermission,
        canDelete: this.editPermission
      }));
    }
    const officeIds = this.cardItemSharing.map( o => o.office.id);
    if (!!this.editPermission) {
      const listOptions = Array.from([...this.officeListOptionsSharing.filter( op => !officeIds.includes(op.id) )]);
      this.cardItemSharing.push(
        {
          typeCardItem: 'newCardItemShared',
          iconMenuItems: listOptions &&
            listOptions.length > 0 ? listOptions.map(office => ({
            label: office.name,
            icon: `app-icon ${IconsEnum.Offices}`,
            command: () => this.handleCreateNewShared(office),
          })) : []
        }
      );
    }
    this.isLoading = false;
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
      canDelete: true,
      office
    });
    if (office.fullName === 'All') {
      this.cardItemSharing = Array.from(this.cardItemSharing.filter(card => card.titleCardItem === this.translateSrv.instant('all')));
    } else {
      this.cardItemSharing = Array.from(this.cardItemSharing.filter(card => card.titleCardItem !== this.translateSrv.instant('all')));
    }
    this.cancelButton.showButton();
    if (office.id === this.office.id) {
      this.handleShowSaveButton();
    } else {
      this.saveButton?.hideButton();
    }
    const officeIds = this.cardItemSharing.map( o => o.office.id);
    const listOptions = Array.from([...this.officeListOptionsSharing.filter( op => !officeIds.includes(op.id) )]);
    this.cardItemSharing.push({
      typeCardItem: 'newCardItemShared',
      iconMenuItems: listOptions && listOptions.length > 0 ? listOptions
        .filter(office => !officeIds.includes(office.id))
        .map(office => ({
          label: office.name,
          icon: `app-icon ${IconsEnum.Offices}`,
          command: () => this.handleCreateNewShared(office),
        })) : []
    });
  }

  async deleteWorkpackShared(event) {
    if (event.id) {
      const workpackShared = this.workpackSharing.find(shared => shared.id === event.id);
      const result =
        await this.workpackSharedSrv
        .deleteShareWorkpack({ 'id-shared-with': workpackShared.id !== this.idWorkpack ? workpackShared.id : undefined },
        { field: workpackShared.office.name, useConfirm: true });
      if (result.success) {
        this.cardItemSharing = Array.from(this.cardItemSharing.filter(card => card.itemId !== event.id));
        this.cardItemSharing.pop();
        const officeIds = this.cardItemSharing.map( o => o.office.id);
        const listOptions = Array.from([...this.officeListOptionsSharing.filter( op => !officeIds.includes(op.id) )]);
        this.cardItemSharing.push({
          typeCardItem: 'newCardItemShared',
          iconMenuItems: listOptions && listOptions.length > 0 ? listOptions
            .filter(office => !officeIds.includes(office.id))
            .map(office => ({
              label: office.name,
              icon: `app-icon ${IconsEnum.Offices}`,
              command: () => this.handleCreateNewShared(office),
            })) : []
        });
      }
    } else {
      const message = event.office === this.translateSrv.instant('all') ?
        `${this.translateSrv.instant('messages.deleteSharedWithAllConfirmation')}?` :
        `${this.translateSrv.instant('messages.deleteSharedWithConfirmation')} ${event.office}?`;
      this.confirmationSrv.confirm({
        message,
        key: 'deleteConfirm',
        acceptLabel: this.translateSrv.instant('yes'),
        rejectLabel: this.translateSrv.instant('no'),
        accept: async() => {
          this.cardItemSharing = Array.from(this.cardItemSharing.filter(card => !card.titleCardItem ||
            card.titleCardItem !== event.office));
          setTimeout(() => {
            this.messageSrv.add({
              severity: 'success',
              summary: this.translateSrv.instant('success'),
              detail: this.translateSrv.instant('messages.deleteSuccessful')
            });
          }, 300);
          this.cardItemSharing.pop();
          const officeIds = this.cardItemSharing.map( o => o.office.id);
          const listOptions = Array.from([...this.officeListOptionsSharing.filter( op => !officeIds.includes(op.id) )]);
          this.cardItemSharing.push({
            typeCardItem: 'newCardItemShared',
            iconMenuItems: listOptions && listOptions.length > 0 ? listOptions
              .filter(office => !officeIds.includes(office.id))
              .map(office => ({
                label: office.name,
                icon: `app-icon ${IconsEnum.Offices}`,
                command: () => this.handleCreateNewShared(office),
              })) : []
          });
        }
      });
    }

  }

  handleShowSaveButton() {
    if (this.cardItemSharing
      .filter(card => card.typeCardItem === 'sharedItem' && (!card.selectedOption || card.selectedOption === '')).length === 0) {
      this.saveButton.showButton();
    }
    this.cancelButton.showButton();
  }

  async saveWorkpackSharing() {
    this.cancelButton.hideButton();
    this.formIsSaving = true;
    const sharedWithSender: IWorkpackShared[] = this.cardItemSharing.filter(card => card.typeCardItem === 'sharedItem').map(share => ({
      id: share.itemId,
      office: share.office,
      level: share.selectedOption
    }));
    const result = await this.workpackSharedSrv.shareWorkpack(sharedWithSender);
    this.formIsSaving = false;
    if (result.success) {
      await this.loadWorkpackSharing();
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.registerSaved')
      });
    }

  }

  handleOnCancel() {
    this.saveButton.hideButton();
    this.loadSharedCardItems();
  }

}
