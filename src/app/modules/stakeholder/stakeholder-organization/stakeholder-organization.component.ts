import { Component, OnInit } from '@angular/core';
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

interface ICardItemRole {
  type: string;
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

  idWorkpack: number;
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
  stakeholderRolesCardItems: ICardItemRole[];
  showSaveButton = false;

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
    private router: Router
  ) {
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idWorkpack = queryParams.idWorkpack;
      this.idOrganization = queryParams.idOrganization;
    });
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });
  }

  async ngOnInit() {
    await this.loadStakeholder();
    this.breadcrumbSrv.pushMenu({
      key: 'stakeholder',
      routerLink: ['/stakeholder/organization'],
      queryParams: { idWorkpack: this.idWorkpack, idOrganization: this.idOrganization },
      info: this.stakeholder?.organization?.name,
      tooltip: this.stakeholder?.organization?.fullName
    });
  }

  async loadStakeholder() {
    if (this.idOrganization) {
      const result = await this.stakeholderSrv.GetStakeholderOrganization({'id-workpack': this.idWorkpack,
      'id-organization': this.idOrganization});
      if (result.success) {
        this.stakeholder = result.data;
        this.stakeholderRoles = this.stakeholder.roles && this.stakeholder.roles.map( role => ({
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
    }
    if (!this.idOrganization) {
      await this.loadWorkpack();
      await this.loadOrganizationsList();
      this.loadCards();
      return;
    }
  }

  async loadWorkpack() {
    const result = await this.workpackSrv.GetById(this.idWorkpack);
    if (result.success) {
      this.workpack = result.data;
      this.rolesOptions = this.workpack?.model?.organizationRoles?.map(role => ({ label: role, value: role }));
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
      const plan = await this.planSrv.GetById(this.workpack.plan.id);
      if (plan.success) {
        const result = await this.organizationSrv.GetAll({ 'id-office': plan.data.idOffice });
        if (result.success) {
          this.organizationsOffice = result.data;
          this.organizationListOptions = this.organizationsOffice.map(org => ({ label: org.name, value: org.id.toString() }));
        }
      }
    }
  }

  loadCards() {
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
      this.showSaveButton = false;
    }
  }

  loadStakeholderRolesCardsItems() {
    if (this.stakeholderRoles) {
      this.stakeholderRolesCardItems = this.stakeholderRoles.map(role => ({
        type: 'role-card',
        role,
        personRoleOptions: this.rolesOptions
      }));
      this.stakeholderRolesCardItems.push({
        type: 'new-role-card'
      });
    }
    if (!this.stakeholderRoles) {
      this.stakeholderRolesCardItems = [{
        type: 'new-role-card'
      }];
    }
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
    this.loadStakeholderRolesCardsItems();
  }

  handleShowSaveButton() {
    if (this.organization) {
      if (this.validateStakeholder()){
        this.showSaveButton = true;
        return;
      }
      this.showSaveButton = false;
      return;
    }
    return;
  }

  validateStakeholder() {
    if(!this.stakeholderRoles) {
      return false;
    }
    const roleNotOk = this.stakeholderRoles.filter( r => {
      if( !r.role) {
        return r;
      }
      if (r.to !== null) {
        if (r.from > r.to || r.to < r.from) {
          return r;
        }
      }
    });
    if(roleNotOk && roleNotOk.length > 0) {
      return false;
    }
    return true;
  }

  async saveStakeholder() {
    const stakeholderModel = {
      idWorkpack: this.idWorkpack,
      idOrganization: this.organization.id,
      roles: this.stakeholderRoles.map( r => ({
        ...r,
        to: r.to !== null ? formatDateToString(r.to as Date, true) : null,
        from: formatDateToString(r.from as Date, true)
      })),
    };
    if (this.idOrganization) {
      const result = await this.stakeholderSrv.putStakeholderOrganization(stakeholderModel);
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
              id: this.idWorkpack
            }
          }
        );
      }
    }
    if (!this.idOrganization) {
      const result = await this.stakeholderSrv.postStakeholderOrganization(stakeholderModel);
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
              id: this.idWorkpack
            }
          }
        );
      }
    }
  }
}
