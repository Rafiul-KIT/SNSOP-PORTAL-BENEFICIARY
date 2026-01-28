import { ChangeDetectorRef, Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MenuItem, MessageService, ConfirmationService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { ApiService } from '../../../services/api.service';
import { LookupItem, LookupService } from '../../../services/lookup.service';
import { LoadingSpinner } from '../../../components/loading-spinner/loading-spinner';
import { Loader } from '../../../components/loader/loader';

export interface ReportType {
  id: number;
  name: string;
  endpoint: string;
  icon: string;
  description: string;
}

export interface AsyncReportItem {
  id: string;
  reportType: string;
  reportName: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  errorMessage?: string;
  parameters?: any;
  progress?: number;
}

interface ReportStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  failed: number;
}

@Component({
  selector: 'app-async-report-generation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    BreadcrumbModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressBarModule,
    SelectModule,
    FloatLabelModule,
    InputTextModule,
    TagModule,
    PaginatorModule,
    LoadingSpinner,
    Loader
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './async-report-generation.html',
  styleUrl: './async-report-generation.scss',
})
export class AsyncReportGeneration implements OnInit, OnDestroy {
  // Breadcrumb
  items: MenuItem[] | undefined;
  home: MenuItem | undefined;

  // Loading states
  isLoading: boolean = true;
  isGenerating: boolean = false;

  // Report types dropdown
  reportTypes: ReportType[] = [
    {
      id: 1,
      name: 'Boma Wise Beneficiary List Report',
      endpoint: 'api/report/async/household-report',
      icon: 'fas fa-users',
      description: 'Generate beneficiary list by geographic location'
    },
    {
      id: 2,
      name: 'Staff Wise Registration Report',
      endpoint: 'api/report/async/staff-report',
      icon: 'fas fa-user-tie',
      description: 'Generate registration report by staff member'
    },
    {
      id: 5,
      name: 'Age Group Wise Report',
      endpoint: 'api/report/async/age-group-report',
      icon: 'fas fa-chart-pie',
      description: 'Generate report grouped by age ranges'
    },
    {
      id: 6,
      name: 'Households Interested in Component 2',
      endpoint: 'api/report/async/household-component2-report',
      icon: 'fas fa-home',
      description: 'Generate households interested in Component 2'
    },
    {
      id: 7,
      name: 'Biometric Match List Report',
      endpoint: 'api/report/async/afis-match-report',
      icon: 'fas fa-fingerprint',
      description: 'Generate biometric matching results report'
    },
    {
      id: 9,
      name: 'Reconciliation Detail Report',
      endpoint: 'api/report/async/reconciled-summary-report',
      icon: 'fas fa-file-invoice-dollar',
      description: 'Generate detailed reconciliation report'
    },
    {
      id: 10,
      name: 'Reconciliation Summary Report',
      endpoint: 'api/report/async/reconciliation-summary-count-report',
      icon: 'fas fa-calculator',
      description: 'Generate reconciliation summary counts'
    },
  ];

  selectedReportType: ReportType | null = null;
  reportForm: FormGroup = new FormGroup({});

  // Lookup data for cascading dropdowns
  stateList: LookupItem[] = [];
  countyList: LookupItem[] = [];
  payamList: LookupItem[] = [];
  bomaList: LookupItem[] = [];
  userList: any[] = [];

  // Selected dropdown values for p-select
  selectedState: LookupItem | null = null;
  selectedCounty: LookupItem | null = null;
  selectedPayam: LookupItem | null = null;
  selectedBoma: LookupItem | null = null;

  // Generated reports list
  asyncReports = signal<AsyncReportItem[]>([]);

  // Report statistics
  reportStats = signal<ReportStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    failed: 0
  });

  // Pagination
  pageSize: number = 10;
  currentPage: number = 0;
  totalRecords: number = 0;

  constructor(
    private apiService: ApiService,
    public lookupService: LookupService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.home = {
      label: '',
      icon: 'fas fa-home me-2',
      routerLink: '/'
    };
    this.items = [{ label: 'Async Report Generation', icon: 'fas fa-file-export me-2' }];

    // Load initial data
    this.loadInitialData();
  }

  ngOnDestroy(): void {
  }

  private loadInitialData(): void {
    // Load states if not already loaded
    this.lookupService.getOrFetchStateList().then((states) => {
      this.stateList = states;
      this.isLoading = false;
      this.loadAsyncReports();
      this.cdr.markForCheck();
    }).catch(() => {
      this.isLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load initial data'
      });
      this.cdr.markForCheck();
    });
  }

  onReportTypeChange(selectedReport: ReportType): void {
    this.selectedReportType = selectedReport;

    if (this.selectedReportType) {
      this.buildFormForReportType(this.selectedReportType.id);
    } else {
      this.reportForm = new FormGroup({});
    }

    // Reset cascading dropdowns
    this.countyList = [];
    this.payamList = [];
    this.bomaList = [];
    this.selectedState = null;
    this.selectedCounty = null;
    this.selectedPayam = null;
    this.selectedBoma = null;
  }

  private buildFormForReportType(reportTypeId: number): void {
    switch (reportTypeId) {
      case 1: // Boma Wise Beneficiary List
        this.reportForm = new FormGroup({
          stateId: new FormControl('', Validators.required),
          countyId: new FormControl('', Validators.required),
          payamId: new FormControl(''),
          bomaId: new FormControl(''),
          registrationPhase: new FormControl('')
        });
        break;

      case 2: // Staff Wise Registration
        this.getStaffList();
        this.reportForm = new FormGroup({
          fromDate: new FormControl('', Validators.required),
          toDate: new FormControl('', Validators.required),
          staffUserName: new FormControl('', Validators.required),
          registrationPhase: new FormControl('')
        });
        break;

      case 5: // Age Group Wise
        this.reportForm = new FormGroup({
          stateId: new FormControl('', Validators.required),
          countyId: new FormControl(''),
          payamId: new FormControl(''),
          bomaId: new FormControl(''),
          registrationPhase: new FormControl('')
        });
        break;

      case 6: // Households Interested in Component 2
        this.reportForm = new FormGroup({
          stateId: new FormControl('', Validators.required),
          countyId: new FormControl(''),
          payamId: new FormControl(''),
          bomaId: new FormControl(''),
          registrationPhase: new FormControl('')
        });
        break;

      case 7: // Biometric Match List
        this.reportForm = new FormGroup({
          registrationPhase: new FormControl('')
        });
        break;

      case 9: // Reconciliation Detail
        this.reportForm = new FormGroup({
          stateId: new FormControl('', Validators.required),
          countyId: new FormControl('', Validators.required),
          payamId: new FormControl('', Validators.required),
          bomaId: new FormControl('', Validators.required),
          scheme: new FormControl('ALL', Validators.required),
          paymentStatus: new FormControl('ALL', Validators.required),
          paymentCycle: new FormControl('1', Validators.required)
        });
        break;

      case 10: // Reconciliation Summary
        this.reportForm = new FormGroup({
          stateId: new FormControl('', Validators.required),
          countyId: new FormControl('', Validators.required),
          payamId: new FormControl('', Validators.required),
          bomaId: new FormControl(''),
          paymentCycle: new FormControl('1', Validators.required)
        });
        break;

      default:
        this.reportForm = new FormGroup({});
        break;
    }
  }

  getStaffList(): void {
    const payload = {
      page: 0,
      size: -1,
      sortColumn: 'ID',
      sortOrder: 'DESC'
    };
    this.apiService.POST('api/users/search', payload, 'alt').then(res => {
      if (res.status === 200) {
        this.userList = res.data.users || [];
      }
    }).catch(err => {
      console.error('Error fetching staff list:', err);
      this.userList = [];
    });
  }

  onStateChange(state: LookupItem): void {
    this.selectedState = state;
    this.reportForm.patchValue({ stateId: state?.id || '' });

    if (!state) {
      this.countyList = [];
      this.payamList = [];
      this.bomaList = [];
      this.selectedCounty = null;
      this.selectedPayam = null;
      this.selectedBoma = null;
      this.reportForm.patchValue({ countyId: '', payamId: '', bomaId: '' });
      return;
    }

    this.apiService.POST('api/lookup/geo/search', {
      lookupType: 'COUNTY',
      parentId: state.id,
      size: -1
    }).then(res => {
      if (res.status === 200) {
        this.countyList = res.data.lookups || [];
        this.payamList = [];
        this.bomaList = [];
        this.selectedCounty = null;
        this.selectedPayam = null;
        this.selectedBoma = null;
        this.reportForm.patchValue({ countyId: '', payamId: '', bomaId: '' });
      }
    }).catch(err => {
      console.error('Error fetching counties:', err);
      this.countyList = [];
    });
  }

  onCountyChange(county: LookupItem): void {
    this.selectedCounty = county;
    this.reportForm.patchValue({ countyId: county?.id || '' });

    if (!county) {
      this.payamList = [];
      this.bomaList = [];
      this.selectedPayam = null;
      this.selectedBoma = null;
      this.reportForm.patchValue({ payamId: '', bomaId: '' });
      return;
    }

    this.apiService.POST('api/lookup/geo/search', {
      lookupType: 'PAYAM',
      parentId: county.id,
      size: -1
    }).then(res => {
      if (res.status === 200) {
        this.payamList = res.data.lookups || [];
        this.bomaList = [];
        this.selectedPayam = null;
        this.selectedBoma = null;
        this.reportForm.patchValue({ payamId: '', bomaId: '' });
      }
    }).catch(err => {
      console.error('Error fetching payams:', err);
      this.payamList = [];
    });
  }

  onPayamChange(payam: LookupItem): void {
    this.selectedPayam = payam;
    this.reportForm.patchValue({ payamId: payam?.id || '' });

    if (!payam) {
      this.bomaList = [];
      this.selectedBoma = null;
      this.reportForm.patchValue({ bomaId: '' });
      return;
    }

    this.apiService.POST('api/lookup/geo/search', {
      lookupType: 'BOMA',
      parentId: payam.id,
      size: -1
    }).then(res => {
      if (res.status === 200) {
        this.bomaList = res.data.lookups || [];
        this.selectedBoma = null;
        this.reportForm.patchValue({ bomaId: '' });
      }
    }).catch(err => {
      console.error('Error fetching bomas:', err);
      this.bomaList = [];
    });
  }

  onBomaChange(boma: LookupItem): void {
    this.selectedBoma = boma;
    this.reportForm.patchValue({ bomaId: boma?.id || '' });
  }

  generateReport(): void {
    if (!this.selectedReportType) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select a report type first.'
      });
      return;
    }

    this.isGenerating = true;

    const payload = this.buildPayload();

    this.apiService.POST(this.selectedReportType.endpoint, payload)
      .then((res: any) => {
        if (res.status === 200 || res.status === 201) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Report generation started successfully!'
          });
          this.loadAsyncReports();
          this.resetForm();
        }
        this.isGenerating = false;
        this.cdr.markForCheck();
      })
      .catch((err: any) => {
        console.error('Error generating report:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to start report generation'
        });
        this.isGenerating = false;
        this.cdr.markForCheck();
      });
  }

  private buildPayload(): any {
    const formValue = this.reportForm.value;
    let payload: any = {};

    if (this.selectedReportType?.id === 2) {
      // Staff report - format dates
      payload = {
        ...formValue,
        fromDate: this.formatDateToDDMMYYYY(formValue.fromDate),
        toDate: this.formatDateToDDMMYYYY(formValue.toDate)
      };
    } else if (this.selectedReportType?.id === 9 || this.selectedReportType?.id === 10) {
      // Reconciliation reports - parse integers
      payload = {
        state: parseInt(formValue.stateId) || null,
        county: parseInt(formValue.countyId) || null,
        payam: parseInt(formValue.payamId) || null,
        boma: parseInt(formValue.bomaId) || null,
        paymentCycle: formValue.paymentCycle ? parseInt(formValue.paymentCycle, 10) : null
      };
      if (this.selectedReportType?.id === 9) {
        payload.scheme = formValue.scheme || null;
        payload.paymentStatus = formValue.paymentStatus || null;
      }
    } else {
      payload = { ...formValue };
    }

    return payload;
  }

  private formatDateToDDMMYYYY(date: string): string {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
  }

  loadAsyncReports(): void {
    this.apiService.GET('api/report/async/list')
      .then((res: any) => {
        if (res.status === 200 && res.data) {
          const reports = res.data.reports || res.data || [];
          const mappedReports = reports.map((report: any) => ({
            id: report.id,
            reportType: report.reportType,
            reportName: this.getReportNameByType(report.reportType),
            status: report.status,
            createdAt: report.createdAt,
            completedAt: report.completedAt,
            downloadUrl: report.downloadUrl,
            errorMessage: report.errorMessage,
            parameters: report.parameters,
            progress: report.progress || 0
          }));
          this.asyncReports.set(mappedReports);
          this.updateReportStats(mappedReports);
        }
        this.cdr.markForCheck();
      })
      .catch((err: any) => {
        console.error('Error loading async reports:', err);
        this.cdr.markForCheck();
      });
  }

  private updateReportStats(reports: AsyncReportItem[]): void {
    const stats: ReportStats = {
      total: reports.length,
      pending: reports.filter(r => r.status === 'PENDING').length,
      inProgress: reports.filter(r => r.status === 'IN_PROGRESS').length,
      completed: reports.filter(r => r.status === 'COMPLETED').length,
      failed: reports.filter(r => r.status === 'FAILED').length
    };
    this.reportStats.set(stats);
    this.totalRecords = reports.length;
  }

  private getReportNameByType(reportType: string): string {
    const type = this.reportTypes.find(rt => rt.endpoint.includes(reportType?.toLowerCase() || ''));
    return type?.name || reportType || 'Unknown Report';
  }

  downloadReport(report: AsyncReportItem): void {
    if (!report.downloadUrl) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Download URL not available'
      });
      return;
    }

    window.open(report.downloadUrl, '_blank');
    this.messageService.add({
      severity: 'info',
      summary: 'Download Started',
      detail: 'Your report download has started'
    });
  }

  confirmDelete(report: AsyncReportItem): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the report "${report.reportName}"?`,
      header: 'Confirm Delete',
      icon: 'fas fa-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-secondary p-button-sm',
      accept: () => {
        this.deleteReport(report);
      }
    });
  }

  deleteReport(report: AsyncReportItem): void {
    this.apiService.DELETE(`api/report/async/${report.id}`)
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Report deleted successfully'
        });
        this.loadAsyncReports();
      })
      .catch((err: any) => {
        console.error('Error deleting report:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete report'
        });
      });
  }

  resetForm(): void {
    this.selectedReportType = null;
    this.reportForm = new FormGroup({});
    this.countyList = [];
    this.payamList = [];
    this.bomaList = [];
    this.selectedState = null;
    this.selectedCounty = null;
    this.selectedPayam = null;
    this.selectedBoma = null;
  }

  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'PENDING':
        return 'warn';
      case 'FAILED':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'fas fa-check-circle';
      case 'IN_PROGRESS':
        return 'fas fa-spinner fa-spin';
      case 'PENDING':
        return 'fas fa-clock';
      case 'FAILED':
        return 'fas fa-times-circle';
      default:
        return 'fas fa-question-circle';
    }
  }

  refreshReports(): void {
    this.loadAsyncReports();
    this.messageService.add({
      severity: 'info',
      summary: 'Refreshed',
      detail: 'Report list refreshed'
    });
  }

  onPageChange(event: any): void {
    this.currentPage = event.page;
    this.pageSize = event.rows;
  }

  get paginatedReports(): AsyncReportItem[] {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return this.asyncReports().slice(start, end);
  }

  // Registration phase options for dropdown
  registrationPhaseOptions = [
    { id: '', name: 'All Phases' },
    { id: '0', name: 'PARENT' },
    { id: '1', name: 'AF' },

  ];

  // Scheme options
  schemeOptions = [
    { id: 'ALL', name: 'ALL' },
    { id: 'LIPW', name: 'LIPW' },
    { id: 'DIS', name: 'DIS' }
  ];

  // Payment status options
  paymentStatusOptions = [
    { id: 'ALL', name: 'ALL' },
    { id: 'PAID', name: 'Paid' },
    { id: 'UNPAID', name: 'Unpaid' }
  ];

  // Payment cycle options
  paymentCycleOptions = Array.from({ length: 9 }, (_, i) => ({
    id: String(i + 1),
    name: `Payment Cycle ${i + 1}`
  }));
}
