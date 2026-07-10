import { ResponsiveService } from './../../../../../shared/services/responsive.service';
import { TypePropertyModelEnum } from './../../../../../shared/enums/TypePropertyModelEnum';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import {ConfigDataViewService} from "../../../../../shared/services/config-dataview.service";
import {takeUntil} from "rxjs/operators";
import {Subject} from "rxjs";
import {
  detectPpaWiring,
  filterDependentOptions,
  IPpaWiring,
  masterOptions,
  selectedProgramCodes
} from 'src/app/shared/utils/ppa-relationship.util';

@Component({
  selector: 'app-property-group',
  templateUrl: './property-group.component.html',
  styleUrls: ['./property-group.component.scss']
})
export class PropertyGroupComponent implements OnInit {

  @Input() groupProperty: PropertyTemplateModel;
  @Output() changed = new EventEmitter();

  types = TypePropertyModelEnum;
  responsive: boolean;
  $destroy = new Subject();
  ppaWiring: IPpaWiring;

  constructor(
    private responsiveSrv: ResponsiveService,
  ) {
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });

  }

  ngOnInit(): void {
    this.ppaWiring = detectPpaWiring(this.groupProperty);
    if (this.ppaWiring) {
      [this.ppaWiring.source, ...this.ppaWiring.dependents].forEach(property => {
        if (!property.allPossibleValues) {
          property.allPossibleValues = property.possibleValues;
        }
      });
      // Roda antes do ngOnInit dos filhos, então os selects já nascem filtrados.
      // Sem podar valores: abrir a tela não pode marcar o formulário como alterado.
      this.applyPpaFilter(false);
    }
  }

  onGroupedChanged(groupedProperty: PropertyTemplateModel, event: any) {
    if (this.ppaWiring && groupedProperty === this.ppaWiring.source) {
      this.applyPpaFilter(true);
    }
    this.changed.emit(event);
  }

  applyPpaFilter(prune: boolean) {
    const codes = selectedProgramCodes(this.ppaWiring.source);
    this.ppaWiring.dependents.forEach(dependent => {
      // Nova referência: o p-multiSelect só reprocessa [options] quando o array troca.
      dependent.possibleValues = filterDependentOptions(masterOptions(dependent), codes);
      if (prune && Array.isArray(dependent.value)) {
        const allowed = new Set(dependent.possibleValues.map(option => option.value));
        const kept = (dependent.value as string[]).filter(value => allowed.has(value));
        if (kept.length !== (dependent.value as string[]).length) {
          dependent.value = kept;
        }
      }
    });
  }

}
