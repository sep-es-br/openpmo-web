import { takeUntil } from 'rxjs/operators';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TypePropertyModelEnum } from 'src/app/shared/enums/TypePropertyModelEnum';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService, SelectItem, SelectItemGroup } from 'primeng/api';
import { ScheduleService } from 'src/app/shared/services/schedule.service';

@Component({
  selector: 'app-property-selection',
  templateUrl: './property-selection.component.html',
  styleUrls: ['./property-selection.component.scss']
})
export class PropertySelectionComponent implements OnInit {

  @Input() property: PropertyTemplateModel;
  @Output() changed = new EventEmitter();
  type = TypePropertyModelEnum;
  responsive: boolean;
  $destroy = new Subject();
  language: string;
  possibleValuesOptions: (SelectItem | SelectItemGroup)[] = [];
  hasGroups = false;

  constructor(
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private scheduleSrv: ScheduleService,
    private confirmationService: ConfirmationService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.responsive = value;
    });
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.setLanguage(), 200);
    });
  }

  ngOnInit(): void {
    this.setLanguage();
    this.transformPossibleValues()
  }
  
  ngOnDestroy() {
    this.$destroy.complete();
    this.$destroy.subscribe();
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang;
  }

  transformPossibleValues(): void {
    if (!this.property?.possibleValues) {
      this.possibleValuesOptions = [];
      this.hasGroups = false;
      return;
    }

    const grouped: SelectItemGroup[] = [];
    const standalone: SelectItem[] = [];

    this.property.possibleValues.forEach(pv => {
      if (pv.label.includes('\\')) {
        const [groupNameRaw, itemNameRaw] = pv.label.split('\\');
        const groupName = groupNameRaw.trim();
        const itemName = itemNameRaw.trim();

        let group = grouped.find(g => g.label === groupName);
        if (!group) {
          group = { label: groupName, items: [] };
          grouped.push(group);
        }
        group.items.push({ label: itemName, value: pv.value });
      } else {
        const shouldDisable =
        pv.label.includes('Cancelada') ||
        (this.property.id == null && pv.label.includes('Concluída'));
        standalone.push({
          label: pv.label.trim(),
          value: pv.value,
          disabled: shouldDisable
        });
      }
    });

    this.possibleValuesOptions = [];

    this.possibleValuesOptions.push(...grouped);

    if (standalone.length) {
      this.possibleValuesOptions.push({
        label: 'Outros',
        items: standalone
      });
    }

    this.hasGroups = this.possibleValuesOptions.some(opt => 
      'items' in opt && 
      opt.items.length > 0 && 
      opt.label !== 'Outros'
    );

  }

  onSelectionChange(value: any) {
    if (this.property.name === 'Situação' && value === 'Concluída') {
      this.verifyDeliverable(this.property.id);
    }
    this.changed.emit(value);
  }
  
  async verifyDeliverable(deliverableId: number) {
    try {
      const result = await this.scheduleSrv.checkDeliverableComplete(deliverableId);
  
      if (!result.success || !result.data) {
        this.confirmationService.confirm({
          key: 'deliverableInfoConfirm',
          message: 'Para concluir uma entrega, deve-se atualizar o cronograma, registrando como realizado ao menos 100% do escopo planejado. A seleção "Concluída" será feita automaticamente pelo sistema.',
          icon: 'pi pi-exclamation-triangle',
          acceptLabel: 'OK',
          rejectVisible: false,
          accept: () => {
            this.property.value = this.property.defaultValue;
          }
        });
      }
    } catch (err) {
      this.property.value = this.property.defaultValue;
      console.error('Erro ao verificar deliverable, voltando para o default:', err);
    }
  }

}
