import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PaginatorModule } from 'primeng/paginator';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { Loader } from '../../../components/loader/loader';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService } from '../../../services/api.service';

interface Location {
  name: string;
  code: string;
}

interface Beneficiary {
  tashId: number;
  taskType: string;
  householdNumber: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  age: number;
  phoneNumber: string;
  state: string;
  county: string;
  payam: string;
  boma: string;
}

@Component({
  selector: 'app-beneficiary-edit-approval-list',
  templateUrl: './beneficiary-edit-approval-list.html',
  styleUrl: './beneficiary-edit-approval-list.scss',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    PaginatorModule,
    BreadcrumbModule,
    InputTextModule,
    TooltipModule,
    FloatLabelModule,
    SelectModule,
    Loader,
    RouterModule,
  ],
  providers: [MessageService, ConfirmationService],
})
export class BeneficiaryEditApprovalList implements OnInit {
  isLoading: boolean = true;
  bid!: string;
  mode: 'edit' | 'migrate' | 'create' | 'archive' | undefined;
  searchForm!: FormGroup;
  states: Location[] = [];
  counties: Location[] = [];
  payams: Location[] = [];
  bomas: Location[] = [];
  beneficiaries: Beneficiary[] = [];
  breadcrumbItems: any[] = [];
  breadcrumbHome: any;
  currentPage = 0;
  pageSize = 10;
  advanceSearchPanelVisible: boolean = false;
  totalRecords = 0;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.bid = this.route.snapshot.paramMap.get('bid')!;
    this.mode = this.route.snapshot.queryParamMap.get('mode') as any;
    this.initForm();
    this.loadBeneficiaries();
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Beneficiary List' }];
  }

  initForm() {
    this.searchForm = this.fb.group({
      // householdNumber: [''],
      // firstName: [''],
      // middleName: [''],
      // lastName: [''],
      // phoneNumber: [''],
      // state: [null],
      // county: [null],
      // payam: [null],
      // boma: [null],
      taskType: [null],
      approvalStatus: [null],
    });
  }


  loadBeneficiaries() {
    this.isLoading = true;

    const payload = {
      ...this.searchForm.value,
      approvalStatus: this.searchForm.value.approvalStatus ?? null,
      page: this.currentPage,
      size: this.pageSize,
    };
    this.apiService
      .POST('/api/approval/taskList', payload)
      .then((res: any) => {
        // response -> approvalTaskList
        this.beneficiaries = res.data?.approvalTaskList || [];
        this.totalRecords = res.data?.total || 0;
      })
      .catch((err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load beneficiaries',
        });
        console.error(err);
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  get paginatedBeneficiaries(): Beneficiary[] {
    const start = this.currentPage * this.pageSize;
    return this.beneficiaries.slice(start, start + this.pageSize);
  }

  onPageChange(event: any) {
    this.currentPage = event.page;   // event.page = 0-based index
    this.pageSize = event.rows;
    this.loadBeneficiaries();        // fetch new page from API
  }

  searchBeneficiaries() {
    if (!this.searchForm.valid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fill required fields before searching',
      });
      return;
    }

    // Build payload according to ApprovalTaskSearchRequest
    const payload = {
      taskType: this.searchForm.value.taskType || null,   // "BENEFICIARY_EDIT" etc.
      approvalStatus: this.searchForm.value.approvalStatus || null,
      page: this.currentPage,   // 🔹 hook into your paginator
      size: this.pageSize
    };

    this.isLoading = true;
    this.apiService
      .POST('/api/approval/taskList', payload)
      .then((res: any) => {
        this.beneficiaries = res.data?.approvalTaskList || [];
        this.messageService.add({
          severity: 'success',
          summary: 'Search Complete',
          detail: `Found ${this.beneficiaries.length} task(s)`,
        });
      })
      .catch((err: any) => {
        console.error('Search failed:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load approval tasks',
        });
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }


  resetForm() {
    this.searchForm.reset();
  }

  /*editBeneficiary(b: Beneficiary) {
    const bid = b?.householdNumber;

    if (!bid) {
      console.error('Edit clicked, but b.householdNumber is missing:', b);
      return;
    }

    this.router.navigate(['/private/beneficiary/edit', String(bid)]);
  }*/

  /*migrateBeneficiary(b: Beneficiary) {
    const bid = b?.householdNumber;

    if (!bid) {
      console.error('Migrate clicked, but b.householdNumber is missing:', b);
      return;
    }

    this.router.navigate(['/private/beneficiary/migration', String(bid)]);
  }*/

  beneficiaryDetails(b: Beneficiary) {
    const bid = b?.householdNumber;
    if (!bid) {
      console.error('Edit clicked, but b.householdNumber is missing:', b);
      return;
    }

    this.router.navigate(['/beneficiary/details', String(bid)]);
  }

  /*deleteBeneficiary(beneficiary: Beneficiary) {
    this.confirmationService.confirm({
      message: `Are you sure you want to archive ${beneficiary.firstName} ${beneficiary.lastName}?`,
      header: 'Confirm',
      icon: 'fas fa-warning',
      accept: () => {
        this.beneficiaries = this.beneficiaries.filter(
          (b) => b.householdNumber !== beneficiary.householdNumber
        );
        this.messageService.add({
          severity: 'success',
          summary: 'Archived',
          detail: 'Beneficiary archived successfully',
        });
      },
    });
  }*/

  getFullName(beneficiary: Beneficiary): string {
    return [beneficiary.firstName, beneficiary.middleName, beneficiary.lastName]
      .filter(Boolean)
      .join(' ');
  }

  approveTask(b: any) {
    console.log(b);

    if (!b?.id) {
      console.error('Approve clicked, but task id is missing:', b);
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to approve task #${b.id}?`,
      header: 'Confirm Approval',
      icon: 'fas fa-check-circle',
      rejectButtonProps: {
        severity: 'danger',
      },
      accept: () => {
        const payload = {
          approvalTaskId: b.id,
          approved: true,
        };

        this.apiService
          .POST('/api/approval/doApprove', payload)
          .then(() => {
            this.messageService.add({
              severity: 'success',
              summary: 'Approved',
              detail: `Task #${b.id} approved successfully.`,
            });
            this.loadBeneficiaries();
          })
          .catch((err: any) => {
            console.error(err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to approve task',
            });
          });
      },
    });
  }

  rejectTask(b: any) {
    if (!b?.id) {
      console.error('Reject clicked, but task id is missing:', b);
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to reject task #${b.id}?`,
      header: 'Confirm Rejection',
      icon: 'fas fa-ban',
      rejectButtonProps: {
        severity: 'danger',
      },
      accept: () => {
        const payload = {
          approvalTaskId: b.id,
          approved: false,
        };

        this.apiService
          .POST('/api/approval/doApprove', payload)
          .then(() => {
            this.messageService.add({
              severity: 'warn',
              summary: 'Rejected',
              detail: `Task #${b.id} rejected successfully.`,
            });
            this.loadBeneficiaries();
          })
          .catch((err: any) => {
            console.error(err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to reject task',
            });
          });
      },
    });
  }

  viewTask(b: any) {
    if (!b?.id) {
      console.error('View clicked, but task id is missing:', b);
      return;
    }

    this.router.navigate(['/beneficiary/details', String(b.id)], {
      queryParams: { taskMode: true },
    });
  }
}
