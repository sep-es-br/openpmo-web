import { Injectable, Injector } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from "@angular/router";
import { WorkpackService } from "../services/workpack.service";
import { WorkpackPropertyService } from "../services/workpack-property.service";
import { DashboardService } from "../services/dashboard.service";
import { CostAccountService } from "../services/cost-account.service";
import { StakeholderService } from "../services/stakeholder.service";
import { RiskService } from "../services/risk.service";
import { IssueService } from "../services/issue.service";
import { BaselineService } from "../services/baseline.service";
import { ProcessService } from "../services/process.service";
import { IndicatorService } from "../services/indicator.service";
import { JournalService } from "../services/journal.service";
import { ScheduleService } from "../services/schedule.service";
import { AuthService } from "../services/auth.service";
import { PlanService } from "../services/plan.service";
import { WorkpackModelService } from "../services/workpack-model.service";
import { OfficeService } from "../services/office.service";
import { PersonService } from "../services/person.service";

@Injectable({providedIn: 'root'})
export class dashboardResolver implements Resolve<any> {

    private workpackSrv: WorkpackService;
    private propertySrv: WorkpackPropertyService;
    private dashboardSrv: DashboardService;
    private costAccountSrv: CostAccountService;
    private stakeholderSrv: StakeholderService;
    private riskSrv: RiskService;
    private issueSrv: IssueService;
    private baselineSrv: BaselineService;
    private processSrv: ProcessService;
    private indicatorSrv: IndicatorService;
    private journalSrv: JournalService;
    private scheduleSrv: ScheduleService;
    private authSrv;
    private planSrv;
    private router;
    private officeSrv;
    private workpackModelSrv;
    private personSrv;
    

    idWorkpack;
    idPlan;
    idWorkpackModel;
    idWorkpackParent;
    idWorkpackModelLinked;
    linkEvent;
    isUserAdmin;
    workpack;
    idOffice;
    workpackModel;
    propertiesPlan;
    propertiesOffice;

    constructor(
        private injector : Injector
    ){
        this.workpackSrv = this.injector.get(WorkpackService);
        this.propertySrv = this.injector.get(WorkpackPropertyService);
        this.dashboardSrv = this.injector.get(DashboardService);
        this.costAccountSrv = this.injector.get(CostAccountService);
        this.stakeholderSrv = this.injector.get(StakeholderService);
        this.riskSrv = this.injector.get(RiskService);
        this.issueSrv = this.injector.get(IssueService);
        this.baselineSrv = this.injector.get(BaselineService);
        this.processSrv = this.injector.get(ProcessService);
        this.indicatorSrv = this.injector.get(IndicatorService);
        this.journalSrv = this.injector.get(JournalService);
        this.scheduleSrv = this.injector.get(ScheduleService);
        this.authSrv = this.injector.get(AuthService);
        this.planSrv = this.injector.get(PlanService);
        this.router = this.injector.get(Router);
        this.workpackModelSrv = this.injector.get(WorkpackModelService);
        this.officeSrv = this.injector.get(OfficeService);
        this.personSrv = this.injector.get(PersonService);
    }

    async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        
        const {
            id,
            idPlan,
            idWorkpackModel,
            idWorkpackParent,
            idWorkpackModelLinked,
            linkEvent
        } = route.queryParams;

        this.idWorkpack = id && +id;
        this.idPlan = idPlan && +idPlan;
        this.idWorkpackModel = idWorkpackModel && +idWorkpackModel;
        this.idWorkpackParent = idWorkpackParent && +idWorkpackParent;
        this.idWorkpackModelLinked = idWorkpackModelLinked && +idWorkpackModelLinked;
        this.linkEvent = linkEvent;
        this.workpackSrv.setWorkpackParams({
            idWorkpack: id && +id,
            idPlan: idPlan && +idPlan,
            idWorkpackModel: idWorkpackModel && +idWorkpackModel,
            idWorkpackParent: idWorkpackParent && +idWorkpackParent,
            idWorkpackModelLinked: idWorkpackModelLinked && +idWorkpackModelLinked,
        });
        await this.loadWorkpackData();

    }

    async loadWorkpackData() {
        this.isUserAdmin = await this.authSrv.isUserAdmin();
        if (this.isUserAdmin || !this.idWorkpack) {
            this.workpackSrv.setEditPermission(true);
        }
        const params = this.workpackSrv.getWorkpackParams();
        const planProperties = await this.planSrv.getCurrentPlan(this.idPlan);
        this.idOffice = planProperties.idOffice;
        this.workpackSrv.setWorkpackParams({
            ...params,
            idPlan: this.idPlan,
            idOffice: planProperties.idOffice
        });
        if (this.idWorkpack) {
        if (!this.idWorkpackModelLinked) {
            await this.loadWorkpack();
        } else {
            await this.loadWorkpackLinked();
        }
        } else {
            await this.loadWorkpackModel(this.idWorkpackModel);
        }
        this.propertySrv.loadProperties();
        const linked = this.idWorkpackModelLinked ? true : false;
        await this.dashboardSrv.calculateReferenceMonth();
        this.dashboardSrv.loadDashboard(linked);
        this.costAccountSrv.loadCostAccounts();
        this.stakeholderSrv.loadStakeholders();
        this.riskSrv.loadRisks();
        this.issueSrv.loadIssues();
        this.baselineSrv.loadBaselines();
        this.processSrv.loadProcesses();
        this.indicatorSrv.loadIndicators();
        this.journalSrv.loadJournal();
        // this.journalSrv.loadScope();
        this.scheduleSrv.loadSchedule();
        this.workpackSrv.nextResetWorkpack(true);
    }

    async loadWorkpackLinked(reloadOnlyProperties = false) {
    this.workpackSrv.nextLoadingWorkpack(true);
    const result = await this.workpackSrv.GetWorkpackLinked(this.idWorkpack,
      { 'id-workpack-model': this.idWorkpackModelLinked, 'id-plan': this.idPlan});
    if (result.success && result.data) {
      this.workpack = result.data;
      const workpackParams = this.workpackSrv.getWorkpackParams();
      workpackParams.idOfficeOwnerWorkpackLinked = this.workpack.planOrigin.idOffice;
      this.workpackSrv.setWorkpackParams({ ...workpackParams });
      if (!this.isUserAdmin && this.workpack) {
        const editPermission = !!this.workpack.permissions?.find(p => p.level === 'EDIT');
        this.workpackSrv.setEditPermission(editPermission);
        const permission = this.workpack.permissions.find(p => p.level);
        this.workpackSrv.setPermissionLevel(permission?.level);
      }
      if (reloadOnlyProperties) {
        const workpackData = this.workpackSrv.getWorkpackData();
        this.workpackSrv.setWorkpackData({
          ...workpackData,
          workpack: this.workpack
        });
        this.workpackSrv.nextReloadProperties(true);
      }
      if (!reloadOnlyProperties) {
        this.workpackSrv.setWorkpackData({ workpack: this.workpack });
        await this.loadWorkpackModel(this.workpack.modelLinked.id);
      } else {
        this.workpackSrv.nextLoadingWorkpack(false);
      }
    } else {
      this.router.navigate(['/plan'], {
        queryParams: {
          id: this.idPlan
        }
      });
      return;
    }
  }
    
  async loadWorkpack(reloadOnlyProperties = false) {
    this.workpackSrv.nextLoadingWorkpack(true);
    const result = await this.workpackSrv.GetWorkpackDataById(this.idWorkpack, { 'id-plan': this.idPlan});
    if (result.success && result.data) {
      this.workpack = result.data;
      if (this.workpack && this.workpack.canceled) {
        this.workpackSrv.setEditPermission(false);
      }

      if (reloadOnlyProperties) {
        const workpackData = this.workpackSrv.getWorkpackData();
        this.workpackSrv.setWorkpackData({
          ...workpackData,
          workpack: this.workpack
        });
        this.propertySrv.loadProperties();
      }
      if (!reloadOnlyProperties) {
        this.workpackSrv.setWorkpackData({ workpack: this.workpack });
        await this.loadWorkpackModel(this.workpack.idWorkpackModel);
      } else {
        this.workpackSrv.nextLoadingWorkpack(false);
      }
    } else {
      this.workpackSrv.nextLoadingWorkpack(false);
      this.router.navigate(['/plan'], {
        queryParams: {
          id: this.idPlan,
          idOffice: this.idOffice
        }
      });
      return;
    }
  }
  
  async loadWorkpackModel(idWorkpackModel) {
    this.workpackSrv.nextLoadingWorkpack(true);
    const result = await this.workpackModelSrv.GetById(idWorkpackModel);
    if (result.success) {
      this.workpackModel = result.data;
      const workpackData = this.workpackSrv.getWorkpackData();
      this.workpackSrv.setWorkpackData({
        ...workpackData,
        workpackModel: this.workpackModel
      });
    }
    const workpackParams = this.workpackSrv.getWorkpackParams();
    setTimeout(() => { this.workpackSrv.nextLoadingWorkpack(false); }, 300);
    this.propertiesPlan = await this.planSrv.getCurrentPlan(workpackParams.idPlan);
    if (this.propertiesPlan.id) {this.planSrv.nextIDPlan(this.propertiesPlan.id);}
    if (this.propertiesPlan) {
      this.propertiesOffice = await this.officeSrv.getCurrentOffice(this.propertiesPlan.idOffice);
      this.idOffice = this.propertiesOffice.id;
      this.workpackSrv.setWorkpackParams({
        ...workpackParams,
        propertiesPlan: this.propertiesPlan,
        idOffice: this.propertiesPlan.idOffice,
        propertiesOffice: this.propertiesOffice
      });
      this.officeSrv.nextIDOffice(this.propertiesPlan.idOffice);
      this.setWorkWorkpack();
    }
  }
  
  setWorkWorkpack() {
    this.personSrv.setPersonWorkLocal({
      idOffice: this.idOffice,
      idPlan: this.idPlan,
      idWorkpack: this.idWorkpack ? this.idWorkpack : null,
      idWorkpackModelLinked: this.idWorkpackModelLinked ? this.idWorkpackModelLinked : null
    });
  }


}