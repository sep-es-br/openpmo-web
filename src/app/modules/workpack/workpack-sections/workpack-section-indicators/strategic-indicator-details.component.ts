import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { CancelButtonComponent } from '../../../../shared/components/cancel-button/cancel-button.component';
import { SaveButtonComponent } from '../../../../shared/components/save-button/save-button.component';
import { IStrategicIndicator, IStrategicIndicatorDetail, IndicatorService } from '../../../../shared/services/indicator.service';
import { ICard } from '../../../../shared/interfaces/ICard';
import { isStrategicProjectGoalValid } from './strategic-project-goal-validation';

@Component({
  selector: 'app-strategic-indicator-details',
  templateUrl: './strategic-indicator-details.component.html',
  styleUrls: ['./strategic-indicator-details.component.scss']
})
export class StrategicIndicatorDetailsComponent implements OnInit, OnDestroy {
  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;

  indicatorId: number;
  idWorkpack: number;
  idPlan: number;
  indicator: IStrategicIndicator;
  details: IStrategicIndicatorDetail[] = [];
  linkId: number;
  projectGoals: { [year: string]: number | null } = {};
  private originalProjectGoals: { [year: string]: number } = {};
  private touchedProjectGoalYears = new Set<string>();
  loading = true;
  saving = false;
  readonly cardSection: ICard = {
    cardTitle: 'properties',
    toggleable: false,
    initialStateToggle: false,
    collapseble: false
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private indicatorService: IndicatorService,
    private messageService: MessageService,
    private translateService: TranslateService,
    private elementRef: ElementRef
  ) {}

  async ngOnInit(): Promise<void> {
    this.elementRef.nativeElement.addEventListener('paste', this.preventExponentPaste, true);
    this.indicatorId = Number(this.route.snapshot.queryParamMap.get('indicatorId'));
    this.idWorkpack = Number(this.route.snapshot.queryParamMap.get('idWorkpack'));
    this.idPlan = Number(this.route.snapshot.queryParamMap.get('idPlan')) || undefined;

    try {
      if (!Number.isInteger(this.indicatorId) || this.indicatorId <= 0 || !this.idWorkpack) {
        throw new Error(this.translateService.instant('strategicIndicatorDetailsUnavailable'));
      }
      const [catalogResponse, detailsResponse, linksResponse] = await Promise.all([
        this.indicatorService.getStrategicIndicatorCatalog(),
        this.indicatorService.getStrategicIndicatorDetails([this.indicatorId]),
        this.indicatorService.getProjectIndicatorLinks(this.idWorkpack, 'STRATEGIC')
      ]);
      if (!catalogResponse?.success || !detailsResponse?.success || !linksResponse?.success) {
        throw new Error(catalogResponse?.message || detailsResponse?.message || linksResponse?.message || 'Indicator details unavailable');
      }
      this.indicator = (catalogResponse.data || []).find(item => item.indicatorId === this.indicatorId);
      this.details = (detailsResponse.data || [])
        .filter(item => item.indicatorId === this.indicatorId)
        .sort((left, right) => left.goalYear - right.goalYear);
      const linkedIndicator = (linksResponse.data || [])
        .find(link => link.externalId === `strategic:${this.indicatorId}` && link.active);
      if (!linkedIndicator) {
        throw new Error(this.translateService.instant('strategicIndicatorDetailsUnavailable'));
      }
      this.linkId = linkedIndicator.id;
      this.projectGoals = { ...(linkedIndicator.projectGoals || {}) };
      this.originalProjectGoals = { ...(linkedIndicator.projectGoals || {}) };
      if (!this.indicator || !this.details.length) {
        throw new Error(this.translateService.instant('strategicIndicatorDetailsUnavailable'));
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: this.translateService.instant('error'),
        detail: error?.error?.message || error?.message || this.translateService.instant('strategicIndicatorDetailsUnavailable')
      });
    } finally {
      this.loading = false;
      setTimeout(() => this.updateActionButtons(), 0);
    }
  }

  ngOnDestroy(): void {
    this.elementRef.nativeElement.removeEventListener('paste', this.preventExponentPaste, true);
  }

  async returnToIndicators(): Promise<void> {
    await this.router.navigate(['/workpack'], {
      queryParams: { id: this.idWorkpack, idPlan: this.idPlan },
      queryParamsHandling: 'merge'
    });
  }

  get source(): string {
    return this.details.find(item => !!item.source)?.source;
  }

  get unitOfMeasure(): string {
    return this.details.find(item => !!item.unitOfMeasure)?.unitOfMeasure;
  }

  getProjectGoalValue(year: number): number | null {
    return this.projectGoals[String(year)] ?? null;
  }

  setProjectGoalValue(year: number, value: number | null): void {
    this.projectGoals = { ...this.projectGoals, [String(year)]: value };
    this.updateActionButtons();
  }

  markProjectGoalTouched(year: number): void {
    this.touchedProjectGoalYears.add(String(year));
  }

  isProjectGoalChanged(year: number): boolean {
    const key = String(year);
    return (this.projectGoals[key] ?? null) !== (this.originalProjectGoals[key] ?? null);
  }

  shouldShowProjectGoalInvalid(goal: IStrategicIndicatorDetail): boolean {
    const year = String(goal.goalYear);
    return (this.touchedProjectGoalYears.has(year) || this.isProjectGoalChanged(goal.goalYear)) &&
      !this.isProjectGoalValid(goal);
  }

  isProjectGoalValid(goal: IStrategicIndicatorDetail): boolean {
    return isStrategicProjectGoalValid(
      this.getProjectGoalValue(goal.goalYear),
      goal.goalValue,
      goal.polarity
    );
  }

  get hasChanges(): boolean {
    return this.details.some(goal => this.isProjectGoalChanged(goal.goalYear));
  }

  private hasInvalidProjectGoals(): boolean {
    return !this.details.length || this.details.some(goal => !this.isProjectGoalValid(goal));
  }

  private updateActionButtons(): void {
    if (!this.saveButton || !this.cancelButton || this.loading) {
      return;
    }
    if (!this.hasChanges) {
      this.saveButton.hideButton();
      this.cancelButton.hideButton();
      return;
    }
    this.cancelButton.showButton();
    if (this.hasInvalidProjectGoals() || this.saving) {
      this.saveButton.hideButton();
    } else {
      this.saveButton.showButton();
    }
  }

  async saveProjectGoals(): Promise<void> {
    if (!this.linkId || !this.hasChanges || this.hasInvalidProjectGoals() || this.saving) {
      return;
    }
    this.saving = true;
    this.updateActionButtons();
    try {
      const projectGoals: { [year: string]: number } = {};
      this.details.forEach(goal => {
        const value = this.getProjectGoalValue(goal.goalYear);
        if (value != null) {
          projectGoals[String(goal.goalYear)] = value;
        }
      });
      const response = await this.indicatorService.updateProjectIndicatorLinkGoals(
        this.idWorkpack,
        this.linkId,
        projectGoals
      );
      if (!response?.success) {
        throw new Error(response?.message || 'Unable to update project goals');
      }
      this.projectGoals = { ...(response.data?.projectGoals || projectGoals) };
      this.originalProjectGoals = { ...this.projectGoals };
      this.touchedProjectGoalYears.clear();
      this.messageService.add({
        severity: 'success',
        summary: this.translateService.instant('success'),
        detail: this.translateService.instant('strategicProjectGoalsSaved')
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: this.translateService.instant('error'),
        detail: error?.error?.message || error?.message || this.translateService.instant('messages.catalogLoadError')
      });
    } finally {
      this.saving = false;
      this.updateActionButtons();
    }
  }

  private preventExponentPaste = (event: ClipboardEvent): void => {
    const target = event.target as HTMLElement;
    const pastedText = event.clipboardData?.getData('text') || '';
    if (target?.matches('input.strategic-project-goal-input') && /[eE]/.test(pastedText)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };
}
