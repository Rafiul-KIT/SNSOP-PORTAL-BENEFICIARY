import { Component, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Router, ActivatedRoute } from '@angular/router';
import { TabPanel, TabsModule } from "primeng/tabs";
import { Toast } from "primeng/toast";
import { Breadcrumb } from "primeng/breadcrumb";
import { Loader } from "../../../components/loader/loader";
import { Button } from "primeng/button";

@Component({
  selector: 'app-beneficiary-migrate-approval-details',
  templateUrl: './beneficiary-migrate-approval-details.html',
  styleUrls: ['./beneficiary-migrate-approval-details.scss'],
  providers: [MessageService, ConfirmationService], // Ensure ConfirmationService is included here
  imports: [TabPanel, TabsModule, Toast, Breadcrumb, Loader, Button]
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
  
  items = [
    { label: 'Approval List', icon: 'fas fa-users me-2', routerLink: '/beneficiary-approval-list/edit' },
    { label: 'Beneficiary Details', icon: 'fas fa-user-cog me-2' },
  ];

  home = { icon: 'fas fa-home me-2', routerLink: '/' };
  beneficiaryPhoto = '/images/dummyHuman.jpg';

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,  // Ensure ConfirmationService is injected
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

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
      comment: this.approvalComment,
    };

    this.api.POST('/api/approval/doApprove', payload).then(() => {
      const life = 1200;
      this.messageService.add({
        severity: this.isApprove ? 'success' : 'warn',
        summary: this.isApprove ? 'Approved' : 'Rejected',
        detail: `Task #${this.taskId} ${this.isApprove ? 'approved' : 'rejected'} successfully.`,
        life,
      });
      this.isLoading = false;
      setTimeout(() => {
        this.router.navigate(['/beneficiary-approval-list/edit']);
      }, life);
    }).catch((err: any) => {
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
      const response = await this.api.GET(`/api/approval/details/${id}`);
      if (response.data) {
        this.oldDetails = response.data.oldBeneficiary;
        this.editedDetails = response.data.taskDetails;
        this.taskId = id;
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
}
