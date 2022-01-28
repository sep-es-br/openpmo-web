import {AuthService} from '../../../shared/services/auth.service';
import {WorkpackService} from '../../../shared/services/workpack.service';
import {debounceTime, filter, takeUntil} from 'rxjs/operators';
import {ProcessService} from '../../../shared/services/process.service';
import {MessageService} from 'primeng/api';
import {BreadcrumbService} from 'src/app/shared/services/breadcrumb.service';
import {TranslateService} from '@ngx-translate/core';
import {ResponsiveService} from 'src/app/shared/services/responsive.service';
import {ActivatedRoute} from '@angular/router';
import {IProcess} from '../../../shared/interfaces/IProcess';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ICard} from 'src/app/shared/interfaces/ICard';
import {Subject} from 'rxjs';
import {SaveButtonComponent} from 'src/app/shared/components/save-button/save-button.component';
import {Component, EventEmitter, OnInit, ViewChild} from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-process',
  templateUrl: './process.component.html',
  styleUrls: ['./process.component.scss']
})
export class ProcessComponent implements OnInit {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;

  responsive: boolean;
  idProcess: number;
  idWorkpack: number;
  editPermission: boolean;
  $destroy = new Subject();
  cardProcessProperties: ICard;
  cardProcessHistory: ICard;
  formProcess: FormGroup;
  process: IProcess;
  debounceSearch = new Subject<string>();
  showProcessHistory = false;
  currentLang = '';
  isLoading = false;
  idPlan: number;

  constructor(
    private actRouter: ActivatedRoute,
    private formBuilder: FormBuilder,
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private breadcrumbSrv: BreadcrumbService,
    private messageSrv: MessageService,
    private processSrv: ProcessService,
    private authSrv: AuthService,
    private workpackSrv: WorkpackService
  ) {
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idProcess = queryParams.id && +queryParams.id;
      this.idWorkpack = queryParams.idWorkpack && +queryParams.idWorkpack;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.formProcess = this.formBuilder.group({
      name: ['', Validators.required],
      processNumber: ['', Validators.required],
      subject: ['', Validators.required],
      currentOrganization: ['', Validators.required],
      lengthOfStayOn: ['', Validators.required],
      note: ['', Validators.required],
      priority: false,
      status: ''
    });
    this.formProcess.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton.hideButton());
    this.formProcess.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formProcess.dirty && this.formProcess.valid))
      .subscribe(() => this.saveButton.showButton());
    this.debounceSearch.pipe(debounceTime(300), takeUntil(this.$destroy)).subscribe(() => this.searchProcessByNumber());
    this.currentLang = this.translateSrv.currentLang;
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.currentLang = this.translateSrv.getDefaultLang();
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
        setTimeout(() => this.setLanguage(), 200);
      }
    );
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    await this.loadPropertiesProcess();
    await this.setBreadcrumb();
    if (!this.editPermission) {
      this.formProcess.disable;
    } else {
      this.formProcess.enable;
    }
  }

  setLanguage() {
    this.currentLang = this.translateSrv.currentLang;
  }

  async searchProcessByNumber() {
    this.isLoading = true;
    const result = await this.processSrv.GetProcessByNumber({'process-number': this.formProcess.controls.processNumber.value});
    this.isLoading = false;
    if (result.success && result.data) {
      this.process = result.data;
      this.setFormProcess();
    } else {
      this.messageSrv.add({
        severity: 'warn',
        summary: this.translateSrv.instant('attention'),
        detail: this.translateSrv.instant('messages.processNotFound')
      });
    }
  }

  setFormProcess() {
    this.formProcess.controls.name.setValue(this.process.name);
    this.formProcess.controls.processNumber.setValue(this.process.processNumber);
    this.formProcess.controls.subject.setValue(this.process.subject);
    this.formProcess.controls.currentOrganization.setValue(this.process.currentOrganization);
    this.formProcess.controls.lengthOfStayOn.setValue(this.process.lengthOfStayOn);
    this.formProcess.controls.note.setValue(this.process.note);
    this.formProcess.controls.priority.setValue(this.process.priority);
    this.formProcess.controls.subject.disable();
    this.formProcess.controls.currentOrganization.disable();
    this.formProcess.controls.lengthOfStayOn.disable();
    this.formProcess.controls.priority.disable();
    this.formProcess.controls.status.setValue(this.process.status);
    this.formProcess.controls.status.disable();
    if (this.idProcess) {
      this.formProcess.controls.processNumber.disable();
    }
    if (this.process.history && this.process.history.length > 0) {
      this.loadCardProcessHistory();
    }
  }

  async loadPropertiesProcess() {
    this.cardProcessProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: false,
    };

    const result = this.idProcess && await this.processSrv.GetById(this.idProcess);
    if (result && result.success) {
      this.process = result.data;
      await this.loadPermissions();
      this.setFormProcess();
    }
  }

  async loadPermissions() {
    const isUserAdmin = await this.authSrv.isUserAdmin();
    if (isUserAdmin) {
      this.editPermission = true;
    } else {
      const idWorkpack = this.idProcess ? this.process.idWorkpack : this.idWorkpack;
      this.idPlan = Number(localStorage.getItem('@currentPlan'));
      const result = await this.workpackSrv.GetWorkpackById(idWorkpack, {'id-plan': this.idPlan});
      if (result.success) {
        const workpack = result.data;
        this.editPermission = workpack.permissions && workpack.permissions.filter(p => p.level === 'EDIT').length > 0;
      }
    }

  }

  async setBreadcrumb() {
    this.breadcrumbSrv.setMenu([
      ...await this.getBreadcrumbs(this.idWorkpack),
      {
        key: 'process',
        routerLink: ['/workpack/process'],
        queryParams: {idWorkpack: this.idWorkpack, id: this.idProcess},
        info: this.process?.name,
        tooltip: this.process?.name
      }
    ]);
  }

  async getBreadcrumbs(idWorkpack: number) {
    this.idPlan = Number(localStorage.getItem('@currentPlan'));
    const {success, data} = await this.breadcrumbSrv.getBreadcrumbWorkpack(idWorkpack, {'id-plan': this.idPlan});
    return success
      ? data.map(p => ({
        key: !p.modelName ? p.type.toLowerCase() : p.modelName,
        info: p.name,
        tooltip: p.fullName,
        routerLink: this.getRouterLinkFromType(p.type),
        queryParams: {id: p.id, idWorkpackModelLinked: p.idWorkpackModelLinked},
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

  loadCardProcessHistory() {
    this.cardProcessHistory = {
      toggleable: true,
      toggleLabel: 'show',
      initialStateToggle: false,
      cardTitle: 'processHistory',
      collapseble: false,
      initialStateCollapse: false,
      onToggle: new EventEmitter<boolean>()
    };
    this.cardProcessHistory.onToggle.pipe(takeUntil(this.$destroy)).subscribe(e => {
      this.showProcessHistory = e;
    });
    this.process.history.forEach((p, i) => {
      p.date = moment(p.updateDate, 'DD/MM/yyyy').toDate();
      if (i === 0) {
        p.left = true;
      } else {
        if (p.organizationName === this.process.history[i - 1].organizationName) {
          p.left = this.process.history[i - 1].left;
          p.right = this.process.history[i - 1].right;
        } else {
          p.left = !this.process.history[i - 1].left;
          p.right = !this.process.history[i - 1].right;
        }
      }
    });
  }

  async saveProcess() {
    const sender: IProcess = {
      id: this.idProcess,
      idWorkpack: this.idWorkpack,
      name: this.formProcess.controls.name.value,
      processNumber: this.formProcess.controls.processNumber.value,
      subject: this.formProcess.controls.subject.value,
      currentOrganization: this.formProcess.controls.currentOrganization.value,
      lengthOfStayOn: this.formProcess.controls.lengthOfStayOn.value,
      note: this.formProcess.controls.note.value,
      priority: this.formProcess.controls.priority.value,
      status: this.formProcess.controls.status.value
    };
    const result = this.idProcess ? await this.processSrv.put(sender) : await this.processSrv.post(sender);
    if (result.success) {
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.idProcess = result.data.id;
      this.process = {...result.data};
    }
  }

}
