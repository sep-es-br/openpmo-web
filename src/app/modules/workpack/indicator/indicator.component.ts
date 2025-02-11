import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { MessageService, SelectItem } from "primeng/api";
import { Subject } from "rxjs";
import { filter, takeUntil } from "rxjs/operators";
import { CancelButtonComponent } from "src/app/shared/components/cancel-button/cancel-button.component";
import { SaveButtonComponent } from "src/app/shared/components/save-button/save-button.component";
import { ICard } from "src/app/shared/interfaces/ICard";
import { ICardItem } from "src/app/shared/interfaces/ICardItem";
import { IIndicator } from "src/app/shared/interfaces/IIndicator";
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
    styleUrls: ['./indicator.component.scss']
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
        { label: 'Semestral', value: "SEMESTRAL" },
        { label: 'Quadrimestral', value: "QUADRIMESTRAL" },
        { label: 'Trimestral', value: "TRIMESTRAL" },
        { label: 'Bimestral', value: "BIMESTRAL" },
        { label: 'Mensal', value: "MENSAL" },
        { label: 'Quinzenal', value: "QUINZENAL" },
        { label: 'Diário', value: "DIARIO" }
    ];

    sourceOptions: ISourceIndicators[] = [];
    selectedSource: string;
    selectedMeasure: string;
    selectedPeriodicity: string;

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
        await this.loadPropertiesIndicator();
        await this.loadFontOptions(this.idWorkpack);
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
        const result = this.idIndicator && await this.indicatorSrv.GetById(this.idIndicator);
        if (result.success) {
            this.indicator = result.data;

            await this.loadFontOptions(this.idWorkpack);

            this.setFormIndicator();

            console.log(this.indicator.source)
            console.log(this.sourceOptions)
        }
        if (!this.idIndicator) {
            this.cardIndicatorProperties.isLoading = false;
        }
    }

    async loadFontOptions(idWorkpack: number) {
        return new Promise<void>((resolve) => {
            this.pentahoSrv.getUoOptions(idWorkpack).subscribe(data => {
                this.sourceOptions = [
                    ...data.map(item => ({
                        name: item.name,
                        displayText: item.name
                    }))
                ];
                resolve();
            })
        })
    }

    setFormIndicator() {
        this.formIndicator.reset({
            name: this.indicator.name,
            description: this.indicator.description,
            source: this.sourceOptions.find(item => item.name == this.indicator.source)?.name,
            measure: this.indicator.measure,
            finalGoal: this.indicator.finalGoal,
            periodicity: this.periodicityOptions.find(item => item.value === this.indicator.periodicity)?.value
        })
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
        this.cancelButton.showButton();
        this.selectedPeriodicity = event.value;
    }

    async saveIndicator() {
        debugger
        this.cancelButton.hideButton();
        this.formIsSaving = true;

        const sender: IIndicator = {
            id: this.idIndicator,
            idWorkpack: this.idWorkpack,
            name: this.formIndicator.controls.name.value,
            description: this.formIndicator.controls.description.value,
            source: this.formIndicator.controls.source.value,
            measure: this.formIndicator.controls.measure.value,
            finalGoal: this.formIndicator.controls.finalGoal.value,
            periodicity: this.formIndicator.controls.periodicity.value
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
}