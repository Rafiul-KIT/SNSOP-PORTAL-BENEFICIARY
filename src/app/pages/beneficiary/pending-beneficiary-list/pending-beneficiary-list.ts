import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
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
import { PaginatorModule } from 'primeng/paginator';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { Loader } from '../../../components/loader/loader';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ApiService } from '../../../services/api.service';
import { LookupService, LookupItem } from '../../../services/lookup.service';
import { QrInputDirective } from './../../../directives/qr-input.directive';
import { QrScannerComponent } from './../../../components/qr-scanner/qr-scanner.component';

type Gender = 'MALE' | 'FEMALE';
type RegPhase = 'PARENT' | 'AF';
type Criteria = 'LIPW' | 'DIS';

interface BeneficiaryDto {
  applicationId: string;
  type: 'BENEFICIARY' | 'NOMINEE' | 'ALTERNATE_1' | 'ALTERNATE_2';
  respondentFirstName: string;
  respondentMiddleName: string;
  respondentLastName: string;
  respondentGender: Gender;
  selectionCriteria: Criteria;
  respondentId: string;
  respondentAge: number;
  respondentPhoneNo: string;
  address?: {
    stateId: string;
    countyId: string;
    payam: string;
    boma: string;
  };
  registrationPhase: RegPhase;
}

interface BeneficiaryVm {
  applicationId: string;
  respondentGender: Gender;
  selectionCriteria: Criteria;
  respondentAge: number;
  respondentPhoneNo: string;
  registrationPhase: RegPhase;
  address?: {
    stateId: string;
    countyId: string;
    payam: string;
    boma: string;
  };
  fullName: string;
  stateName: string;
  countyName: string;
  payamName: string;
  bomaName: string;
}

@Component({
  selector: 'app-pending-beneficiary-list',

  templateUrl: './pending-beneficiary-list.html',
  styleUrl: './pending-beneficiary-list.scss',
  standalone: true,
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
    FloatLabelModule,
    InputTextModule,
    SelectModule,
    RouterModule,
    TooltipModule,
    Loader,
    QrInputDirective,
    QrScannerComponent
  ],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingBeneficiaryList implements OnInit {
  isLoading = true;
  searchForm!: FormGroup;

  // geo lookup lists
  states: LookupItem[] = [];
  counties: LookupItem[] = [];
  payams: LookupItem[] = [];
  bomas: LookupItem[] = [];
  selectedBeneficiaries: any[] = [];
  approveComment: string = '';

  genderOptions: LookupItem[] = [];
  criteriaOptions: LookupItem[] = []
  registrationPhaseOptions: LookupItem[] = [];

  beneficiaries: BeneficiaryVm[] = [];
  totalRecords = 0;

  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  currentPage = 0; // 0-based
  pageSize = 10;
  advanceSearchPanelVisible = false;
  archiveComment: string = ''; // holds comment text
  beneficiaryToDelete: BeneficiaryVm | null = null; // holds current target
  isScannerVisible = false;
  private readonly FILTER_STORAGE_KEY = 'pending_beneficiary_filters';

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private lookup: LookupService,
    private cdr: ChangeDetectorRef
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
        firstName: filters.firstName,
        middleName: filters.middleName,
        lastName: filters.lastName,
        phoneNumber: filters.phoneNumber,
        gender: filters.gender,
        registrationPhase: filters.registrationPhase,
        criteria: filters.criteria,
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

    // Use MALE/FEMALE ids, not 0/1
    this.genderOptions = this.lookup.getGenderListbyId();
    this.criteriaOptions = this.lookup.getSelectionCriteriaListbyId();
    this.registrationPhaseOptions = this.lookup.getRegistrationPhaseList();

    this.cdr.markForCheck();
  }

  async ngOnInit() {
    this.initForm();
    this.initBreadcrumb();

    await this.loadLookups(); // ✅ caches ready + names resolvable

    await this.restoreFiltersFromStorage();
    this.fetchPage(this.currentPage, this.pageSize);
  }

  initForm() {
    this.searchForm = this.fb.group({
      applicationId: [''],
      firstName: [''],
      middleName: [''],
      lastName: [''],
      phoneNumber: [''],
      state: [null as LookupItem | null],
      county: [null as LookupItem | null],
      payam: [null as LookupItem | null],
      boma: [null as LookupItem | null],
      gender: [null as Gender | null],
      registrationPhase: [null as RegPhase | null],
      criteria: [null as Criteria | null],
    });
  }

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [
      {
        label: 'Pending Verification', icon: 'fas fa-users-viewfinder'
      }
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

  // ---------- Request building ----------
  private buildCriteria(): any[] {
    const f = this.searchForm.value;
    const criteria: any[] = [
      { fieldName: 'STATUS', operator: 'EQUAL', value: '2' },
    ];

    if (f.firstName)
      criteria.push({
        fieldName: 'RESPONDENT_FIRST_NAME',
        operator: 'LIKE',
        value: f.firstName.trim(),
      });
    if (f.middleName)
      criteria.push({
        fieldName: 'RESPONDENT_MIDDLE_NAME',
        operator: 'LIKE',
        value: f.middleName.trim(),
      });
    if (f.lastName)
      criteria.push({
        fieldName: 'RESPONDENT_LAST_NAME',
        operator: 'LIKE',
        value: f.lastName.trim(),
      });
    if (f.phoneNumber)
      criteria.push({
        fieldName: 'RESPONDENT_PHONE_NO',
        operator: 'LIKE',
        value: f.phoneNumber.trim(),
      });

    if (f.state?.id)
      criteria.push({
        fieldName: 'STATE_ID',
        operator: 'EQUAL',
        value: f.state.id,
      });
    if (f.county?.id)
      criteria.push({
        fieldName: 'COUNTY_ID',
        operator: 'EQUAL',
        value: f.county.id,
      });
    if (f.payam?.id)
      criteria.push({
        fieldName: 'PAYAM_ID',
        operator: 'EQUAL',
        value: f.payam.id,
      });
    if (f.boma?.id)
      criteria.push({
        fieldName: 'BOMA_ID',
        operator: 'EQUAL',
        value: f.boma.id,
      });
    if (f.gender)
      criteria.push({
        fieldName: 'RESPONDENT_GENDER',
        operator: 'EQUAL',
        value: f.gender,
      });
    if (f.criteria)
      criteria.push({
        fieldName: 'SELECTION_CRITERIA',
        operator: 'LIKE',
        value: f.criteria,
      });

    return criteria;
  }

  private buildSearchBody(page: number, size: number) {
    const f = this.searchForm.value;
    return {
      applicationId: f.applicationId ? f.applicationId.trim() : null,
      respondentFirstName: f.firstName ? f.firstName.trim() : null,
      respondentMiddleName: f.middleName ? f.middleName.trim() : null,
      respondentLastName: f.lastName ? f.lastName.trim() : null,
      respondentId: null,
      registrationPhase: f.registrationPhase || null,
      respondentGender: f.gender || null,
       selectionCriteria: f.criteria || null,
      criteria: this.buildCriteria(),
      sortColumn: 'ID',
      sortOrder: 'DESC',
      page,
      size,
    };
  }

  // ---------- Mapping ----------
  private toVm(list: BeneficiaryDto[]): BeneficiaryVm[] {
    return list.map((b) => {
      const fullName = [
        b.respondentFirstName,
        b.respondentMiddleName,
        b.respondentLastName,
      ]
        .filter(Boolean)
        .join(' ');

      return {
        applicationId: b.applicationId,
        respondentGender: b.respondentGender,
        respondentAge: b.respondentAge,
        respondentPhoneNo: b.respondentPhoneNo,
        address: b.address,
        registrationPhase: b.registrationPhase,
        selectionCriteria: b.selectionCriteria,
        fullName,
        stateName: b.address?.stateId
          ? this.lookup.getStateNameById(b.address.stateId) ||
            String(b.address.stateId)
          : '',
        countyName: b.address?.countyId
          ? this.lookup.getCountyNameById(b.address.countyId) ||
            String(b.address.countyId)
          : '',
        payamName: b.address?.payam
          ? this.lookup.getPayamNameById(b.address.payam) ||
            String(b.address.payam)
          : '',
        bomaName: b.address?.boma
          ? this.lookup.getBomaNameById(b.address.boma) ||
            String(b.address.boma)
          : '',
      };
    });
  }

  // ---------- Data loading ----------
  fetchPage(page: number, size: number) {
    this.isLoading = true;
    const body = this.buildSearchBody(page, size);
    this.api
      .POST('api/beneficiary/search', body)
      .then((res: any) => {
        const data = res?.data;
        console.log(data);
        if (!data) throw new Error('Empty response');
        if (data.operationResult === false) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Search',
            detail: data.errorMsg || 'No beneficiaries found',
          });
        }
        const raw: BeneficiaryDto[] = data.beneficiaries || [];
        this.beneficiaries = this.toVm(raw);
        this.totalRecords = Number(data.total || 0);
      })
      .catch((err) => {
        console.error('Fetch beneficiaries error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch beneficiaries',
        });
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.fetchPage(this.currentPage, this.pageSize);
  }

  searchBeneficiaries() {
    this.fetchPage(this.currentPage, this.pageSize);
  }

  resetForm() {
    this.searchForm.reset();
    this.currentPage = 0;
    this.fetchPage(this.currentPage, this.pageSize);
  }

  // ---------- Actions ----------
  editBeneficiary(b: BeneficiaryVm) {
    if (!b?.applicationId) return;
    this.saveFiltersToStorage();
    this.router.navigate([
      '/pending-beneficiary/edit',
      String(b.applicationId),
    ]);
  }
  approveSelected() {
    if (
      !this.selectedBeneficiaries ||
      this.selectedBeneficiaries.length === 0
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Selection',
        detail: 'Please select beneficiaries to approve.',
      });
      return;
    }

    this.approveComment = ''; // Reset comment

    this.confirmationService.confirm({
      key: 'approveDialog',
      accept: () => this.handleApproveConfirm(),
      reject: () => {
        // User rejected, no action needed
      },
      acceptButtonStyleClass: 'p-button-primary',
      rejectButtonStyleClass: 'p-button-danger',
    });
  }

  handleApproveConfirm() {
    const householdIds = this.selectedBeneficiaries.map((b) => b.applicationId);

    const payload = {
      householdId: householdIds,
      comment: this.approveComment.trim(),
      enrollmentStatusEnum: 'APPROVED',
    };

    this.isLoading = true;
    this.cdr.markForCheck();

    this.api
      .POST('api/beneficiary/update/approveBeneficiary/batch', payload)
      .then((res: any) => {
        if (res.status === 200) {
          this.messageService.add({
            severity: 'success',
            summary: 'Approved',
            detail: 'Selected beneficiaries have been approved successfully.',
          });
          this.approveComment = '';
          this.selectedBeneficiaries = [];
          this.fetchPage(this.currentPage, this.pageSize); // Refresh data
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Approval Failed',
            detail:
              res.errorMsg ||
              'There was a problem approving the beneficiaries.',
          });
        }
      })
      .catch((err) => {
        console.error('Approve beneficiaries error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'API Error',
          detail: 'Failed to send approval request.',
        });
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  handleArchiveConfirm() {
    // validate comment
    if (!this.archiveComment || !this.archiveComment.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Comment Required',
        detail: 'Please provide a reason for archiving before proceeding.',
      });
      return;
    }

    if (!this.beneficiaryToDelete) return;

    const b = this.beneficiaryToDelete;

    const requestData = {
      beneficiaries: [
        {
          householdId: b.applicationId,
          comment: this.archiveComment.trim(),
        },
      ],
    };
  }

  deleteSelected() {
    if (
      !this.selectedBeneficiaries ||
      this.selectedBeneficiaries.length === 0
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Selection',
        detail: 'Please select beneficiaries to delete.',
      });
      return;
    }

    this.archiveComment = ''; // Reset comment

    this.confirmationService.confirm({
      key: 'deleteDialog',
      accept: () => this.handleDeleteConfirm(),
      reject: () => {
        // User rejected, no action needed
      },
      acceptButtonStyleClass: 'p-button-primary',
      rejectButtonStyleClass: 'p-button-danger',
    });
  }

  handleDeleteConfirm() {
    if (!this.archiveComment || !this.archiveComment.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Comment Required',
        detail: 'Please provide a reason for deletion before proceeding.',
      });
      return;
    }
    const householdIds = this.selectedBeneficiaries.map((b) => b.applicationId);

    const payload = {
      householdId: householdIds,
      comment: this.archiveComment.trim(),
      enrollmentStatusEnum: 'DELETE',
    };

    this.isLoading = true;
    this.cdr.markForCheck();

    this.api
      .POST('api/beneficiary/update/approveBeneficiary/batch', payload)
      .then((res: any) => {
        if (res.status === 200) {
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Selected beneficiaries have been deleted successfully.',
          });
          this.archiveComment = '';
          this.selectedBeneficiaries = [];
          this.fetchPage(this.currentPage, this.pageSize);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Delete Failed',
            detail:
              res.errorMsg || 'There was a problem deleting the beneficiaries.',
          });
        }
      })
      .catch((err) => {
        console.error('Delete beneficiaries error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'API Error',
          detail: 'Failed to send delete request.',
        });
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      });
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

  trackByAppId = (_: number, row: BeneficiaryVm) => row.applicationId;
}
