import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IIndicator } from '../interfaces/IIndicator';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { WorkpackService } from './workpack.service';
import { FilterDataviewService } from './filter-dataview.service';
import { IWorkpackData, IWorkpackParams } from '../interfaces/IWorkpackDataParams';
import { PrepareHttpParams } from '../utils/query.util';

@Injectable({
    providedIn: 'root'
})
export class IndicatorService extends BaseService<IIndicator> {

    private resetIndicator = new BehaviorSubject<boolean>(false);
    workpackData: IWorkpackData;
    workpackParams: IWorkpackParams;
    filters;
    indicators;
    idFilterSelected;
    term = '';
    loading;

    constructor(
        @Inject(Injector) injector: Injector,
        private workpackSrv: WorkpackService,
        private filterSrv: FilterDataviewService
    ) {
        super('indicators', injector);
    }

    async loadIndicators(params?) {
        this.workpackData = this.workpackSrv.getWorkpackData();
        this.workpackParams = this.workpackSrv.getWorkpackParams();
        if (this.workpackData && this.workpackData?.workpack?.id && this.workpackData?.workpackModel) {
            if (!this.workpackParams.idWorkpackModelLinked || (this.workpackSrv.getEditPermission() && !!this.workpackParams.idWorkpackModelLinked)) {
                if (params) {
                    this.idFilterSelected = params.idFilterSelected;
                    this.term = params.term
                } else {
                    const resultFilters = await this.filterSrv.getAllFilters(`workpackModels/${this.workpackData.workpackModel.id}/indicators`);
                    this.filters = resultFilters.success && Array.isArray(resultFilters.data) ? resultFilters.data : [];
                    this.idFilterSelected = this.filters.find(defaultFilter => !!defaultFilter.favorite) ?
                        this.filters.find(defaultFilter => !!defaultFilter.favorite).id : undefined;
                }
                const resultIndicators = await this.GetAll({ 'id-workpack': this.workpackParams.idWorkpack, idFilter: this.idFilterSelected, term: this.term });
                this.indicators = resultIndicators.success ? resultIndicators.data : [];
                this.loading = false;
                this.nextResetIndicator(true);
            }
        } else {
            this.loading = false;
        }
    }

    getIndicatorsData() {
        return {
            workpackData: this.workpackData,
            workpackParams: this.workpackParams,
            filters: this.filters,
            indicators: this.indicators,
            idFilterSelected: this.idFilterSelected,
            term: this.term,
            loading: this.loading
        }
    }

    deleteIndicatorFromData(id: number) {
        this.indicators = this.indicators.filter(indicator => indicator.id !== id);
    }
    
    resetIndicatorsData() {
        this.filters = [];
        this.indicators = [];
        this.idFilterSelected = undefined;
        this.term = '';
        this.loading = true;
        this.nextResetIndicator(true);
    }

    nextResetIndicator(value: boolean) {
        this.resetIndicator.next(value);
    }

    get observableResetIndicator() {
        return this.resetIndicator.asObservable();
    }

    loadPeriodData(idWorkpack: number) {
        return this.http.get(`${this.urlBase}/period/${idWorkpack}`)
    }

    loadOrganizationFromOffice(idOffice: number) {
        return this.http.get(`${this.urlBase}/office/${idOffice}`)
    }
}