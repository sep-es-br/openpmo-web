import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
  RouteReuseStrategy
} from '@angular/router';

@Injectable({ providedIn: 'root' })
export class WorkpackIndicatorRouteReuseStrategy implements RouteReuseStrategy {
  private storedRoute: ActivatedRouteSnapshot | null = null;
  private storedHandle: DetachedRouteHandle | null = null;
  private enteringIndicatorForm = false;
  private returningToWorkpack = false;

  prepareIndicatorFormNavigation(): void {
    this.enteringIndicatorForm = true;
  }

  cancelIndicatorFormNavigation(): void {
    this.enteringIndicatorForm = false;
  }

  prepareWorkpackReturn(): void {
    this.returningToWorkpack = true;
  }

  finishWorkpackReturn(navigated: boolean): void {
    this.returningToWorkpack = false;
    if (navigated) {
      this.clearStoredRoute();
    }
  }

  clearAfterIndicatorFormExit(): void {
    if (!this.returningToWorkpack) {
      this.clearStoredRoute();
    }
  }

  shouldSkipWorkpackReload(route: ActivatedRouteSnapshot): boolean {
    return this.returningToWorkpack && this.matchesStoredWorkpack(route);
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    if (!this.isReusableWorkpackRoute(route)) {
      return false;
    }
    const shouldDetach = this.enteringIndicatorForm;
    this.enteringIndicatorForm = false;
    return shouldDetach;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    if (handle && this.isReusableWorkpackRoute(route)) {
      this.storedRoute = route;
      this.storedHandle = handle;
      return;
    }
    this.clearStoredRoute();
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    if (!this.isReusableWorkpackRoute(route) || !this.returningToWorkpack || !this.storedHandle) {
      return false;
    }
    if (this.matchesStoredWorkpack(route)) {
      return true;
    }
    this.finishWorkpackReturn(false);
    this.clearStoredRoute();
    return false;
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    if (!this.shouldAttach(route)) {
      return null;
    }
    const handle = this.storedHandle;
    this.clearStoredRoute();
    this.returningToWorkpack = false;
    return handle;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, current: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === current.routeConfig;
  }

  private matchesStoredWorkpack(route: ActivatedRouteSnapshot): boolean {
    if (!this.storedRoute || !this.storedHandle || !this.isReusableWorkpackRoute(route) ||
      route.routeConfig !== this.storedRoute.routeConfig) {
      return false;
    }
    const identityParams = [
      'id',
      'idPlan',
      'idWorkpackModel',
      'idWorkpackParent',
      'idWorkpackModelLinked',
      'linkEvent'
    ];
    return identityParams.every(key => route.queryParams[key] === this.storedRoute.queryParams[key]);
  }

  private isReusableWorkpackRoute(route: ActivatedRouteSnapshot): boolean {
    return route.routeConfig?.data?.reuseForIndicatorForm === true;
  }

  private clearStoredRoute(): void {
    this.storedRoute = null;
    this.storedHandle = null;
  }
}
