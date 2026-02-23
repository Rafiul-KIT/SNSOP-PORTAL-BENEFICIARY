import { QrInputDirective } from './../../../directives/qr-input.directive';
import { QrScannerComponent } from './../../../components/qr-scanner/qr-scanner.component';
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
import { LookupService, LookupItem } from '../../../services/lookup.service';

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
    QrScannerComponent,
    QrInputDirective,
  ],
  providers: [MessageService, ConfirmationService],
})
export class BeneficiaryEditApprovalList implements OnInit {
  isLoading: boolean = true;
  bid!: string;
  mode: 'edit' | 'migrate' | 'create' | 'archive' | undefined;
  searchForm!: FormGroup;
  states: LookupItem[] = [];
  counties: LookupItem[] = [];
  payams: LookupItem[] = [];
  bomas: LookupItem[] = [];
  beneficiaries: Beneficiary[] = [];
  breadcrumbItems: any[] = [];
  breadcrumbHome: any;
  currentPage = 0;
  pageSize = 10;
  advanceSearchPanelVisible: boolean = false;
  totalRecords = 0;
  isScannerVisible = false;
  private readonly FILTER_STORAGE_KEY =
    'beneficiary_edit_approval_list_filters';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private lookup: LookupService
  ) {}

  private saveFiltersToStorage(): void {
    const state = {
      filters: this.searchForm.getRawValue(),
      currentPage: this.currentPage,
      pageSize: this.pageSize,
      advanceSearchPanelVisible: this.advanceSearchPanelVisible,
    };
    sessionStorage.setItem(this.FILTER_STORAGE_KEY, JSON.stringify(state));
  }

  private async restoreFiltersFromStorage(): Promise<boolean> {
    const stored = sessionStorage.getItem(this.FILTER_STORAGE_KEY);
    if (!stored) return false;

    sessionStorage.removeItem(this.FILTER_STORAGE_KEY);

    try {
      const savedState = JSON.parse(stored);
      const filters = savedState.filters;

      this.currentPage = savedState.currentPage ?? 0;
      this.pageSize = savedState.pageSize ?? 10;
      this.advanceSearchPanelVisible =
        savedState.advanceSearchPanelVisible ?? false;

      // Restore non-geo fields
      this.searchForm.patchValue({
        applicationId: filters.applicationId,
        approvalStatus: filters.approvalStatus,
        taskType: filters.taskType,
      });

      // Restore geo fields with cascading
      if (filters.state) {
        const stateObj = this.states.find((s) => s.id === filters.state.id);
        if (stateObj) {
          this.searchForm.patchValue({ state: stateObj });
          await this.onStateChange(stateObj);

          if (filters.county) {
            const countyObj = this.counties.find(
              (c) => c.id === filters.county.id
            );
            if (countyObj) {
              this.searchForm.patchValue({ county: countyObj });
              await this.onCountyChange(countyObj);

              if (filters.payam) {
                const payamObj = this.payams.find(
                  (p) => p.id === filters.payam.id
                );
                if (payamObj) {
                  this.searchForm.patchValue({ payam: payamObj });
                  await this.onPayamChange(payamObj);

                  if (filters.boma) {
                    const bomaObj = this.bomas.find(
                      (b) => b.id === filters.boma.id
                    );
                    if (bomaObj) {
                      this.searchForm.patchValue({ boma: bomaObj });
                    }
                  }
                }
              }
            }
          }
        }
      }

      this.cdr.markForCheck();
      return true;
    } catch {
      return false;
    }
  }

  private async loadLookups() {
    // Warm the caches (Promises)
    await Promise.all([
      this.lookup.getOrFetchStateList(),
      this.lookup.fetchAllCountyList(),
      this.lookup.fetchAllPayamList(),
      this.lookup.fetchAllBomaList(),
    ]);

    // Now read from the sync getters
    this.states = this.lookup.getStateList();
    this.counties = this.lookup.getAllCountyList();
    this.payams = this.lookup.getAllPayamList();
    this.bomas = this.lookup.getAllBomaList();
    this.cdr.markForCheck();
  }

  async ngOnInit() {
    this.bid = this.route.snapshot.paramMap.get('bid')!;
    this.mode = this.route.snapshot.queryParamMap.get('mode') as any;
    await this.loadLookups();
    this.initForm();
    await this.restoreFiltersFromStorage();
    this.loadBeneficiaries(this.currentPage, this.pageSize);
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [
      { label: 'Update Approval', icon: 'fas fa-user-check' },
    ];
  }

   // ---------- dependent dropdowns ----------
  async onStateChange(state: LookupItem | null) {
    if (state?.id) {
      const list = await this.lookup.getCountyListByStateId(state.id);
      this.counties = list;
      this.payams = [];
      this.bomas = [];
      this.searchForm.patchValue({ county: null, payam: null, boma: null });
      this.cdr.markForCheck();
    } else {
      this.counties = [];
      this.payams = [];
      this.bomas = [];
    }
  }

  async onCountyChange(county: LookupItem | null) {
    if (county?.id) {
      const list = await this.lookup.getPayamListByCountyId(county.id);
      this.payams = list;
      this.bomas = [];
      this.searchForm.patchValue({ payam: null, boma: null });
      this.cdr.markForCheck();
    } else {
      this.payams = [];
      this.bomas = [];
    }
  }

  async onPayamChange(payam: LookupItem | null) {
    if (payam?.id) {
      const list = await this.lookup.getBomaListByPayamId(payam.id);
      this.bomas = list;
      this.searchForm.patchValue({ boma: null });
      this.cdr.markForCheck();
    } else {
      this.bomas = [];
    }
  }

  openQrScanner() {
    this.isScannerVisible = true;
  }

  onQrScanSuccess(decodedText: string) {
    if (decodedText) {
      this.searchForm.patchValue({ applicationId: decodedText });
      this.searchBeneficiaries();
    }
    this.isScannerVisible = false;
  }

  initForm() {
    this.searchForm = this.fb.group({
      // householdNumber: [''],
      // firstName: [''],
      // middleName: [''],
      // lastName: [''],
      // phoneNumber: [''],
      state: [null as LookupItem | null],
      county: [null as LookupItem | null],
      payam: [null as LookupItem | null],
      boma: [null as LookupItem | null],
      taskType: [null],
      approvalStatus: [null],
      applicationId: null,
    });
  }


  loadBeneficiaries(page: number, size: number) {
    this.isLoading = true;

    const { state, county, payam, boma, ...rest } = this.searchForm.value;
    const payload = {
      ...rest,
      stateId: state?.id ?? null,
      countyId: county?.id ?? null,
      payam: payam?.id ?? null,
      boma: boma?.id ?? null,
      approvalStatus: this.searchForm.value.approvalStatus ?? null,
      page: page, // Correct page number
      size: size, // Correct page size
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
      message: `Are you sure you want to approve?`,
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
      message: `Are you sure you want to reject?`,
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
    this.saveFiltersToStorage();
    if (!b?.id) {
      console.error('View clicked, but task id is missing:', b);
      return;
    }

    let route: string = '';

    // Check the taskType and determine the route accordingly
    switch (b.taskType) {
      case 'BENEFICIARY_EDIT':
        route = 'beneficiary-approval/edit-details';
        break;
      case 'BENEFICIARY_MIGRATION':
        route = 'beneficiary-approval/migrate-details';
        break;
      case 'BENEFICIARY_DELETE':
        route = 'beneficiary-approval/archive-details';
        break;
      default:
        console.error('Unknown taskType:', b.taskType);
        return;
    }

    // Navigate to the determined route
    this.router.navigate([route, String(b.id)], {
      queryParams: { taskMode: true },
    });
  }

}
