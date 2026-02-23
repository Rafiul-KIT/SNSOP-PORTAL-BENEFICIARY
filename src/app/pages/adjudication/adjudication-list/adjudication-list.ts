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

import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { LookupItem, LookupService } from '../../../services/lookup.service';
import { ApiService } from '../../../services/api.service';
import { Loader } from '../../../components/loader/loader';


type Gender = 'MALE' | 'FEMALE';
type RegPhase = 'PARENT' | 'AF';
type Criteria = 'LIPW' | 'DIS';

interface BeneficiaryVm {
  applicationId: string;
  respondentGender: Gender;
  selectionCriteria: Criteria;
  respondentAge: number;
  respondentPhoneNo: string;
  address?: {
    stateId: string | number;
    countyId: string | number;
    payam: string | number;
    boma: string | number;
  };
  fullName: string;
  stateName: string;
  countyName: string;
  payamName: string;
  bomaName: string;
  registrationPhase: any;
}
@Component({
  selector: 'app-adjudication-list',
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
  ],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './adjudication-list.html',
  styleUrl: './adjudication-list.scss'
})
export class AdjudicationList implements OnInit {
  isLoading = true;
  searchForm!: FormGroup;

  // geo lookup lists
  states: LookupItem[] = [];
  counties: LookupItem[] = [];
  payams: LookupItem[] = [];
  bomas: LookupItem[] = [];

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
  private readonly FILTER_STORAGE_KEY = 'adjudication_list_filters';

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

  private loadLookups() {
    this.states = this.lookup.getStateList();
    this.counties = this.lookup.getAllCountyList();
    this.payams = this.lookup.getAllPayamList();
    this.bomas = this.lookup.getAllBomaList();
    this.genderOptions = this.lookup.getGenderListbyId();
    this.criteriaOptions = this.lookup.getSelectionCriteriaListbyId();
    this.registrationPhaseOptions = this.lookup.getRegistrationPhaseList();
  }
  async ngOnInit() {
    this.initForm();
    this.initBreadcrumb();
    this.loadLookups();
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
    this.breadcrumbItems = [{ icon: 'fas fa-users-viewfinder', label: 'Adjudication' }];
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
    const criteria: any[] = [];

    if (f.firstName)
      criteria.push({
        fieldName: 'firstName',
        operator: 'LIKE',
        value: f.firstName.trim(),
      });
    if (f.middleName)
      criteria.push({
        fieldName: 'middleName',
        operator: 'LIKE',
        value: f.middleName.trim(),
      });
    if (f.lastName)
      criteria.push({
        fieldName: 'lastName',
        operator: 'LIKE',
        value: f.lastName.trim(),
      });
    if (f.phoneNumber)
      criteria.push({
        fieldName: 'phoneNo',
        operator: 'LIKE',
        value: f.phoneNumber.trim(),
      });

    if (f.state?.id)
      criteria.push({
        fieldName: 'state',
        operator: 'EQUAL',
        value: f.state.id,
      });
    if (f.county?.id)
      criteria.push({
        fieldName: 'county',
        operator: 'EQUAL',
        value: f.county.id,
      });
    if (f.payam?.id)
      criteria.push({
        fieldName: 'payam',
        operator: 'EQUAL',
        value: f.payam.id,
      });
    if (f.boma?.id)
      criteria.push({
        fieldName: 'boma',
        operator: 'EQUAL',
        value: f.boma.id,
      });
    if (f.gender)
      criteria.push({
        fieldName: 'gender',
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
      firstName: f.firstName ? f.firstName.trim() : null,
      middleName: f.middleName ? f.middleName.trim() : null,
      lastName: f.lastName ? f.lastName.trim() : null,
      state: f.state?.id || null,
      county: f.county?.id || null,
      payam: f.payam?.id || null,
      boma: f.boma?.id || null,
      respondentId: null,
      registrationPhase: f.registrationPhase || null,
      gender: f.gender || null,
      selectionCriteria: f.criteria || null,
      criteria: this.buildCriteria(),
      sortColumn: 'ID',
      sortOrder: 'DESC',
      page,
      size,
    };
  }

  // ---------- Mapping ----------
  private toVm(list: any[]): BeneficiaryVm[] {
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
        selectionCriteria: b.selectionCriteria,
        respondentAge: b.respondentAge,
        respondentPhoneNo: b.respondentPhoneNo,
        address: b.address,
        registrationPhase: b.registrationPhase,
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
      .POST('api/adjudication/getAdjudicateList', body)
      .then((res: any) => {
        const data = res?.data;
        if (!data) throw new Error('Empty response');
        if (data.operationResult === false) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Search',
            detail: data.errorMsg || 'No beneficiaries found',
          });
        }
                const raw: any[] = data.matchList || [];
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
    this.counties = [];
    this.payams = [];
    this.bomas = [];
    this.loadLookups();
    this.searchBeneficiaries();
  }

  // ---------- Actions ----------
  // editBeneficiary(b: BeneficiaryVm) {
  //   if (!b?.applicationId) return;
  //   this.router.navigate(['/beneficiary/edit', String(b.applicationId)]);
  // }
  // migrateBeneficiary(b: BeneficiaryVm) {
  //   if (!b?.applicationId) return;
  //   this.router.navigate(['/beneficiary/migrate', String(b.applicationId)]);
  // }
  beneficiaryDetails(b: BeneficiaryVm) {
    if (!b?.applicationId) return;
    this.saveFiltersToStorage();
    this.router.navigate(['/adjudication/match-list', String(b.applicationId)]);
  }


  deleteBeneficiary(b: BeneficiaryVm) {
    this.beneficiaryToDelete = b;
    this.archiveComment = '';

    this.confirmationService.confirm({
      key: 'archiveDialog',
      header: 'Confirm Archive',
      message: `Are you sure you want to archive ${b.fullName}?`,
      icon: 'fas fa-exclamation-triangle text-warning',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      accept: () => this.handleArchiveConfirm(),
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

    const apiPath = '/api/beneficiary/delete';
    this.api
      .POST(apiPath, requestData)
      .then((res: any) => {
        const data = res?.data;
        if (!data) throw new Error('Empty response');

        // Checking for operation result in the bulkResponse
        const response = data.bulkResponse && data.bulkResponse[0];
        if (response) {
          if (response.result === 'FAILED') {
            // Show error if result is failed
            this.messageService.add({
              severity: 'error',
              summary: 'Archive Failed',
              detail: response.errorMessage || 'Failed to send request for archiving beneficiary',
            });
          } else if (response.result === 'SUCCESS') {
            // Handle success if result is successful
            this.beneficiaries = this.beneficiaries.filter(
              (x) => x.applicationId !== b.applicationId
            );

            this.messageService.add({
              severity: 'success',
              summary: 'Archived',
              detail: 'Beneficiary archive request sent successfully.',
            });
            this.cdr.markForCheck();
          }
        } else {
          // Handle case where there's no response
          this.messageService.add({
            severity: 'warn',
            summary: 'No Response',
            detail: 'No response returned from the server.',
          });
        }
      })
      .catch((err) => {
        console.error('Archive beneficiary error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to send request for archiving beneficiary.',
        });
      })
      .finally(() => {
        this.archiveComment = '';
        this.beneficiaryToDelete = null;
      });
  }

  showUnderConstruction() {
    this.router.navigate(['under-construction']);
  }

  trackByAppId = (_: number, row: BeneficiaryVm) => row.applicationId;
}
