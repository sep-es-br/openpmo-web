import {AuthService} from '../../../shared/services/auth.service';
import {BaselineService} from '../../../shared/services/baseline.service';
import {IBaseline, IBaselineUpdates} from '../../../shared/interfaces/IBaseline';
import {takeUntil} from 'rxjs/operators';
import {BreadcrumbService} from 'src/app/shared/services/breadcrumb.service';
import {ResponsiveService} from 'src/app/shared/services/responsive.service';
import {WorkpackService} from 'src/app/shared/services/workpack.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Subject} from 'rxjs';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ICard} from 'src/app/shared/interfaces/ICard';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {MessageService} from "primeng/api";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-baseline',
  templateUrl: './baseline.component.html',
  styleUrls: ['./baseline.component.scss']
})
export class BaselineComponent implements OnInit, OnDestroy {

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
  isLoading = false;
  formIsSaving = false;

  constructor(
    private actRouter: ActivatedRoute,
    private baselineSrv: BaselineService,
    private workpackSrv: WorkpackService,
    private formBuilder: FormBuilder,
    private responsiveSrv: ResponsiveService,
    private breadcrumbSrv: BreadcrumbService,
    private router: Router,
    private authSrv: AuthService,
    private messageSrv: MessageService,
    private translateSrv: TranslateService
  ) {
    this.actRouter.queryParams
      .subscribe(({id, idWorkpack, idWorkpackModelLinked}) => {
        this.idWorkpack = idWorkpack && +idWorkpack;
        this.idWorkpackModelLinked = idWorkpackModelLinked && +idWorkpackModelLinked;
        this.idBaseline = id && +id;
      });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.formBaseline = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      proposer: null,
      description: ['', [Validators.required]],
      message: ['', [Validators.required]],
    });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    await this.loadPropertiesBaseline();
    await this.setBreadcrumb();
  }

  async setBreadcrumb() {
    let breadcrumbItems = this.breadcrumbSrv.get;
    if (!breadcrumbItems || breadcrumbItems.length === 0) {
      breadcrumbItems = await this.breadcrumbSrv.loadWorkpackBreadcrumbs(this.idWorkpack, this.idPlan)
    }
    this.breadcrumbSrv.setMenu([
      ...breadcrumbItems,
      {
        key: 'baseline',
        info: this.baseline?.name,
        tooltip: this.baseline?.name
      }
    ]);
  }

  async getBreadcrumbs(idWorkpack: number) {
    const {success, data} = await this.breadcrumbSrv.getBreadcrumbWorkpack(idWorkpack, {'id-plan': this.idPlan});
    return success
      ? data.map(p => ({
        key: !p.modelName ? p.type.toLowerCase() : p.modelName,
        info: p.name,
        tooltip: p.fullName,
        routerLink: this.getRouterLinkFromType(p.type),
        queryParams: {id: p.id, idWorkpackModelLinked: p.idWorkpackModelLinked, idPlan: this.idPlan},
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
      initialStateCollapse: false,
      isLoading: this.idBaseline ? true : false
    };
    this.cardBaselineUpdates = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: this.translateSrv.instant('updates'),
      collapseble: true,
      initialStateCollapse: false,
      isLoading: true
    };
    if (this.idBaseline) {
      const result = await this.baselineSrv.GetById(this.idBaseline);
      this.baseline = result.data;
      this.cardBaselineProperties.isLoading = false;
      if (this.baseline) {
        this.idWorkpack = this.baseline.idWorkpack;
        this.formBaseline.controls.name.setValue(this.baseline.name);
        this.formBaseline.controls.proposer.setValue(this.baseline.proposer);
        this.formBaseline.controls.description.setValue(this.baseline.description);
        this.formBaseline.controls.message.setValue(this.baseline.message);
        if (this.baseline.status !== 'DRAFT') {
          this.formBaseline.disable();
          if (this.baseline.updates) {
            this.baseline.updates.forEach(update => update.included = true);
          }
        }
      }
    } else {
      this.baseline = {
        idWorkpack: this.idWorkpack,
        status: 'DRAFT',
        name: '',
        description: '',
      };
    }
    await this.loadPermissions();
    this.cardBaselineUpdates.isLoading = !this.idBaseline || this.baseline.status === 'DRAFT';
    if (!this.idBaseline || this.baseline.status === 'DRAFT') {
      await this.loadUpdates();
    }
  }

  async loadPermissions() {
    const isUserAdmin = await this.authSrv.isUserAdmin();
    this.idPlan = Number(localStorage.getItem('@currentPlan'));
    const result = await this.workpackSrv.GetWorkpackPermissions(this.idWorkpack, {'id-plan': this.idPlan});
      if (result.success) {
        const workpack = result.data;
        if (isUserAdmin) {
          this.editPermission = !workpack.canceled;
        } else {
          this.editPermission = workpack.permissions && workpack.permissions.filter(p => p.level === 'EDIT').length > 0 && !workpack.canceled;
        }
        
      }
    
  }

  handleCollapsed(event?) {
    this.panelCollapsed = event ? event : !this.panelCollapsed;
  }

  async loadUpdates() {
    this.baseline.updates = await this.baselineSrv.getUpdates({'id-workpack': this.idWorkpack});
    this.cardBaselineUpdates.isLoading = false;
    if (this.baseline.updates.length > 0) {
      this.baseline.updates.forEach(updates => updates.included = true);
      this.includeAllUpdates = true;
      this.togglesReadOnly = this.baseline.updates.filter(update => update.classification !== 'NEW').length === 0;
    }
  }

  handleSetAllTogglesUpdates(event) {
    this.baseline.updates.forEach(update => update.included = event.checked);
  }

  async handleSaveDraftBaseline(showMessage = true) {
    if (this.formBaseline.invalid) {
      this.messageSrv.add({
        severity: 'warn',
        summary: this.translateSrv.instant('atention'),
        detail: this.translateSrv.instant('messages.requiredInformationsMustBeFilled')
      });
      return;
    }
    this.baseline = {
      ...this.baseline,
      name: this.formBaseline.controls.name.value,
      description: this.formBaseline.controls.description.value,
      message: this.formBaseline.controls.message.value
    };
    this.formIsSaving = true;
    const result = this.idBaseline
      ? await this.baselineSrv.putBaseline(this.idBaseline, this.baseline)
      : await this.baselineSrv.post(this.baseline);
    this.formIsSaving = false;
    if (result.success) {
      if (!this.idBaseline) {
        this.baseline.id = result.data.id;
        this.idBaseline = result.data.id;
      }
      if (showMessage) {
        this.messageSrv.add({
          severity: 'success',
          summary: this.translateSrv.instant('success'),
          detail: this.translateSrv.instant('messages.savedSuccessfully')
        });
      }
    }
  }

  async handleSubmitBaseline() {
    this.formIsSaving = true;
    const result = await this.baselineSrv.submitBaseline(this.idBaseline, this.baseline.updates);
    this.formIsSaving = false;
    if (result.success) {
      const idPlan = Number(localStorage.getItem('@currentPlan'));
      await this.router.navigate(
        ['/workpack'],
        {
          queryParams: this.idWorkpackModelLinked ? {
            id: this.idWorkpack,
            idPlan,
            idWorkpackModelLinked: this.idWorkpackModelLinked
          } : {
            id: this.idWorkpack,
            idPlan,
          }
        }
      );
    }
  }

  async handleCancelChanges() {
    const idPlan = Number(localStorage.getItem('@currentPlan'));
    await this.router.navigate(
      ['/workpack'],
      {
        queryParams: this.idWorkpackModelLinked ? {
          id: this.idWorkpack,
          idPlan,
          idWorkpackModelLinked: this.idWorkpackModelLinked
        } : {
          id: this.idWorkpack,
          idPlan,
        }
      }
    );
  }

  handleShowDialogComment(comment) {
    this.selectedComment = comment;
    this.showCommentDialog = true;
  }

  async saveDraftAndSubmitBaseline() {
    if (!this.idBaseline) {
      await this.handleSaveDraftBaseline(false);
    }
    if (this.idBaseline) {
      await this.handleSubmitBaseline();
    }
  }

}
