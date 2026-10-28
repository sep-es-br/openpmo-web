import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IIndicator } from '../interfaces/IIndicator';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { WorkpackService } from './workpack.service';
import { FilterDataviewService } from './filter-dataview.service';
import { IWorkpackData, IWorkpackParams } from '../interfaces/IWorkpackDataParams';
import { PrepareHttpParams } from '../utils/query.util';
import { IHttpResult } from '../interfaces/IHttpResult';

export interface ISustainableDevelopmentGoal {
    order: number;
    description: string;
    name: string;
}

export interface IStrategicChallenge {
    managementId: number;
    management: string;
    groupId: number;
    groupType: string;
    group: string;
    subgroupId: number;
    subgroupType: string;
    subgroup: string;
    challengeId: number;
    challenge: string;
    gestaoId?: number;
    gestao?: string;
    grupoId?: number;
    grupoTipo?: string;
    grupo?: string;
    subgrupoId?: number;
    subgrupoTipo?: string;
    subgrupo?: string;
    desafioId?: number;
    desafio?: string;
}
export interface IEs500Indicator {
    id: number;
    code: string;
    strategicObjectiveCode: string;
    targetCode: string;
    appId: number;
    title: string;
    description: string;
    targetValue: string;
    unit: string;
    polarity: string;
    source: string;
}

export interface IStrategicIndicator {
    managementId: number;
    management: string;
    groupId: number;
    groupType: string;
    group: string;
    subgroupId: number;
    subgroupType: string;
    subgroup: string;
    indicatorId: number;
    indicator: string;
}

export interface IStrategicIndicatorDetail {
    indicatorId: number;
    indicator: string;
    source: string;
    unitOfMeasure: string;
    referenceYear: number;
    referenceValue: number;
    goalYear: number;
    goalValue: number;
    polarity: string;
}

export type IndicatorLinkCategory = 'STRATEGIC' | 'ODS' | 'ES500';

export interface IProjectIndicatorLink {
    id: number;
    category: IndicatorLinkCategory;
    externalId: string;
    name: string;
    description?: string;
    active: boolean;
    projectGoals?: { [year: string]: number };
}

@Injectable({
    providedIn: 'root'
})
export class IndicatorService extends BaseService<IIndicator> {

    private resetIndicator = new BehaviorSubject<boolean>(false);
    private projectIndicatorLinksSavingState = new BehaviorSubject<Record<string, boolean>>({});
    private challengeCatalogRequest: Promise<IHttpResult<IStrategicChallenge[]>>;
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
        
        if (!this.workpackParams?.idWorkpack) {
            this.loading = false;
            return;
          }
        
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

    loadUnitMeasure() {
        return this.http.get(`${this.urlBase}/unitMeasure`)
    }

    getOdsCatalog(): Promise<IHttpResult<ISustainableDevelopmentGoal[]>> {
        return this.http
            .get<IHttpResult<ISustainableDevelopmentGoal[]>>(`${this.urlBase}/ods`)
            .toPromise();
    }

    getChallengeCatalog(): Promise<IHttpResult<IStrategicChallenge[]>> {
        if (!this.challengeCatalogRequest) {
            this.challengeCatalogRequest = this.http
                .get<IHttpResult<IStrategicChallenge[]>>(`${this.urlBase}/challenges`)
                .toPromise()
                .catch(error => {
                    this.challengeCatalogRequest = null;
                    throw error;
                });
        }
        return this.challengeCatalogRequest;
    }

    getEs500IndicatorCatalog(): Promise<IHttpResult<IEs500Indicator[]>> {
        return this.http
            .get<IHttpResult<IEs500Indicator[]>>(`${this.urlBase}/es500/indicators`)
            .toPromise();
    }

    getStrategicIndicatorCatalog(): Promise<IHttpResult<IStrategicIndicator[]>> {
        return this.http
            .get<IHttpResult<IStrategicIndicator[]>>(`${this.urlBase}/strategic`)
            .toPromise();
    }

    getStrategicIndicatorDetails(indicatorIds: number[]): Promise<IHttpResult<IStrategicIndicatorDetail[]>> {
        return this.http
            .get<IHttpResult<IStrategicIndicatorDetail[]>>(`${this.urlBase}/strategic/details`, {
                params: { indicatorIds: indicatorIds.join(',') }
            })
            .toPromise();
    }

    getProjectIndicatorLinks(
        idWorkpack: number,
        category: IndicatorLinkCategory
    ): Promise<IHttpResult<IProjectIndicatorLink[]>> {
        return this.http
            .get<IHttpResult<IProjectIndicatorLink[]>>(`${this.urlBase}/associations/${idWorkpack}`, { params: { category } })
            .toPromise();
    }

    createProjectIndicatorLink(
        idWorkpack: number,
        item: Pick<IProjectIndicatorLink, 'category' | 'externalId' | 'name' | 'description' | 'projectGoals'>
    ): Promise<IHttpResult<IProjectIndicatorLink>> {
        return this.http
            .post<IHttpResult<IProjectIndicatorLink>>(`${this.urlBase}/associations/${idWorkpack}`, item)
            .toPromise();
    }

    updateProjectIndicatorLinkStatus(
        idWorkpack: number,
        idLink: number,
        active: boolean
    ): Promise<IHttpResult<IProjectIndicatorLink>> {
        return this.http
            .patch<IHttpResult<IProjectIndicatorLink>>(
                `${this.urlBase}/associations/${idWorkpack}/${idLink}/active`,
                active
            )
            .toPromise();
    }

    updateProjectIndicatorLinkGoals(
        idWorkpack: number,
        idLink: number,
        projectGoals: { [year: string]: number }
    ): Promise<IHttpResult<IProjectIndicatorLink>> {
        return this.http
            .patch<IHttpResult<IProjectIndicatorLink>>(
                `${this.urlBase}/associations/${idWorkpack}/${idLink}/project-goals`,
                projectGoals
            )
            .toPromise();
    }

    isProjectIndicatorLinksSaving(idWorkpack: number, category: IndicatorLinkCategory): boolean {
        return !!this.projectIndicatorLinksSavingState.value[this.projectIndicatorLinksSavingKey(idWorkpack, category)];
    }

    setProjectIndicatorLinksSaving(idWorkpack: number, category: IndicatorLinkCategory, saving: boolean): void {
        const key = this.projectIndicatorLinksSavingKey(idWorkpack, category);
        this.projectIndicatorLinksSavingState.next({
            ...this.projectIndicatorLinksSavingState.value,
            [key]: saving
        });
    }

    get observableProjectIndicatorLinksSaving() {
        return this.projectIndicatorLinksSavingState.asObservable();
    }

    private projectIndicatorLinksSavingKey(idWorkpack: number, category: IndicatorLinkCategory): string {
        return `${idWorkpack}:${category}`;
    }
}
