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

    finalGoal: number = 0;

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
            name: ['', Validators.required],
            description: ["", Validators.required],
            finalGoal: [""],
            source: [null],
            measure: [null],
            startDate: [null, Validators.required],
            endDate: [null, Validators.required],
            periodicity: [null],
            expectedGoals: [null],
            achievedGoals: [null]
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
            finalGoal: [""],
            periodicity: [null],
            startDate: [null],
            endDate: [null],
            expectedGoals: [null],
            achievedGoals: [null]
        });
    }

    mirrorDescription(): boolean {
        return (isNaN(this.idIndicator) && this.formIndicator?.get('description')?.pristine);
    }

    async loadPropertiesIndicator() {
        debugger
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
                this.preparePeriodData();
            }
        } else {
            this.cardIndicatorProperties.isLoading = false;
        }
    }

    preparePeriodData() {
        debugger;
        if (!this.indicator) return;
    
        // Obtém todos os períodos únicos de expectedGoals e achievedGoals
        const allPeriods = [
            ...this.indicator.expectedGoals.map(g => g.period),
            ...this.indicator.achievedGoals.map(g => g.period)
        ];
        const uniquePeriods = Array.from(new Set(allPeriods)).sort();
    
        // Mapeia os períodos únicos para o periodData
        this.periodData = uniquePeriods.map(period => {
            // Encontra o expectedGoal correspondente ao período
            const expectedGoal = this.indicator.expectedGoals.find(g => g.period === period);
            // Encontra o achievedGoal correspondente ao período
            const achievedGoal = this.indicator.achievedGoals.find(g => g.period === period);
    
            // Retorna o objeto para o periodData
            return {
                period: period,
                expectedGoals: expectedGoal?.value || 0, // Usa o valor do expectedGoal ou 0 se não existir
                achievedGoals: achievedGoal?.value || 0, // Usa o valor do achievedGoal ou 0 se não existir
                measure: this.indicator.measure, // Usa a medida do indicador
                lastUpdate: expectedGoal?.lastUpdate || achievedGoal?.lastUpdate || '--' // Usa o lastUpdate do expectedGoal ou achievedGoal, ou '--' se não existir
            };
        });
    }

    async loadFontOptions(idOffice: number) {
        debugger
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

    validateExpectedGoals(): boolean {
        const totalExpected = this.periodData.reduce((sum, data) => {
            const expectedGoals = Number(data.expectedGoals) || 0; // Converte para número ou usa 0 como padrão
            return sum + expectedGoals;
        }, 0);
        return totalExpected <= this.finalGoal;
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

    onDateChange(): void {
        const startDate = this.formIndicator.value.startDate;
        const endDate = this.formIndicator.value.endDate;
    
        // Verifica se as datas são válidas
        if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return;
        }
    
        // Verifica se a data de início é anterior à data de fim
        if (startDate > endDate) {
            this.messageSrv.add({
                severity: 'warn',
                summary: 'Atenção',
                detail: 'A data de início deve ser anterior à data de fim.'
            });
            return;
        }
    
        // Recalcula o periodData com base nas novas datas
        const years = this.getYearsBetweenDates(startDate, endDate);
        this.periodList = this.formatPeriod(years, this.selectedPeriodicity || 'ANUAL'); // Usa 'ANUAL' como padrão
        this.periodData = this.periodList.map(period => ({
            period: period,
            expectedGoals: 0,
            achievedGoals: 0,
            measure: this.selectedMeasure || '--',
            lastUpdate: '--'
        }));
    
        // Força a renderização da tabela
        this.cdr.detectChanges();
    }

    onExpectedGoalChange(data: any): void {
        data.lastUpdate = this.getCurrentDate();
        this.formIndicator.markAsDirty();
        
        if (!this.validateExpectedGoals()) {
            this.messageSrv.add({ 
                severity: 'warn', 
                summary: 'Sucesso', 
                detail: 'A soma das metas previstas ultrapassou a meta finalística.' 
            });
            this.saveButton.hideButton()
        } else {
            this.saveButton.showButton()
        }
    }

    onAchievedGoalChange(data: any) {
        this.formIndicator.markAsDirty();
        data.lastUpdate = this.getCurrentDate();
        this.saveButton.showButton();
    }

    onFinalGoalChange(event: any): void {
        const value = event.target.value
        this.finalGoal = +value;
    }

    setFormIndicator() {
        // Converte as datas para o tipo Date
        const startDate = this.indicator.startDate ? this.formatDate(this.indicator.startDate) : null;
        const endDate = this.indicator.endDate ? this.formatDate(this.indicator.endDate) : null;
    
        this.formIndicator.reset({
            name: this.indicator.name,
            description: this.indicator.description,
            source: this.sourceOptions.find(item => item.name == this.indicator.source)?.name,
            measure: this.indicator.measure,
            finalGoal: this.indicator.finalGoal,
            startDate: startDate, // Objeto Date ou null
            endDate: endDate,     // Objeto Date ou null
            periodicity: this.periodicityOptions.find(item => item.value === this.indicator.periodicity)?.value,
            expectedGoals: this.indicator.expectedGoals,
            achievedGoals: this.indicator.achievedGoals,
            lastUpdate: this.indicator.lastUpdate
        });
    
        // Recalcula o periodData com base nas datas do indicador
        if (startDate && endDate) {
            this.onDateChange();
        }
    
        this.finalGoal = this.indicator.finalGoal;
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
                key: 'indicators',
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
            this.periodData = this.periodList.map(period => ({
                period: period,
                expectedGoals: 0,
                achievedGoals: 0,
                measure: this.selectedMeasure || '--',
                lastUpdate: '--'
            }));
        }
    }

    async saveIndicator() {
        if (!this.validateExpectedGoals()) {
            this.messageSrv.add({ severity: 'warn', summary: 'Atenção', detail: 'A soma das metas previstas ultrapassou a meta finalística.'});
            return;
        }
    
        this.cancelButton.hideButton();
        this.formIsSaving = true;
    
        const expectedGoals = this.periodData.map(data => ({
            period: String(data.period),
            value: Number(data.expectedGoals) || 0,
            lastUpdate: data.lastUpdate
        }));
    
        const achievedGoals = this.periodData.map(data => ({
            period: String(data.period),
            value: Number(data.achievedGoals) || 0,
            lastUpdate: data.lastUpdate
        }));
    
        this.updateDate = this.getCurrentDate();
    
        const sender: IIndicator = {
            id: this.idIndicator,
            idWorkpack: this.idWorkpack,
            name: this.formIndicator.controls.name.value,
            description: this.formIndicator.controls.description.value,
            source: this.formIndicator.controls.source.value,
            measure: this.formIndicator.controls.measure.value,
            finalGoal: this.formIndicator.controls.finalGoal.value,
            periodicity: this.formIndicator.controls.periodicity.value,
            startDate: this.formIndicator.controls.startDate.value,
            endDate: this.formIndicator.controls.endDate.value,
            expectedGoals: expectedGoals,
            achievedGoals: achievedGoals,
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
                finalGoal: "",
                periodicity: null
            })
        }
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

        // Se já for um objeto Date, retorna diretamente
        if (date instanceof Date) {
            return date;
        }

        // Se for uma string no formato ISO 8601 (2022-02-28T03:00:00.000Z)
        if (typeof date === 'string' && date.includes('T')) {
            return new Date(date); // Converte a string ISO 8601 para Date
        }

        // Se for uma string no formato "dd/mm/yyyy"
        if (typeof date === 'string') {
            const [day, month, year] = date.split('/');
            if (day && month && year) {
                return new Date(+year, +month - 1, +day); // Mês é base 0 no JavaScript
            }
        }

        return null; // Retorna null se a data for inválida
    }
}