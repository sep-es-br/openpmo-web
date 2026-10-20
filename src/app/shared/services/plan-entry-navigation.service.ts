import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { IPerson } from '../interfaces/IPerson';
import { AuthService } from './auth.service';
import { OfficeService } from './office.service';
import { PlanService } from './plan.service';
import { TransversalService } from './transversal.service';

@Injectable({ providedIn: 'root' })
export class PlanEntryNavigationService {
  constructor(
    private authSrv: AuthService,
    private officeSrv: OfficeService,
    private planSrv: PlanService,
    private transversalSrv: TransversalService,
    private router: Router
  ) { }

  async navigateToPlanEntry(idPlan: number, workLocal?: IPerson['workLocal']): Promise<boolean> {
    try {
      const isAdmin = await this.authSrv.isUserAdmin();
      if (isAdmin || await this.planSrv.hasDirectAccess(idPlan)) {
        const plan = await this.planSrv.GetById(idPlan);
        if (!plan?.success || !plan.data) {
          return false;
        }
        this.officeSrv.nextIDOffice(plan.data.idOffice);
        this.planSrv.nextIDPlan(idPlan);
        await this.router.navigate(['/plan'], { queryParams: { id: idPlan } });
        return true;
      }
    } catch (error) {
      // Resolve the first accessible workpack view when plan access is absent.
    }

    if (await this.navigateFirstAccessibleStructural(idPlan, workLocal)) {
      return true;
    }
    return this.navigateFirstAccessibleTransversal(idPlan);
  }

  private async navigateFirstAccessibleStructural(
    idPlan: number,
    workLocal?: IPerson['workLocal']
  ): Promise<boolean> {
    try {
      const result = await this.transversalSrv.getDirectStructuralAccessContexts();
      const contexts = result?.success ? result.data || [] : [];
      const context = contexts.find(item => Number(item.idPlan) === Number(idPlan));
      if (!context) {
        return false;
      }
      const savedWorkpackIsAccessible = contexts.some(item =>
        Number(item.idPlan) === Number(context.idPlan) && Number(item.idWorkpack) === Number(workLocal?.idWorkpack)
      );
      const idWorkpack = savedWorkpackIsAccessible ? Number(workLocal.idWorkpack) : context.idWorkpack;
      this.officeSrv.nextIDOffice(context.idOffice);
      this.planSrv.setCurrentIDPlan(context.idPlan);
      await this.router.navigate(['/workpack'], {
        queryParams: {
          id: idWorkpack,
          idPlan: context.idPlan,
          idOffice: context.idOffice,
          classification: 'STRUCTURAL'
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  private async navigateFirstAccessibleTransversal(idPlan: number): Promise<boolean> {
    try {
      const result = await this.transversalSrv.getAccessibleContexts();
      const contexts = result?.success ? result.data || [] : [];
      const context = contexts.find(item => Number(item.idPlan) === Number(idPlan));
      if (!context) {
        return false;
      }
      this.officeSrv.nextIDOffice(context.idOffice);
      this.planSrv.setCurrentIDPlan(context.idPlan);
      await this.router.navigate(['/workpack'], {
        queryParams: {
          id: context.idTransversalProgram,
          idPlan: context.idPlan,
          idOffice: context.idOffice,
          classification: 'TRANSVERSAL',
          idTransversalRoot: context.idTransversalProgram,
          idTransversalView: context.idTransversalView
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
