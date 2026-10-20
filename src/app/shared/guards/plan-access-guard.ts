import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PlanService } from '../services/plan.service';

@Injectable({ providedIn: 'root' })
export class PlanAccessGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private planService: PlanService,
    private router: Router
  ) { }

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const idPlan = Number(route.queryParamMap.get('id'));
    if (!Number.isFinite(idPlan) || idPlan <= 0) {
      this.router.navigate(['/home']);
      return false;
    }

    try {
      if (await this.authService.isUserAdmin() || await this.planService.hasDirectAccess(idPlan)) {
        return true;
      }
    } catch (error) {
      // A failed permission check must not expose the plan page.
    }

    this.router.navigate(['/home']);
    return false;
  }
}
