import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { IBreadcrumb } from 'src/app/shared/interfaces/IBreadcrumb';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit {

  @ViewChild('crumbsEl') crumbsEl: ElementRef;
  crumbs: IBreadcrumb[] = [];
  crumpsHide: IBreadcrumb[] = [];
  isMobileView = false;
  isOverflowing = false;
  addCrumbHidden = true;
  crumbOffice: IBreadcrumb;
  crumbPlan: IBreadcrumb;

  constructor(
    public breadcrumbSrv: BreadcrumbService,
    private responsiveSrv: ResponsiveService,
    private router: Router
  ) {
    this.responsiveSrv.observable.subscribe(isMobileView => this.isMobileView = isMobileView);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.addCrumbHidden = true;
    this.detectOverflow();
  }

  ngOnInit(): void {
    this.breadcrumbSrv.observable.subscribe( async (menu) => {
      await this.resetAll();
      await this.setCrumbs(menu);
      this.detectOverflow();
    });
  }

  async resetAll() {
    this.crumbs = [];
    this.crumbPlan = undefined;
    this.crumbOffice = undefined;
  }

  async setCrumbs(crumbs: IBreadcrumb[]) {
    if(crumbs.length > 0) {
      this.crumbOffice = crumbs.find( crumb => crumb.key === 'office');
      // if(crumbs[0]?.key === 'office') {
      //   this.crumbOffice = crumbs[0];
      //   // crumbs.shift();
      // }
      // if(crumbs[0]?.key === 'plan') {
      //   this.crumbPlan = crumbs[0];
      //   crumbs.shift();
      //   this.showNameOffice = true;
      // }
      this.crumbPlan = crumbs.find( crumb => crumb.key === 'plan');
      // if(crumbs.length > 0 && this.showNameOffice) {
      //   this.showNamePlan = true;
      // }
    }
    this.crumbs = crumbs.filter( crumb => !['office','plan'].includes(crumb.key));
  }

  handleNavigateBredcrumb() {
    if (this.crumbPlan && this.crumbOffice && this.crumbs.length > 0) {
      this.router.navigate([...this.crumbPlan.routerLink], {
        queryParams: this.crumbPlan.queryParams
      });
    } else if((this.crumbPlan && this.crumbOffice && this.crumbs.length === 0) || (!this.crumbPlan && this.crumbOffice && this.crumbs.length === 0)) {
      this.router.navigate([...this.crumbOffice.routerLink], {
        queryParams: this.crumbOffice.queryParams
      });
    } else if (!this.crumbPlan && this.crumbOffice && this.crumbs.length > 0) {
      this.router.navigate([...this.crumbOffice.routerLink], {
        queryParams: this.crumbOffice.queryParams
      });
    }
    else {
      this.router.navigate(['/']);
    }
  }

  detectOverflow() {
    if (this.crumbsEl) {
      setTimeout(() => {
        this.isOverflowing = (this.crumbsEl.nativeElement.offsetHeight < this.crumbsEl.nativeElement.scrollHeight) ||
          (this.crumbsEl.nativeElement.offsetWidth < this.crumbsEl.nativeElement.scrollWidth);
        this.hideCrumbsUntilNotOverflowing();
      },0);
    }
  }

  hideCrumbsUntilNotOverflowing() {
    if (this.isOverflowing) {
      const firstCrumb = 0;
      if(this.crumbs[firstCrumb].key === 'reticencias') {
         const secondElement = 1;
         const hideCrump = this.crumbs.splice(secondElement, 1)[0];
         this.crumpsHide.push(hideCrump);
         this.crumbs[firstCrumb].routerLink = hideCrump.routerLink;
         this.crumbs[firstCrumb].queryParams = hideCrump.queryParams;
      } else {
        const hideCrump = this.crumbs.shift();
        this.crumpsHide.push(hideCrump);
        this.crumbs.unshift({
          key: 'reticencias',
          routerLink: this.crumpsHide[this.crumpsHide.length - 1].routerLink,
          queryParams: this.crumpsHide[this.crumpsHide.length - 1].queryParams,
          modelName: '...',
        });
      }
     this.addCrumbHidden = false;
     return this.detectOverflow();
    }
    if (this.crumpsHide.length > 0 && this.addCrumbHidden) {
        const indexAdd = this.crumpsHide.length > 1 ? 1 : 0;
        const deleteOrAddCrumb = this.crumpsHide.length > 1 ? 0 : 1 ;
        this.crumbs.splice(indexAdd, deleteOrAddCrumb, this.crumpsHide.shift());
        this.detectOverflow();
    }
  }

  navigateTo(crumb: IBreadcrumb, index: number) {
    this.router.navigate(crumb.routerLink, { queryParams: crumb.queryParams });
  }
}
