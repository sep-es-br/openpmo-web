import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem, MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IFile } from 'src/app/shared/interfaces/IFile';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { EvidenceService } from 'src/app/shared/services/evidence.service';
import { JournalService } from 'src/app/shared/services/journal.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { WorkpackShowTabviewService } from 'src/app/shared/services/workpack-show-tabview.service';

@Component({
  selector: 'app-journal',
  templateUrl: './journal.component.html',
  styleUrls: ['./journal.component.scss']
})
export class JournalComponent implements OnInit {
  cardJournalProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    collapseble: true,
    initialStateCollapse: false,
  };
  cardItemsEvidences: ICardItem[] = [];
  responsive: boolean;
  $destroy = new Subject();
  formJournal: FormGroup;
  evidences: IFile[] = [];
  idWorkpack: number;
  idPlan: number;
  showTabview = false;

  constructor(
    private responsiveSrv: ResponsiveService,
    private formBuilder: FormBuilder,
    private translateSvr: TranslateService,
    private journalSrv: JournalService,
    private location: Location,
    private messageSrv: MessageService,
    private activeRoute: ActivatedRoute,
    private evidenceSrv: EvidenceService,
    private breadcrumbSrv: BreadcrumbService,
    private sanatizer: DomSanitizer,
    private workpackShowTabviewSrv: WorkpackShowTabviewService
  ) {
    this.workpackShowTabviewSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.showTabview = value;
    });
    this.activeRoute.queryParams.subscribe(({ idWorkpack }) => {
      this.idWorkpack = +idWorkpack;
    });

    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);

    this.formJournal = this.formBuilder.group({
      description: ['', Validators.required],
    });
  }

  async ngOnInit(): Promise<void> {
    this.idPlan = Number(localStorage.getItem('@currentPlan'));
    this.setCardItemsEvidences(this.evidences);
    await this.setBreadcrumb();
  }

  setCardItemsEvidences(evidences: IFile[]) {
    this.cardItemsEvidences = evidences.map((evidence) => ({
      typeCardItem: 'listItem',
      urlImg: evidence.url,
      nameCardItem: evidence.name,
      icon: this.getIconFromMimeTypeFile(evidence.mimeType),
      givenName: evidence.givenName,
      menuItems: [
        {
          label: this.translateSvr.instant('delete'),
          icon: 'fas fa-trash-alt',
          command: () => this.deleteEvidence(evidence),
        }
      ] as MenuItem[],
    }));
    this.cardItemsEvidences.push({
      typeCardItem: 'newCardItem',
      iconSvg: true,
      icon: IconsEnum.Plus,
    });
  }

  async setBreadcrumb() {
    this.breadcrumbSrv.setMenu([
      ... await this.getBreadcrumbs(),
      ...[{
        key: this.translateSvr.instant('information'),
        info: this.translateSvr.instant('information'),
        routerLink: ['/workpack/journal'],
        queryParams: {
          idWorkpack: this.idWorkpack,
        },
      }]
    ]);
  }

  getIconFromMimeTypeFile(mimeType: string): string {
    const isImg = mimeType.includes('image');
    if (isImg) {
      return null;
    }
    switch (mimeType) {
      case 'application/pdf':
        return 'far fa-file-pdf';
      case 'application/msword':
        return 'far fa-file-word';
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return 'far fa-file-excel';
      default:
        return 'far fa-file';
    }
  }

  async getBreadcrumbs() {
    const id = this.idWorkpack;
    if (!id) {
      return [];
    }
    const { success, data } = await this.breadcrumbSrv.getBreadcrumbWorkpack(id, { 'id-plan': this.idPlan });
    return success
      ? data.map(p => ({
        key: !p.modelName ? p.type.toLowerCase() : p.modelName,
        info: p.name,
        tooltip: p.fullName,
        routerLink: this.getRouterLinkFromType(p.type),
        queryParams: { id: p.id, idWorkpackModelLinked: p.idWorkpackModelLinked, idPlan: this.idPlan },
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

  deleteEvidence(evidence: IFile) {
    this.evidences = this.evidences.filter(item => item !== evidence);
    this.setCardItemsEvidences(this.evidences);
  }

  handleUploadEvidence(files) {
    files.map(file => {
      const url = file.objectURL || this.createObjectUrl(file);
      this.evidences.push({
        url,
        mimeType: file.type,
        name: file.name,
        givenName: file.name.split('.')[0],
      });
    });
    this.setCardItemsEvidences(this.evidences);
  }

  createObjectUrl(file: File): SafeResourceUrl {
    return this.sanatizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
  }

  async handleOnSubmit() {
    const sender = {
      ...this.formJournal.value,
      workpackId: this.idWorkpack
    };
    const { data, success } = await this.journalSrv.post(sender);
    if (success) {
      this.setGivenNameFromCardToEvidence();
      this.uploadEvidencesAll(data);
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSvr.instant('success'),
        detail: this.translateSvr.instant('messages.savedSuccessfully')
      });
      this.location.back();
    }

  }

  setGivenNameFromCardToEvidence() {
    this.evidences = this.evidences.map((evidence, index) => ({
      ...evidence,
      givenName: this.cardItemsEvidences[index].givenName,
    }));
  }

  uploadEvidencesAll(data) {
    this.evidences.forEach(async(evidence: any) => {
      const file = await fetch(evidence.url.changingThisBreaksApplicationSecurity);
      const formData: FormData = new FormData();
      const blob = await file.blob();
      formData.append('file', blob, evidence.name);
      await this.evidenceSrv.uploadEvidence(formData, data.id);
    });
  }

}
