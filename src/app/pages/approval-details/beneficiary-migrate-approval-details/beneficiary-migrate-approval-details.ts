import { Component, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Router, ActivatedRoute } from '@angular/router';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { Loader } from '../../../components/loader/loader';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FormsModule } from '@angular/forms';
import { LookupService } from '../../../services/lookup.service';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-beneficiary-migrate-approval-details',
  templateUrl: './beneficiary-migrate-approval-details.html',
  styleUrls: ['./beneficiary-migrate-approval-details.scss'],
  providers: [MessageService, ConfirmationService], // Ensure ConfirmationService is included here
  imports: [
    CommonModule,
    FormsModule,
    TabsModule,
    ToastModule,
    BreadcrumbModule,
    Loader,
    ButtonModule,
    ConfirmDialogModule,
    TooltipModule,
    CardModule
  ],
  standalone: true
})
export class BeneficiaryMigrateApprovalDetails {
  approvalComment: string = '';
  isSubmitting = false;
  isLoading = true;
  isApprove: boolean = true;
  taskId: string | null = null;
  beneficiaryForm: any;
  oldDetails: any = {};
  editedDetails: any = {};
  approvalStatus: string = '';

  items = [
    { label: 'Approval List', icon: 'fas fa-users me-2', routerLink: '/beneficiary-approval/list' },
    { label: 'Beneficiary Migration Details', icon: 'fas fa-user-cog me-2' },
  ];

  home = { icon: 'fas fa-home me-2', routerLink: '/' };
  beneficiaryPhoto = 'images/dummyHuman.jpg';

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private messageService: MessageService,
    private lookup: LookupService,
    private confirmationService: ConfirmationService,  // Ensure ConfirmationService is injected
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  differences: Record<string, string> = {};
  private diffKeySet = new Set<string>();

  /** Normalize a path to a few common candidates so we’re resilient to dot/bracket styles. */
  private candidatesFor(path: string): string[] {
    const dot = path.replace(/\[(\d+)\]/g, '.$1');
    const bracket = path.replace(/\.([0-9]+)/g, '[$1]');
    return [path, dot, bracket];
  }

  private setDifferences(d: Record<string, string> | undefined) {
    this.differences = d || {};
    this.diffKeySet = new Set(Object.keys(this.differences));
  }

  /** True if ANY of the given paths changed. */
  isChanged(paths: string | string[]): boolean {
    const arr = Array.isArray(paths) ? paths : [paths];
    return arr.some(p => this.candidatesFor(p).some(c => this.diffKeySet.has(c)));
  }

  /** Return a tooltip string (merged if multiple) for changed paths. */
  diffTip(paths: string | string[]): string | undefined {
    const arr = Array.isArray(paths) ? paths : [paths];
    const msgs = new Set<string>();   // ✅ avoid duplicates
    for (const p of arr) {
      for (const c of this.candidatesFor(p)) {
        const v = this.differences[c];
        if (v) msgs.add(`${c}: ${v}`);
      }
    }
    return msgs.size ? Array.from(msgs).join('\n') : undefined;
  }

  /** Convenience for ngClass. */
  changedClass(paths: string | string[]): string {
    return this.isChanged(paths) ? 'changed' : '';
  }

  openApprovalDialog(isApprove: boolean) {
    if (!this.taskId) {
      console.error('Task id missing');
      return;
    }

    this.isApprove = isApprove;
    this.approvalComment = '';

    this.confirmationService.confirm({
      key: 'approvalDialog',
      header: isApprove ? 'Confirm Approval' : 'Confirm Rejection',
      icon: isApprove ? 'fas fa-check-circle' : 'fas fa-ban',
      acceptButtonProps: { label: 'Yes', severity: 'success', disabled: this.isLoading },
      rejectButtonProps: { label: 'No', severity: 'danger', disabled: this.isLoading },
      accept: () => this.handleApproval(),
    });
  }

  private handleApproval() {
    if (!this.isApprove && (!this.approvalComment || !this.approvalComment.trim())) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Comment Required',
        detail: 'Please provide a reason for rejection before proceeding.',
      });
      return;
    }

    this.isLoading = true;

    const payload = {
      approvalTaskId: this.taskId,
      approved: this.isApprove,
      comment: this.approvalComment
    };

    this.api.POST('/api/approval/doApprove', payload)
      .then(() => {
        const life = 1200;
        this.messageService.add({
          severity: this.isApprove ? 'success' : 'warn',
          summary: this.isApprove ? 'Approved' : 'Rejected',
          detail: `Migration request for ${this.editedDetails?.applicationId} ${this.isApprove ? 'approved' : 'rejected'} successfully.`,
          life,
        });
        this.isLoading = false;
        setTimeout(() => {
          this.router.navigate(['/beneficiary-approval/list']);
        }, life);
      })
      .catch((err: any) => {
        console.error(err);
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to ${this.isApprove ? 'approve' : 'reject'} task`,
        });
      });
  }


  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const isTaskMode = (this.route.snapshot.queryParamMap.get('taskMode') || '').toLowerCase() === 'true';
    this.isLoading = true;

    try {
      await Promise.all([
        this.lookup.getOrFetchStateList(),
        this.lookup.fetchAllCountyList(),
        this.lookup.fetchAllPayamList(),
        this.lookup.fetchAllBomaList(),
      ]);

      const response = await this.api.GET(`/api/approval/details/${id}`);
      this.approvalStatus = response?.data?.approvalStatus || '';
      if (response.data) {
        this.oldDetails = response.data.oldBeneficiary;
        this.editedDetails = response.data.taskDetails || response.data.addressMigrationDetails || {};
        this.taskId = id;
        this.setDifferences(response.data.differences);
      }
    } catch (err) {
      console.error(err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load task details.',
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
  getStateName(id: string) {
    return this.lookup.getStateNameById(id);
  }

  getCountyName(id: string) {
    return (
      this.lookup.getAllCountyList().find((c) => String(c.id) === String(id))
        ?.name || '--'
    );
  }

  getPayamName(id: string) {
    return (
      this.lookup.getAllPayamList().find((p) => String(p.id) === String(id))
        ?.name || '--'
    );
  }

  getBomaName(id: string) {
    return (
      this.lookup.getAllBomaList().find((b) => String(b.id) === String(id))
        ?.name || '--'
    );
  }

  getPhotoSrc(photoData?: string): string {
  if (!photoData) {
    return 'images/dummyHuman.jpg';
  }

  // Ensure it starts with proper base64 prefix
  if (photoData.startsWith('data:image')) {
    return photoData;
  }

  return `data:image/jpeg;base64,${photoData}`;
}
}
