import { Inject, Injectable, Injector } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { BaseService } from '../base/base.service';
import {
  IWorkpackData,
  IWorkpackParams
} from '../interfaces/IWorkpackDataParams';

import { FilterDataviewService } from './filter-dataview.service';
import { WorkpackService } from './workpack.service';
import { IProcurement } from '../interfaces/IProcurement';

@Injectable({
  providedIn: 'root'
})
export class ProcurementsService extends BaseService<IProcurement> {

  private resetProcurements =
    new BehaviorSubject<boolean>(false);

  workpackData: IWorkpackData;
  workpackParams: IWorkpackParams;
  filters;
  procurements: IProcurement[];
  idFilterSelected;
  term = '';
  loading;

  constructor(
    @Inject(Injector) injector: Injector,
    private workpackSrv: WorkpackService,
    private filterSrv: FilterDataviewService
  ) {
    super('procurements', injector);
  }

  resetProcurementsData(): void {
    this.filters = [];
    this.procurements = [];
    this.idFilterSelected = undefined;
    this.term = '';
    this.loading = true;

    this.nextResetProcurements(true);
  }

  async loadProcurements(params?): Promise<void> {
    this.workpackData =
      this.workpackSrv.getWorkpackData();

    this.workpackParams =
      this.workpackSrv.getWorkpackParams();

    if (
      this.workpackData &&
      this.workpackData?.workpack?.id &&
      this.workpackData?.workpackModel &&
      this.workpackData.workpackModel
        .procurementsSessionActive
    ) {
      if (
        !this.workpackParams.idWorkpackModelLinked ||
        (
          this.workpackSrv.getEditPermission() &&
          !!this.workpackParams.idWorkpackModelLinked
        )
      ) {
        if (params) {
          this.idFilterSelected =
            params.idFilterSelected;

          this.term = params.term;
        } else {
          const resultFilters =
            await this.filterSrv.getAllFilters(
              `workpackModels/${this.workpackData.workpackModel.id}/procurements`
            );

          this.filters =
            resultFilters.success &&
            Array.isArray(resultFilters.data)
              ? resultFilters.data
              : [];

          const favoriteFilter =
            this.filters.find(
              filter => !!filter.favorite
            );

          this.idFilterSelected =
            favoriteFilter
              ? favoriteFilter.id
              : undefined;
        }

        const resultProcurements =
          await this.GetAll({
            'id-workpack':
              this.workpackParams.idWorkpack,
            idFilter: this.idFilterSelected,
            term: this.term
          });

        this.procurements =
          resultProcurements.success
            ? resultProcurements.data
            : [];

        this.loading = false;
        this.nextResetProcurements(true);
      }
    } else {
      this.loading = false;
      this.nextResetProcurements(true);
    }
  }

  getProcurementsData() {
    return {
      workpackData: this.workpackData,
      workpackParams: this.workpackParams,
      filters: this.filters,
      procurements: this.procurements,
      term: this.term,
      idFilterSelected: this.idFilterSelected,
      loading: this.loading
    };
  }

  deleteProcurementFromData(id: number): void {
    this.procurements =
      this.procurements.filter(
        procurement => procurement.id !== id
      );
  }

  nextResetProcurements(
    nextValue: boolean
  ): void {
    this.resetProcurements.next(nextValue);
  }

  get observableResetProcurements() {
    return this.resetProcurements.asObservable();
  }
}
