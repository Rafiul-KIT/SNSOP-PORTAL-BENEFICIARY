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
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { LoadingSpinner } from '../../../components/loading-spinner/loading-spinner';
import { Loader } from '../../../components/loader/loader';
import { ApiService } from '../../../services/api.service';
import { environment } from '../../../../environments/environment';

export interface ReportType {
  id: number;
  name: string;
  reportTypeEnum: string;
  icon: string;
  description: string;
}

export interface AsyncReportItem {
  requestId: string;
  reportType: string;
  reportName: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  completedAt?: string;
  filePath?: string;
  errorMessage?: string;
  parameters?: any;
  progress?: number;
  format?: string;
  fileSize?: number;
}

export interface LookupItem {
  id: number | string;
  name: string;
  [key: string]: any;
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
    DialogModule,
    ProgressBarModule,
    SelectModule,
    FloatLabelModule,
    InputTextModule,
    TagModule,
    PaginatorModule,

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
  isLoadingReports: boolean = false;

  // Report types dropdown
  reportTypes: ReportType[] = [
    {
      id: 1,
      name: 'Boma Wise Beneficiary List Report',
      reportTypeEnum: 'BOMA_WISE_BENEFICIARY_REPORT',
      icon: 'fas fa-users',
      description: 'Generate beneficiary list by geographic location'
    },
    // {
    //   id: 2,
    //   name: 'Staff Wise Registration Report',
    //   reportTypeEnum: 'STAFF_WISE_REGISTRATION_REPORT',
    //   icon: 'fas fa-user-tie',
    //   description: 'Generate registration report by staff member'
    // },
    // {
    //   id: 5,
    //   name: 'Age Group Wise Report',
    //   reportTypeEnum: 'AGE_GROUP_WISE_REPORT',
    //   icon: 'fas fa-chart-pie',
    //   description: 'Generate report grouped by age ranges'
    // },
    // {
    //   id: 6,
    //   name: 'Households Interested in Component 2',
    //   reportTypeEnum: 'HOUSEHOLD_COMPONENT2_REPORT',
    //   icon: 'fas fa-home',
    //   description: 'Generate households interested in Component 2'
    // },
    // {
    //   id: 7,
    //   name: 'Biometric Match List Report',
    //   reportTypeEnum: 'BIOMETRIC_MATCH_LIST_REPORT',
    //   icon: 'fas fa-fingerprint',
    //   description: 'Generate biometric matching results report'
    // },
    // {
    //   id: 9,
    //   name: 'Reconciliation Detail Report',
    //   reportTypeEnum: 'RECONCILIATION_DETAIL_REPORT',
    //   icon: 'fas fa-file-invoice-dollar',
    //   description: 'Generate detailed reconciliation report'
    // },
    // {
    //   id: 10,
    //   name: 'Reconciliation Summary Report',
    //   reportTypeEnum: 'RECONCILIATION_SUMMARY_COUNT_REPORT',
    //   icon: 'fas fa-calculator',
    //   description: 'Generate reconciliation summary counts'
    // },
  ];

  selectedReportType: ReportType | null = null;
  selectedFormat: string = 'EXCEL';
  reportForm: FormGroup = new FormGroup({});

  formatOptions = [
    { id: 'PDF', name: 'PDF' },
    { id: 'EXCEL', name: 'EXCEL' },
    { id: 'CSV', name: 'CSV' }
  ];

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

  // Download progress dialog
  showDownloadDialog: boolean = false;
  downloadProgressValue: number = 0;
  downloadingReportName: string = '';

  // Report statistics
  reportStats = signal<ReportStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    failed: 0
  });

  // Filters
  filterStatus: string = '';
  filterStartDate: string = '';
  filterEndDate: string = '';

  statusFilterOptions = [
    { id: '', name: 'All Status' },
    { id: 'PENDING', name: 'Pending' },
    { id: 'IN_PROGRESS', name: 'In Progress' },
    { id: 'COMPLETED', name: 'Completed' },
    { id: 'FAILED', name: 'Failed' },
    { id: 'CANCELLED', name: 'Cancelled' }
  ];

  // Pagination
  pageSize: number = 10;
  currentPage: number = 0;
  totalRecords: number = 0;

  constructor(
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.home = {
      label: '',
      icon: 'fas fa-home me-2',
      routerLink: '/'
    };
    this.items = [{ label: 'Async Report Generation', icon: 'fas fa-file-export me-2' }];
    this.loadInitialData();
  }

  ngOnDestroy(): void {
  }

  private async fetchStates(): Promise<LookupItem[]> {
    try {
        const response = await this.api.POST('api/lookup/geo/search', { lookupType: 'STATE', size: -1 });
        return response.data.lookups || [];
    } catch (err) {
        console.error('Error fetching states:', err);
        return [];
    }
  }

  private async loadInitialData(): Promise<void> {
    this.isLoading = true;
    try {
      this.stateList = await this.fetchStates();
      await this.loadAsyncReports();
    } catch (err) {
       this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load initial data'
      });
    } finally {
        this.isLoading = false;
        this.cdr.markForCheck();
    }
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

  async getStaffList(): Promise<void> {
    const payload = {
      page: 0,
      size: -1,
      sortColumn: 'ID',
      sortOrder: 'DESC'
    };
    try {
      const response = await this.api.POST('api/users/search', payload);
      this.userList = response.data.users || [];
    } catch (err) {
      console.error('Error fetching staff list:', err);
      this.userList = [];
    }
  }

  async onStateChange(state: LookupItem): Promise<void> {
    this.selectedState = state;
    this.reportForm.patchValue({ stateId: state?.id || '' });

    this.countyList = [];
    this.payamList = [];
    this.bomaList = [];
    this.selectedCounty = null;
    this.selectedPayam = null;
    this.selectedBoma = null;
    this.reportForm.patchValue({ countyId: '', payamId: '', bomaId: '' });

    if (!state) {
      return;
    }

    try {
      const response = await this.api.POST('api/lookup/geo/search', { lookupType: 'COUNTY', parentId: state.id, size: -1 });
      this.countyList = response.data.lookups || [];
    } catch (err) {
      console.error('Error fetching counties:', err);
      this.countyList = [];
    }
  }

  async onCountyChange(county: LookupItem): Promise<void> {
    this.selectedCounty = county;
    this.reportForm.patchValue({ countyId: county?.id || '' });

    this.payamList = [];
    this.bomaList = [];
    this.selectedPayam = null;
    this.selectedBoma = null;
    this.reportForm.patchValue({ payamId: '', bomaId: '' });

    if (!county) {
      return;
    }

    try {
      const response = await this.api.POST('api/lookup/geo/search', { lookupType: 'PAYAM', parentId: county.id, size: -1 });
      this.payamList = response.data.lookups || [];
    } catch (err) {
      console.error('Error fetching payams:', err);
      this.payamList = [];
    }
  }

  async onPayamChange(payam: LookupItem): Promise<void> {
    this.selectedPayam = payam;
    this.reportForm.patchValue({ payamId: payam?.id || '' });

    this.bomaList = [];
    this.selectedBoma = null;
    this.reportForm.patchValue({ bomaId: '' });

    if (!payam) {
      return;
    }

    try {
      const response = await this.api.POST('api/lookup/geo/search', { lookupType: 'BOMA', parentId: payam.id, size: -1 });
      this.bomaList = response.data.lookups || [];
    } catch (err) {
      console.error('Error fetching bomas:', err);
      this.bomaList = [];
    }
  }

  onBomaChange(boma: LookupItem): void {
    this.selectedBoma = boma;
    this.reportForm.patchValue({ bomaId: boma?.id || '' });
  }

  async generateReport(): Promise<void> {
    if (!this.selectedReportType) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select a report type first.'
      });
      return;
    }

    this.isGenerating = true;

    const parameters = this.buildReportParameters();
    const payload = {
      reportType: this.selectedReportType.reportTypeEnum,
      format: this.selectedFormat,
      parameters: parameters,
    };

    try {
      const response = await this.api.POST('api/reports', payload, 'report');

      if (response.status === 200 || response.status === 201 || response.status === 202) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Report generation started successfully!'
        });
        await this.loadAsyncReports();
        this.resetForm();
      } else {
        throw new Error(`HTTP Error: ${response.status}`);
      }
    } catch (err: any) {
      console.error('Error generating report:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err?.response?.data?.message || err.message || 'Failed to start report generation'
      });
    } finally {
      this.isGenerating = false;
      this.cdr.markForCheck();
    }
  }

  private buildReportParameters(): any {
    const formValue = this.reportForm.value;
    let payload: any = {};

    if (this.selectedReportType?.id === 2) {
      payload = {
        ...formValue,
        fromDate: this.formatDateToDDMMYYYY(formValue.fromDate),
        toDate: this.formatDateToDDMMYYYY(formValue.toDate)
      };
    } else if (this.selectedReportType?.id === 9 || this.selectedReportType?.id === 10) {
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

  private parseDateTime(value: any): string {
    if (!value) return '';
    if (Array.isArray(value)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = value;
      return new Date(year, month - 1, day, hour, minute, second).toISOString();
    }
    return value;
  }

  async loadAsyncReports(): Promise<void> {
    this.isLoadingReports = true;
    try {
      let response;

      const paginationParams = {
        page: this.currentPage,
        size: this.pageSize,
        // sort: 'createdAt,desc'
      };

      if (this.filterStatus) {
        response = await this.api.GET(`api/reports/status/${this.filterStatus}`, paginationParams, 'report');
      } else if (this.filterStartDate && this.filterEndDate) {
        response = await this.api.GET('api/reports/date-range', {
          startDate: new Date(this.filterStartDate).toISOString(),
          endDate: new Date(this.filterEndDate).toISOString(),
          ...paginationParams
        }, 'report');
      } else {
        response = await this.api.GET('api/reports/all', paginationParams, 'report');
      }

      const data = response.data;
      const reports = Array.isArray(data) ? data : data.content || [];
      this.totalRecords = data.totalElements ?? (Array.isArray(data) ? data.length : 0);
      const mappedReports: AsyncReportItem[] = reports.map((report: any) => ({
        requestId: report.id || report.requestId,
        reportType: report.reportType,
        reportName: this.getReportNameByType(report.reportType),
        status: report.status,
        createdAt: this.parseDateTime(report.createdAt),
        completedAt: this.parseDateTime(report.completedAt),
        filePath: report.filePath || report.downloadUrl,
        errorMessage: report.errorMessage,
        parameters: report.parameters,
        progress: report.progress || 0,
        format: report.format,
        fileSize: report.fileSize
      }));
      this.asyncReports.set(mappedReports);
      this.updateReportStats(mappedReports);
    } catch (err) {
      console.error('Error loading async reports:', err);
    } finally {
      this.isLoadingReports = false;
      this.cdr.markForCheck();
    }
  }

  onFilterStatusChange(): void {
    if (this.filterStatus) {
      this.filterStartDate = '';
      this.filterEndDate = '';
    }
    this.currentPage = 0;
    this.loadAsyncReports();
  }

  onDateRangeFilter(): void {
    if (this.filterStartDate && this.filterEndDate) {
      this.filterStatus = '';
      this.currentPage = 0;
      this.loadAsyncReports();
    }
  }

  clearFilters(): void {
    this.filterStatus = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.currentPage = 0;
    this.loadAsyncReports();
  }

  private updateReportStats(reports: AsyncReportItem[]): void {
    const stats: ReportStats = {
      total: this.totalRecords,
      pending: reports.filter(r => r.status === 'PENDING').length,
      inProgress: reports.filter(r => r.status === 'IN_PROGRESS').length,
      completed: reports.filter(r => r.status === 'COMPLETED').length,
      failed: reports.filter(r => r.status === 'FAILED').length
    };
    this.reportStats.set(stats);
  }

  private getReportNameByType(reportType: string): string {
    const type = this.reportTypes.find(rt => rt.reportTypeEnum === reportType);
    return type?.name || reportType || 'Unknown Report';
  }

  async downloadReport(report: AsyncReportItem): Promise<void> {
    if (!report.filePath) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'File path not available for this report.'
      });
      return;
    }

    const fileName = report.filePath.split(/[/\\]/).pop();

    if (!fileName) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Could not determine the filename to download.'
        });
        return;
    }

    // Show download progress dialog
    this.downloadingReportName = report.reportName || fileName;
    this.downloadProgressValue = 0;
    this.showDownloadDialog = true;
    this.cdr.markForCheck();

    try {
      const response = await this.api.GET(`api/reports/download/report/${fileName}`, undefined, 'report', {
        responseType: 'blob',
        onDownloadProgress: (progressEvent: any) => {
          if (progressEvent.total) {
            this.downloadProgressValue = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            this.cdr.markForCheck();
          }
        }
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const extMap: Record<string, string> = { PDF: 'pdf', EXCEL: 'xlsx', CSV: 'csv' };
      const formatKey = report.format ? report.format.toUpperCase() : '';
      const ext = extMap[formatKey] || report.format?.toLowerCase() || 'xlsx';
      link.download = `${report.reportName || fileName}.${ext}`;
      link.click();
      window.URL.revokeObjectURL(url);

      this.messageService.add({
        severity: 'info',
        summary: 'Download Complete',
        detail: 'Your report has been downloaded successfully'
      });
    } catch (err: any) {
      console.error('Error downloading report:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err?.response?.data?.message || err.message || 'Failed to download report'
      });
    } finally {
      this.showDownloadDialog = false;
      this.downloadProgressValue = 0;
      this.downloadingReportName = '';
      this.cdr.markForCheck();
    }
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

  async deleteReport(report: AsyncReportItem): Promise<void> {
    try {
      await this.api.DELETE(`api/reports/${report.requestId}`, 'report');
      this.messageService.add({
        severity: 'success',
        summary: 'Deleted',
        detail: 'Report deleted successfully'
      });
      await this.loadAsyncReports();
    } catch (err: any) {
      console.error('Error deleting report:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err?.response?.data?.message || err.message || 'Failed to delete report'
      });
    }
  }

  resetForm(): void {
    this.selectedReportType = null;
    this.selectedFormat = 'EXCEL';
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
    this.loadAsyncReports();
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
