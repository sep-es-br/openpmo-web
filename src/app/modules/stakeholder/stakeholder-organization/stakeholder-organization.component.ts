import { AuthService } from './../../../shared/services/auth.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { TranslateService } from '@ngx-translate/core';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { StakeholderService } from 'src/app/shared/services/stakeholder.service';
import { IStakeholder, IStakeholderRole } from 'src/app/shared/interfaces/IStakeholder';
import { IWorkpack } from 'src/app/shared/interfaces/IWorkpack';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { MessageService } from 'primeng/api';
import { enterLeave } from '../../../shared/animations/enterLeave.animation';
import { IOrganization } from 'src/app/shared/interfaces/IOrganization';
import { OrganizationService } from 'src/app/shared/services/organization.service';
import { PlanService } from 'src/app/shared/services/plan.service';
import { formatDateToString } from 'src/app/shared/utils/formatDateToString';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { WorkpackModelService } from 'src/app/shared/services/workpack-model.service';
import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';

interface ICardItemRole {
  type: string;
  readOnly?: boolean;
  role?: IStakeholderRole;
  personRoleOptions?: { label: string; value: string }[];
}

@Component({
  selector: 'app-stakeholder-organization',
  templateUrl: './stakeholder-organization.component.html',
  styleUrls: ['./stakeholder-organization.component.scss'],
  animations: [
    enterLeave({ opacity: 0, pointerEvents: 'none' }, { opacity: 1, pointerEvents: 'all' }, 300)
  ]
})
export class StakeholderOrganizationComponent implements OnInit {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;

  idWorkpack: number;
  idWorkpackModelLinked: number;
  idPlan: number;
  workpack: IWorkpack;
  rolesOptions: { label: string; value: string }[];
  organization: IOrganization;
  organizationSelected: string;
  organizationListOptions: { label: string; value: string }[];
  organizationsOffice: IOrganization[];
  cardOrganization: ICard;
  cardRoles: ICard;
  idOrganization: number;
  responsive: boolean;
  stakeholder: IStakeholder;
  stakeholderRoles: IStakeholderRole[];
  backupStakeholderRolesCardItems: ICardItemRole[];
  stakeholderRolesCardItems: ICardItemRole[];
  editPermission = false;
  isLoading = false;
  formIsSaving = false;

  constructor(
    private actRouter: ActivatedRoute,
    private responsiveSrv: ResponsiveService,
    private workpackSrv: WorkpackService,
    private stakeholderSrv: StakeholderService,
    private organizationSrv: OrganizationService,
    private planSrv: PlanService,
    private translateSrv: TranslateService,
    private location: Location,
    private messageSrv: MessageService,
    private breadcrumbSrv: BreadcrumbService,
    private router: Router,
    private authSrv: AuthService,
    private workpackModelSrv: WorkpackModelService
  ) {
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idPlan = queryParams.idPlan;
      this.idWorkpack = queryParams.idWorkpack;
      this.idWorkpackModelLinked = queryParams.idWorkpackModelLinked;
      this.idOrganization = queryParams.idOrganization;
    });
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });
  }

  async ngOnInit() {
    await this.loadStakeholder();
    let breadcrumbItems = this.breadcrumbSrv.get;
    if (!breadcrumbItems || breadcrumbItems.length === 0) {
      breadcrumbItems = await this.breadcrumbSrv.loadWorkpackBreadcrumbs(this.idWorkpack, this.idPlan)
    }
    this.breadcrumbSrv.setMenu([
      ...breadcrumbItems,
      {
        key: 'stakeholder',
        info: this.stakeholder?.organization?.name,
        tooltip: this.stakeholder?.organization?.fullName
      }
    ]);
  }

  async loadStakeholder() {
    this.isLoading = true;
    if (this.idOrganization) {
      const result = await this.stakeholderSrv.GetStakeholderOrganization({
        'id-workpack': this.idWorkpack,
        'id-organization': this.idOrganization
      });
      if (result.success) {
        this.stakeholder = result.data;
        this.stakeholderRoles = this.stakeholder.roles && this.stakeholder.roles.map(role => ({
          id: role.id,
          active: role.active,
          role: role.role,
          from: new Date(role.from + 'T00:00:00'),
          to: role.to ? new Date(role.to + 'T00:00:00') : null
        }));
        if (!this.workpack) {
          this.idWorkpack = this.stakeholder.idWorkpack;
          await this.loadWorkpack();
        }
        await this.loadOrganizationStakeholder();
        this.loadCards();
      }
      return;
    } else {
      await this.loadWorkpack();
      await this.loadOrganizationsList();
      this.loadCards();
      return;
    }
  }

  async loadWorkpack() {
    const workpackData = this.workpackSrv.getWorkpackData();
    if (workpackData && workpackData.workpack && workpackData.workpack.id === this.idWorkpack && workpackData.workpackModel) {
      this.workpack = workpackData.workpack;
      this.rolesOptions = workpackData.workpackModel.organizationRoles?.map(role => ({ label: role, value: role }));

    } else {
      const result = await this.workpackSrv.GetWorkpackById(this.idWorkpack, { 'id-plan': this.idPlan });
      if (result.success) {
        this.workpack = result.data;
      }
      const resultModel = await this.workpackModelSrv.GetById(this.workpack.idWorkpackModel);
      if (resultModel.success) {
        this.rolesOptions = resultModel.data.organizationRoles.map(role => ({
          label: role,
          value: role.toLowerCase()
        }));
      }
    }
    const isUserAdmin = await this.authSrv.isUserAdmin();
    if (isUserAdmin) {
      this.editPermission = !this.workpack.canceled;
    } else {
      this.editPermission = (this.workpack.permissions && this.workpack.permissions.filter(p => p.level === 'EDIT').length > 0) && !this.workpack.canceled;
    }
  }

  async loadOrganizationStakeholder() {
    const result = await this.organizationSrv.GetById(this.stakeholder.organization.id);
    if (result.success) {
      this.organization = result.data;
    }
  }

  async loadOrganizationsList() {
    if (this.workpack) {
      const plan = await this.planSrv.getCurrentPlan(this.workpack.plan.id);
      if (plan) {
        const result = await this.organizationSrv.GetAll({ 'id-office': plan.idOffice });
        if (result.success) {
          this.organizationsOffice = result.data;
          this.organizationListOptions = this.organizationsOffice.map(org => ({ label: org.name, value: org.id.toString() }));
        }
      }
    }
  }

  loadCards() {
    this.isLoading = false;
    this.cardOrganization = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'organization',
      collapseble: true,
      initialStateCollapse: false
    };
    this.cardRoles = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'roles',
      collapseble: true,
      initialStateCollapse: false
    };
    this.loadStakeholderRolesCardsItems();
  }

  async handleSelectOrganization() {
    if (this.organizationSelected) {
      const organization = this.organizationsOffice.find(org => org.id.toString() === this.organizationSelected);
      this.organization = organization;
      this.stakeholderRoles = null;
      this.loadStakeholderRolesCardsItems();
      this.saveButton?.hideButton();
      this.cancelButton.showButton();
    }
  }

  loadStakeholderRolesCardsItems() {
    if (this.stakeholderRoles) {
      this.stakeholderRolesCardItems = this.stakeholderRoles && this.stakeholderRoles.map(role => ({
        type: 'role-card',
        readOnly: !this.editPermission,
        role,
        personRoleOptions: this.rolesOptions
      }));
      if (this.editPermission) {
        this.stakeholderRolesCardItems.push({
          type: 'new-role-card'
        });
      }
    }
    if (!this.stakeholderRoles) {
      if (this.editPermission) {
        this.stakeholderRolesCardItems = [{
          type: 'new-role-card'
        }];
      }
    }
    this.backupStakeholderRolesCardItems = this.stakeholderRolesCardItems.map( card => ({...card, role: {...card.role}}));
  }

  createNewCardItemRole() {
    if (!this.organization) {
      setTimeout(() => {
        this.messageSrv.add({ severity: 'error', summary: 'Erro', detail: this.translateSrv.instant('messages.personNotFound') });
      }, 500);
      return;
    }
    if (this.stakeholderRoles) {
      this.stakeholderRoles.push({
        role: '',
        active: true,
        from: new Date(),
        to: null
      });
    }
    if (!this.stakeholderRoles) {
      this.stakeholderRoles = [{
        role: '',
        active: true,
        from: new Date(),
        to: null
      }];
    }
    this.cancelButton.showButton();
    this.loadStakeholderRolesCardsItems();
  }

  handleShowSaveButton() {
    this.cancelButton.showButton();
    if (this.organization) {
      return this.validateStakeholder()
        ? this.saveButton?.showButton()
        : this.saveButton?.hideButton();
    }
    return;
  }

  validateStakeholder() {
    if (!this.stakeholderRoles) {
      return false;
    }
    const roleNotOk = this.stakeholderRoles.filter(r => {
      if (!r.role) {
        return r;
      }
      if (r.to !== null) {
        if (r.from > r.to || r.to < r.from) {
          return r;
        }
      }
    });
    if (roleNotOk && roleNotOk.length > 0) {
      return false;
    }
    return true;
  }

  async saveStakeholder() {
    this.cancelButton.hideButton();
    this.formIsSaving = true;
    const stakeholderModel = {
      idWorkpack: this.idWorkpack,
      idOrganization: this.organization.id,
      roles: this.stakeholderRoles.map(r => ({
        ...r,
        to: r.to !== null ? formatDateToString(r.to as Date, true) : null,
        from: formatDateToString(r.from as Date, true)
      })),
    };
    if (this.idOrganization) {
      const result = await this.stakeholderSrv.putStakeholderOrganization(stakeholderModel);
      this.formIsSaving = false;
      if (result.success) {
        this.messageSrv.add({
          severity: 'success',
          summary: this.translateSrv.instant('success'),
          detail: this.translateSrv.instant('messages.savedSuccessfully')
        });
        this.router.navigate(
          ['/workpack'],
          {
            queryParams: {
              id: this.idWorkpack,
              idPlan: this.idPlan,
              idWorkpackModelLinked: this.idWorkpackModelLinked
            }
          }
        );
      }
    }
    if (!this.idOrganization) {
      const result = await this.stakeholderSrv.postStakeholderOrganization(stakeholderModel);
      this.formIsSaving = false;
      if (result.success) {
        this.messageSrv.add({
          severity: 'success',
          summary: this.translateSrv.instant('success'),
          detail: this.translateSrv.instant('messages.savedSuccessfully')
        });
        this.router.navigate(
          ['/workpack'],
          {
            queryParams: {
              id: this.idWorkpack,
              idPlan: this.idPlan,
              idWorkpackModelLinked: this.idWorkpackModelLinked
            }
          }
        );
      }
    }
  }

  handleOnCancel() {
    this.saveButton.hideButton();
    if (!this.idOrganization) {
      this.organizationSelected = undefined;
      this.organization = undefined;
      this.stakeholderRoles = null;
    }
    this.stakeholderRolesCardItems = this.backupStakeholderRolesCardItems.filter( card => card.role.id || card.type === 'new-role-card')
      .map(  card => ({...card, role: {...card.role}}));
  }

}
