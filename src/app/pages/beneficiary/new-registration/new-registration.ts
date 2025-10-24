import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TabsModule } from 'primeng/tabs';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { InputTextModule } from 'primeng/inputtext';
import { Loader } from '../../../components/loader/loader';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ApiService } from '../../../services/api.service';
import { BeneficiaryDto } from '../../../models/beneficiary';
import { FloatLabel } from 'primeng/floatlabel';
import { LookupService, LookupItem } from '../../../services/lookup.service';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-new-registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TabsModule,
    BreadcrumbModule,
    InputTextModule,
    SelectModule,
    ButtonModule,
    Loader,
    FloatLabel,
    Toast,
  ],
  templateUrl: './new-registration.html',
  styleUrl: './new-registration.scss'
})
export class NewRegistration implements OnInit {
  isLoading = true;
  beneficiaryForm!: FormGroup;
  destroy$ = new Subject<void>();

  genderOptions: LookupItem[] = [];
  maritalStatusOptions: any[] = [];
  relationshipOptions: any[] = [];
  legalStatusOptions: any[] = [];
  idTypeOptions: any[] = [];
  currentIdTypeOptions: any[] = [];
  occupationOptions: any[] = [];
  incomeSourceOptions: any[] = [];
  allReasons: any[] = [];
  filteredReasons: any[] = [];
  mobileMoneyOptions: any[] = [];

  // ===== Regex & constants (aligned with your manage component) =====
  private RGX_ONLY_CHARS = /^[A-Za-z]+$/;
  private RGX_CHARS_SPACES = /^[A-Za-z ]+$/;
  private RGX_ALPHANUM_HYPHEN = /^[A-Za-z0-9\-]+$/;
  private RGX_ALPHANUM_SPACE = /^[A-Za-z0-9 ]+$/;
  private RGX_REFUGEE_ID = /^[A-Za-z0-9\-]+$/;
  private RGX_PHONE_9 = /^\d{9}$/;
  private MIN_NAME = 3;
  private MAX_NAME = 30;

  ageGroups = [
    {
      label: '0-2 yrs', maleTotal: 'm0_2_total', maleDisable: 'm0_2_disable', maleChronicalIll: 'm0_2_chronic', maleBoth: 'm0_2_both',
      femaleTotal: 'f0_2_total', femaleDisable: 'f0_2_disable', femaleChronicalIll: 'f0_2_chronic', femaleBoth: 'f0_2_both'
    },
    {
      label: '3-5 yrs', maleTotal: 'm3_5_total', maleDisable: 'm3_5_disable', maleChronicalIll: 'm3_5_chronic', maleBoth: 'm3_5_both',
      femaleTotal: 'f3_5_total', femaleDisable: 'f3_5_disable', femaleChronicalIll: 'f3_5_chronic', femaleBoth: 'f3_5_both'
    },
    {
      label: '6-17 yrs', maleTotal: 'm6_17_total', maleDisable: 'm6_17_disable', maleChronicalIll: 'm6_17_chronic', maleBoth: 'm6_17_both',
      femaleTotal: 'f6_17_total', femaleDisable: 'f6_17_disable', femaleChronicalIll: 'f6_17_chronic', femaleBoth: 'f6_17_both'
    },
    {
      label: '18-35 yrs', maleTotal: 'm18_35_total', maleDisable: 'm18_35_disable', maleChronicalIll: 'm18_35_chronic', maleBoth: 'm18_35_both',
      femaleTotal: 'f18_35_total', femaleDisable: 'f18_35_disable', femaleChronicalIll: 'f18_35_chronic', femaleBoth: 'f18_35_both'
    },
    {
      label: '36-64 yrs', maleTotal: 'm36_64_total', maleDisable: 'm36_64_disable', maleChronicalIll: 'm36_64_chronic', maleBoth: 'm36_64_both',
      femaleTotal: 'f36_64_total', femaleDisable: 'f36_64_disable', femaleChronicalIll: 'f36_64_chronic', femaleBoth: 'f36_64_both'
    },
    {
      label: '65+ yrs', maleTotal: 'm65_total', maleDisable: 'm65_disable', maleChronicalIll: 'm65_chronic', maleBoth: 'm65_both',
      femaleTotal: 'f65_total', femaleDisable: 'f65_disable', femaleChronicalIll: 'f65_chronic', femaleBoth: 'f65_both'
    },
  ];

  items = [
    { label: 'Beneficiary List', icon: 'fas fa-users me-2', routerLink: '/beneficiary/list' },
    { label: 'New Registration', icon: 'fas fa-user-plus me-2' },
  ];
  home = { icon: 'fas fa-home me-2', routerLink: '/' };

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private lookup: LookupService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForm();

    // Lookups
    this.genderOptions = this.lookup.getGenderList();
    this.maritalStatusOptions = this.lookup.getMaritalStatusEnum();
    this.relationshipOptions = this.lookup.getRelationshipEnum();
    this.legalStatusOptions = this.lookup.getLegalStatusEnum();
    this.occupationOptions = this.lookup.getNomineeOccupationEnum();
    this.incomeSourceOptions = this.lookup.getIncomeSourceEnum();
    this.mobileMoneyOptions = this.lookup.getMobileMoneyProviderEnum();
    this.allReasons = this.lookup.getSelectionReasonEnum();

    // Dynamic age-group controls (bounds 0..10)
    this.ageGroups.forEach((g) => {
      this.beneficiaryForm.addControl(g.maleTotal, this.fb.control('0', [this.numMin(0), this.numMax(10)]));
      this.beneficiaryForm.addControl(g.maleDisable, this.fb.control('0', [this.numMin(0), this.numMax(10)]));
      this.beneficiaryForm.addControl(g.maleChronicalIll, this.fb.control('0', [this.numMin(0), this.numMax(10)]));
      this.beneficiaryForm.addControl(g.maleBoth, this.fb.control('0', [this.numMin(0), this.numMax(10)]));
      this.beneficiaryForm.addControl(g.femaleTotal, this.fb.control('0', [this.numMin(0), this.numMax(10)]));
      this.beneficiaryForm.addControl(g.femaleDisable, this.fb.control('0', [this.numMin(0), this.numMax(10)]));
      this.beneficiaryForm.addControl(g.femaleChronicalIll, this.fb.control('0', [this.numMin(0), this.numMax(10)]));
      this.beneficiaryForm.addControl(g.femaleBoth, this.fb.control('0', [this.numMin(0), this.numMax(10)]));
    });

    // Form-level validators
    this.beneficiaryForm.setValidators([
      this.breakdownSubcategoryNotExceedTotal(),
      this.householdSizeMatchesSum(),
      this.literate1835NotExceedYouth(),
      this.personalAgeExistsInBreakdown(),
      this.genderPresentIfSelected(),
      this.selectionReasonsRequired(),
      this.disLipwEligibility(),
    ]);

    // Pre-create exactly 2 alternates and 5 nominees
    for (let i = 0; i < 2; i++) this.alternates.push(this.createAlternateGroup({}));
    for (let i = 0; i < 5; i++) this.nominees.push(this.createNomineeGroup({}));

    // Disable/behaviors like Manage
    this.beneficiaryForm.get('canReadWrite')?.disable();
    // this.beneficiaryForm.get('supportType')?.disable();

    this.beneficiaryForm.get('supportType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        this.filterReasons(val);
        this.beneficiaryForm.updateValueAndValidity();
      });

    this.beneficiaryForm.get('relationship')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => this.updateRelationshipFields(v));

    this.beneficiaryForm.get('maritalStatus')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => this.updateMaritalStatusFields(v));

    this.beneficiaryForm.get('legalStatus')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateIdLogic());
    this.beneficiaryForm.get('hasNationalId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateIdLogic());
    this.beneficiaryForm.get('idType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateIdLogic());

    this.beneficiaryForm.get('mainIncomeSource')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => this.updateIncomeSourceFields(v));

    this.updateFormUI();
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------- UI reactive helpers ----------
  private updateRelationshipFields(value: string): void {
    const control = this.beneficiaryForm.get('relationshipOther')!;
    if (value === 'OTHER') {
      control.enable({ emitEvent: false });
      control.setValidators([
        Validators.required,
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
    const required = ['spouseFirstName', 'spouseMiddleName', 'spouseLastName'];
    const nick = this.beneficiaryForm.get('spouseNickName');

    required.forEach((name) => {
      const c = this.beneficiaryForm.get(name);
      if (!c) return;
      if (value === 'MARRIED') {
        c.enable({ emitEvent: false });
        c.setValidators([
          Validators.required,
          this.capitalized(),
          this.onlyLetters(),
          this.size(this.MIN_NAME, this.MAX_NAME),
        ]);
      } else {
        c.disable({ emitEvent: false });
        c.clearValidators();
        c.setValue('', { emitEvent: false });
      }
      c.updateValueAndValidity({ emitEvent: false });
    });

    if (nick) {
      if (value === 'MARRIED') {
        nick.enable({ emitEvent: false });
        nick.clearValidators();
      } else {
        nick.disable({ emitEvent: false });
        nick.clearValidators();
        nick.setValue('', { emitEvent: false });
      }
      nick.updateValueAndValidity({ emitEvent: false });
    }
  }

  private updateIncomeSourceFields(value: string): void {
    const other = this.beneficiaryForm.get('otherIncomeSource')!;
    const monthly = this.beneficiaryForm.get('avgMonthlyIncome')!;
    if (value === 'OTHER') {
      other.enable({ emitEvent: false });
      other.setValidators([
        Validators.required,
        this.pattern(this.RGX_CHARS_SPACES, 'Only letters and spaces'),
        this.size(2, 50),
      ]);
    } else {
      other.disable({ emitEvent: false });
      other.clearValidators();
      other.setValue('', { emitEvent: false });
    }

    if (value && value !== 'NONE' && value !== 'SELECT') {
      monthly.enable({ emitEvent: false });
      monthly.setValidators([
        this.numberNotNegative('Add valid monthly income'),
        this.numMax(1000000),
      ]);
    } else {
      monthly.disable({ emitEvent: false });
      monthly.clearValidators();
      monthly.setValue('', { emitEvent: false });
    }

    other.updateValueAndValidity({ emitEvent: false });
    monthly.updateValueAndValidity({ emitEvent: false });
  }

  private updateIdLogic(): void {
    const legalStatus = this.beneficiaryForm.get('legalStatus')!.value;
    const hasId = this.beneficiaryForm.get('hasNationalId')!;
    const type = this.beneficiaryForm.get('idType')!;
    const other = this.beneficiaryForm.get('idTypeOther')!;
    const num = this.beneficiaryForm.get('respondentIdNumber')!;

    type.clearValidators(); other.clearValidators(); num.clearValidators();

    const allTypes = this.lookup.getDocumentTypeEnum();
    const refugee = allTypes.filter((o) => o.value.startsWith('REFUGEE'));
    const nonRef = allTypes.filter((o) => !o.value.startsWith('REFUGEE') && o.value !== 'SELECT');

    if (legalStatus === 'REFUGEE') {
      this.currentIdTypeOptions = refugee;
      if (!type.value || !refugee.some((o) => o.value === type.value)) {
        type.setValue('', { emitEvent: false });
      }
      hasId.setValue('Yes', { emitEvent: false });
      hasId.disable({ emitEvent: false });

      type.enable({ emitEvent: false });
      type.setValidators([
        Validators.required,
        this.disallow(['SELECT', 'PASSPORT', 'NATIONAL_ID', 'OTHER'], 'Please select a valid ID type')
      ]);
      num.enable({ emitEvent: false });
      num.setValidators([
        Validators.required,
        this.pattern(this.RGX_REFUGEE_ID, 'ID number must contain digits, letters, hyphen only'),
        this.size(5, 14),
      ]);

      other.disable({ emitEvent: false });
      other.setValue('', { emitEvent: false });
    } else {
      this.currentIdTypeOptions = nonRef;
      if (!type.value || !nonRef.some((o) => o.value === type.value)) {
        type.setValue('', { emitEvent: false });
      }
      hasId.enable({ emitEvent: false });

      if (hasId.value === 'Yes') {
        type.enable({ emitEvent: false });
        type.setValidators([Validators.required]);

        if (type.value === 'OTHER') {
          other.enable({ emitEvent: false });
          other.setValidators([
            Validators.required,
            this.pattern(this.RGX_CHARS_SPACES, 'Only letters/spaces'),
            this.size(2, 50),
          ]);
          num.enable({ emitEvent: false });
          num.setValidators([
            Validators.required,
            this.pattern(this.RGX_ALPHANUM_SPACE, 'ID must be alphanumeric'),
            this.size(5, 14),
          ]);
        } else if (type.value === 'NONE' || !type.value) {
          other.disable({ emitEvent: false });
          num.disable({ emitEvent: false });
          other.setValue('', { emitEvent: false });
          num.setValue('', { emitEvent: false });
        } else {
          other.disable({ emitEvent: false });
          other.setValue('', { emitEvent: false });
          num.enable({ emitEvent: false });
          num.setValidators([
            Validators.required,
            this.pattern(this.RGX_ALPHANUM_SPACE, 'ID must be alphanumeric'),
            this.size(5, 14),
          ]);
        }
      } else {
        type.disable({ emitEvent: false });
        other.disable({ emitEvent: false });
        num.disable({ emitEvent: false });
        type.setValue('', { emitEvent: false });
        other.setValue('', { emitEvent: false });
        num.setValue('', { emitEvent: false });
      }
    }

    type.updateValueAndValidity({ emitEvent: false });
    other.updateValueAndValidity({ emitEvent: false });
    num.updateValueAndValidity({ emitEvent: false });
  }

  private updateFormUI() {
    this.updateRelationshipFields(this.beneficiaryForm.get('relationship')!.value);
    this.updateMaritalStatusFields(this.beneficiaryForm.get('maritalStatus')!.value);
    this.updateIdLogic();
    this.updateIncomeSourceFields(this.beneficiaryForm.get('mainIncomeSource')!.value);
    this.filterReasons(this.beneficiaryForm.get('supportType')?.value);
    this.beneficiaryForm.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  // ---------- Form skeleton ----------
  private initForm() {
    this.beneficiaryForm = this.fb.group({
      householdNumber: [''],

      respondentFirstName: ['', [Validators.required, this.capitalized(), this.onlyLetters(), this.size(this.MIN_NAME, this.MAX_NAME)]],
      respondentMiddleName: ['', [Validators.required, this.capitalized(), this.onlyLetters(), this.size(this.MIN_NAME, this.MAX_NAME)]],
      respondentLastName: ['', [Validators.required, this.capitalized(), this.onlyLetters(), this.size(this.MIN_NAME, this.MAX_NAME)]],
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
      hasNationalId: [''],
      idType: [''],
      idTypeOther: [''],
      respondentIdNumber: [''],

      respondentPhone: ['', [this.optionalPattern(this.RGX_PHONE_9, 'Phone number length must be 9')]],

      mainIncomeSource: ['', [this.notSelectRequired()]],
      mobileMoneyProvider: ['', [this.notSelectRequired()]],
      mobileWalletNumber: [''],
      otherIncomeSource: [''],
      avgMonthlyIncome: [''],

      supportType: [''],
      selectionReasons: this.fb.control([]),

      canReadWrite: [''],
      literate1835Count: ['0', [this.intMin(0)]],
      householdSize: ['0', [this.intMin(0)]],

      alternates: this.fb.array([]),
      nominees: this.fb.array([]),
    });
  }

  // ---------- Submit (Create) ----------
  onSubmit() {
    this.beneficiaryForm.markAllAsTouched();
    if (!this.beneficiaryForm.valid) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please fix the highlighted errors.' });
      return;
    }

    const payload = this.buildCreatePayload(this.beneficiaryForm.getRawValue());
    const body = { beneficiaries: [payload] };

    this.isLoading = true;
    this.api.POST('api/beneficiary/register', body)
      .then((res: any) => {
        const responses = res?.bulkResponse || res?.data?.bulkResponse || [];
        if (!responses.length) {
          this.messageService.add({ severity: 'error', summary: 'Registration Failed', detail: 'No response returned from server.' });
          return;
        }
        const first = responses[0];
        if (first.result === 'SUCCESS') {
          this.messageService.add({ severity: 'success', summary: 'Registration Successful', detail: 'Beneficiary created successfully!' });
          setTimeout(() => this.router.navigate(['/beneficiary/list']), 3000);
        } else if (first.result === 'FAILED') {
          this.messageService.add({ severity: 'error', summary: 'Registration Failed', detail: first.errorMessage || 'Unknown error occurred' });
        } else {
          this.messageService.add({ severity: 'warn', summary: 'Status', detail: `Unexpected result: ${first.result}` });
        }
      })
      .catch((err) => {
        console.error('Registration failed:', err);
        this.messageService.add({ severity: 'error', summary: 'Registration Failed', detail: 'Request could not be processed' });
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  // ---------- Build Create Payload ----------
  private buildCreatePayload(formValue: any): BeneficiaryDto {
    const payload: any = {};

    // Personal
    payload.applicationId = formValue.householdNumber || '';
    payload.respondentFirstName = formValue.respondentFirstName;
    payload.respondentMiddleName = formValue.respondentMiddleName;
    payload.respondentLastName = formValue.respondentLastName;
    payload.respondentNickName = formValue.respondentNickName;
    payload.relationshipWithHouseholdHead = formValue.relationship;
    payload.relationshipOther = formValue.relationshipOther;
    payload.respondentAge = +formValue.respondentAge;
    payload.respondentGender = formValue.gender;
    payload.respondentMaritalStatus = formValue.maritalStatus;
    payload.spouseFirstName = formValue.spouseFirstName;
    payload.spouseMiddleName = formValue.spouseMiddleName;
    payload.spouseLastName = formValue.spouseLastName;
    payload.spouseNickName = formValue.spouseNickName;
    payload.respondentLegalStatus = formValue.legalStatus;

    // IDs
    if (formValue.hasNationalId === 'No') {
      payload.documentType = 'NONE';
      payload.documentTypeOther = '';
      payload.respondentId = '';
    } else {
      payload.documentType = formValue.idType;
      payload.documentTypeOther = formValue.idTypeOther;
      payload.respondentId = formValue.respondentIdNumber;
    }

    // Phones
    const phone = formValue.respondentPhone?.toString().trim();
    payload.respondentPhoneNo = phone ? `+211${phone}` : '';

    // Income
    payload.householdIncomeSource = formValue.mainIncomeSource;
    payload.mobileMoneyProvider = formValue.mobileMoneyProvider;
    const wphone = formValue.mobileWalletNumber?.toString().trim();
    payload.mobileWalletNumber = wphone ? `+211${wphone}` : '';
    payload.incomeSourceOther = formValue.otherIncomeSource;
    payload.householdMonthlyAvgIncome = formValue.avgMonthlyIncome;

    // Selection
    payload.selectionCriteria = formValue.supportType === 'Public Works' ? 'LIPW' : 'DIS';
    payload.selectionReason = formValue.selectionReasons;

    // Literacy + HH size
    payload.isReadWrite = formValue.canReadWrite === 'Yes';
    payload.memberReadWrite = +formValue.literate1835Count;
    payload.householdSize = +formValue.householdSize;

    // Breakdown builders
    const buildSlice = (mPrefix: string, fPrefix: string) => ({
      maleTotal: +formValue[`${mPrefix}_total`] || 0,
      maleDisable: +formValue[`${mPrefix}_disable`] || 0,
      maleChronicalIll: +formValue[`${mPrefix}_chronic`] || 0,
      maleBoth: +formValue[`${mPrefix}_both`] || 0,
      femaleTotal: +formValue[`${fPrefix}_total`] || 0,
      femaleDisable: +formValue[`${fPrefix}_disable`] || 0,
      femaleChronicalIll: +formValue[`${fPrefix}_chronic`] || 0,
      femaleBoth: +formValue[`${fPrefix}_both`] || 0,
    });

    payload.householdMember2 = buildSlice('m0_2', 'f0_2');
    payload.householdMember5 = buildSlice('m3_5', 'f3_5');
    payload.householdMember17 = buildSlice('m6_17', 'f6_17');
    payload.householdMember35 = buildSlice('m18_35', 'f18_35');
    payload.householdMember64 = buildSlice('m36_64', 'f36_64');
    payload.householdMember65 = buildSlice('m65', 'f65');

    // Alternates (exactly 2 in UI; include only if minimally filled)
    const altArr = formValue.alternates || [];
    const mapAlt = (a: any) => ({
      id: a.id || null,
      payeeFirstName: a.payeeFirstName,
      payeeMiddleName: a.payeeMiddleName,
      payeeLastName: a.payeeLastName,
      payeeNickName: a.payeeNickName,
      payeeGender: a.payeeGender,
      payeeAge: a.payeeAge,
      relationshipWithHouseholdHead: a.relationshipWithHouseholdHead,
      relationshipOther: a.relationshipOther,
      documentType: a.documentType,
      documentTypeOther: a.documentTypeOther,
      nationalId: a.nationalId,
      payeePhoneNo: a.payeePhoneNo ? `+211${a.payeePhoneNo}` : '',
    });

    payload.alternatePayee1 = altArr[0] && altArr[0].payeeFirstName ? mapAlt(altArr[0]) : null;
    payload.alternatePayee2 = altArr[1] && altArr[1].payeeFirstName ? mapAlt(altArr[1]) : null;

    // Nominees (5 in UI; include those minimally filled)
    const nomArr = (formValue.nominees || []) as any[];
    payload.nominees = nomArr
      .filter((n) => (n.nomineeFirstName && n.nomineeLastName))
      .map((n) => ({
        id: n.id || null,
        applicationId: payload.applicationId,
        nomineeFirstName: n.nomineeFirstName,
        nomineeMiddleName: n.nomineeMiddleName,
        nomineeLastName: n.nomineeLastName,
        nomineeNickName: n.nomineeNickName?.trim() ? n.nomineeNickName : null,
        relationshipWithHouseholdHead: n.relationshipWithHouseholdHead,
        relationshipOther: n.relationshipOther?.trim() ? n.relationshipOther : null,
        nomineeAge: n.nomineeAge,
        nomineeGender: n.nomineeGender,
        isReadWrite: n.isReadWrite,
        nomineeOccupation: n.nomineeOccupation,
        otherOccupation: n.otherOccupation?.trim() ? n.otherOccupation : null,
      }));

    // Biometric removed on create payload (if any UI-side props appear)
    delete (payload as any).biometrics;

    return payload as BeneficiaryDto;
  }

  // ---------- Reasons ----------
  onReasonChange(event: any, value: string) {
    const reasons: string[] = this.beneficiaryForm.get('selectionReasons')?.value || [];
    if (event.target.checked) {
      if (!reasons.includes(value)) reasons.push(value);
    } else {
      const i = reasons.indexOf(value);
      if (i >= 0) reasons.splice(i, 1);
    }
    this.beneficiaryForm.patchValue({ selectionReasons: reasons });
    this.beneficiaryForm.updateValueAndValidity();
  }
  filterReasons(supportType: string) {
    // Get all reasons by type
    if (supportType === 'Public Works') {
      this.filteredReasons = this.allReasons.filter((r) => r.value.startsWith('LIPW_REASON'));
    } else if (supportType === 'Direct Income Support') {
      this.filteredReasons = this.allReasons.filter((r) => r.value.startsWith('DIS_REASON'));
    } else {
      this.filteredReasons = [];
    }

    // Reset selection reasons to include only those that belong to the current support type
    const currentReasons = this.beneficiaryForm.get('selectionReasons')?.value || [];
    const validReasons = this.filteredReasons.map((r) => r.value);
    const filteredSelected = currentReasons.filter((r: string) => validReasons.includes(r));

    // Update form control
    this.beneficiaryForm.patchValue({ selectionReasons: filteredSelected });
    this.beneficiaryForm.updateValueAndValidity();
  }

  isReasonSelected(value: string): boolean {
    const reasons = this.beneficiaryForm.get('selectionReasons')?.value || [];
    return reasons.includes(value);
  }

  // ---------- Arrays ----------
  get nominees(): FormArray { return this.beneficiaryForm.get('nominees') as FormArray; }
  get alternates(): FormArray { return this.beneficiaryForm.get('alternates') as FormArray; }

  private createNomineeGroup(n: any = {}): FormGroup {
    const g = this.fb.group({
      id: [n.id || null],
      nomineeFirstName: [n.nomineeFirstName || '', [Validators.required, this.capitalized(), this.onlyLetters(), this.size(this.MIN_NAME, this.MAX_NAME)]],
      nomineeMiddleName: [n.nomineeMiddleName || '', [Validators.required, this.capitalized(), this.onlyLetters(), this.size(this.MIN_NAME, this.MAX_NAME)]],
      nomineeLastName: [n.nomineeLastName || '', [Validators.required, this.capitalized(), this.onlyLetters(), this.size(this.MIN_NAME, this.MAX_NAME)]],
      nomineeNickName: [n.nomineeNickName || '', [this.optionalCapitalizedName()]],
      relationshipWithHouseholdHead: [n.relationshipWithHouseholdHead || '', [this.notSelectRequired()]],
      relationshipOther: [n.relationshipOther || ''],
      nomineeAge: [n.nomineeAge || '', [this.intMin(1)]],
      nomineeGender: [n.nomineeGender || '', [this.notSelectRequired()]],
      isReadWrite: [n.isReadWrite ?? null, [Validators.required]],
      nomineeOccupation: [n.nomineeOccupation || '', [this.notSelectRequired()]],
      otherOccupation: [n.otherOccupation || ''],
    });

    g.get('relationshipWithHouseholdHead')?.valueChanges.subscribe((v) => {
      const c = g.get('relationshipOther')!;
      if (v === 'OTHER') {
        c.enable({ emitEvent: false });
        c.setValidators([Validators.required, this.pattern(this.RGX_CHARS_SPACES, 'Only letters and spaces'), this.size(2, 25)]);
      } else {
        c.disable({ emitEvent: false });
        c.clearValidators();
        c.setValue('', { emitEvent: false });
      }
      c.updateValueAndValidity({ emitEvent: false });
    });

    g.get('nomineeOccupation')?.valueChanges.subscribe((v) => {
      const c = g.get('otherOccupation')!;
      if (v === 'OTHER') {
        c.setValidators([Validators.required, this.pattern(this.RGX_CHARS_SPACES, 'Only letters and spaces'), this.size(2, 25)]);
      } else {
        c.clearValidators();
        c.setValue('', { emitEvent: false });
      }
      c.updateValueAndValidity({ emitEvent: false });
    });

    return g;
  }

  private createAlternateGroup(a: any = {}): FormGroup {
    const g = this.fb.group({
      id: [a.id || null],
      payeeFirstName: [a.payeeFirstName || '', [Validators.required, this.capitalized(), this.onlyLetters(), this.size(this.MIN_NAME, this.MAX_NAME)]],
      payeeMiddleName: [a.payeeMiddleName || '', [Validators.required, this.capitalized(), this.onlyLetters(), this.size(this.MIN_NAME, this.MAX_NAME)]],
      payeeLastName: [a.payeeLastName || '', [Validators.required, this.capitalized(), this.onlyLetters(), this.size(this.MIN_NAME, this.MAX_NAME)]],
      payeeNickName: [a.payeeNickName || '', [this.optionalCapitalizedName()]],
      payeeGender: [a.payeeGender || '', [this.notSelectRequired()]],
      payeeAge: [a.payeeAge || '', [this.intMin(1)]],
      relationshipWithHouseholdHead: [a.relationshipWithHouseholdHead || '', [this.notSelectRequired()]],
      relationshipOther: [a.relationshipOther || ''],
      documentType: [a.documentType || ''],
      documentTypeOther: [a.documentTypeOther || ''],
      nationalId: [a.nationalId || ''],
      payeePhoneNo: [a.payeePhoneNo ? a.payeePhoneNo.replace('+211', '') : '', [this.optionalPattern(this.RGX_PHONE_9, 'Phone number must be 9 digits')]],
      hasNationalId: [a.documentType && a.documentType !== 'NONE' ? 'Yes' : 'No'],
    });

    g.get('relationshipWithHouseholdHead')?.valueChanges.subscribe((v) => {
      const c = g.get('relationshipOther')!;
      if (v === 'OTHER') {
        c.enable({ emitEvent: false });
        c.setValidators([Validators.required, this.pattern(this.RGX_CHARS_SPACES, 'Only letters and spaces'), this.size(2, 50)]);
      } else {
        c.disable({ emitEvent: false });
        c.clearValidators();
        c.setValue('', { emitEvent: false });
      }
      c.updateValueAndValidity({ emitEvent: false });
    });

    const updateAltId = () => {
      const hasId = g.get('hasNationalId')!.value;
      const type = g.get('documentType')!;
      const num = g.get('nationalId')!;
      const other = g.get('documentTypeOther')!;

      type.clearValidators(); num.clearValidators(); other.clearValidators();

      if (hasId === 'Yes') {
        type.enable({ emitEvent: false });
        type.setValidators([Validators.required, this.disallow(['SELECT'], 'ID Type is required')]);

        if (type.value === 'OTHER') {
          other.enable({ emitEvent: false });
          other.setValidators([Validators.required, this.pattern(this.RGX_CHARS_SPACES, 'Only letters and spaces'), this.size(2, 50)]);
        } else {
          other.disable({ emitEvent: false });
          other.setValue('', { emitEvent: false });
        }

        if (type.value === 'NONE') {
          num.disable({ emitEvent: false });
          num.setValue('', { emitEvent: false });
        } else {
          num.enable({ emitEvent: false });
          const refTypes = ['REFUGEE_RATION_CARD', 'REFUGEE_ID_CARD', 'REFUGEE_PROOF_OF_REGISTRATION'];
          const isRef = refTypes.includes(type.value);
          num.setValidators([
            Validators.required,
            this.pattern(isRef ? this.RGX_REFUGEE_ID : this.RGX_ALPHANUM_SPACE,
              isRef ? 'ID number must contain digits, letters, hyphen only' : 'ID number must contain digits, letters'),
            this.size(5, 14),
          ]);
        }
      } else {
        type.disable({ emitEvent: false });
        num.disable({ emitEvent: false });
        other.disable({ emitEvent: false });
        type.setValue('', { emitEvent: false });
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

  // ---------- Template helpers ----------
  c(name: string): AbstractControl | null { return this.beneficiaryForm.get(name); }
  showError(name: string, key?: string): boolean {
    const ctrl = this.c(name); if (!ctrl) return false;
    const touched = ctrl.touched || ctrl.dirty;
    return touched && !!ctrl.errors && (key ? !!ctrl.errors[key] : true);
  }

  getError(fieldName: string, arrayIndex?: number, arrayName?: 'alternates' | 'nominees'): string {
    let control;
    if (arrayIndex !== undefined && arrayName) {
      control = (this.beneficiaryForm.get(arrayName) as FormArray).at(arrayIndex).get(fieldName);
    } else {
      control = this.beneficiaryForm.get(fieldName);
    }
    if (!control || !control.errors) return '';

    const labels: Record<string, string> = {
      respondentFirstName: 'First Name', respondentMiddleName: 'Middle Name', respondentLastName: 'Last Name',
      respondentNickName: 'Nick Name', relationship: 'Relationship', relationshipOther: 'Relationship Other',
      respondentAge: 'Age', gender: 'Gender', maritalStatus: 'Marital Status',
      spouseFirstName: 'Spouse First Name', spouseMiddleName: 'Spouse Middle Name', spouseLastName: 'Spouse Last Name',
      spouseNickName: 'Spouse Nick Name', legalStatus: 'Legal Status', idType: 'ID Type', idTypeOther: 'ID Type Other',
      respondentIdNumber: 'ID Number', respondentPhone: 'Phone Number', mobileWalletNumber: 'Mobile Wallet Number',
      payeeFirstName: 'First Name', payeeMiddleName: 'Middle Name', payeeLastName: 'Last Name', payeeNickName: 'Nick Name',
      payeeGender: 'Gender', payeeAge: 'Age', relationshipWithHouseholdHead: 'Relationship',
      documentType: 'ID Type', documentTypeOther: 'ID Type Other', nationalId: 'ID Number', payeePhoneNo: 'Contact Number',
      nomineeFirstName: 'First Name', nomineeMiddleName: 'Middle Name', nomineeLastName: 'Last Name',
      nomineeNickName: 'Nick Name', nomineeGender: 'Gender', nomineeAge: 'Age', isReadWrite: 'Can Read/Write',
      nomineeOccupation: 'Occupation',
    };

    const label = labels[fieldName] || fieldName;
    const errors = control.errors;
    if (errors['required']) return `${label} is required`;
    if (errors['notSelectRequired']) return `Please select a ${label}`;
    if (errors['capitalized']) return `${label} must start with a capital letter`;
    if (errors['onlyLetters']) return `${label} must contain only letters`;
    if (errors['size']) {
      const { min, max, actual } = errors['size'];
      if (actual < min) return `${label} must be at least ${min} characters`;
      if (actual > max) return `${label} must not exceed ${max} characters`;
    }
    if (errors['intBetween']) { const { min, max } = errors['intBetween']; return `${label} must be between ${min} and ${max}`; }
    if (errors['intMin']) { const { min } = errors['intMin']; return `${label} must be at least ${min}`; }
    if (errors['pattern']) {
      if (['respondentPhone', 'payeePhoneNo', 'mobileWalletNumber'].includes(fieldName)) return 'Phone number must be exactly 9 digits';
      return `${label} format is invalid`;
    }
    if (errors['optionalPattern']) return errors['optionalPattern'];
    if (errors['optionalCapitalizedName']) return `${label} must start with a capital letter if provided`;
    return `${label} is invalid`;
  }

  // ---------- Validators ----------
  private capitalized() {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value || '').toString().trim(); if (!v) return null;
      return /^[A-Z]/.test(v) ? null : { capitalized: 'Must start with a capital letter' };
    };
  }
  private onlyLetters() {
    return this.pattern(this.RGX_ONLY_CHARS, 'Must not contain space, digits or special characters');
  }
  private size(min: number, max: number) {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value ?? '').toString(); if (!v) return null;
      if (v.length < min) return { size: { min, max, actual: v.length } };
      if (v.length > max) return { size: { min, max, actual: v.length } };
      return null;
    };
  }
  private optionalCapitalizedName() {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value || '').toString().trim(); if (!v) return null;
      if (v.length < this.MIN_NAME) return { size: { min: this.MIN_NAME, max: this.MAX_NAME, actual: v.length } };
      if (!/^[A-Z]/.test(v)) return { capitalized: true };
      if (!this.RGX_ONLY_CHARS.test(v)) return { pattern: true };
      if (v.length > this.MAX_NAME) return { size: { min: this.MIN_NAME, max: this.MAX_NAME, actual: v.length } };
      return null;
    };
  }
  private notSelectRequired() {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value || '').toString();
      if (!v || v === 'SELECT') return { required: true };
      return null;
    };
  }
  private pattern(regex: RegExp, msg: string) {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value || '').toString().trim(); if (!v) return null;
      return regex.test(v) ? null : { pattern: msg };
    };
  }
  private optionalPattern(regex: RegExp, msg: string) {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value || '').toString().trim(); if (!v) return null;
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
      if (v === '' || v === null || v === undefined) return { required: true };
      const n = Number(v);
      if (!Number.isInteger(n)) return { integer: true };
      if (n < min) return { min: true };
      if (n > max) return { max: true };
      return null;
    };
  }
  private intMin(min: number) {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = c.value; if (v === '' || v === null || v === undefined) return null;
      const n = Number(v);
      if (!Number.isFinite(n)) return { number: true };
      if (n < min) return { min: true };
      return null;
    };
  }
  private numberNotNegative(msg: string) {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = c.value;
      if (v === '' || v === null || v === undefined) return { required: msg };
      const n = Number(v);
      if (isNaN(n)) return { number: 'Must be a valid number' };
      if (n < 0) return { min: msg };
      return null;
    };
  }
  private numMin(min: number) {
    return (c: AbstractControl): ValidationErrors | null => {
      const n = Number(c.value ?? 0);
      return n < min ? { min: true } : null;
    };
  }
  private numMax(max: number) {
    return (c: AbstractControl): ValidationErrors | null => {
      const n = Number(c.value ?? 0);
      return n > max ? { max: true } : null;
    };
  }

  // ---------- Form-level validators ----------
  private breakdownSubcategoryNotExceedTotal() {
    return (fg: AbstractControl): ValidationErrors | null => {
      if (!(fg instanceof FormGroup)) return null;
      for (const g of this.ageGroups) {
        const mT = +fg.get(g.maleTotal)?.value || 0;
        const mD = +fg.get(g.maleDisable)?.value || 0;
        const mC = +fg.get(g.maleChronicalIll)?.value || 0;
        const mB = +fg.get(g.maleBoth)?.value || 0;
        const fT = +fg.get(g.femaleTotal)?.value || 0;
        const fD = +fg.get(g.femaleDisable)?.value || 0;
        const fC = +fg.get(g.femaleChronicalIll)?.value || 0;
        const fB = +fg.get(g.femaleBoth)?.value || 0;

        if (mD + mC + mB > mT) return { subExceeds: `Male subcategories exceed total in ${g.label}` };
        if (fD + fC + fB > fT) return { subExceeds: `Female subcategories exceed total in ${g.label}` };
      }
      return null;
    };
  }
  private householdSizeMatchesSum() {
    return (fg: AbstractControl): ValidationErrors | null => {
      if (!(fg instanceof FormGroup)) return null;
      let sum = 0;
      for (const g of this.ageGroups) {
        sum += (+fg.get(g.maleTotal)?.value || 0) + (+fg.get(g.femaleTotal)?.value || 0);
      }
      const size = +fg.get('householdSize')?.value || 0;
      if (size <= 0) return { hhEmpty: 'Household cannot be empty. There must be atleast one member' };
      if (sum !== size) return { hhSizeMismatch: "Household size doesn't match sum of members" };
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
      if (lit > total) return { literateTooHigh: 'Invalid data in Can Read Write' };
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
      if ((+fg.get(g.m)?.value || 0) + (+fg.get(g.f)?.value || 0) <= 0) {
        return { ageMissing: 'Age not found in household breakdown' };
      }
      return null;
    };
  }
  private genderPresentIfSelected() {
    return (fg: AbstractControl): ValidationErrors | null => {
      const gender = fg.get('gender')?.value;
      if (!gender || gender === 'SELECT') return null;
      let anyMale = false, anyFemale = false;
      for (const g of this.ageGroups) {
        if ((+fg.get(g.maleTotal)?.value || 0) > 0) anyMale = true;
        if ((+fg.get(g.femaleTotal)?.value || 0) > 0) anyFemale = true;
      }
      if (gender === 'MALE' && !anyMale) return { genderMismatch: 'Gender in form is Male, but no male present in breakdown' };
      if (gender === 'FEMALE' && !anyFemale) return { genderMismatch: 'Gender in form is Female, but no female present in breakdown' };
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
        const slice = (m: string, f: string, md: string, mc: string, mb: string, fd: string, fc: string, fb: string) => {
          const mt = +fg.get(m)?.value || 0; const ft = +fg.get(f)?.value || 0;
          const msub = (+fg.get(md)?.value || 0) + (+fg.get(mc)?.value || 0) + (+fg.get(mb)?.value || 0);
          const fsub = (+fg.get(fd)?.value || 0) + (+fg.get(fc)?.value || 0) + (+fg.get(fb)?.value || 0);
          return (mt - msub) + (ft - fsub);
        };
        return slice('m18_35_total', 'f18_35_total', 'm18_35_disable', 'm18_35_chronic', 'm18_35_both', 'f18_35_disable', 'f18_35_chronic', 'f18_35_both')
          + slice('m36_64_total', 'f36_64_total', 'm36_64_disable', 'm36_64_chronic', 'm36_64_both', 'f36_64_disable', 'f36_64_chronic', 'f36_64_both');
      })();

      if (st === 'Direct Income Support') {
        if (ableAdults > 0) return { disRule: 'There is an adult in the household who is able to work' };
      }
      if (st === 'Public Works') {
        if (ableAdults <= 0) return { lipwRule: 'At least one able-bodied member aged 18–64 is required' };
      }
      return null;
    };
  }
}