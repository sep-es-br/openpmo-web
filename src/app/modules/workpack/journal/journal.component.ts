import { Location } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem, MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
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
  @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;

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
  idWorkpack: number;
  idPlan: number;
  showTabview = false;
  formIsSaving = false;

  constructor(
    private responsiveSrv: ResponsiveService,
    private formBuilder: FormBuilder,
    private translateSvr: TranslateService,
    private journalSrv: JournalService,
    private messageSrv: MessageService,
    private activeRoute: ActivatedRoute,
    private evidenceSrv: EvidenceService,
    private breadcrumbSrv: BreadcrumbService,
    private sanatizer: DomSanitizer,
    private route: Router,
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
    this.formJournal.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formJournal.dirty))
      .subscribe(() => this.cancelButton.showButton());
  }

  async ngOnInit(): Promise<void> {
    this.idPlan = Number(localStorage.getItem('@currentPlan'));
    this.setCardItemsEvidences();
    await this.setBreadcrumb();
  }

  setCardItemsEvidences() {
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
      ...breadcrumbItems,
      ...[{
        key: this.translateSvr.instant('information'),
        info: this.translateSvr.instant('information'),
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

  deleteEvidence(urlImg) {
    this.cardItemsEvidences = this.cardItemsEvidences.filter(item => item.urlImg !== urlImg);
    if (this.formJournal.valid) {
      this.saveButton.showButton();
    }
  }

  handleUploadEvidence(files) {
    if (files) this.cardItemsEvidences.pop();
    files.map(file => {
      const url = file.objectURL || this.createObjectUrl(file);
      const newFile = {
        url,
        mimeType: file.type,
        name: file.name,
        givenName: file.name.split('.')[0],
      };
      this.cardItemsEvidences.push({
        typeCardItem: 'listItem',
        urlImg: newFile.url,
        nameCardItem: newFile.name,
        icon: this.getIconFromMimeTypeFile(newFile.mimeType),
        givenName: newFile.givenName,
        menuItems: [
          {
            label: this.translateSvr.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: () => this.deleteEvidence(newFile.url),
          }
        ] as MenuItem[],
      });
    });
    this.cardItemsEvidences.push({
      typeCardItem: 'newCardItem',
      iconSvg: true,
      icon: IconsEnum.Plus,
    });
  }

  createObjectUrl(file: File): SafeResourceUrl {
    return this.sanatizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
  }

  async handleOnSubmit() {
    this.cancelButton.hideButton();
    this.formIsSaving = true;
    const sender = {
      ...this.formJournal.value,
      workpackId: this.idWorkpack
    };
    const { data, success } = await this.journalSrv.post(sender);
    if (success) {
      const results = await this.uploadEvidencesAll(data);
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSvr.instant('success'),
        detail: this.translateSvr.instant('messages.savedSuccessfully')
      });
      setTimeout(() => {
        this.formIsSaving = false;
        this.route.navigate(['workpack'], {
          queryParams: {
            id: this.idWorkpack,
            idPlan: this.idPlan
          }
        })
      }, 1000)

    }

  }

  handleOnCancel() {
    this.saveButton.hideButton();
    this.formJournal.reset();
    this.cardItemsEvidences = this.cardItemsEvidences.filter(card => card.typeCardItem === 'newCardItem');
  }

  async uploadEvidencesAll(data) {
    const results = await Promise.all(this.cardItemsEvidences.filter(card => card.typeCardItem !== 'newCardItem').map(async (evidence: any) => {
      if (evidence.itemId) {
        return {
          success: true
        };
      }
      const file = await fetch(evidence.urlImg.changingThisBreaksApplicationSecurity);
      const formData: FormData = new FormData();
      const blob = await file.blob();
      formData.append('file', blob, evidence.givenName);
      const result = await this.evidenceSrv.uploadEvidence(formData, data.id);
      if (result.success) {
        evidence.itemId = result.data.id
      }
      return result;
    }));
    return results;
  }

}
