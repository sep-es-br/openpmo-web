import { animate, style, transition, trigger } from "@angular/animations";
import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { resolve } from "dns";
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
import { AuthService } from "src/app/shared/services/auth.service";
import { BreadcrumbService } from "src/app/shared/services/breadcrumb.service";
import { IndicatorService } from "src/app/shared/services/indicator.service";
import { PentahoService } from "src/app/shared/services/pentaho.service";
import { ResponsiveService } from "src/app/shared/services/responsive.service";
import { WorkpackService } from "src/app/shared/services/workpack.service";

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
        private pentahoSrv: PentahoService
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
            periodicity: [null]
        });
        this.formIndicator.statusChanges.pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID')).subscribe(() => this.saveButton?.hideButton());
        this.formIndicator.valueChanges.pipe(takeUntil(this.$destroy), filter(() => this.formIndicator.dirty && this.formIndicator.valid)).subscribe(() => this.saveButton.showButton());
        this.formIndicator.valueChanges.pipe(takeUntil(this.$destroy), filter(() => this.formIndicator.dirty)).subscribe(() => this.cancelButton.showButton());
    }

    async ngOnInit() {
        this.idPlan = Number(localStorage.getItem('@currentPlan'));
        this.idOffice = Number(localStorage.getItem('@currentOffice'));
        await this.loadPropertiesIndicator();
        await this.loadFontOptions(this.idOffice);
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
            periodicity: [null]
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
            const result = await this.indicatorSrv.GetById(this.idIndicator);
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
        debugger
        if (!this.indicator) return;

        const allPeriods = [
            ...this.indicator.expectedGoals.map(g => g.period),
            ...this.indicator.achievedGoals.map(g => g.period)
        ];
        const uniquePeriods = Array.from(new Set(allPeriods)).sort();

        this.periodData = uniquePeriods.map(period => {
            return {
                period: period,
                expectedGoals: this.indicator.expectedGoals.find(g => g.period === period)?.value || 0,
                achievedGoals: this.indicator.achievedGoals.find(g => g.period === period)?.value || 0,
                measure: this.indicator.measure,
                lastUpdate: this.indicator.lastUpdate
            };
        });
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

    formatPeriod(periods: number[], periodicity: string): string[] {
        debugger
        if (periodicity === 'SEMESTRAL') {
            return periods.map(year => [`${year}/1`, `${year}/2`]).reduce((acc, val) => acc.concat(val), []);
        } else if (periodicity === 'ANUAL') {
            return periods.map(year => year.toString());
        }
        return [];
    }

    loadPeriodData(periodicity: string): void {
        debugger
        this.periodList = [];
        this.indicatorSrv.loadPeriodData(this.idWorkpack).subscribe({
            next: (result: any) => {

                const years = (result as {data: number[]}).data
                this.periodList = this.formatPeriod(years, periodicity);
                this.expectedGoals = new Array(this.periodList.length).fill(0);
                this.achievedGoals = new Array(this.periodList.length).fill(0);

            },
            error: (error) => {
                console.log('Erro ao carregar os períodos: ', error)
            }
        })
    }

    validateExpectedGoals(): boolean {
        const totalExpected = this.expectedGoals.reduce((sum, value) => sum + value, 0);
        return totalExpected <= this.finalGoal;
    }

    onExpectedGoalChange(): void {
        if (!this.validateExpectedGoals()) {
            this.messageSrv.add({ severity: 'warn', summary: 'Sucesso', detail: 'A soma das metas previstas ultrapassou a meta finalística.' });
        }
    }

    onFinalGoalChange(event: any): void {
        const value = event.target.value
        this.finalGoal = +value;
    }

    setFormIndicator() {
        this.formIndicator.reset({
            name: this.indicator.name,
            description: this.indicator.description,
            source: this.sourceOptions.find(item => item.name == this.indicator.source)?.name,
            measure: this.indicator.measure,
            finalGoal: this.indicator.finalGoal,
            periodicity: this.periodicityOptions.find(item => item.value === this.indicator.periodicity)?.value
        });
        this.finalGoal = this.indicator.finalGoal
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

    onPeriodicityChange(event: any) {
        debugger
        this.cancelButton.showButton();
        this.selectedPeriodicity = event.value;
        this.loadPeriodData(this.selectedPeriodicity);

        this.periodData = this.periodList.map(period => ({
            period: period,
            expectedGoals: 0,
            achievedGoals: 0,
            measure: this.selectedMeasure || '--',
            lastUpdate: '--'
        }));
    }

    async saveIndicator() {
        debugger
        if (!this.validateExpectedGoals()) {
            this.messageSrv.add({ severity: 'warn', summary: 'Atenção', detail: 'A soma das metas previstas ultrapassou a meta finalística.'})
            return;
        }

        this.cancelButton.hideButton();
        this.formIsSaving = true;

        const expectedGoals = this.periodList.map((period, index) => ({
            period: String(period),
            value: this.expectedGoals[index] || 0 
        }));

        const achievedGoals = this.periodList.map((period, index) => ({
            period: String(period),
            value: this.achievedGoals[index] || 0
        }))

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
            expectedGoals: expectedGoals,
            achievedGoals: achievedGoals,
            lastUpdate: this.updateDate
        };
        const put = !!this.idIndicator;
        const result = put ? await this.indicatorSrv.put(sender) : await this.indicatorSrv.post(sender);
        this.formIsSaving = false;
        if (result.success) {
            this.messageSrv.add({ severity: 'success', summary: 'Sucesso', detail: put ? 'Indicador atualizado com sucesso' : 'Indicador criado com sucesso' });
            this.router.navigate(['/workpack'],
                {
                    queryParams: {
                        id: this.idWorkpack,
                        idPlan: this.idPlan
                    }
                });
        }
    }

    handleOnCancel() {
        this.saveButton.hideButton();
        this.periodList = []
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
}