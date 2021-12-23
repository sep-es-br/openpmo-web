import { FilterDataviewService } from '../../../shared/services/filter-dataview.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { AuthService } from 'src/app/shared/services/auth.service';
import { OfficeService } from 'src/app/shared/services/office.service';
import { FilterDataviewPropertiesEntity } from 'src/app/shared/constants/filterDataviewPropertiesEntity';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { ICardItemOffice } from 'src/app/shared/interfaces/ICardItemOffice';

@Component({
  selector: 'app-office-list',
  templateUrl: './office-list.component.html',
  styleUrls: ['./office-list.component.scss']
})
export class OfficeListComponent implements OnInit {

  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'offices',
    collapseble: true,
    initialStateCollapse: false
  };
  cardItemsProperties: ICardItemOffice[];
  isUserAdmin: boolean;
  isListEmpty = false;
  collapsePanelsStatus = true;
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;
  filterProperties: PropertyTemplateModel[] = this.filterSrv.get;
  idFilterSelected: number;

  constructor(
    private officeSvr: OfficeService,
    private router: Router,
    private authSrv: AuthService,
    private filterSrv: FilterDataviewService,
  ) { }

  async ngOnInit() {
    await this.loadFiltersOffices();
    await this.loadPropertiesOffice();
  }

  handleChangeCollapseExpandPanel(event) {
    this.collapsePanelsStatus = event.mode === 'collapse' ? true : false;
    this.cardProperties = Object.assign({}, {
      ...this.cardProperties,
      initialStateCollapse: this.collapsePanelsStatus
    });
  }

  handleChangeDisplayMode(event) {
    this.displayModeAll = event.displayMode;
  }

  handleChangePageSize(event) {
    this.pageSize = event.pageSize;
  }

  async loadPropertiesOffice() {
    const { success, data } = await this.officeSvr.GetAll({
      idFilter: this.idFilterSelected
    });
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    const itemsProperties: ICardItemOffice[] = this.isUserAdmin ? [
      {
        typeCardItem: 'newCardItem',
        iconSvg: true,
        icon: IconsEnum.Plus,
        urlCard: '/offices/office',
      }
    ] : [];
    this.cardProperties.showCreateNemElementButton = this.isUserAdmin ? true : false;
    if (success) {
      this.isListEmpty = !data.length;
      if(this.isListEmpty) {
        const personInfo = await this.authSrv.getInfoPerson();
        if(personInfo.isCcbMember) {
          this.router.navigate(['/ccbmember-baselines-view']);
        } else {
          await this.authSrv.signOut();
        }
      }
      itemsProperties.unshift(...data.map(office => {
        const editPermissions = (!this.isUserAdmin && office.permissions) && office.permissions.filter(p => p.level === 'EDIT');
        const editPermission = this.isUserAdmin ? true : (editPermissions && editPermissions.length > 0 ? true : false);
        const officeCardItem = {
          typeCardItem: 'listItem',
          iconSvg: true,
          icon: IconsEnum.Offices,
          nameCardItem: office.name,
          fullNameCardItem: office.fullName,
          itemId: office.id,
          menuConfig: true,
          urlMenuConfig: editPermission ? '/configuration-office' : undefined,
          paramsUrlMenuConfig: editPermission ? [{ name: 'idOffice', value: office.id }] : undefined,
          urlCard: 'office',
          office
        };
        return officeCardItem;
      }));
    }

    this.cardItemsProperties = itemsProperties;
    this.totalRecords = this.cardItemsProperties && this.cardItemsProperties.length;
  }

  async deleteOffice(office: IOffice) {
    const { success } = await this.officeSvr.delete(office);
    if (success) {
      this.cardItemsProperties = Array.from(this.cardItemsProperties.filter(c => c.itemId !== office.id));
      this.totalRecords = this.cardItemsProperties && this.cardItemsProperties.length;
    }
  }

  navigateToPage(url: string, idOffice: number) {
    this.router.navigate([`${url}`]);
    this.router.navigate([url], { queryParams: { idOffice } });
  }

  handleCreateNewOffice() {
    this.router.navigate(['/offices', 'office']);
  }

  async loadFiltersOffices() {
    const result = await this.filterSrv.getAllFilters('offices');
    if (result.success && result.data.length > 0) {
      const filterDefault = result.data.find( filter => !!filter.favorite);
      this.idFilterSelected = filterDefault ? filterDefault.id : undefined;
      this.cardProperties.filters = result.data;
    }
    this.cardProperties.showFilters = true;
  }

  handleEditFilter(event) {
    const idFilter = event.filter;
    if (idFilter) {
      const filterProperties = this.loadFilterPropertiesList();
      this.filterSrv.setFilterProperties(filterProperties);
      this.router.navigate(['/filter-dataview'], {
        queryParams: {
          id: idFilter,
          entityName: 'offices'
        }
      });
    }
  }

  async handleSelectedFilter(event) {
    const idFilter = event.filter;
    if (idFilter) {
      this.idFilterSelected = idFilter;
      await this.loadPropertiesOffice();
    }
  }

  handleNewFilter() {
    const filterProperties = this.loadFilterPropertiesList();
    this.filterSrv.setFilterProperties(filterProperties);
    this.router.navigate(['/filter-dataview'], {
      queryParams: {
        entityName: 'offices'
      }
    });
  }

  loadFilterPropertiesList() {
    const listProperties = FilterDataviewPropertiesEntity.offices;
    const filterPropertiesList = listProperties.map( prop => {
      const property =  new PropertyTemplateModel();
      property.type = prop.type;
      property.label = prop.label;
      property.name = prop.apiValue;
      property.active = true;
      return property;
    });
    return filterPropertiesList;
  }

}
