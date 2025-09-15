import { Component, OnInit } from '@angular/core';
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
  selector: 'app-beneficiary-edit-approval',
  templateUrl: './beneficiary-edit-approval.html',
  styleUrl: './beneficiary-edit-approval.scss',
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
export class BeneficiaryEditApproval implements OnInit {
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

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.bid = this.route.snapshot.paramMap.get('bid')!;
    this.mode = this.route.snapshot.queryParamMap.get('mode') as any;
    this.initForm();
    this.loadLocations();
    this.loadBeneficiaries();
    this.breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
    this.breadcrumbItems = [{ label: 'Beneficiary List' }];
    this.isLoading = false;
  }

  initForm() {
    this.searchForm = this.fb.group({
      householdNumber: [''],
      firstName: [''],
      middleName: [''],
      lastName: [''],
      phoneNumber: [''],
      state: [null],
      county: [null],
      payam: [null],
      boma: [null],
      taskType: ['BENEFICIARY_EDIT'],
      approvalStatus: ['APPROVED']
    });
  }

  loadLocations() {
    this.states = [
      { name: 'Central Equatoria', code: 'CE' },
      { name: 'Eastern Equatoria', code: 'EE' },
      { name: 'Jonglei', code: 'JG' },
      { name: 'Unity', code: 'UN' },
      { name: 'Upper Nile', code: 'UN2' },
    ];

    this.counties = [
      { name: 'Juba', code: 'JB' },
      { name: 'Yei', code: 'YE' },
      { name: 'Terekeka', code: 'TR' },
    ];

    this.payams = [
      { name: 'Munuki', code: 'MN' },
      { name: 'Kator', code: 'KT' },
      { name: 'Juba Town', code: 'JT' },
    ];

    this.bomas = [
      { name: 'Gudele', code: 'GD' },
      { name: 'Hai Thoura', code: 'HT' },
      { name: 'Nyakuron', code: 'NK' },
    ];
  }

  loadBeneficiaries() {
    this.isLoading = true;

    const payload = this.searchForm.value;
    this.apiService
      .POST('/api/approval/taskList', payload)
      .then((res: any) => {
        // response -> approvalTaskList
        this.beneficiaries = res.data?.approvalTaskList || [];
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
      });
  }

  get paginatedBeneficiaries(): Beneficiary[] {
    const start = this.currentPage * this.pageSize;
    return this.beneficiaries.slice(start, start + this.pageSize);
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
  }

  searchBeneficiaries() {
    this.messageService.add({
      severity: 'info',
      summary: 'Search',
      detail: 'Search performed with the provided criteria',
    });
    console.log('Search criteria:', this.searchForm.value);
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
}
