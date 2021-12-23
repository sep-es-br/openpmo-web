import { takeUntil } from 'rxjs/operators';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ResponsiveService } from './../../../shared/services/responsive.service';
import { WorkpackService } from './../../../shared/services/workpack.service';
import { BaselineService } from './../../../shared/services/baseline.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { IBaseline } from './../../../shared/interfaces/IBaseline';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ICard } from './../../../shared/interfaces/ICard';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-baseline-cancelling',
  templateUrl: './baseline-cancelling.component.html',
  styleUrls: ['./baseline-cancelling.component.scss']
})
export class BaselineCancellingComponent implements OnInit {

  idWorkpack: number;
  idWorkpackModelLinked: number;
  responsive: boolean;
  cardBaselineProperties: ICard;
  formBaseline: FormGroup;
  baseline: IBaseline;
  $destroy = new Subject();
  idPlan: number;
  projectName: string;

  constructor(
    private actRouter: ActivatedRoute,
    private baselineSrv: BaselineService,
    private workpackSrv: WorkpackService,
    private formBuilder: FormBuilder,
    private responsiveSrv: ResponsiveService,
    private breadcrumbSrv: BreadcrumbService,
    private router: Router,
  ) {
    this.actRouter.queryParams
      .subscribe(({ idProject, idWorkpackModelLinked, projectName }) => {
        this.idWorkpack = +idProject;
        this.projectName = projectName;
        this.idWorkpackModelLinked = +idWorkpackModelLinked;
      });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.formBaseline = this.formBuilder.group({
      name: null,
      description: null,
      message: null,
    });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    await this.loadPropertiesBaseline()
    await this.setBreadcrumb();
  }

  async setBreadcrumb() {
    this.breadcrumbSrv.setMenu([
      ... await this.getBreadcrumbs(this.idWorkpack),
      {
        key: 'baseline',
        routerLink: ['/workpack/cancelling'],
        queryParams: { idWorkpack: this.idWorkpack, idWorkpackModelLinked: this.idWorkpackModelLinked },
        info: this.baseline?.name,
        tooltip: this.baseline?.name
      }
    ]);
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

  async loadPropertiesBaseline() {
    this.cardBaselineProperties = {
      toggleable: false,
      initialStateToggle: false,
      collapseble: true,
      initialStateCollapse: false
    };
    this.idPlan = Number(localStorage.getItem('@currentPlan'));
    this.baseline = {
      idWorkpack: this.idWorkpack,
      status:  'PROPOSED',
      name: this.projectName,
      description: '',
      cancelation: true
    };
    this.formBaseline.controls.name.setValue(this.baseline.name);
  }

  async handleSubmitBaselineCancelling() {
    this.baseline = {
      ...this.baseline,
      name: this.formBaseline.controls.name.value,
      description: this.formBaseline.controls.description.value,
      message: this.formBaseline.controls.message.value
    };
    const result = await this.baselineSrv.submitBaselineCancelling(this.baseline);
    if (result.success) {
      this.router.navigate(
        ['/workpack'],
        {
          queryParams: {
            id: this.idWorkpack,
            idWorkpackModelLinked: this.idWorkpackModelLinked
          }
        }
      );
    }
  }

  handleCancelChanges() {
    this.router.navigate(
      ['/workpack'],
      {
        queryParams: {
          id: this.idWorkpack,
          idWorkpackModelLinked: this.idWorkpackModelLinked
        }
      }
    );
  }


}
