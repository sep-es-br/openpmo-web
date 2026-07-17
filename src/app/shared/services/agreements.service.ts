import { Inject, Injectable, Injector } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { BaseService } from '../base/base.service';
import {
  IWorkpackData,
  IWorkpackParams
} from '../interfaces/IWorkpackDataParams';

import { FilterDataviewService } from
  './filter-dataview.service';
import { WorkpackService } from
  './workpack.service';
import { IAgreements } from '../interfaces/IAgreements';

@Injectable({
  providedIn: 'root'
})
export class AgreementsService
  extends BaseService<IAgreements> {

  private resetAgreements =
    new BehaviorSubject<boolean>(false);

  workpackData: IWorkpackData;
  workpackParams: IWorkpackParams;
  filters;
  Agreements: IAgreements[];
  idFilterSelected;
  term = '';
  loading;

  constructor(
    @Inject(Injector) injector: Injector,
    private workpackSrv: WorkpackService,
    private filterSrv: FilterDataviewService
  ) {
    super('agreements', injector);
  }

  resetAgreementsData(): void {
    this.filters = [];
    this.Agreements = [];
    this.idFilterSelected = undefined;
    this.term = '';
    this.loading = true;

    this.nextResetAgreements(true);
  }

  async loadAgreements(
    params?
  ): Promise<void> {
    this.workpackData =
      this.workpackSrv.getWorkpackData();

    this.workpackParams =
      this.workpackSrv.getWorkpackParams();

    if (
      this.workpackData &&
      this.workpackData?.workpack?.id &&
      this.workpackData?.workpackModel &&
      this.workpackData.workpackModel
        .agreementsSessionActive
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
              `workpackModels/${this.workpackData.workpackModel.id}/agreements`
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

        const resultAgreements =
          await this.GetAll({
            'id-workpack':
              this.workpackParams.idWorkpack,
            idFilter: this.idFilterSelected,
            term: this.term
          });

        this.Agreements =
          resultAgreements.success
            ? resultAgreements.data
            : [];

        this.loading = false;

        this.nextResetAgreements(
          true
        );
      }
    } else {
      this.loading = false;

      this.nextResetAgreements(
        true
      );
    }
  }

  getAgreementsData() {
    return {
      workpackData: this.workpackData,
      workpackParams: this.workpackParams,
      filters: this.filters,
      Agreements:
        this.Agreements,
      term: this.term,
      idFilterSelected: this.idFilterSelected,
      loading: this.loading
    };
  }

  deleteAgreementsFromData(
    id: number
  ): void {
    this.Agreements =
      this.Agreements.filter(
        item => item.id !== id
      );
  }

  nextResetAgreements(
    nextValue: boolean
  ): void {
    this.resetAgreements.next(
      nextValue
    );
  }

  get observableResetAgreements() {
    return this.resetAgreements
      .asObservable();
  }
}
