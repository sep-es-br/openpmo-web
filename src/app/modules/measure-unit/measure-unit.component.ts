import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem, MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItemMeasureUnit } from 'src/app/shared/interfaces/ICardItemMeasureUnit';
import { IMeasureUnit } from 'src/app/shared/interfaces/IMeasureUnit';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { AuthService } from 'src/app/shared/services/auth.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { MeasureUnitService } from 'src/app/shared/services/measure-unit.service';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';
import { OfficeService } from 'src/app/shared/services/office.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

@Component({
  selector: 'app-measure-unit',
  templateUrl: './measure-unit.component.html',
  styleUrls: ['./measure-unit.component.scss']
})
export class MeasureUnitComponent implements OnInit {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;

  formsMeasureUnits: { id: string; form: FormGroup }[] = [];
  measureUnits: IMeasureUnit[];
  propertiesOffice: IOffice;
  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'measureUnits',
    collapseble: false,
    initialStateCollapse: false
  };
  idOffice: number;
  cardItemsProperties: ICardItemMeasureUnit[] = [];
  $destroy = new Subject();
  isUserAdmin: boolean;
  editPermission: boolean;
  responsive: boolean;

  constructor(
    private formBuilder: FormBuilder,
    private measureUnitSvr: MeasureUnitService,
    private translateSvr: TranslateService,
    private activeRoute: ActivatedRoute,
    private officeSrv: OfficeService,
    private breadcrumbSrv: BreadcrumbService,
    private authSrv: AuthService,
    private officePermissionSrv: OfficePermissionService,
    private responsiveSrv: ResponsiveService,
    private messageSrv: MessageService,
    private translateSrv: TranslateService
  ) {
    this.activeRoute.queryParams.subscribe(params => this.idOffice = +params.idOffice);
    this.responsiveSrv.observable.subscribe(value => this.responsive = value);
  }


  async ngOnInit() {
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    this.editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
    await this.loadMeasureUnitList();
    await this.getOfficeById();
    this.breadcrumbSrv.setMenu([{
      key: 'measureUnits',
      info: this.propertiesOffice?.name,
      tooltip: this.propertiesOffice?.fullName,
      routerLink: ['/measure-units'],
      queryParams: { idOffice: this.idOffice }
    }]);
  }

  async getOfficeById() {
    const { success, data } = await this.officeSrv.GetById(this.idOffice);
    if (success) {
      this.propertiesOffice = data;
    }
  }

  async loadMeasureUnitList() {
    const result = await this.measureUnitSvr.GetAll({ idOffice: this.idOffice });
    if (result.success) {
      this.measureUnits = result.data;
    }
    this.loadCardItemsMeasureUnits();
    this.loadFormsMeasureUnits();
  }

  loadCardItemsMeasureUnits() {
    if (this.measureUnits.length > 0) {
        this.cardItemsProperties = this.measureUnits.map((measureUnit, index) => ({
        typeCardItem: 'listItem',
        icon: IconsEnum.UnitSelection,
        nameCardItem: measureUnit.name,
        index,
        id: measureUnit.id,
        itemId: measureUnit.id ?
          `ID: ${measureUnit.id < 10 ? '0' + measureUnit.id : measureUnit.id}` : '',
        menuItems: [{ label: 'Delete', icon: 'fas fa-trash-alt',
        command: () => this.deleteMeasureUnit(measureUnit),
        disabled: !this.editPermission }] as MenuItem[],
      }));
    } else if (this.cardItemsProperties?.length > 1) {
      this.cardItemsProperties = this.editPermission ? [{
        typeCardItem: 'newCardItem',
        icon: IconsEnum.Plus,
      }] : [];
    } else if (this.editPermission) {
      this.cardItemsProperties = [{ typeCardItem: 'newCardItem', icon: IconsEnum.Plus }];
    }
    if (this.cardItemsProperties[0]?.typeCardItem === 'listItem' && this.editPermission) {
      this.cardItemsProperties.push({ typeCardItem: 'newCardItem', icon: IconsEnum.Plus });
    }
  }

  loadFormsMeasureUnits() {
    if (this.measureUnits) {
      this.formsMeasureUnits = this.measureUnits.map(measureUnit => ({
        id: measureUnit.id?.toString(),
        form: this.formBuilder.group({
          id: measureUnit.id,
          name: [measureUnit.name, [Validators.required, Validators.maxLength(25)]],
          fullName: [measureUnit.fullName, Validators.required]
        })
      }));
      if (!this.editPermission) {
        this.formsMeasureUnits.forEach( item => item.form.disable());
      } else {
        this.formsMeasureUnits.forEach( item => {
          item.form.statusChanges
            .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
            .subscribe(() => this.saveButton?.hideButton());
          item.form.valueChanges
          .pipe(takeUntil(this.$destroy), filter(() => item.form.dirty && item.form.valid))
          .subscribe(() => this.saveButton?.showButton());
        });
      }
    } else {
      this.formsMeasureUnits = [];
    }
  }

  async deleteMeasureUnit(measureUnit: IMeasureUnit) {
    const { success } = await this.measureUnitSvr.delete(measureUnit);
    if (success) {
      this.cardItemsProperties = this.cardItemsProperties.filter(item => item.id !== measureUnit.id);
      this.formsMeasureUnits = this.formsMeasureUnits.filter(item => item.id !== measureUnit.id?.toString());
    }
  };

  async handleOnSubmit() {
    const formItemsChanged = this.formsMeasureUnits.filter( item => item.form.dirty && item.form.valid);
    formItemsChanged.forEach( async({ form, id }) => {
      const { success, data } = form.value.id
        ? await this.measureUnitSvr.put(form.value)
        : await this.measureUnitSvr.post({ ...form.value, idOffice: this.idOffice });
      if (success) {
        form.reset({ ...form.value, id: data.id });
        this.messageSrv.add({
          severity: 'success',
          summary: this.translateSrv.instant('success'),
          detail: this.translateSrv.instant('messages.savedSuccessfully')
        });
        if (id.startsWith('local')) {
          const cardItemIndex = this.cardItemsProperties.findIndex(card => card.newId === id);
          const formItem = this.formsMeasureUnits.find(f => f.id === id);
          formItem.id = data.id.toString();
          const measureUnit = form.value;
          const newCard = ({
            typeCardItem: 'listItem',
            icon: IconsEnum.UnitSelection,
            nameCardItem: measureUnit.name,
            id: measureUnit.id,
            itemId: measureUnit.id ?
              `ID: ${measureUnit.id < 10 ? '0' + measureUnit.id : measureUnit.id}` : '',
            menuItems: [{ label: 'Delete', icon: 'fas fa-trash-alt',
            command: () => this.deleteMeasureUnit(measureUnit),
            disabled: !this.editPermission }] as MenuItem[],
          });
          this.cardItemsProperties = [
            ... this.cardItemsProperties.slice(0, cardItemIndex),
            newCard,
            ... this.cardItemsProperties.slice(cardItemIndex + 1)
          ];
        }
      };
    });
  }

  handleAddCardItem() {
    const lastCardItemRemove = this.cardItemsProperties.pop();
    const nextNewId = this.cardItemsProperties
      .filter(a => a.newId?.startsWith('local-'))
      .map(a => +a.newId.split('-')[1])
      .reduce((a, b) => a < b ? b : a, 0) + 1;
    const newId = `local-${nextNewId}`;
    this.cardItemsProperties.push({
      typeCardItem: 'listItem',
      icon: IconsEnum.UnitSelection,
      newId,
      menuItems: [
        {
          label: this.translateSvr.instant('delete'),
          icon: 'fas fa-trash-alt',
          command: () => this.deleteCardItem(newId),
          disabled: !this.editPermission
        }
      ],
    });
    this.newForm(newId);
    this.cardItemsProperties.push(lastCardItemRemove);
  }

  newForm(newId) {
    const newForm = {
      id: newId,
      form:  this.formBuilder.group({
        id: null,
        name: ['', [Validators.required, Validators.maxLength(25)]],
        fullName: ['', [Validators.required]]
      })
    };
    newForm.form.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton?.hideButton());
    newForm.form.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => newForm.form.dirty && newForm.form.valid))
      .subscribe(() => this.saveButton?.showButton());
    this.formsMeasureUnits.push(newForm);
  }

  deleteCardItem(indexCard: string) {
    const indexOnList = this.cardItemsProperties.findIndex(item => item.newId === indexCard);
    this.cardItemsProperties.splice(indexOnList, 1);
    this.deleteForm(indexOnList);
    if (!this.cardItemsProperties.filter(a => a.newId).length) {
      this.saveButton?.hideButton();
    }
  }

  deleteForm(index: number) {
    this.formsMeasureUnits.splice(index, 1);
  }

  getFormById(id) {
    return this.formsMeasureUnits.find(item => item.id === id.toString())?.form;
  }
}
