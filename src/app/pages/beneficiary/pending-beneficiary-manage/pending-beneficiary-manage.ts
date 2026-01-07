import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TabsModule, TabPanel, Tabs, TabList, Tab, TabPanels } from 'primeng/tabs';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { InputTextModule } from 'primeng/inputtext';
import { Loader } from '../../../components/loader/loader';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { BeneficiaryDto } from '../../../models/beneficiary';
import { FloatLabel, FloatLabelModule } from 'primeng/floatlabel';
import { LookupService, LookupItem } from '../../../services/lookup.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Toast, ToastModule } from 'primeng/toast';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-pending-beneficiary-manage',
  templateUrl: './pending-beneficiary-manage.html',
  styleUrl: './pending-beneficiary-manage.scss',
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
    TabPanel,
    Tabs,
    TabList,
    Tab,
    TabPanels
  ],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingBeneficiaryManage implements OnInit {
  isLoading = true;
  beneficiaryForm!: FormGroup;
  originalDto!: BeneficiaryDto;
  deleteComment: string = '';
  destroy$ = new Subject<void>();

  genderOptions: LookupItem[] = [];
  maritalStatusOptions: any[] = [];
  relationshipOptions: any[] = [];
  legalStatusOptions: any[] = [];
  idTypeOptions: any[] = [];
  currentIdTypeOptions: any[] = [];
  alternateIdTypeOptions: any[] = [];
  occupationOptions: any[] = [];
  incomeSourceOptions: any[] = [];
  allReasons: any[] = [];
  filteredReasons: any[] = [];
  mobileMoneyOptions: any[] = [];

  // ===== Regex & constants (aligned with mobile/Java) =====
  private RGX_ONLY_CHARS = /^[A-Za-z]+$/; // names (no spaces/digits/special)
  private RGX_CHARS_SPACES = /^[A-Za-z ]+$/; // letters + spaces
  private RGX_ALPHANUM_HYPHEN = /^[A-Za-z0-9\-]+$/; // Correct regex
  private RGX_ALPHANUM_SPACE = /^[A-Za-z0-9 ]+$/; // alphanum + space
  private RGX_REFUGEE_ID = /^[A-Za-z0-9\-]+$/; // refugee IDs allow hyphen
  private RGX_PHONE_9 = /^\d{9}$/; // 9 digits w/ optional +
  private MIN_NAME = 3;
  private MAX_NAME = 30;

  ageGroups = [
    {
      label: '0-2 yrs',
      maleTotal: 'm0_2_total',
      maleDisable: 'm0_2_disable',
      maleChronicalIll: 'm0_2_chronic',
      maleBoth: 'm0_2_both',
      femaleTotal: 'f0_2_total',
      femaleDisable: 'f0_2_disable',
      femaleChronicalIll: 'f0_2_chronic',
      femaleBoth: 'f0_2_both',
    },
    {
      label: '3-5 yrs',
      maleTotal: 'm3_5_total',
      maleDisable: 'm3_5_disable',
      maleChronicalIll: 'm3_5_chronic',
      maleBoth: 'm3_5_both',
      femaleTotal: 'f3_5_total',
      femaleDisable: 'f3_5_disable',
      femaleChronicalIll: 'f3_5_chronic',
      femaleBoth: 'f3_5_both',
    },
    {
      label: '6-17 yrs',
      maleTotal: 'm6_17_total',
      maleDisable: 'm6_17_disable',
      maleChronicalIll: 'm6_17_chronic',
      maleBoth: 'm6_17_both',
      femaleTotal: 'f6_17_total',
      femaleDisable: 'f6_17_disable',
      femaleChronicalIll: 'f6_17_chronic',
      femaleBoth: 'f6_17_both',
    },
    {
      label: '18-35 yrs',
      maleTotal: 'm18_35_total',
      maleDisable: 'm18_35_disable',
      maleChronicalIll: 'm18_35_chronic',
      maleBoth: 'm18_35_both',
      femaleTotal: 'f18_35_total',
      femaleDisable: 'f18_35_disable',
      femaleChronicalIll: 'f18_35_chronic',
      femaleBoth: 'f18_35_both',
    },
    {
      label: '36-64 yrs',
      maleTotal: 'm36_64_total',
      maleDisable: 'm36_64_disable',
      maleChronicalIll: 'm36_64_chronic',
      maleBoth: 'm36_64_both',
      femaleTotal: 'f36_64_total',
      femaleDisable: 'f36_64_disable',
      femaleChronicalIll: 'f36_64_chronic',
      femaleBoth: 'f36_64_both',
    },
    {
      label: '65+ yrs',
      maleTotal: 'm65_total',
      maleDisable: 'm65_disable',
      maleChronicalIll: 'm65_chronic',
      maleBoth: 'm65_both',
      femaleTotal: 'f65_total',
      femaleDisable: 'f65_disable',
      femaleChronicalIll: 'f65_chronic',
      femaleBoth: 'f65_both',
    },
  ];

  items = [
    {
      label: 'Pending Verification',
      icon: 'fas fa-users me-2',
      routerLink: '/pending-beneficiary/list',
    },
    { label: 'Manage Pending Beneficiary', icon: 'fas fa-user-pen me-2' },
  ];
  home = { icon: 'fas fa-home me-2', routerLink: '/' };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private api: ApiService,
    private lookup: LookupService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private router: Router,
    private confirmationService: ConfirmationService
  ) { }

  // ========= Init =========
  ngOnInit(): void {
    this.initForm();

    // Lookups
    this.genderOptions = this.lookup.getGenderList();
    this.maritalStatusOptions = this.lookup.getMaritalStatusEnum();
    this.relationshipOptions = this.lookup.getRelationshipEnum();
    this.legalStatusOptions = this.lookup.getLegalStatusEnum();
    this.alternateIdTypeOptions = this.lookup.getDocumentTypeEnum().filter(o => o.value !== 'SELECT');

    this.occupationOptions = this.lookup.getNomineeOccupationEnum();
    this.incomeSourceOptions = this.lookup.getIncomeSourceEnum();
    this.mobileMoneyOptions = this.lookup.getMobileMoneyProviderEnum();
    this.allReasons = this.lookup.getSelectionReasonEnum();

    // Dynamic age-group controls with bounds 0..10 per mobile rule
    this.ageGroups.forEach((group) => {
      this.beneficiaryForm.addControl(
        group.maleTotal,
        this.fb.control('0', [this.numMin(0), this.numMax(10)])
      );
      this.beneficiaryForm.addControl(
        group.maleDisable,
        this.fb.control('0', [this.numMin(0), this.numMax(10)])
      );
      this.beneficiaryForm.addControl(
        group.maleChronicalIll,
        this.fb.control('0', [this.numMin(0), this.numMax(10)])
      );
      this.beneficiaryForm.addControl(
        group.maleBoth,
        this.fb.control('0', [this.numMin(0), this.numMax(10)])
      );
      this.beneficiaryForm.addControl(
        group.femaleTotal,
        this.fb.control('0', [this.numMin(0), this.numMax(10)])
      );
      this.beneficiaryForm.addControl(
        group.femaleDisable,
        this.fb.control('0', [this.numMin(0), this.numMax(10)])
      );
      this.beneficiaryForm.addControl(
        group.femaleChronicalIll,
        this.fb.control('0', [this.numMin(0), this.numMax(10)])
      );
      this.beneficiaryForm.addControl(
        group.femaleBoth,
        this.fb.control('0', [this.numMin(0), this.numMax(10)])
      );
    });

    this.beneficiaryForm.addControl('f18_35_lactating_total', this.fb.control('0', [this.numMin(0), this.numMax(10)]));
    this.beneficiaryForm.addControl('f18_35_lactating_disable', this.fb.control('0', [this.numMin(0), this.numMax(10)]));
    this.beneficiaryForm.addControl('f18_35_lactating_chronic', this.fb.control('0', [this.numMin(0), this.numMax(10)]));
    this.beneficiaryForm.addControl('f18_35_lactating_both', this.fb.control('0', [this.numMin(0), this.numMax(10)]));

    this.beneficiaryForm.addControl('f36_64_lactating_total', this.fb.control('0', [this.numMin(0), this.numMax(10)]));
    this.beneficiaryForm.addControl('f36_64_lactating_disable', this.fb.control('0', [this.numMin(0), this.numMax(10)]));
    this.beneficiaryForm.addControl('f36_64_lactating_chronic', this.fb.control('0', [this.numMin(0), this.numMax(10)]));
    this.beneficiaryForm.addControl('f36_64_lactating_both', this.fb.control('0', [this.numMin(0), this.numMax(10)]));

    // Form-level validators (mirror Java)
    this.beneficiaryForm.setValidators([
      this.breakdownSubcategoryNotExceedTotal(),
      this.householdSizeMatchesSum(),
      this.literate1835NotExceedYouth(),
      this.personalAgeExistsInBreakdown(),
      this.genderPresentIfSelected(),
      this.selectionReasonsRequired(),
      this.disLipwEligibility(),
    ]);

    // Existing load
    const applicationId = this.route.snapshot.paramMap.get('applicationId');
    if (applicationId) {
      this.isLoading = true;
      this.loadBeneficiary(applicationId);
    } else {
      this.isLoading = false;
      this.updateFormUI();
    }

    // Filter reasons by Support Type

    this.beneficiaryForm.get('canReadWrite')?.disable();
    this.beneficiaryForm.get('selectionReasons')?.disable();
    this.beneficiaryForm.get('supportType')?.disable();

    this.beneficiaryForm
      .get('supportType')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        this.filterReasons(val);
        this.beneficiaryForm.updateValueAndValidity();
      });

    // Conditional validators
    this.beneficiaryForm
      .get('relationship')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.updateRelationshipFields(value);
      });

    this.beneficiaryForm
      .get('maritalStatus')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.updateMaritalStatusFields(value);
      });

    // Triggers for the ID logic
    this.beneficiaryForm
      .get('legalStatus')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateIdLogic());
    this.beneficiaryForm
      .get('hasNationalId')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateIdLogic());
    this.beneficiaryForm
      .get('idType')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateIdLogic());

    this.beneficiaryForm
      .get('hasMobileWallet')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.updateMobileWalletValidation(value);
      });

    this.beneficiaryForm
      .get('mainIncomeSource')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.updateIncomeSourceFields(value);
      });
  }

  ngOnDestroy(): void {
    // Unsubscribe when the component is destroyed to avoid memory leaks
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateRelationshipFields(value: string): void {
    const control = this.beneficiaryForm.get('relationshipOther')!;
    if (value === 'OTHER') {
      control.enable({ emitEvent: false });
      control.setValidators([
        this.requiredWithWhitespace(),
        this.pattern(this.RGX_CHARS_SPACES, 'Only letters and spaces'),
        this.size(2, 50),
      ]);
    } else {
      control.disable({ emitEvent: false });
      control.clearValidators();
      control.setValue('', { emitEvent: false });
    }
    control.updateValueAndValidity({ emitEvent: false });
  }

  private updateMaritalStatusFields(value: string): void {
    const requiredControls = [
      'spouseFirstName',
      'spouseMiddleName',
      'spouseLastName',
    ];
    const nickNameControl = this.beneficiaryForm.get('spouseNickName');

    requiredControls.forEach((name) => {
      const control = this.beneficiaryForm.get(name);
      if (!control) return;
      if (value === 'MARRIED') {
        control.enable({ emitEvent: false });
        control.setValidators([
          this.requiredWithWhitespace(),
          this.capitalized(),
          this.onlyLetters(),
          this.size(this.MIN_NAME, this.MAX_NAME),
        ]);
      } else {
        control.disable({ emitEvent: false });
        control.clearValidators();
        control.setValue('', { emitEvent: false });
      }
      control.updateValueAndValidity({ emitEvent: false });
    });

    if (nickNameControl) {
      if (value === 'MARRIED') {
        nickNameControl.enable({ emitEvent: false });
        nickNameControl.clearValidators(); // Ensure no validators
      } else {
        nickNameControl.disable({ emitEvent: false });
        nickNameControl.clearValidators();
        nickNameControl.setValue('', { emitEvent: false });
      }
      nickNameControl.updateValueAndValidity({ emitEvent: false });
    }
  }

  private updateMobileWalletValidation(value: string): void {
    const mobileMoneyProviderCtrl =
      this.beneficiaryForm.get('mobileMoneyProvider')!;
    const mobileWalletNumberCtrl =
      this.beneficiaryForm.get('mobileWalletNumber')!;

    if (value === 'Yes') {
      mobileMoneyProviderCtrl.enable({ emitEvent: false });
      mobileWalletNumberCtrl.enable({ emitEvent: false });
      mobileMoneyProviderCtrl.setValidators([this.notSelectRequired()]);
      mobileWalletNumberCtrl.setValidators([
        this.requiredWithWhitespace(),
        this.pattern(this.RGX_PHONE_9, 'Phone number must be 9 digits'),
      ]);
    } else {
      mobileMoneyProviderCtrl.disable({ emitEvent: false });
      mobileWalletNumberCtrl.disable({ emitEvent: false });
      mobileMoneyProviderCtrl.clearValidators();
      mobileWalletNumberCtrl.clearValidators();
      mobileMoneyProviderCtrl.setValue('', { emitEvent: false });
      mobileWalletNumberCtrl.setValue('', { emitEvent: false });
    }
    mobileMoneyProviderCtrl.updateValueAndValidity({ emitEvent: false });
    mobileWalletNumberCtrl.updateValueAndValidity({ emitEvent: false });
  }

  private updateIncomeSourceFields(value: string): void {
    const otherControl = this.beneficiaryForm.get('otherIncomeSource')!;
    const monthlyControl = this.beneficiaryForm.get('avgMonthlyIncome')!;

    if (value === 'OTHER') {
      otherControl.enable({ emitEvent: false });
      otherControl.setValidators([
        this.requiredWithWhitespace(),
        this.pattern(this.RGX_CHARS_SPACES, 'Only letters and spaces'),
        this.size(2, 50),
      ]);
    } else {
      otherControl.disable({ emitEvent: false });
      otherControl.clearValidators();
      otherControl.setValue('', { emitEvent: false });
    }

    if (value && value !== 'NONE' && value !== 'SELECT') {
      monthlyControl.enable({ emitEvent: false });
      monthlyControl.setValidators([
        this.numberNotNegative('Add valid monthly income'),
        this.numMax(1000000),
      ]);
    } else {
      monthlyControl.disable({ emitEvent: false });
      monthlyControl.clearValidators();
      monthlyControl.setValue('', { emitEvent: false });
    }

    otherControl.updateValueAndValidity({ emitEvent: false });
    monthlyControl.updateValueAndValidity({ emitEvent: false });
  }

  private updateIdLogic(): void {
    const legalStatus = this.beneficiaryForm.get('legalStatus')!.value;
    const hasIdControl = this.beneficiaryForm.get('hasNationalId')!;
    const typeControl = this.beneficiaryForm.get('idType')!;
    const otherControl = this.beneficiaryForm.get('idTypeOther')!;
    const numberControl = this.beneficiaryForm.get('respondentIdNumber')!;

    // Reset validators before applying new ones
    typeControl.clearValidators();
    otherControl.clearValidators();
    numberControl.clearValidators();

    const allIdTypes = this.lookup.getDocumentTypeEnum();
    const refugeeIdTypes = allIdTypes.filter((o) =>
      o.value.startsWith('REFUGEE')
    );
    const nonRefugeeIdTypes = allIdTypes.filter(
      (o) => !o.value.startsWith('REFUGEE') && o.value !== 'SELECT'
    );

    if (legalStatus === 'REFUGEE') {
      this.currentIdTypeOptions = refugeeIdTypes;
      if (
        !typeControl.value ||
        !refugeeIdTypes.some((o) => o.value === typeControl.value)
      ) {
        typeControl.setValue('', { emitEvent: false });
      }

      hasIdControl.setValue('Yes', { emitEvent: false });
      hasIdControl.disable({ emitEvent: false });

      typeControl.setValidators([this.requiredWithWhitespace()]);
      numberControl.setValidators([
        this.requiredWithWhitespace(),
        this.pattern(this.RGX_REFUGEE_ID, 'ID must be valid refugee format'),
        this.size(5, 14),
      ]);

      typeControl.enable({ emitEvent: false });
      numberControl.enable({ emitEvent: false });
      typeControl.setValidators([
        this.requiredWithWhitespace(),
        this.disallow(
          ['SELECT', 'PASSPORT', 'NATIONAL_ID', 'OTHER'],
          'Please select a valid ID type'
        ),
      ]);
      numberControl.setValidators([
        this.requiredWithWhitespace(),
        this.pattern(
          this.RGX_REFUGEE_ID,
          'ID number must contain digits, letters, hyphen only'
        ),
        this.size(5, 14),
      ]);

      otherControl.disable({ emitEvent: false });
      otherControl.setValue('', { emitEvent: false });
    } else {
      this.currentIdTypeOptions = nonRefugeeIdTypes;
      if (
        !typeControl.value ||
        !nonRefugeeIdTypes.some((o) => o.value === typeControl.value)
      ) {
        typeControl.setValue('', { emitEvent: false });
      }
      hasIdControl.enable({ emitEvent: false });

      if (hasIdControl.value === 'Yes') {
        typeControl.enable({ emitEvent: false });
        typeControl.setValidators([this.requiredWithWhitespace()]);

        if (typeControl.value === 'OTHER') {
          otherControl.enable({ emitEvent: false });
          numberControl.enable({ emitEvent: false });
          otherControl.setValidators([
            this.requiredWithWhitespace(),
            this.pattern(this.RGX_CHARS_SPACES, 'Only letters/spaces'),
            this.size(2, 50),
          ]);
          numberControl.setValidators([
            this.requiredWithWhitespace(),
            this.pattern(this.RGX_ALPHANUM_SPACE, 'ID must be alphanumeric'),
            this.size(5, 14),
          ]);
        } else if (typeControl.value === 'NONE' || !typeControl.value) {
          otherControl.disable({ emitEvent: false });
          numberControl.disable({ emitEvent: false });
          otherControl.setValue('', { emitEvent: false });
          numberControl.setValue('', { emitEvent: false });
        } else {
          // Passport, National ID
          numberControl.enable({ emitEvent: false });
          otherControl.disable({ emitEvent: false });
          numberControl.setValidators([
            this.requiredWithWhitespace(),
            this.pattern(this.RGX_ALPHANUM_SPACE, 'ID must be alphanumeric'),
            this.size(5, 14),
          ]);
          otherControl.setValue('', { emitEvent: false });
        }
      } else {
        // hasNationalId is 'No' or empty
        typeControl.disable({ emitEvent: false });
        otherControl.disable({ emitEvent: false });
        numberControl.disable({ emitEvent: false });
        typeControl.setValue('', { emitEvent: false });
        otherControl.setValue('', { emitEvent: false });
        numberControl.setValue('', { emitEvent: false });
      }
    }

    // Force UI update
    typeControl.updateValueAndValidity({ emitEvent: false });
    otherControl.updateValueAndValidity({ emitEvent: false });
    numberControl.updateValueAndValidity({ emitEvent: false });
  }

  private updateFormUI() {
    this.updateRelationshipFields(
      this.beneficiaryForm.get('relationship')!.value
    );
    this.updateMaritalStatusFields(
      this.beneficiaryForm.get('maritalStatus')!.value
    );
    this.updateIdLogic();
    this.updateIncomeSourceFields(
      this.beneficiaryForm.get('mainIncomeSource')!.value
    );
    this.updateMobileWalletValidation(
      this.beneficiaryForm.get('hasMobileWallet')!.value
    );
    this.filterReasons(this.beneficiaryForm.get('supportType')?.value);
    this.beneficiaryForm.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  // ========= Form skeleton =========
  private initForm() {
    this.beneficiaryForm = this.fb.group({
      householdNumber: [{ value: '', disabled: true }],
      respondentFirstName: [
        '',
        [
          this.requiredWithWhitespace(),
          this.capitalized(),
          this.onlyLetters(),
          this.size(this.MIN_NAME, this.MAX_NAME),
        ],
      ],
      respondentMiddleName: [
        '',
        [
          this.requiredWithWhitespace(),
          this.capitalized(),
          this.onlyLetters(),
          this.size(this.MIN_NAME, this.MAX_NAME),
        ],
      ],
      respondentLastName: [
        '',
        [
          this.requiredWithWhitespace(),
          this.capitalized(),
          this.onlyLetters(),
          this.size(this.MIN_NAME, this.MAX_NAME),
        ],
      ],
      respondentNickName: ['', [this.optionalCapitalizedName()]],

      relationship: ['', [this.notSelectRequired()]],
      relationshipOther: [''],

      respondentAge: ['', [this.intBetween(1, 99)]],
      gender: ['', [this.notSelectRequired()]],

      maritalStatus: ['', [this.notSelectRequired()]],
      spouseFirstName: [''],
      spouseMiddleName: [''],
      spouseLastName: [''],
      spouseNickName: [''],

      legalStatus: ['', [this.notSelectRequired()]],
      hasNationalId: [''], // 'Yes'|'No'
      idType: [''],
      idTypeOther: [''],
      respondentIdNumber: [''],
      respondentMobileWalletPhone: [
        '',
        [
          this.optionalPattern(
            this.RGX_PHONE_9,
            'Phone number length must be 9'
          ),
        ],
      ],
      respondentPhone: [
        '',
        [
          this.optionalPattern(
            this.RGX_PHONE_9,
            'Phone number length must be 9'
          ),
        ],
      ],

      mainIncomeSource: ['', [this.notSelectRequired()]],
      hasMobileWallet: [''],
      mobileMoneyProvider: [''],
      mobileWalletNumber: [''],
      otherIncomeSource: [''],
      avgMonthlyIncome: [''],

      supportType: [''],
      selectionReasons: this.fb.control([]),

      canReadWrite: [''], // 'Yes'|'No'
      literate1835Count: ['0', [this.intMin(0)]],
      householdSize: ['0', [this.intMin(0)]],

      alternates: this.fb.array([]),
      nominees: this.fb.array([]),
    });
  }

  // ========= Load & patch =========
  private loadBeneficiary(applicationId: string) {
    this.api
      .GET(`/api/beneficiary/details/${applicationId}`)
      .then((res: any) => {
        this.originalDto = res?.data;
        const dto = this.originalDto;

        // Patch personal
        this.beneficiaryForm.patchValue(
          {
            householdNumber: dto.applicationId || '',
            respondentFirstName: dto.respondentFirstName,
            respondentMiddleName: dto.respondentMiddleName,
            respondentLastName: dto.respondentLastName,
            respondentNickName: dto.respondentNickName,
            relationship: dto.relationshipWithHouseholdHead,
            relationshipOther: dto.relationshipOther,
            respondentAge: dto.respondentAge,
            gender: dto.respondentGender,
            maritalStatus: dto.respondentMaritalStatus,
            spouseFirstName: dto.spouseFirstName,
            spouseMiddleName: dto.spouseMiddleName,
            spouseLastName: dto.spouseLastName,
            spouseNickName: dto.spouseNickName,
            legalStatus: dto.respondentLegalStatus,
            hasNationalId: dto.documentType !== 'NONE' ? 'Yes' : 'No',
            idType: dto.documentType,
            idTypeOther: dto.documentTypeOther,
            respondentIdNumber: dto.respondentId,
            respondentPhone: dto.respondentPhoneNo?.startsWith('+211')
              ? dto.respondentPhoneNo.substring(4)
              : dto.respondentPhoneNo || null,
            mainIncomeSource: dto.householdIncomeSource,
            mobileMoneyProvider: dto.mobileMoneyProvider,
            mobileWalletNumber: dto.mobileWalletNumber?.startsWith('+211')
              ? dto.mobileWalletNumber.substring(4)
              : dto.mobileWalletNumber || '',
            otherIncomeSource: dto.incomeSourceOther,
            avgMonthlyIncome: dto.householdMonthlyAvgIncome,
            supportType:
              dto.selectionCriteria === 'LIPW'
                ? 'Public Works'
                : 'Direct Income Support',
            selectionReasons: Array.isArray(dto.selectionReason)
              ? dto.selectionReason
              : [dto.selectionReason],
            canReadWrite: dto.isReadWrite ? 'Yes' : 'No',
            hasMobileWallet: dto.hasMobileWallet ? 'Yes' : 'No',
            literate1835Count: dto.memberReadWrite ?? '0',
            householdSize: dto.householdSize ?? '0',
          },
          { emitEvent: false }
        );

        // Patch breakdown helper
        const pv = (src: any, map: Record<string, string>) => {
          if (!src) return;
          const patch: any = {};
          Object.entries(map).forEach(
            ([formKey, dtoKey]) => (patch[formKey] = src[dtoKey])
          );
          this.beneficiaryForm.patchValue(patch, { emitEvent: false });
        };
        pv(dto.householdMember2, {
          m0_2_total: 'maleTotal',
          m0_2_disable: 'maleDisable',
          m0_2_chronic: 'maleChronicalIll',
          m0_2_both: 'maleBoth',
          f0_2_total: 'femaleTotal',
          f0_2_disable: 'femaleDisable',
          f0_2_chronic: 'femaleChronicalIll',
          f0_2_both: 'femaleBoth',
        });
        pv(dto.householdMember5, {
          m3_5_total: 'maleTotal',
          m3_5_disable: 'maleDisable',
          m3_5_chronic: 'maleChronicalIll',
          m3_5_both: 'maleBoth',
          f3_5_total: 'femaleTotal',
          f3_5_disable: 'femaleDisable',
          f3_5_chronic: 'femaleChronicalIll',
          f3_5_both: 'femaleBoth',
        });
        pv(dto.householdMember17, {
          m6_17_total: 'maleTotal',
          m6_17_disable: 'maleDisable',
          m6_17_chronic: 'maleChronicalIll',
          m6_17_both: 'maleBoth',
          f6_17_total: 'femaleTotal',
          f6_17_disable: 'femaleDisable',
          f6_17_chronic: 'femaleChronicalIll',
          f6_17_both: 'femaleBoth',
        });
        pv(dto.householdMember35, {
          m18_35_total: 'maleTotal',
          m18_35_disable: 'maleDisable',
          m18_35_chronic: 'maleChronicalIll',
          m18_35_both: 'maleBoth',
          f18_35_total: 'femaleTotal',
          f18_35_disable: 'femaleDisable',
          f18_35_chronic: 'femaleChronicalIll',
          f18_35_both: 'femaleBoth',
        });
        pv(dto.householdMember64, {
          m36_64_total: 'maleTotal',
          m36_64_disable: 'maleDisable',
          m36_64_chronic: 'maleChronicalIll',
          m36_64_both: 'maleBoth',
          f36_64_total: 'femaleTotal',
          f36_64_disable: 'femaleDisable',
          f36_64_chronic: 'femaleChronicalIll',
          f36_64_both: 'femaleBoth',
        });
        pv(dto.householdMember65, {
          m65_total: 'maleTotal',
          m65_disable: 'maleDisable',
          m65_chronic: 'maleChronicalIll',
          m65_both: 'maleBoth',
          f65_total: 'femaleTotal',
          f65_disable: 'femaleDisable',
          f65_chronic: 'femaleChronicalIll',
          f65_both: 'femaleBoth',
        });

        pv(dto.householdMemberLactating35, {
          f18_35_lactating_total: 'femaleTotal',
          f18_35_lactating_disable: 'femaleDisable',
          f18_35_lactating_chronic: 'femaleChronicalIll',
          f18_35_lactating_both: 'femaleBoth',
        });
        pv(dto.householdMemberLactating64, {
          f36_64_lactating_total: 'femaleTotal',
          f36_64_lactating_disable: 'femaleDisable',
          f36_64_lactating_chronic: 'femaleChronicalIll',
          f36_64_lactating_both: 'femaleBoth',
        });

        // Alternates
        this.alternates.clear();
        if (dto.alternatePayee1)
          this.alternates.push(this.createAlternateGroup(dto.alternatePayee1));
        if (dto.alternatePayee2)
          this.alternates.push(this.createAlternateGroup(dto.alternatePayee2));

        // Nominees
        this.nominees.clear();
        if (Array.isArray(dto.nominees)) {
          dto.nominees.forEach((n) =>
            this.nominees.push(this.createNomineeGroup(n))
          );
        }

        this.updateFormUI();
      })
      .catch((err) => console.error('Failed to load beneficiary:', err))
      .finally(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  // ========= Build payload =========
  private getOptionalStringValue(value: any): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    const trimmed = String(value).trim();
    return trimmed === '' ? null : trimmed;
  }

  // ========= Build payload =========
  private buildUpdatePayload(formValue: any): BeneficiaryDto {
    const payload: BeneficiaryDto = JSON.parse(
      JSON.stringify(this.originalDto)
    );

    payload.respondentFirstName = formValue.respondentFirstName;
    payload.respondentMiddleName = this.getOptionalStringValue(
      formValue.respondentMiddleName
    );
    payload.respondentLastName = formValue.respondentLastName;
    payload.respondentNickName = this.getOptionalStringValue(
      formValue.respondentNickName
    );
    payload.relationshipWithHouseholdHead = formValue.relationship;
    payload.relationshipOther = this.getOptionalStringValue(
      formValue.relationshipOther
    );
    payload.respondentAge = +formValue.respondentAge;
    payload.respondentGender = formValue.gender;
    payload.respondentMaritalStatus = formValue.maritalStatus;
    payload.spouseFirstName = this.getOptionalStringValue(
      formValue.spouseFirstName
    );
    payload.spouseMiddleName = this.getOptionalStringValue(
      formValue.spouseMiddleName
    );
    payload.spouseLastName = this.getOptionalStringValue(formValue.spouseLastName);
    payload.spouseNickName = this.getOptionalStringValue(formValue.spouseNickName);
    payload.respondentLegalStatus = formValue.legalStatus;
    const phone = formValue.respondentPhone?.toString().trim();
    payload.respondentPhoneNo = phone ? `+211${phone}` : null;
    if (formValue.hasNationalId === 'No') {
      payload.documentType = 'NONE';
      payload.documentTypeOther = null;
      payload.respondentId = '';
    } else {
      payload.documentType = formValue.idType;
      payload.documentTypeOther = this.getOptionalStringValue(
        formValue.idTypeOther
      );
      payload.respondentId = formValue.respondentIdNumber?.trim() || '';
    }
    payload.householdIncomeSource = formValue.mainIncomeSource;
    payload.hasMobileWallet = formValue.hasMobileWallet === 'Yes';
    payload.mobileMoneyProvider = formValue.mobileMoneyProvider || null;
    const wphone = formValue.mobileWalletNumber?.toString().trim();
    payload.mobileWalletNumber = wphone ? `+211${wphone}` : null;
    payload.incomeSourceOther = this.getOptionalStringValue(
      formValue.otherIncomeSource
    );
    payload.householdMonthlyAvgIncome = +formValue.avgMonthlyIncome || 0;

    payload.selectionCriteria =
      formValue.supportType === 'Public Works' ? 'LIPW' : 'DIS';
    payload.selectionReason = formValue.selectionReasons;
    payload.isReadWrite = formValue.canReadWrite === 'Yes';
    payload.memberReadWrite = +formValue.literate1835Count;
    payload.householdSize = +formValue.householdSize;

    // Breakdown copy helper
    const copy = (
      dstKey: keyof BeneficiaryDto,
      mPrefix: string,
      fPrefix: string
    ) => {
      if ((payload as any)[dstKey]) {
        (payload as any)[dstKey] = {
          ...(payload as any)[dstKey],
          maleTotal: +formValue[`${mPrefix}_total`] || 0,
          maleDisable: +formValue[`${mPrefix}_disable`] || 0,
          maleChronicalIll: +formValue[`${mPrefix}_chronic`] || 0,
          maleBoth: +formValue[`${mPrefix}_both`] || 0,
          femaleTotal: +formValue[`${fPrefix}_total`] || 0,
          femaleDisable: +formValue[`${fPrefix}_disable`] || 0,
          femaleChronicalIll: +formValue[`${fPrefix}_chronic`] || 0,
          femaleBoth: +formValue[`${fPrefix}_both`] || 0,
        };
      }
    };
    copy('householdMember2', 'm0_2', 'f0_2');
    copy('householdMember5', 'm3_5', 'f3_5');
    copy('householdMember17', 'm6_17', 'f6_17');
    copy('householdMember35', 'm18_35', 'f18_35');
    copy('householdMember64', 'm36_64', 'f36_64');
    copy('householdMember65', 'm65', 'f65');

    if (payload.householdMemberLactating35) {
      Object.assign(payload.householdMemberLactating35, {
        femaleTotal: +formValue.f18_35_lactating_total || 0,
        femaleDisable: +formValue.f18_35_lactating_disable || 0,
        femaleChronicalIll: +formValue.f18_35_lactating_chronic || 0,
        femaleBoth: +formValue.f18_35_lactating_both || 0,
      });
    }
    if (payload.householdMemberLactating64) {
      Object.assign(payload.householdMemberLactating64, {
        femaleTotal: +formValue.f36_64_lactating_total || 0,
        femaleDisable: +formValue.f36_64_lactating_disable || 0,
        femaleChronicalIll: +formValue.f36_64_lactating_chronic || 0,
        femaleBoth: +formValue.f36_64_lactating_both || 0,
      });
    }

    // Alternates
    if (formValue.alternates?.length) {
      if (payload.alternatePayee1 && formValue.alternates[0]) {
        const a = formValue.alternates[0];
        const altPhone = a.payeePhoneNo?.toString().trim();
        Object.assign(payload.alternatePayee1, {
          payeeFirstName: a.payeeFirstName,
          payeeMiddleName: this.getOptionalStringValue(a.payeeMiddleName),
          payeeLastName: a.payeeLastName,
          payeeNickName: this.getOptionalStringValue(a.payeeNickName),
          payeeGender: a.payeeGender,
          payeeAge: a.payeeAge,
          relationshipWithHouseholdHead: a.relationshipWithHouseholdHead,
          relationshipOther: this.getOptionalStringValue(a.relationshipOther),
          documentType: a.documentType,
          documentTypeOther: this.getOptionalStringValue(a.documentTypeOther),
          nationalId: a.nationalId?.trim() || '',
          payeePhoneNo: altPhone ? `+211${altPhone}` : null,
        });

        if (payload.alternatePayee1.documentType === 'NONE') {
            payload.alternatePayee1.documentTypeOther = null;
            payload.alternatePayee1.nationalId = '';
        }
        delete (payload.alternatePayee1 as any).biometrics;
      }
      if (payload.alternatePayee2 && formValue.alternates[1]) {
        const a = formValue.alternates[1];
        const altPhone = a.payeePhoneNo?.toString().trim();
        Object.assign(payload.alternatePayee2, {
          payeeFirstName: a.payeeFirstName,
          payeeMiddleName: this.getOptionalStringValue(a.payeeMiddleName),
          payeeLastName: a.payeeLastName,
          payeeNickName: this.getOptionalStringValue(a.payeeNickName),
          payeeGender: a.payeeGender,
          payeeAge: a.payeeAge,
          relationshipWithHouseholdHead: a.relationshipWithHouseholdHead,
          relationshipOther: this.getOptionalStringValue(a.relationshipOther),
          documentType: a.documentType,
          documentTypeOther: this.getOptionalStringValue(a.documentTypeOther),
          nationalId: a.nationalId?.trim() || '',
          payeePhoneNo: altPhone ? `+211${altPhone}` : null,
        });

        if (payload.alternatePayee2.documentType === 'NONE') {
            payload.alternatePayee2.documentTypeOther = null;
            payload.alternatePayee2.nationalId = '';
        }
        delete (payload.alternatePayee2 as any).biometrics;
      }
    }

    // Nominees
    payload.nominees = formValue.nominees.map((n: any) => ({
      id: n.id,
      applicationId: payload.applicationId,
      nomineeFirstName: n.nomineeFirstName,
      nomineeMiddleName: n.nomineeMiddleName,
      nomineeLastName: n.nomineeLastName,
      nomineeNickName: this.getOptionalStringValue(n.nomineeNickName),
      relationshipWithHouseholdHead: n.relationshipWithHouseholdHead,
      relationshipOther: this.getOptionalStringValue(n.relationshipOther),
      nomineeAge: n.nomineeAge,
      nomineeGender: n.nomineeGender,
      isReadWrite: n.isReadWrite,
      nomineeOccupation: n.nomineeOccupation,
      otherOccupation: this.getOptionalStringValue(n.otherOccupation),
    }));

    delete (payload as any).biometrics;
    return payload;
  }

  // ========= Submit =========
  onSubmit() {
    this.beneficiaryForm.markAllAsTouched();
    if (!this.beneficiaryForm.valid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fix the highlighted errors.',
      });
      return;
    }

    const beneficiary = this.buildUpdatePayload(
      this.beneficiaryForm.getRawValue()
    );
    const payload = { beneficiaries: [beneficiary] };

    this.isLoading = true;
    this.api
      .POST('api/beneficiary/update/batch', payload)
      .then((res: any) => {
        const responses = res?.bulkResponse || res?.data?.bulkResponse || [];
        if (!responses.length) {
          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: 'No response returned from server.',
          });
          return;
        }
        const first = responses[0];
        if (first.result === 'SUCCESS') {
          this.messageService.add({
            severity: 'success',
            summary: 'Update Successful',
            detail: 'Beneficiary edit request sent successfully!',
          });
          setTimeout(() => this.router.navigate(['/beneficiary/list']), 3000);
        } else if (first.result === 'FAILED') {
          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: first.errorMessage || 'Unknown error occurred',
          });
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Update Status',
            detail: `Unexpected result: ${first.result}`,
          });
        }
      })
      .catch((err) => {
        console.error('Update failed:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Request could not be processed',
        });
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  // ========= Selection reasons =========

  filterReasons(supportType: string) {
    if (supportType === 'Public Works') {
      this.filteredReasons = this.allReasons.filter((r) =>
        r.value.startsWith('LIPW_REASON')
      );
    } else if (supportType === 'Direct Income Support') {
      this.filteredReasons = this.allReasons.filter((r) =>
        r.value.startsWith('DIS_REASON')
      );
    } else {
      this.filteredReasons = [];
    }
  }
  isReasonSelected(value: string): boolean {
    const reasons = this.beneficiaryForm.get('selectionReasons')?.value || [];
    return reasons.includes(value);
  }

  // ========= Arrays =========
  get nominees(): FormArray {
    return this.beneficiaryForm.get('nominees') as FormArray;
  }
  get alternates(): FormArray {
    return this.beneficiaryForm.get('alternates') as FormArray;
  }

  private createNomineeGroup(n: any = {}): FormGroup {
    const g = this.fb.group({
      id: [n.id || null],
      nomineeFirstName: [
        n.nomineeFirstName || '',
        [
          this.requiredWithWhitespace(),
          this.capitalized(),
          this.onlyLetters(),
          this.size(this.MIN_NAME, this.MAX_NAME),
        ],
      ],
      nomineeMiddleName: [
        n.nomineeMiddleName || '',
        [
          this.requiredWithWhitespace(),
          this.capitalized(),
          this.onlyLetters(),
          this.size(this.MIN_NAME, this.MAX_NAME),
        ],
      ],
      nomineeLastName: [
        n.nomineeLastName || '',
        [
          this.requiredWithWhitespace(),
          this.capitalized(),
          this.onlyLetters(),
          this.size(this.MIN_NAME, this.MAX_NAME),
        ],
      ],
      nomineeNickName: [
        n.nomineeNickName || '',
        [this.optionalCapitalizedName()],
      ],
      relationshipWithHouseholdHead: [
        n.relationshipWithHouseholdHead || '',
        [this.notSelectRequired()],
      ],
      relationshipOther: [n.relationshipOther || ''],
      nomineeAge: [n.nomineeAge || '', [this.intMin(1)]],
      nomineeGender: [n.nomineeGender || '', [this.notSelectRequired()]],
      isReadWrite: [n.isReadWrite ?? null, [Validators.required]],
      nomineeOccupation: [
        n.nomineeOccupation || '',
        [this.notSelectRequired()],
      ],
      otherOccupation: [n.otherOccupation || ''],
    });

    // OTHER relationship
    const updateNomineeRelationship = () => {
      const v = g.get('relationshipWithHouseholdHead')?.value;
      const c = g.get('relationshipOther')!;
      if (v === 'OTHER') {
        c.enable({ emitEvent: false });
        c.setValidators([
          this.requiredWithWhitespace(),
          this.pattern(this.RGX_CHARS_SPACES, 'Only letters and spaces'),
          this.size(2, 25),
        ]);
      } else {
        c.disable({ emitEvent: false });
        c.clearValidators();
        c.setValue('', { emitEvent: false });
      }
      c.updateValueAndValidity({ emitEvent: false });
    };
    g.get('relationshipWithHouseholdHead')?.valueChanges.subscribe(
      updateNomineeRelationship
    );
    updateNomineeRelationship();

    // OTHER occupation
    const updateNomineeOccupation = () => {
      const v = g.get('nomineeOccupation')?.value;
      const c = g.get('otherOccupation')!;
      if (v === 'OTHER') {
        c.enable({ emitEvent: false });
        c.setValidators([
          this.requiredWithWhitespace(),
          this.pattern(this.RGX_CHARS_SPACES, 'Only letters and spaces'),
          this.size(2, 25),
        ]);
      } else {
        c.disable({ emitEvent: false });
        c.clearValidators();
        c.setValue('', { emitEvent: false });
      }
      c.updateValueAndValidity({ emitEvent: false });
    };
    g.get('nomineeOccupation')?.valueChanges.subscribe(updateNomineeOccupation);
    updateNomineeOccupation();

    return g;
  }

  private createAlternateGroup(a: any = {}): FormGroup {
    const g = this.fb.group({
      id: [a.id || null],
      payeeFirstName: [
        a.payeeFirstName || '',
        [
          this.requiredWithWhitespace(),
          this.capitalized(),
          this.onlyLetters(),
          this.size(this.MIN_NAME, this.MAX_NAME),
        ],
      ],
      payeeMiddleName: [
        a.payeeMiddleName || '',
        [
          this.requiredWithWhitespace(),
          this.capitalized(),
          this.onlyLetters(),
          this.size(this.MIN_NAME, this.MAX_NAME),
        ],
      ],
      payeeLastName: [
        a.payeeLastName || '',
        [
          this.requiredWithWhitespace(),
          this.capitalized(),
          this.onlyLetters(),
          this.size(this.MIN_NAME, this.MAX_NAME),
        ],
      ],
      payeeNickName: [a.payeeNickName || '', [this.optionalCapitalizedName()]],
      payeeGender: [a.payeeGender || '', [this.notSelectRequired()]],
      payeeAge: [a.payeeAge || '', [this.intMin(1)]],
      relationshipWithHouseholdHead: [
        a.relationshipWithHouseholdHead || '',
        [this.notSelectRequired()],
      ],
      relationshipOther: [a.relationshipOther || ''],
      documentType: [a.documentType || ''],
      documentTypeOther: [a.documentTypeOther || ''],
      nationalId: [a.nationalId || ''],
      payeePhoneNo: [
        a.payeePhoneNo?.startsWith('+211')
          ? a.payeePhoneNo.substring(4)
          : a.payeePhoneNo || null,
        [
          this.optionalPattern(
            this.RGX_PHONE_9,
            'Phone number must be 9 digits'
          ),
        ],
      ],
      hasNationalId: [
        a.documentType && a.documentType !== 'NONE' ? 'Yes' : 'No',
      ],
    });

    // OTHER relationship
    g.get('relationshipWithHouseholdHead')?.valueChanges.subscribe((v) => {
      const c = g.get('relationshipOther')!;
      if (v === 'OTHER') {
        c.enable({ emitEvent: false });
        c.setValidators([
          this.requiredWithWhitespace(),
          this.pattern(this.RGX_CHARS_SPACES, 'Only letters and spaces'),
          this.size(2, 50),
        ]);
      } else {
        c.disable({ emitEvent: false });
        c.clearValidators();
        c.setValue('', { emitEvent: false });
      }
      c.updateValueAndValidity({ emitEvent: false });
    });

    // ID rules (AlForm1Validation)
    const updateAltId = () => {
      const hasId = g.get('hasNationalId')!.value;
      const type = g.get('documentType')!;
      const num = g.get('nationalId')!;
      const other = g.get('documentTypeOther')!;

      type.clearValidators();
      num.clearValidators();
      other.clearValidators();

      if (hasId === 'Yes') {
        type.enable({ emitEvent: false });
        type.setValidators([
          this.requiredWithWhitespace(),
          this.disallow(['SELECT'], 'ID Type is required'),
        ]);

        if (type.value === 'OTHER') {
          other.enable({ emitEvent: false });
          other.setValidators([
            this.requiredWithWhitespace(),
            this.pattern(this.RGX_CHARS_SPACES, 'Only letters and spaces'),
            this.size(2, 50),
          ]);
        } else {
          other.disable({ emitEvent: false });
          other.setValue('', { emitEvent: false });
        }

        if (type.value === 'NONE') {
          num.disable({ emitEvent: false });
          num.setValue('', { emitEvent: false });
        } else {
          num.enable({ emitEvent: false });
          const refTypes = [
            'REFUGEE_RATION_CARD',
            'REFUGEE_ID_CARD',
            'REFUGEE_PROOF_OF_REGISTRATION',
          ];
          const isRef = refTypes.includes(type.value);
          num.setValidators([
            this.requiredWithWhitespace(),
            this.pattern(
              isRef ? this.RGX_REFUGEE_ID : this.RGX_ALPHANUM_SPACE,
              isRef
                ? 'ID number must contain digits, letters, hyphen only'
                : 'ID number must contain digits, letters'
            ),
            this.size(5, 14),
          ]);
        }
      } else {
        // hasId === 'No'
        type.disable({ emitEvent: false });
        num.disable({ emitEvent: false });
        other.disable({ emitEvent: false });
        type.setValue('NONE', { emitEvent: false });
        num.setValue('', { emitEvent: false });
        other.setValue('', { emitEvent: false });
      }
      type.updateValueAndValidity({ emitEvent: false });
      num.updateValueAndValidity({ emitEvent: false });
      other.updateValueAndValidity({ emitEvent: false });
    };
    g.get('hasNationalId')?.valueChanges.subscribe(updateAltId);
    g.get('documentType')?.valueChanges.subscribe(updateAltId);
    updateAltId();

    return g;
  }

  // ========= Template helpers =========
  c(name: string): AbstractControl | null {
    return this.beneficiaryForm.get(name);
  }
  showError(name: string, key?: string): boolean {
    const ctrl = this.c(name);
    if (!ctrl) return false;
    const touched = ctrl.touched || ctrl.dirty;
    return touched && !!ctrl.errors && (key ? !!ctrl.errors[key] : true);
  }

  getError(
    fieldName: string,
    arrayIndex?: number,
    arrayName?: 'alternates' | 'nominees'
  ): string {
    let control;

    // If arrayIndex is provided, get control from FormArray
    if (arrayIndex !== undefined && arrayName) {
      const formArray = this.beneficiaryForm.get(arrayName) as FormArray;
      control = formArray.at(arrayIndex).get(fieldName);
    } else {
      // Otherwise get control from main form
      control = this.beneficiaryForm.get(fieldName);
    }

    if (!control || !control.errors) {
      return '';
    }

    // Combined field labels mapping (main form + alternates/nominees)
    const fieldLabels: { [key: string]: string } = {
      // Main form fields
      respondentFirstName: 'First Name',
      respondentMiddleName: 'Middle Name',
      respondentLastName: 'Last Name',
      respondentNickName: 'Nick Name',
      relationship: 'Relationship',
      relationshipOther: 'Relationship Other',
      respondentAge: 'Age',
      gender: 'Gender',
      maritalStatus: 'Marital Status',
      spouseFirstName: 'Spouse First Name',
      spouseMiddleName: 'Spouse Middle Name',
      spouseLastName: 'Spouse Last Name',
      spouseNickName: 'Spouse Nick Name',
      legalStatus: 'Legal Status',
      idType: 'ID Type',
      idTypeOther: 'ID Type Other',
      respondentIdNumber: 'ID Number',
      respondentPhone: 'Phone Number',
      mobileWalletNumber: 'Mobile Wallet Number',

      // Alternate/Nominee fields
      payeeFirstName: 'First Name',
      payeeMiddleName: 'Middle Name',
      payeeLastName: 'Last Name',
      payeeNickName: 'Nick Name',
      payeeGender: 'Gender',
      payeeAge: 'Age',
      relationshipWithHouseholdHead: 'Relationship',
      documentType: 'ID Type',
      documentTypeOther: 'ID Type Other',
      nationalId: 'ID Number',
      payeePhoneNo: 'Contact Number',
      nomineeFirstName: 'First Name',
      nomineeMiddleName: 'Middle Name',
      nomineeLastName: 'Last Name',
      nomineeNickName: 'Nick Name',
      nomineeGender: 'Gender',
      nomineeAge: 'Age',
      isReadWrite: 'Can Read/Write',
      nomineeOccupation: 'Occupation',
      otherOccupation: 'Other Occupation',
    };

    const label = fieldLabels[fieldName] || fieldName;
    const errors = control.errors;

    // Required validation
    if (errors['required']) {
      return `${label} is required`;
    }

    // Custom "notSelectRequired" validation (for dropdowns)
    if (errors['notSelectRequired']) {
      return `Please select a ${label}`;
    }

    // Capitalized validation
    if (errors['capitalized']) {
      return `${label} must start with a capital letter`;
    }

    // Only letters validation
    if (errors['onlyLetters']) {
      return `${label} must contain only letters`;
    }

    // Size validation (min/max length)
    if (errors['size']) {
      const { min, max, actual } = errors['size'];
      if (actual < min) {
        return `${label} must be at least ${min} characters`;
      }
      if (actual > max) {
        return `${label} must not exceed ${max} characters`;
      }
    }

    // Integer between validation
    if (errors['intBetween']) {
      const { min, max } = errors['intBetween'];
      return `${label} must be between ${min} and ${max}`;
    }

    // Integer minimum validation
    if (errors['intMin']) {
      const { min } = errors['intMin'];
      return `${label} must be at least ${min}`;
    }

    // Pattern validation (for phone)
    if (errors['pattern']) {
      if (
        fieldName === 'respondentPhone' ||
        fieldName === 'payeePhoneNo' ||
        fieldName == 'mobileWalletNumber'
      ) {
        return 'Phone number must be exactly 9 digits';
      }
      return `${label} format is invalid`;
    }

    // Optional pattern with custom message
    if (errors['optionalPattern']) {
      return errors['optionalPattern'];
    }

    // Optional capitalized name
    if (errors['optionalCapitalizedName']) {
      return `${label} must start with a capital letter if provided`;
    }

    // Generic error
    return `${label} is invalid`;
  }
  // ========= Custom validators =========
  private capitalized() {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value || '').toString().trim();
      if (!v) return null;
      return /^[A-Z]/.test(v)
        ? null
        : { capitalized: 'Must start with a capital letter' };
    };
  }
  private onlyLetters() {
    return this.pattern(
      this.RGX_ONLY_CHARS,
      'Must not contain space, digits or special characters'
    );
  }
  private requiredWithWhitespace() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (
        value === null ||
        value === undefined ||
        (typeof value === 'string' && value.trim().length === 0)
      ) {
        return { required: true };
      }
      return null;
    };
  }

  private size(min: number, max: number) {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value ?? '').toString().trim();
      if (!v) return null;
      const len = v.length;
      if (len < min) return { size: { min, max, actual: len } };
      if (len > max) return { size: { min, max, actual: len } };
      return null;
    };
  }
  private optionalCapitalizedName() {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value || '').toString().trim();
      if (!v) return null;
      if (v.length < this.MIN_NAME)
        return { size: `Must be at least ${this.MIN_NAME} characters` };
      if (!/^[A-Z]/.test(v))
        return { capitalized: 'Must start with a capital letter' };
      if (!this.RGX_ONLY_CHARS.test(v))
        return {
          pattern: 'Must not contain space, digits or special characters',
        };
      if (v.length > this.MAX_NAME)
        return { size: `Must be at most ${this.MAX_NAME} characters` };
      return null;
    };
  }
  private notSelectRequired() {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value || '').toString();
      if (!v || v === 'SELECT') return { required: 'This field is required' };
      return null;
    };
  }

  private pattern(regex: RegExp, msg: string) {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value || '').toString().trim();
      if (!v) return null; // Skip validation if input is empty
      return regex.test(v) ? null : { pattern: msg };
    };
  }

  private optionalPattern(regex: RegExp, msg: string) {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value || '').toString().trim();
      if (!v) return null;
      return regex.test(v) ? null : { pattern: msg };
    };
  }
  private disallow(values: string[], msg: string) {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value || '').toString();
      return values.includes(v) ? { disallow: msg } : null;
    };
  }
  private intBetween(min: number, max: number) {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = c.value;
      if (v === '' || v === null || v === undefined)
        return { required: 'Input age properly' };
      const n = Number(v);
      if (!Number.isInteger(n)) return { integer: 'Must be an integer' };
      if (n < min) return { min: 'Input age properly' };
      if (n > max) return { max: `Age can't be more than ${max}` };
      return null;
    };
  }
  private intMin(min: number) {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = c.value;
      if (v === '' || v === null || v === undefined) return null;
      const n = Number(v);
      if (!Number.isFinite(n)) return { number: 'Must be a number' };
      if (n < min) return { min: `Must be ≥ ${min}` };
      return null;
    };
  }
  private numberNotNegative(msg: string) {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = c.value;
      if (v === '' || v === null || v === undefined)
        return { required: 'Monthly income not given' };
      const n = Number(v);
      if (isNaN(n)) return { number: 'Must be a valid number' };
      if (n < 0) return { min: msg };
      return null;
    };
  }
  private numMin(min: number) {
    return (c: AbstractControl): ValidationErrors | null => {
      const n = Number(c.value ?? 0);
      return n < min ? { min: `Must be ≥ ${min}` } : null;
    };
  }
  private numMax(max: number) {
    return (c: AbstractControl): ValidationErrors | null => {
      const n = Number(c.value ?? 0);
      return n > max ? { max: `Must be ≤ ${max}` } : null;
    };
  }

  // ========= Form-level validators =========
  private breakdownSubcategoryNotExceedTotal() {
    return (fg: AbstractControl): ValidationErrors | null => {
      if (!(fg instanceof FormGroup)) return null;

      const f18_35_lactating_total = +fg.get('f18_35_lactating_total')?.value || 0;
      const f18_35_lactating_disable = +fg.get('f18_35_lactating_disable')?.value || 0;
      const f18_35_lactating_chronic = +fg.get('f18_35_lactating_chronic')?.value || 0;
      const f18_35_lactating_both = +fg.get('f18_35_lactating_both')?.value || 0;
      if (f18_35_lactating_disable + f18_35_lactating_chronic + f18_35_lactating_both > f18_35_lactating_total) {
        return { subExceeds: `Lactating women (18-35) subcategories exceed total` };
      }

      const f36_64_lactating_total = +fg.get('f36_64_lactating_total')?.value || 0;
      const f36_64_lactating_disable = +fg.get('f36_64_lactating_disable')?.value || 0;
      const f36_64_lactating_chronic = +fg.get('f36_64_lactating_chronic')?.value || 0;
      const f36_64_lactating_both = +fg.get('f36_64_lactating_both')?.value || 0;
      if (f36_64_lactating_disable + f36_64_lactating_chronic + f36_64_lactating_both > f36_64_lactating_total) {
        return { subExceeds: `Lactating women (36-64) subcategories exceed total` };
      }

      for (const g of this.ageGroups) {
        const mT = +fg.get(g.maleTotal)?.value || 0;
        const mD = +fg.get(g.maleDisable)?.value || 0;
        const mC = +fg.get(g.maleChronicalIll)?.value || 0;
        const mB = +fg.get(g.maleBoth)?.value || 0;

        const fT = +fg.get(g.femaleTotal)?.value || 0;
        const fD = +fg.get(g.femaleDisable)?.value || 0;
        const fC = +fg.get(g.femaleChronicalIll)?.value || 0;
        const fB = +fg.get(g.femaleBoth)?.value || 0;

        if (mD + mC + mB > mT)
          return {
            subExceeds: `Male subcategories exceed total in ${g.label}`,
          };
        if (fD + fC + fB > fT)
          return {
            subExceeds: `Female subcategories exceed total in ${g.label}`,
          };
      }
      return null;
    };
  }
  private householdSizeMatchesSum() {
    return (fg: AbstractControl): ValidationErrors | null => {
      if (!(fg instanceof FormGroup)) return null;
      let sum = 0;
      for (const g of this.ageGroups) {
        sum +=
          (+fg.get(g.maleTotal)?.value || 0) +
          (+fg.get(g.femaleTotal)?.value || 0);
      }
      sum += (+fg.get('f18_35_lactating_total')?.value || 0);
      sum += (+fg.get('f36_64_lactating_total')?.value || 0);
      const size = +fg.get('householdSize')?.value || 0;
      if (size <= 0)
        return {
          hhEmpty:
            'Household cannot be empty. There must be atleast one member',
        };
      if (sum !== size)
        return {
          hhSizeMismatch: "Household size doesn't match sum of members",
        };
      return null;
    };
  }
  private literate1835NotExceedYouth() {
    return (fg: AbstractControl): ValidationErrors | null => {
      const m = +fg.get('m18_35_total')?.value || 0;
      const f = +fg.get('f18_35_total')?.value || 0;
      const total = m + f;
      const lit = +fg.get('literate1835Count')?.value || 0;
      if (lit < 0) return { literateInvalid: 'Add How Many Can Read Write ?' };
      if (lit > total)
        return { literateTooHigh: 'Invalid data in Can Read Write' };
      return null;
    };
  }
  private personalAgeExistsInBreakdown() {
    return (fg: AbstractControl): ValidationErrors | null => {
      const age = +fg.get('respondentAge')?.value || 0;
      if (!age) return null;
      const group = (a: number) => {
        if (a <= 2) return { m: 'm0_2_total', f: 'f0_2_total' };
        if (a <= 5) return { m: 'm3_5_total', f: 'f3_5_total' };
        if (a <= 17) return { m: 'm6_17_total', f: 'f6_17_total' };
        if (a <= 35) return { m: 'm18_35_total', f: 'f18_35_total' };
        if (a <= 64) return { m: 'm36_64_total', f: 'f36_64_total' };
        return { m: 'm65_total', f: 'f65_total' };
      };
      const g = group(age);
      let count = (+fg.get(g.m)?.value || 0) + (+fg.get(g.f)?.value || 0);

      if (age >= 18 && age <= 35) {
        count += (+fg.get('f18_35_lactating_total')?.value || 0);
      } else if (age >= 36 && age <= 64) {
        count += (+fg.get('f36_64_lactating_total')?.value || 0);
      }

      if (count <= 0) {
        return { ageMissing: 'Age not found in household breakdown' };
      }
      return null;
    };
  }
  private genderPresentIfSelected() {
    return (fg: AbstractControl): ValidationErrors | null => {
      const gender = fg.get('gender')?.value;
      if (!gender || gender === 'SELECT') return null;
      let anyMale = false,
        anyFemale = false;
      for (const g of this.ageGroups) {
        if ((+fg.get(g.maleTotal)?.value || 0) > 0) anyMale = true;
        if ((+fg.get(g.femaleTotal)?.value || 0) > 0) anyFemale = true;
      }
      if ((+fg.get('f18_35_lactating_total')?.value || 0) > 0) anyFemale = true;
      if ((+fg.get('f36_64_lactating_total')?.value || 0) > 0) anyFemale = true;
      if (gender === 'MALE' && !anyMale)
        return {
          genderMismatch:
            'Gender in form is Male, but no male present in breakdown',
        };
      if (gender === 'FEMALE' && !anyFemale)
        return {
          genderMismatch:
            'Gender in form is Female, but no female present in breakdown',
        };
      return null;
    };
  }
  private selectionReasonsRequired() {
    return (fg: AbstractControl): ValidationErrors | null => {
      const reasons: any[] = fg.get('selectionReasons')?.value || [];
      if (!reasons.length) return { reasons: 'Support options are required' };
      return null;
    };
  }
  private disLipwEligibility() {
    return (fg: AbstractControl): ValidationErrors | null => {
      const st = fg.get('supportType')?.value;
      if (!st) return null;

      const ableAdults = (() => {
        const slice = (
          m: string,
          f: string,
          md: string,
          mc: string,
          mb: string,
          fd: string,
          fc: string,
          fb: string
        ) => {
          const mt = +fg.get(m)?.value || 0;
          const ft = +fg.get(f)?.value || 0;
          const msub =
            (+fg.get(md)?.value || 0) +
            (+fg.get(mc)?.value || 0) +
            (+fg.get(mb)?.value || 0);
          const fsub =
            (+fg.get(fd)?.value || 0) +
            (+fg.get(fc)?.value || 0) +
            (+fg.get(fb)?.value || 0);
          return mt - msub + (ft - fsub);
        };
        return (
          slice(
            'm18_35_total',
            'f18_35_total',
            'm18_35_disable',
            'm18_35_chronic',
            'm18_35_both',
            'f18_35_disable',
            'f18_35_chronic',
            'f18_35_both'
          ) +
          slice(
            'm36_64_total',
            'f36_64_total',
            'm36_64_disable',
            'm36_64_chronic',
            'm36_64_both',
            'f36_64_disable',
            'f36_64_chronic',
            'f36_64_both'
          )
        );
      })();

      if (st === 'Direct Income Support') {
        if (ableAdults > 0)
          return {
            disRule: 'There is an adult in the household who is able to work',
          };
      }
      if (st === 'Public Works') {
        if (ableAdults <= 0)
          return {
            lipwRule: 'At least one able-bodied member aged 18–64 is required',
          };
      }
      return null;
    };
  }

  onDelete() {
    this.deleteComment = ''; // Reset comment
    this.confirmationService.confirm({
      key: 'deleteDialog',
      header: 'Confirm Deletion',
      accept: () => this.handleDeleteConfirm(),
      reject: () => {
        // User rejected, no action needed
      },
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
    });
  }

  handleDeleteConfirm() {
    if (!this.deleteComment || !this.deleteComment.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Comment Required',
        detail: 'Please provide a reason for deletion.',
      });
      return;
    }

    const applicationId = this.originalDto?.applicationId;
    if (!applicationId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Beneficiary Application ID not found.',
      });
      return;
    }

    const payload = {
      householdId: [applicationId],
      comment: this.deleteComment.trim(),
      enrollmentStatusEnum: 'DELETE'
    };

    this.isLoading = true;
    this.cdr.markForCheck();

    this.api.POST('api/beneficiary/update/approveBeneficiary/batch', payload)
      .then((res: any) => {
        if (res.status === 200) {
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Beneficiary has been deleted successfully.',
          });
          setTimeout(() => this.router.navigate(['/pending-beneficiary/list']), 2000);
        } else {
          const errorMsg = res.errorMsg || 'An unknown error occurred during deletion.';
          this.messageService.add({
            severity: 'error',
            summary: 'Deletion Failed',
            detail: errorMsg,
          });
        }
      })
      .catch(err => {
        console.error('Delete beneficiary error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'API Error',
          detail: 'Failed to delete beneficiary.',
        });
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }
}
