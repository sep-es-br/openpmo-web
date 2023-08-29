import { Location } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem, MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
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

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
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
    let breadcrumbItems = this.breadcrumbSrv.get;
    if (!breadcrumbItems || breadcrumbItems.length === 0) {
      breadcrumbItems = await this.breadcrumbSrv.loadWorkpackBreadcrumbs(this.idWorkpack, this.idPlan)
    }
    this.breadcrumbSrv.setMenu([
      ... breadcrumbItems,
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

  deleteEvidence(evidence: IFile) {
    this.evidences = this.evidences.filter(item => item !== evidence);
    this.setCardItemsEvidences(this.evidences);
    if (this.formJournal.valid) {
      this.saveButton.showButton();
    }
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
      const results = await this.uploadEvidencesAll(data);
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSvr.instant('success'),
        detail: this.translateSvr.instant('messages.savedSuccessfully')
      });
      setTimeout( () => {
        this.location.back();
      }, 1000)
      
    }

  }

  setGivenNameFromCardToEvidence() {
    this.evidences = this.evidences.map((evidence, index) => ({
      ...evidence,
      givenName: this.cardItemsEvidences[index].givenName,
    }));
  }

  async uploadEvidencesAll(data) {
    const results = await Promise.all(this.evidences.map( async (evidence: any) => {
      if (evidence.id) {
        return {
          success: true
        };
      }
      const file = await fetch(evidence.url.changingThisBreaksApplicationSecurity);
      const formData: FormData = new FormData();
      const blob = await file.blob();
      formData.append('file', blob, evidence.name);
      const result =  await this.evidenceSrv.uploadEvidence(formData, data.id);
      if (result.success) {
        evidence.id = result.data.id
      }
      return result;
    }));
    return results;
  }

}
