import { AuthService } from './../../../shared/services/auth.service';
import { AuthServerService } from './../../../shared/services/auth-server.service';
import { BaselineService } from './../../../shared/services/baseline.service';
import { IBaseline, IBaselineUpdates } from './../../../shared/interfaces/IBaseline';
import { takeUntil, filter } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { TranslateService } from '@ngx-translate/core';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-baseline',
  templateUrl: './baseline.component.html',
  styleUrls: ['./baseline.component.scss']
})
export class BaselineComponent implements OnInit {

  idBaseline: number;
  idWorkpack: number;
  idWorkpackModelLinked: number;
  responsive: boolean;
  cardBaselineProperties: ICard;
  cardBaselineUpdates: ICard;
  cardBaselineEvaluations: ICard;
  formBaseline: FormGroup;
  baseline: IBaseline;
  $destroy = new Subject();
  editPermission = false;
  updates: IBaselineUpdates[];
  includeAllUpdates = true;
  togglesReadOnly = true;
  panelCollapsed = false;
  idPlan: number;
  showCommentDialog = false;
  selectedComment = '';

  constructor(
    private actRouter: ActivatedRoute,
    private baselineSrv: BaselineService,
    private workpackSrv: WorkpackService,
    private formBuilder: FormBuilder,
    private responsiveSrv: ResponsiveService,
    private breadcrumbSrv: BreadcrumbService,
    private router: Router,
    private authSrv: AuthService
  ) {
    this.actRouter.queryParams
      .subscribe(({ id, idWorkpack, idWorkpackModelLinked }) => {
        this.idWorkpack = idWorkpack && +idWorkpack;
        this.idWorkpackModelLinked = idWorkpackModelLinked && +idWorkpackModelLinked;
        this.idBaseline = id && +id;
      });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.formBaseline = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      proposer: null,
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
        routerLink: ['/workpack/baseline'],
        queryParams: { idWorkpack: this.idWorkpack, id: this.idBaseline },
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
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: false
    };
    if (this.idBaseline) {
      const result = await this.baselineSrv.GetById(this.idBaseline);
      this.baseline = result.data;
      if (this.baseline) {
        this.idWorkpack = this.baseline.idWorkpack;
        this.formBaseline.controls.name.setValue(this.baseline.name);
        this.formBaseline.controls.proposer.setValue(this.baseline.proposer);
        this.formBaseline.controls.description.setValue(this.baseline.description);
        this.formBaseline.controls.message.setValue(this.baseline.message);
        if (this.baseline.status !== 'DRAFT') {
          this.formBaseline.disable();
          this.baseline.updates.forEach( update => update.included = true);
        }
        console.log('baseline', this.baseline);
      }
    } else {
      this.baseline = {
        idWorkpack: this.idWorkpack,
        status: 'DRAFT',
        name: '',
        description: '',
      }
    }
    await this.loadPermissions();
    this.cardBaselineUpdates = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'updates',
      collapseble: true,
      initialStateCollapse: false
    };
    if (!this.idBaseline || this.baseline.status === 'DRAFT') {
      await this.loadUpdates();
    }
  }

  async loadPermissions() {
    const isUserAdmin = await this.authSrv.isUserAdmin();
    this.idPlan = Number(localStorage.getItem('@currentPlan'));
    if (isUserAdmin) {
      this.editPermission = true;
    } else {
      const result = await this.workpackSrv.GetWorkpackById(this.idWorkpack, { 'id-plan': this.idPlan });
      if (result.success) {
        const workpack = result.data;
        this.editPermission = workpack.permissions && workpack.permissions.filter(p => p.level === 'EDIT').length > 0;
      }
    }
  }

  handleCollapsed(event?) {
    this.panelCollapsed = event ? event : !this.panelCollapsed;
  }

  async loadUpdates() {
    this.baseline.updates = await this.baselineSrv.getUpdates({ 'id-workpack': this.idWorkpack });
    if (this.baseline.updates.length > 0) {
      this.baseline.updates.forEach(updates => updates.included = true);
      this.includeAllUpdates = true;
      if (this.baseline.updates.filter(update => update.classification !== 'NEW').length === 0) {
        this.togglesReadOnly = true;
      } else {
        this.togglesReadOnly = false;
      }
    }
  }

  handleSetAllTogglesUpdates(event) {
    this.baseline.updates.forEach(update => update.included = event.checked);
  }

  async handleSaveDraftBaseline() {
    this.baseline = {
      ...this.baseline,
      name: this.formBaseline.controls.name.value,
      description: this.formBaseline.controls.description.value,
      message: this.formBaseline.controls.message.value
    };
    const result = this.idBaseline ? await this.baselineSrv.putBaseline(this.idBaseline, this.baseline) : await this.baselineSrv.post(this.baseline);
    if (result.success && this.idBaseline) {
      this.idBaseline = result.data.id;
      this.baseline.id = result.data.id;
    }
  }

  async handleSubmitBaseline() {
    const result = await this.baselineSrv.submitBaseline(this.idBaseline, this.baseline.updates);
    if (result.success) {
      const idPlan = Number(localStorage.getItem('@currentPlan'));
      this.router.navigate(
        ['/workpack'],
        {
          queryParams: {
            id: this.idWorkpack,
            idPlan: idPlan,
            idWorkpackModelLinked: this.idWorkpackModelLinked
          }
        }
      );
    }
  }

  handleCancelChanges() {
    const idPlan = Number(localStorage.getItem('@currentPlan'));
    this.router.navigate(
      ['/workpack'],
      {
        queryParams: {
          id: this.idWorkpack,
          idPlan: idPlan,
          idWorkpackModelLinked: this.idWorkpackModelLinked
        }
      }
    );
  }

  handleShowDialogComment(comment) {
    this.selectedComment = comment;
    this.showCommentDialog = true;
  }


}