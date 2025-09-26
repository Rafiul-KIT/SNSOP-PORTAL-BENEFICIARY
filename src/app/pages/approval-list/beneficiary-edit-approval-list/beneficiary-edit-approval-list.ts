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
    this.loadBeneficiaries(this.currentPage, this.pageSize);
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Approval List' }];
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
      applicationId: null,
    });
  }


loadBeneficiaries(page: number, size: number) {
  this.isLoading = true;

  const payload = {
    ...this.searchForm.value,
    approvalStatus: this.searchForm.value.approvalStatus ?? null,
    page: page,  // Correct page number
    size: size,  // Correct page size
  };

  this.apiService
    .POST('/api/approval/taskList', payload)
    .then((res: any) => {
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


 

onPageChange(event: any) {
  this.currentPage = event.page; // Set the current page to the new page (0-based index)
  this.pageSize = event.rows;    // Set the page size
  console.log('Page Changed:', this.currentPage, this.pageSize);
  this.loadBeneficiaries(this.currentPage, this.pageSize); // Reload data with new pagination
}



  searchBeneficiaries() {
    this.loadBeneficiaries(this.currentPage, this.pageSize); 
  }


resetForm() {
  this.searchForm.reset();
  this.currentPage = 0;  // Reset to page 0 when form is reset
  this.loadBeneficiaries(this.currentPage, this.pageSize);  // Load with the reset page
}


  beneficiaryDetails(b: Beneficiary) {
    const bid = b?.householdNumber;
    if (!bid) {
      console.error('Edit clicked, but b.householdNumber is missing:', b);
      return;
    }

    this.router.navigate(['/beneficiary/details', String(bid)]);
  }

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
            this.loadBeneficiaries(this.currentPage, this.pageSize);
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
            this.loadBeneficiaries(this.currentPage, this.pageSize);
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

    this.router.navigate(['/beneficiary-edit-details', String(b.id)], {
      queryParams: { taskMode: true },
    });
  }
}
