import { animate, style, transition, trigger } from "@angular/animations";
import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { resolve } from "dns";
import * as moment from "moment";
import { MessageService, SelectItem } from "primeng/api";
import { Subject } from "rxjs";
import { filter, flatMap, takeUntil } from "rxjs/operators";
import { CancelButtonComponent } from "src/app/shared/components/cancel-button/cancel-button.component";
import { SaveButtonComponent } from "src/app/shared/components/save-button/save-button.component";
import { ICard } from "src/app/shared/interfaces/ICard";
import { ICardItem } from "src/app/shared/interfaces/ICardItem";
import { IIndicator } from "src/app/shared/interfaces/IIndicator";
import { IPeriodData } from "src/app/shared/interfaces/IPeriodData";
import { ISourceIndicators } from "src/app/shared/interfaces/ISourceIndicators";
import { IUnitMeasureIndicators } from "src/app/shared/interfaces/IUnitMeasureIndicators";
import { AuthService } from "src/app/shared/services/auth.service";
import { BreadcrumbService } from "src/app/shared/services/breadcrumb.service";
import { IndicatorService } from "src/app/shared/services/indicator.service";
import { PentahoService } from "src/app/shared/services/pentaho.service";
import { ResponsiveService } from "src/app/shared/services/responsive.service";
import { WorkpackService } from "src/app/shared/services/workpack.service";
import { ChangeDetectorRef } from "@angular/core";

@Component({
    selector: 'app-indicator',
    templateUrl: './indicator.component.html',
    styleUrls: ['./indicator.component.scss'],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('300ms ease-in', style({ opacity: 1 }))
            ]),
            transition(':leave', [
                animate('300ms ease-out', style({ opacity: 0 }))
            ])
        ])
    ],
})
export class IndicatorComponent implements OnInit, OnDestroy {

    @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
    @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;

    responsive: boolean = false;
    idIndicator: number;
    idWorkpack: number;
    idWorkpackModelLinked: number;
    editPermission: boolean = false;
    $destroy = new Subject();
    calendarFormat: string = "dd/mm/yy";
    cardIndicatorProperties: ICard;
    cardIndicatorResponsesProperties: ICard;
    indicatorResponseCardItems: ICardItem[] = [];
    formIndicator: FormGroup;
    indicator: IIndicator;
    importanceOptions: SelectItem[] = [];
    yearRangeCalculated: string;
    idPlan: number;
    idOffice: number;
    formIsSaving = false;
    isLoadingResponseItems = false;
    currentStartDate: Date | null = null;
    currentEndDate: Date | null = null;

    measurementOptions = [
        { label: '(%) Percentual', value: "%" },
        { label: '(Km) Quilômetros', value: "Km" },
        { label: '(M) Metros', value: "M" },
        { label: '(UND) Unidades', value: "UND" }
    ];

    periodicityOptions = [
        { label: 'Anual', value: "ANUAL" },
        { label: 'Semestral', value: "SEMESTRAL" }
    ];

    updateDate: string | null = null;

    sourceOptions: ISourceIndicators[] = [];
    unitMeasureOptions: IUnitMeasureIndicators[] = [];
    periodList: string[] = [];
    selectedSource: string;
    selectedMeasure: string;
    selectedPeriodicity: string;

    expectedGoals: number[] = [];
    achievedGoals: number[] = [];

    periodData: any[] = [];

    constructor(
        private actRouter: ActivatedRoute,
        private formBuilder: FormBuilder,
        private responseService: ResponsiveService,
        private translateSrv: TranslateService,
        private breadcrumbSrv: BreadcrumbService,
        private messageSrv: MessageService,
        private indicatorSrv: IndicatorService,
        private router: Router,
        private workpackSrv: WorkpackService,
        private authSrv: AuthService,
        private pentahoSrv: PentahoService,
        private cdr: ChangeDetectorRef
    ) {
        this.actRouter.queryParams.subscribe(async queryParams => {
            this.idIndicator = +queryParams.idIndicator;
            this.idWorkpack = +queryParams.idWorkpack;
            this.idPlan = +queryParams.idPlan;
            this.idOffice = +queryParams.idOffice;
            this.idWorkpackModelLinked = +queryParams.idWorkpackModelLinked;
        });

        this.responseService.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);

        this.formIndicator = this.formBuilder.group({
            name: ['', [Validators.required, Validators.maxLength(50)]],
            description: ['', [Validators.required, Validators.maxLength(600)]],
            source: [null],
            measure: [null],
            startDate: [null, Validators.required],
            endDate: [null, Validators.required],
            periodicity: [null],
            expectedGoals: [null],
            achievedGoals: [null],
            justification: [null]
        });
        this.formIndicator.statusChanges.pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID')).subscribe(() => this.saveButton?.hideButton());
        this.formIndicator.valueChanges.pipe(takeUntil(this.$destroy), filter(() => this.formIndicator.dirty && this.formIndicator.valid)).subscribe(() => this.saveButton.showButton());
        this.formIndicator.valueChanges.pipe(takeUntil(this.$destroy), filter(() => this.formIndicator.dirty)).subscribe(() => this.cancelButton.showButton());
    }

    async ngOnInit() {
        this.idPlan = Number(localStorage.getItem('@currentPlan'));
        this.idOffice = Number(localStorage.getItem('@currentOffice'));
        await this.calculateYearRange();
        await this.loadPropertiesIndicator();
        await this.loadFontOptions(this.idOffice);
        await this.loadUnitMeasure(this.idOffice);
        await this.setBreadcrumb();
    }

    ngOnDestroy(): void {
        this.$destroy.next(null);
        this.$destroy.complete();
    }

    initForm(): void {
        this.formIndicator = this.formBuilder.group({
            name: [""],
            description: [""],
            source: [null],
            measure: [null],
            periodicity: [null],
            startDate: [null],
            endDate: [null],
            expectedGoals: [null],
            achievedGoals: [null],
            justification: [null]
        });
    }

    mirrorDescription(): boolean {
        return (isNaN(this.idIndicator) && this.formIndicator?.get('description')?.pristine);
    }

    async loadPropertiesIndicator() {
        this.cardIndicatorProperties = {
            toggleable: false,
            initialStateToggle: false,
            cardTitle: 'properties',
            collapseble: true,
            initialStateCollapse: false,
            isLoading: true
        };

        if (this.idIndicator) {
            const result = await this.indicatorSrv.GetByIdWithIdWorkpack(this.idWorkpack, this.idIndicator);
            if (result.success) {
                this.indicator = result.data;
                await this.loadFontOptions(this.idOffice);
                this.setFormIndicator();
                this.formIndicator.markAllAsTouched();
            }
        } else {
            this.cardIndicatorProperties.isLoading = false;
        }
    }

    preparePeriodData() {
        if (!this.indicator) return;
        this.periodData = [...this.indicator.periodGoals].map(goal => ({
            period: goal.period,
            expectedGoals: goal.expectedValue,
            achievedGoals: goal.achievedValue,
            measure: this.indicator.measure,
            lastUpdate: goal.lastUpdate || '--',
            justification: goal.justification
        }));
    }


    async loadFontOptions(idOffice: number) {
        return new Promise<void>((resolve) => {
            this.indicatorSrv.loadOrganizationFromOffice(idOffice).subscribe(data => {
                this.sourceOptions =
                    data["data"].map(item => ({
                        name: item
                    }))
                resolve();
            })
        })
    }

    async loadUnitMeasure(idOffice: number) {
        return new Promise<void>((resolve) => {
            this.indicatorSrv.loadUnitMeasureFromOffice(idOffice).subscribe(data => {
                this.unitMeasureOptions =
                    data["data"].map(item => ({
                        name: item
                    }))
                resolve();
            })
        })
    }

    formatPeriod(periods: number[], periodicity: string): string[] {
        if (periodicity === 'SEMESTRAL') {
            return periods.map(year => [`${year}/1`, `${year}/2`]).reduce((acc, val) => acc.concat(val), []);
        } else if (periodicity === 'ANUAL') {
            return periods.map(year => year.toString());
        }
        return [];
    }

    loadPeriodData(periodicity: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.periodList = [];
            this.indicatorSrv.loadPeriodData(this.idWorkpack).subscribe({
                next: (result: any) => {
                    const years = (result as { data: number[] }).data;
                    this.periodList = this.formatPeriod(years, periodicity);
                    this.expectedGoals = new Array(this.periodList.length).fill(0);
                    this.achievedGoals = new Array(this.periodList.length).fill(0);
                    resolve();
                },
                error: (error) => {
                    console.log('Erro ao carregar os períodos: ', error);
                    reject(error);
                }
            });
        });
    }

    getYearsBetweenDates(startDate: Date, endDate: Date): number[] {
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();
        const years = [];

        for (let year = startYear; year <= endYear; year++) {
            years.push(year);
        }

        return years;
    }

    generatePeriodData(startDate: Date, endDate: Date): void {
        const years = this.getYearsBetweenDates(startDate, endDate);
        this.periodList = this.formatPeriod(years, this.selectedPeriodicity || 'ANUAL');

        const existingDataMap: Record<string, {
            expectedGoals: number | null;
            achievedGoals: number | null;
            lastUpdate: string | null;
        }> = {};

        if (this.periodData) {
            this.periodData.forEach(item => {
                existingDataMap[item.period] = {
                    expectedGoals: item.expectedGoals,
                    achievedGoals: item.achievedGoals,
                    lastUpdate: item.lastUpdate
                };
            });
        }

        this.periodData = this.periodList.map(period => {
            const existingData = existingDataMap[period];
            return {
                period: period,
                expectedGoals: existingData?.expectedGoals ?? null,
                achievedGoals: existingData?.achievedGoals ?? null,
                measure: this.selectedMeasure || '--',
                lastUpdate: existingData?.lastUpdate || '--',
                justification: null
            };
        });

        this.cdr.detectChanges();
    }

    onDateChange(): void {
        const startDate = this.formIndicator.value.startDate;
        const endDate = this.formIndicator.value.endDate;

        if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return;
        }

        if (startDate > endDate) {
            this.messageSrv.add({
                severity: 'warn',
                summary: 'Atenção',
                detail: 'A data de início deve ser anterior à data de fim.'
            });
            return;
        }

        if (!this.formIndicator.value.periodicity) {
            this.formIndicator.patchValue({
                periodicity: 'ANUAL'
            });
            this.selectedPeriodicity = 'ANUAL';
        }

        if (
            startDate.getTime() !== this.currentStartDate?.getTime() ||
            endDate.getTime() !== this.currentEndDate?.getTime()
        ) {
            this.generatePeriodData(startDate, endDate);
            this.currentStartDate = startDate;
            this.currentEndDate = endDate;
        } else {
            this.preparePeriodData();
        }
    }

    onExpectedGoalChange(data: any): void {
        data.lastUpdate = this.getCurrentDate();
        this.formIndicator.markAsDirty();
        if (this.formIndicator.valid) {
            this.saveButton.showButton();
        } else {
            this.saveButton.hideButton();
        }
        this.cancelButton.showButton();
    }

    onAchievedGoalChange(data: any): void {
        this.formIndicator.markAsDirty();
        data.lastUpdate = this.getCurrentDate();
        if (this.formIndicator.valid) {
            this.saveButton.showButton();
        } else {
            this.saveButton.hideButton();
        }
        this.cancelButton.showButton();
    }

    onJustificationChange(): void {
        this.formIndicator.markAsDirty();
        if (this.formIndicator.valid) {
            this.saveButton.showButton();
        } else {
            this.saveButton.hideButton();
        }
        this.cancelButton.showButton();
    }

    setFormIndicator() {
        const startDate = this.indicator.startDate ? this.formatDate(this.indicator.startDate) : null;
        const endDate = this.indicator.endDate ? this.formatDate(this.indicator.endDate) : null;
        this.selectedPeriodicity = this.periodicityOptions.find(item => item.value === this.indicator.periodicity)?.value;
        this.selectedMeasure = this.indicator.measure;

        this.formIndicator.reset({
            name: this.indicator.name,
            description: this.indicator.description,
            source: this.sourceOptions.find(item => item.name == this.indicator.source)?.name,
            measure: this.selectedMeasure,
            startDate: startDate,
            endDate: endDate,
            periodicity: this.selectedPeriodicity,
            periodGoals: this.indicator.periodGoals,
            lastUpdate: this.indicator.lastUpdate
        });

        this.currentStartDate = startDate;
        this.currentEndDate = endDate;

        if (startDate && endDate) {
            this.onDateChange();
        }

        this.cardIndicatorProperties.isLoading = false;
    }

    async setBreadcrumb() {
        let breadcrumbItems = this.breadcrumbSrv.get;
        if (!breadcrumbItems || breadcrumbItems.length === 0) {
            breadcrumbItems = await this.breadcrumbSrv.loadWorkpackBreadcrumbs(this.idWorkpack, this.idPlan)
        }
        this.breadcrumbSrv.setMenu([
            ...breadcrumbItems,
            {
                key: 'indicator',
                routerLink: ['/workpack/indicators'],
                queryParams: { idWorkpack: this.idWorkpack, idIndicator: this.idIndicator },
                info: this.indicator?.name,
                tooltip: this.indicator?.name
            }
        ]);
    }

    onSourceChange(event: any) {
        this.cancelButton.showButton();
        this.selectedSource = event.value;
    }

    onMeasureChange(event: any) {
        this.cancelButton.showButton();
        this.selectedMeasure = event.value;
    }

    async onPeriodicityChange(event: any) {
        this.cancelButton.showButton();
        this.selectedPeriodicity = event.value;
        const startDate = this.formIndicator.value.startDate;
        const endDate = this.formIndicator.value.endDate;

        if (startDate && endDate) {
            const years = this.getYearsBetweenDates(startDate, endDate);
            this.periodList = this.formatPeriod(years, this.selectedPeriodicity);

            const existingGoalsMap: {
                [period: string]: {
                    expected: number | null;  // Permite null
                    achieved: number | null;  // Permite null
                    lastUpdate: string | null;
                };
            } = {};

            if (this.indicator?.periodGoals) {
                if (this.selectedPeriodicity === 'ANUAL') {
                    this.indicator.periodGoals.forEach(goal => {
                        const year = goal.period.split('/')[0];
                        if (!existingGoalsMap[year]) {
                            existingGoalsMap[year] = {
                                expected: null,
                                achieved: null,
                                lastUpdate: null
                            };
                        }
                        if (goal.expectedValue !== null) {
                            existingGoalsMap[year].expected =
                                existingGoalsMap[year].expected !== null
                                    ? existingGoalsMap[year].expected! + goal.expectedValue
                                    : goal.expectedValue;
                        }
                        if (goal.achievedValue !== null) {
                            existingGoalsMap[year].achieved =
                                existingGoalsMap[year].achieved !== null
                                    ? existingGoalsMap[year].achieved! + goal.achievedValue
                                    : goal.achievedValue;
                        }

                        if (goal.lastUpdate && goal.lastUpdate !== '--') {
                            if (!existingGoalsMap[year].lastUpdate ||
                                new Date(goal.lastUpdate) > new Date(existingGoalsMap[year].lastUpdate!)) {
                                existingGoalsMap[year].lastUpdate = goal.lastUpdate;
                            }
                        }
                    });
                } else {
                    this.indicator.periodGoals.forEach(goal => {
                        existingGoalsMap[goal.period] = {
                            expected: goal.expectedValue,
                            achieved: goal.achievedValue,
                            lastUpdate: goal.lastUpdate || null
                        };
                    });
                }
            }

            this.periodData = this.periodList.map(period => {
                const existingGoal = existingGoalsMap[period];
                return {
                    period: period,
                    expectedGoals: existingGoal ? existingGoal.expected : null,
                    achievedGoals: existingGoal ? existingGoal.achieved : null,
                    measure: this.selectedMeasure || '--',
                    lastUpdate: existingGoal?.lastUpdate || '--',
                    justification: this.selectedPeriodicity === 'ANUAL' ? null :
                        (existingGoal ? this.indicator.periodGoals?.find(g => g.period === period)?.justification || null : null)
                };
            });

            this.cdr.detectChanges();
        }
    }

    async saveIndicator() {

        this.cancelButton.hideButton();
        this.formIsSaving = true;

        const parseDecimal = (value: string | number | null | undefined): number | null => {
            if (value === null || value === undefined) return null;

            if (typeof value === 'number') return value;

            if (typeof value === 'string') {
                const trimmedValue = value.trim();
                if (trimmedValue === '') return null;
                const parsedValue = parseFloat(trimmedValue.replace(',', '.'));
                return isNaN(parsedValue) ? null : parsedValue;
            }

            return null;
        };
        const periodGoals = this.periodData.map(data => ({
            period: String(data.period),
            expectedValue: parseDecimal(data.expectedGoals),
            achievedValue: parseDecimal(data.achievedGoals),
            lastUpdate: data.lastUpdate,
            justification: data.justification || null
        }));

        this.updateDate = this.getCurrentDate();

        const sender: IIndicator = {
            id: this.idIndicator,
            idWorkpack: this.idWorkpack,
            name: this.formIndicator.controls.name.value,
            description: this.formIndicator.controls.description.value,
            source: this.formIndicator.controls.source.value,
            measure: this.formIndicator.controls.measure.value,
            periodicity: this.formIndicator.controls.periodicity.value,
            startDate: this.formIndicator.controls.startDate.value,
            endDate: this.formIndicator.controls.endDate.value,
            periodGoals: periodGoals,
            lastUpdate: this.updateDate
        };

        const put = !!this.idIndicator;
        const result = put ? await this.indicatorSrv.put(sender) : await this.indicatorSrv.post(sender);
        this.formIsSaving = false;

        if (result.success) {
            this.messageSrv.add({ severity: 'success', summary: 'Sucesso', detail: put ? 'Indicador atualizado com sucesso' : 'Indicador criado com sucesso' });
            this.router.navigate(['/workpack'], {
                queryParams: {
                    id: this.idWorkpack,
                    idPlan: this.idPlan
                }
            });
        }
    }

    handleOnCancel() {
        this.saveButton.hideButton();
        this.periodData = []
        if (this.idIndicator) {
            this.setFormIndicator();
        } else {
            this.formIndicator.reset({
                name: "",
                description: "",
                source: null,
                measure: null,
                periodicity: null
            })
        }
        this.formIndicator.markAllAsTouched();
    }

    trackByFn(index: number, item: any): any {
        return index;
    }

    getCurrentDate(): string {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const year = today.getFullYear();

        return `${day}/${month}/${year}`;
    }

    calculateYearRange() {
        const date = moment();
        const rangeYearStart = 2015
        const rangeYearEnd = date.add(30, 'years').year();
        this.yearRangeCalculated = `${rangeYearStart}:${rangeYearEnd};`
    }

    formatDate(date: string | Date): Date | null {
        if (!date) return null;

        if (date instanceof Date) {
            return date;
        }

        if (typeof date === 'string' && date.includes('T')) {
            return new Date(date);
        }

        if (typeof date === 'string') {
            const [day, month, year] = date.split('/');
            if (day && month && year) {
                return new Date(+year, +month - 1, +day);
            }
        }

        return null;
    }
}
