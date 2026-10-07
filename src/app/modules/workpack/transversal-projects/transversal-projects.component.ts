import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { IEligibleProject } from 'src/app/shared/interfaces/ITransversal';
import { TransversalService } from 'src/app/shared/services/transversal.service';

@Component({
  selector: 'app-transversal-projects',
  templateUrl: './transversal-projects.component.html',
  styleUrls: ['./transversal-projects.component.scss']
})
export class TransversalProjectsComponent implements OnChanges {
  @Input() idTransversalProgram: number;

  eligibleProjects: IEligibleProject[] = [];
  includedProjects: IEligibleProject[] = [];
  selectedProjectId: number;
  isLoading = false;
  isSaving = false;

  constructor(private transversalSrv: TransversalService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.idTransversalProgram && this.idTransversalProgram) {
      this.loadProjects();
    }
  }

  async loadProjects(): Promise<void> {
    this.isLoading = true;
    try {
      const [eligible, included] = await Promise.all([
        this.transversalSrv.getEligibleProjects(this.idTransversalProgram),
        this.transversalSrv.getIncludedProjects(this.idTransversalProgram)
      ]);
      this.eligibleProjects = eligible?.success ? (eligible.data || []).map(project => ({
        ...project,
        displayName: project.fullName || project.name
      })) : [];
      this.includedProjects = included?.success ? included.data || [] : [];
      const includedIds = new Set(this.includedProjects.map(project => Number(project.idProject)));
      this.eligibleProjects = this.eligibleProjects.filter(project => !includedIds.has(Number(project.idProject)));
    } finally {
      this.isLoading = false;
    }
  }

  async includeSelected(): Promise<void> {
    if (!this.selectedProjectId || this.isSaving) {
      return;
    }
    this.isSaving = true;
    try {
      const result = await this.transversalSrv.includeProject(this.idTransversalProgram, this.selectedProjectId);
      if (result?.success) {
        this.selectedProjectId = undefined;
        await this.loadProjects();
      }
    } finally {
      this.isSaving = false;
    }
  }

  async remove(project: IEligibleProject): Promise<void> {
    if (this.isSaving) {
      return;
    }
    this.isSaving = true;
    try {
      const result = await this.transversalSrv.removeProject(this.idTransversalProgram, project.idProject);
      if (result?.success) {
        await this.loadProjects();
      }
    } finally {
      this.isSaving = false;
    }
  }
}
