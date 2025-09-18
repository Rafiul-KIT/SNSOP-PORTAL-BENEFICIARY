import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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

type Gender = 'MALE' | 'FEMALE';
type RegPhase = 'PARENT' | 'AF';

interface BeneficiaryDto {
  applicationId: string;
  type: 'BENEFICIARY' | 'NOMINEE' | 'ALTERNATE_1' | 'ALTERNATE_2';
  respondentFirstName: string;
  respondentMiddleName: string;
  respondentLastName: string;
  respondentGender: Gender;
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
  respondentAge: number;
  respondentPhoneNo: string;
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
  selector: 'app-beneficiary-list',
  templateUrl: './beneficiary-list.html',
  styleUrls: ['./beneficiary-list.scss'],
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
})
export class BeneficiaryList implements OnInit {
  isLoading = true;
  searchForm!: FormGroup;

  // geo lookup lists
  states: LookupItem[] = [];
  counties: LookupItem[] = [];
  payams: LookupItem[] = [];
  bomas: LookupItem[] = [];

  genderOptions: LookupItem[] = [];
  registrationPhaseOptions: LookupItem[] = [];


  beneficiaries: BeneficiaryVm[] = [];
  totalRecords = 0;

  breadcrumbItems: any[] = [];
  breadcrumbHome: any;

  currentPage = 0; // 0-based
  pageSize = 10;
  advanceSearchPanelVisible = false;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private lookup: LookupService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.initForm();
    this.initBreadcrumb();

    // Preload all lookup lists first
    Promise.all([
      this.lookup.getOrFetchStateList().then(list => this.states = list),
      this.lookup.getCountyListByStateId('').then(list => this.counties = list),
      this.lookup.getPayamListByCountyId('').then(list => this.payams = list),
      this.lookup.getBomaListByPayamId('').then(list => this.bomas = list),
    ])
      .then(() => {
        this.genderOptions = this.lookup.getGenderList();
        this.registrationPhaseOptions = this.lookup.getRegistrationPhaseList();

        // ✅ Only fetch beneficiaries after lookup data is ready
        this.fetchPage(this.currentPage, this.pageSize);
        this.cdr.markForCheck();
      });
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
    });
  }

  initBreadcrumb() {
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Beneficiary List' }];
  }

  // ---------- dependent dropdowns ----------
  onStateChange(state: LookupItem | null) {
    if (state?.id) {
      this.lookup.getCountyListByStateId(state.id).then((list) => {
        this.counties = list;
        this.payams = [];
        this.bomas = [];
        this.searchForm.patchValue({ county: null, payam: null, boma: null });
        this.cdr.markForCheck();
      });
    } else {
      this.counties = [];
      this.payams = [];
      this.bomas = [];
    }
  }

  onCountyChange(county: LookupItem | null) {
    if (county?.id) {
      this.lookup.getPayamListByCountyId(county.id).then((list) => {
        this.payams = list;
        this.bomas = [];
        this.searchForm.patchValue({ payam: null, boma: null });
        this.cdr.markForCheck();
      });
    } else {
      this.payams = [];
      this.bomas = [];
    }
  }

  onPayamChange(payam: LookupItem | null) {
    if (payam?.id) {
      this.lookup.getBomaListByPayamId(payam.id).then((list) => {
        this.bomas = list;
        this.searchForm.patchValue({ boma: null });
        this.cdr.markForCheck();
      });
    } else {
      this.bomas = [];
    }
  }

  // ---------- Request building ----------
  private buildCriteria(): any[] {
    const f = this.searchForm.value;
    const criteria: any[] = [];

    if (f.firstName) criteria.push({ fieldName: 'RESPONDENT_FIRST_NAME', operator: 'LIKE', value: f.firstName.trim() });
    if (f.middleName) criteria.push({ fieldName: 'RESPONDENT_MIDDLE_NAME', operator: 'LIKE', value: f.middleName.trim() });
    if (f.lastName) criteria.push({ fieldName: 'RESPONDENT_LAST_NAME', operator: 'LIKE', value: f.lastName.trim() });
    if (f.phoneNumber) criteria.push({ fieldName: 'RESPONDENT_PHONE_NO', operator: 'LIKE', value: f.phoneNumber.trim() });

    if (f.state?.id) criteria.push({ fieldName: 'STATE_ID', operator: 'EQUAL', value: f.state.id });
    if (f.county?.id) criteria.push({ fieldName: 'COUNTY_ID', operator: 'EQUAL', value: f.county.id });
    if (f.payam?.id) criteria.push({ fieldName: 'PAYAM_ID', operator: 'EQUAL', value: f.payam.id });
    if (f.boma?.id) criteria.push({ fieldName: 'BOMA_ID', operator: 'EQUAL', value: f.boma.id });
    if (f.gender) criteria.push({ fieldName: 'RESPONDENT_GENDER', operator: 'EQUAL', value: f.gender });

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
      const fullName = [b.respondentFirstName, b.respondentMiddleName, b.respondentLastName]
        .filter(Boolean)
        .join(' ');

      return {
        applicationId: b.applicationId,
        respondentGender: b.respondentGender,
        respondentAge: b.respondentAge,
        respondentPhoneNo: b.respondentPhoneNo,
        address: b.address,
        registrationPhase: b.registrationPhase,
        fullName,
        stateName: b.address?.stateId
          ? this.lookup.getStateNameById(b.address.stateId) || String(b.address.stateId)
          : '',
        countyName: b.address?.countyId
          ? this.lookup.getCountyNameById(b.address.countyId) || String(b.address.countyId)
          : '',
        payamName: b.address?.payam
          ? this.lookup.getPayamNameById(b.address.payam) || String(b.address.payam)
          : '',
        bomaName: b.address?.boma
          ? this.lookup.getBomaNameById(b.address.boma) || String(b.address.boma)
          : '',
      };
    });
  }


  // ---------- Data loading ----------
  fetchPage(page: number, size: number) {
    this.isLoading = true;
    this.cdr.markForCheck();

    const body = this.buildSearchBody(page, size);

    this.api
      .POST('api/beneficiary/search', body)
      .then((res: any) => {
        const data = res?.data;
        if (!data) throw new Error('Empty response');
        if (data.operationResult === false) {
          this.messageService.add({ severity: 'warn', summary: 'Search', detail: data.errorMsg || 'No beneficiaries found' });
        }
        const raw: BeneficiaryDto[] = data.beneficiaries || [];
        this.beneficiaries = this.toVm(raw);
        this.totalRecords = Number(data.total || 0);
      })
      .catch((err) => {
        console.error('Fetch beneficiaries error:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch beneficiaries' });
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
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
    this.searchBeneficiaries();
  }

  // ---------- Actions ----------
  editBeneficiary(b: BeneficiaryVm) {
    if (!b?.applicationId) return;
    this.router.navigate(['/beneficiary/edit', String(b.applicationId)]);
  }
  migrateBeneficiary(b: BeneficiaryVm) {
    if (!b?.applicationId) return;
    this.router.navigate(['/beneficiary/migrate', String(b.applicationId)]);
  }
  beneficiaryDetails(b: BeneficiaryVm) {
    if (!b?.applicationId) return;
    this.router.navigate(['/beneficiary/details', String(b.applicationId)]);
  }
  deleteBeneficiary(b: BeneficiaryVm) {
    this.confirmationService.confirm({
      message: `Are you sure you want to archive ${b.fullName}?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-success',
      accept: () => {
        this.beneficiaries = this.beneficiaries.filter((x) => x.applicationId !== b.applicationId);
        this.messageService.add({ severity: 'success', summary: 'Archived', detail: 'Beneficiary archived successfully' });
        this.cdr.markForCheck();
      },
    });
  }

  trackByAppId = (_: number, row: BeneficiaryVm) => row.applicationId;
}
