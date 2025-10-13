import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TabsModule } from 'primeng/tabs';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { InputTextModule } from 'primeng/inputtext';
import { Loader } from '../../../components/loader/loader';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute } from '@angular/router';
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
  selector: 'app-beneficiary-manage',
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
    Toast
  ],
  templateUrl: './beneficiary-manage.html',
  styleUrls: ['./beneficiary-manage.scss'],
})
export class BeneficiaryManage implements OnInit {
  isLoading = true;
  beneficiaryForm!: FormGroup;
  originalDto!: BeneficiaryDto;
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

  // ===== Regex & constants (aligned with mobile/Java) =====
  private RGX_ONLY_CHARS = /^[A-Za-z]+$/;              // names (no spaces/digits/special)
  private RGX_CHARS_SPACES = /^[A-Za-z ]+$/;           // letters + spaces
  private RGX_ALPHANUM_HYPHEN = /^[A-Za-z0-9\-]+$/;         // Correct regex
  private RGX_ALPHANUM_SPACE = /^[A-Za-z0-9 ]+$/;      // alphanum + space
  private RGX_REFUGEE_ID = /^[A-Za-z0-9\-]+$/;          // refugee IDs allow hyphen
  private RGX_PHONE_13 = /^\+?\d{12}$/;                // 12 digits w/ optional +
  private MIN_NAME = 3;
  private MAX_NAME = 50;

  ageGroups = [
    { label: '0-2 yrs', maleTotal: 'm0_2_total', maleDisable: 'm0_2_disable', maleChronicalIll: 'm0_2_chronic', maleBoth: 'm0_2_both', femaleTotal: 'f0_2_total', femaleDisable: 'f0_2_disable', femaleChronicalIll: 'f0_2_chronic', femaleBoth: 'f0_2_both' },
    { label: '3-5 yrs', maleTotal: 'm3_5_total', maleDisable: 'm3_5_disable', maleChronicalIll: 'm3_5_chronic', maleBoth: 'm3_5_both', femaleTotal: 'f3_5_total', femaleDisable: 'f3_5_disable', femaleChronicalIll: 'f3_5_chronic', femaleBoth: 'f3_5_both' },
    { label: '6-17 yrs', maleTotal: 'm6_17_total', maleDisable: 'm6_17_disable', maleChronicalIll: 'm6_17_chronic', maleBoth: 'm6_17_both', femaleTotal: 'f6_17_total', femaleDisable: 'f6_17_disable', femaleChronicalIll: 'f6_17_chronic', femaleBoth: 'f6_17_both' },
    { label: '18-35 yrs', maleTotal: 'm18_35_total', maleDisable: 'm18_35_disable', maleChronicalIll: 'm18_35_chronic', maleBoth: 'm18_35_both', femaleTotal: 'f18_35_total', femaleDisable: 'f18_35_disable', femaleChronicalIll: 'f18_35_chronic', femaleBoth: 'f18_35_both' },
    { label: '36-64 yrs', maleTotal: 'm36_64_total', maleDisable: 'm36_64_disable', maleChronicalIll: 'm36_64_chronic', maleBoth: 'm36_64_both', femaleTotal: 'f36_64_total', femaleDisable: 'f36_64_disable', femaleChronicalIll: 'f36_64_chronic', femaleBoth: 'f36_64_both' },
    { label: '65+ yrs', maleTotal: 'm65_total', maleDisable: 'm65_disable', maleChronicalIll: 'm65_chronic', maleBoth: 'm65_both', femaleTotal: 'f65_total', femaleDisable: 'f65_disable', femaleChronicalIll: 'f65_chronic', femaleBoth: 'f65_both' },
  ];

  items = [
    { label: 'Beneficiary List', icon: 'fas fa-users me-2', routerLink: '/beneficiary/list' },
    { label: 'Manage Beneficiary', icon: 'fas fa-user-pen me-2' },
  ];
  home = { icon: 'fas fa-home me-2', routerLink: '/' };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private api: ApiService,
    private lookup: LookupService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private router: Router
  ) { }

  // ========= Init =========
ngOnInit(): void {
  this.initForm();

  // Lookups
  this.genderOptions = this.lookup.getGenderList();
  this.maritalStatusOptions = this.lookup.getMaritalStatusEnum();
  this.relationshipOptions = this.lookup.getRelationshipEnum();
  this.legalStatusOptions = this.lookup.getLegalStatusEnum();

  this.occupationOptions = this.lookup.getNomineeOccupationEnum();
  this.incomeSourceOptions = this.lookup.getIncomeSourceEnum();
  this.allReasons = this.lookup.getSelectionReasonEnum();

  // Dynamic age-group controls with bounds 0..10 per mobile rule
  this.ageGroups.forEach(group => {
    this.beneficiaryForm.addControl(group.maleTotal, this.fb.control('0', [this.numMin(0), this.numMax(10)]));
    this.beneficiaryForm.addControl(group.maleDisable, this.fb.control('0', [this.numMin(0), this.numMax(10)]));
    this.beneficiaryForm.addControl(group.maleChronicalIll, this.fb.control('0', [this.numMin(0), this.numMax(10)]));
    this.beneficiaryForm.addControl(group.maleBoth, this.fb.control('0', [this.numMin(0), this.numMax(10)]));
    this.beneficiaryForm.addControl(group.femaleTotal, this.fb.control('0', [this.numMin(0), this.numMax(10)]));
    this.beneficiaryForm.addControl(group.femaleDisable, this.fb.control('0', [this.numMin(0), this.numMax(10)]));
    this.beneficiaryForm.addControl(group.femaleChronicalIll, this.fb.control('0', [this.numMin(0), this.numMax(10)]));
    this.beneficiaryForm.addControl(group.femaleBoth, this.fb.control('0', [this.numMin(0), this.numMax(10)]));
  });

  // Form-level validators (mirror Java)
  this.beneficiaryForm.setValidators([
    this.breakdownSubcategoryNotExceedTotal(),
    this.householdSizeMatchesSum(),
    this.literate1835NotExceedYouth(),
    this.personalAgeExistsInBreakdown(),
    this.genderPresentIfSelected(),
    this.selectionReasonsRequired(),
    this.disLipwEligibility()
  ]);

  // Existing load
  const applicationId = this.route.snapshot.paramMap.get('applicationId');
  if (applicationId) {
    this.isLoading = true;
    this.loadBeneficiary(applicationId);
  } else {
    this.isLoading = false;
  }

  // Filter reasons by Support Type
  this.beneficiaryForm.get('supportType')?.valueChanges.pipe(
    takeUntil(this.destroy$)
  ).subscribe(val => {
    this.filterReasons(val);
    this.beneficiaryForm.updateValueAndValidity();
  });

    // Conditional validators
    this.beneficiaryForm.get('relationship')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      const control = this.beneficiaryForm.get('relationshipOther')!;
      if (value === 'OTHER') {
        control.enable({ emitEvent: false });
        control.setValidators([Validators.required, this.pattern(this.RGX_CHARS_SPACES, 'Only letters and spaces'), this.size(2, 50)]);
      } else {
        control.disable({ emitEvent: false });
        control.clearValidators();
        control.setValue('', { emitEvent: false });
      }
      control.updateValueAndValidity({ emitEvent: false });
    });
  
    this.beneficiaryForm.get('maritalStatus')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      const controls = ['spouseFirstName', 'spouseMiddleName', 'spouseLastName', 'spouseNickName'];
      controls.forEach(name => {
        const control = this.beneficiaryForm.get(name)!;
        if (value === 'MARRIED') {
          control.enable({ emitEvent: false });
          control.setValidators([Validators.required, this.capitalized(), this.onlyLetters(), this.size(this.MIN_NAME, this.MAX_NAME)]);
        } else {
          control.disable({ emitEvent: false });
          control.clearValidators();
          control.setValue('', { emitEvent: false });
        }
        control.updateValueAndValidity({ emitEvent: false });
      });
    });
  
    // --- ID Information Logic ---
    const updateIdLogic = () => {
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
      const refugeeIdTypes = allIdTypes.filter(o => o.value.startsWith('REFUGEE'));
      const nonRefugeeIdTypes = allIdTypes.filter(o => !o.value.startsWith('REFUGEE') && o.value !== 'SELECT');

      if (legalStatus === 'REFUGEE') {
        this.currentIdTypeOptions = refugeeIdTypes;
        if (!typeControl.value || !refugeeIdTypes.some(o => o.value === typeControl.value)) {
          typeControl.setValue('', { emitEvent: false });
        }
        
        hasIdControl.setValue('Yes', { emitEvent: false });
        hasIdControl.disable({ emitEvent: false });

        typeControl.setValidators([Validators.required]);
        numberControl.setValidators([Validators.required, this.pattern(this.RGX_REFUGEE_ID, 'ID must be valid refugee format'), this.size(5, 14)]);

        typeControl.enable({ emitEvent: false });
        numberControl.enable({ emitEvent: false });
        otherControl.disable({ emitEvent: false });
        otherControl.setValue('', { emitEvent: false });
      } else {
        this.currentIdTypeOptions = nonRefugeeIdTypes;
        if (!typeControl.value || !nonRefugeeIdTypes.some(o => o.value === typeControl.value)) {
          typeControl.setValue('', { emitEvent: false });
        }
        hasIdControl.enable({ emitEvent: false });

        if (hasIdControl.value === 'Yes') {
          typeControl.enable({ emitEvent: false });
          typeControl.setValidators([Validators.required]);

          if (typeControl.value === 'OTHER') {
            otherControl.enable({ emitEvent: false });
            numberControl.enable({ emitEvent: false });
            otherControl.setValidators([Validators.required, this.pattern(this.RGX_CHARS_SPACES, 'Only letters/spaces'), this.size(2, 50)]);
            numberControl.setValidators([Validators.required, this.pattern(this.RGX_ALPHANUM_SPACE, 'ID must be alphanumeric'), this.size(5, 14)]);
          } else if (typeControl.value === 'NONE' || !typeControl.value) {
            otherControl.disable({ emitEvent: false });
            numberControl.disable({ emitEvent: false });
            otherControl.setValue('', { emitEvent: false });
            numberControl.setValue('', { emitEvent: false });
          } else { // Passport, National ID
            numberControl.enable({ emitEvent: false });
            otherControl.disable({ emitEvent: false });
            numberControl.setValidators([Validators.required, this.pattern(this.RGX_ALPHANUM_SPACE, 'ID must be alphanumeric'), this.size(5, 14)]);
            otherControl.setValue('', { emitEvent: false });
          }
        } else { // hasNationalId is 'No' or empty
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
      this.cdr.detectChanges();
    };

    // Triggers for the ID logic
    this.beneficiaryForm.get('legalStatus')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => updateIdLogic());
    this.beneficiaryForm.get('hasNationalId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => updateIdLogic());
    this.beneficiaryForm.get('idType')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => updateIdLogic());
    
    // Initial run to set the form state
    updateIdLogic();
  
    this.beneficiaryForm.get('mainIncomeSource')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      const otherControl = this.beneficiaryForm.get('otherIncomeSource')!;
      const monthlyControl = this.beneficiaryForm.get('avgMonthlyIncome')!;
  
      if (value === 'OTHER') {
        otherControl.enable({ emitEvent: false });
        otherControl.setValidators([Validators.required, this.pattern(this.RGX_CHARS_SPACES, 'Only letters and spaces'), this.size(2, 50)]);
      } else {
        otherControl.disable({ emitEvent: false });
        otherControl.clearValidators();
        otherControl.setValue('', { emitEvent: false });
      }
  
      if (value && value !== 'NONE' && value !== 'SELECT') {
        monthlyControl.enable({ emitEvent: false });
        monthlyControl.setValidators([this.numberNotNegative('Add valid monthly income')]);
      } else {
        monthlyControl.disable({ emitEvent: false });
        monthlyControl.clearValidators();
        monthlyControl.setValue('', { emitEvent: false });
      }
  
      otherControl.updateValueAndValidity({ emitEvent: false });
      monthlyControl.updateValueAndValidity({ emitEvent: false });
    });
  this.cdr.detectChanges();
}


ngOnDestroy(): void {
  // Unsubscribe when the component is destroyed to avoid memory leaks
  this.destroy$.next();
  this.destroy$.complete();
}
  // ========= Form skeleton =========
  private initForm() {
    this.beneficiaryForm = this.fb.group({
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
      hasNationalId: [''], // 'Yes'|'No'
      idType: [''],
      idTypeOther: [''],
      respondentIdNumber: [''],

      respondentPhone: ['', [this.optionalPattern(this.RGX_PHONE_13, 'Phone number length must be 13')]],

      mainIncomeSource: ['', [this.notSelectRequired()]],
      otherIncomeSource: [''],
      avgMonthlyIncome: [''],

      supportType: ['', [this.notSelectRequired()]],
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
    this.api.GET(`/api/beneficiary/details/${applicationId}`)
      .then((res: any) => {
        this.originalDto = res?.data;
        const dto = this.originalDto;

        // Patch personal
        this.beneficiaryForm.patchValue({
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
          respondentPhone: dto.respondentPhoneNo,
          mainIncomeSource: dto.householdIncomeSource,
          otherIncomeSource: dto.incomeSourceOther,
          avgMonthlyIncome: dto.householdMonthlyAvgIncome,
          supportType: dto.selectionCriteria === 'LIPW' ? 'Public Works' : 'Direct Income Support',
          selectionReasons: Array.isArray(dto.selectionReason) ? dto.selectionReason : [dto.selectionReason],
          canReadWrite: dto.isReadWrite ? 'Yes' : 'No',
          literate1835Count: dto.memberReadWrite ?? '0',
          householdSize: dto.householdSize ?? '0',
        });
        this.filterReasons(this.beneficiaryForm.get('supportType')?.value);

        // Patch breakdown helper
        const pv = (src: any, map: Record<string, string>) => {
          if (!src) return;
          const patch: any = {};
          Object.entries(map).forEach(([formKey, dtoKey]) => patch[formKey] = src[dtoKey]);
          this.beneficiaryForm.patchValue(patch);
        };
        pv(dto.householdMember2, { m0_2_total: 'maleTotal', m0_2_disable: 'maleDisable', m0_2_chronic: 'maleChronicalIll', m0_2_both: 'maleBoth', f0_2_total: 'femaleTotal', f0_2_disable: 'femaleDisable', f0_2_chronic: 'femaleChronicalIll', f0_2_both: 'femaleBoth' });
        pv(dto.householdMember5, { m3_5_total: 'maleTotal', m3_5_disable: 'maleDisable', m3_5_chronic: 'maleChronicalIll', m3_5_both: 'maleBoth', f3_5_total: 'femaleTotal', f3_5_disable: 'femaleDisable', f3_5_chronic: 'femaleChronicalIll', f3_5_both: 'femaleBoth' });
        pv(dto.householdMember17, { m6_17_total: 'maleTotal', m6_17_disable: 'maleDisable', m6_17_chronic: 'maleChronicalIll', m6_17_both: 'maleBoth', f6_17_total: 'femaleTotal', f6_17_disable: 'femaleDisable', f6_17_chronic: 'femaleChronicalIll', f6_17_both: 'femaleBoth' });
        pv(dto.householdMember35, { m18_35_total: 'maleTotal', m18_35_disable: 'maleDisable', m18_35_chronic: 'maleChronicalIll', m18_35_both: 'maleBoth', f18_35_total: 'femaleTotal', f18_35_disable: 'femaleDisable', f18_35_chronic: 'femaleChronicalIll', f18_35_both: 'femaleBoth' });
        pv(dto.householdMember64, { m36_64_total: 'maleTotal', m36_64_disable: 'maleDisable', m36_64_chronic: 'maleChronicalIll', m36_64_both: 'maleBoth', f36_64_total: 'femaleTotal', f36_64_disable: 'femaleDisable', f36_64_chronic: 'femaleChronicalIll', f36_64_both: 'femaleBoth' });
        pv(dto.householdMember65, { m65_total: 'maleTotal', m65_disable: 'maleDisable', m65_chronic: 'maleChronicalIll', m65_both: 'maleBoth', f65_total: 'femaleTotal', f65_disable: 'femaleDisable', f65_chronic: 'femaleChronicalIll', f65_both: 'femaleBoth' });

        // Alternates
        this.alternates.clear();
        if (dto.alternatePayee1) this.alternates.push(this.createAlternateGroup(dto.alternatePayee1));
        if (dto.alternatePayee2) this.alternates.push(this.createAlternateGroup(dto.alternatePayee2));

        // Nominees
        this.nominees.clear();
        if (Array.isArray(dto.nominees)) {
          dto.nominees.forEach(n => this.nominees.push(this.createNomineeGroup(n)));
        }
      })
      .catch(err => console.error('Failed to load beneficiary:', err))
      .finally(() => { this.isLoading = false; this.cdr.detectChanges(); });
  }

  // ========= Build payload =========
  private buildUpdatePayload(formValue: any): BeneficiaryDto {
    const payload: BeneficiaryDto = JSON.parse(JSON.stringify(this.originalDto));

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
    if (formValue.hasNationalId === 'No') {
      payload.documentType = 'NONE';
      payload.documentTypeOther = '';
      payload.respondentId = '';
    } else {
      payload.documentType = formValue.idType;
      payload.documentTypeOther = formValue.idTypeOther;
      payload.respondentId = formValue.respondentIdNumber;
    }
    payload.respondentPhoneNo = formValue.respondentPhone;

    payload.householdIncomeSource = formValue.mainIncomeSource;
    payload.incomeSourceOther = formValue.otherIncomeSource;
    payload.householdMonthlyAvgIncome = formValue.avgMonthlyIncome;

    payload.selectionCriteria = formValue.supportType === 'Public Works' ? 'LIPW' : 'DIS';
    payload.selectionReason = formValue.selectionReasons;
    payload.isReadWrite = formValue.canReadWrite === 'Yes';
    payload.memberReadWrite = +formValue.literate1835Count;
    payload.householdSize = +formValue.householdSize;

    // Breakdown copy helper
    const copy = (dstKey: keyof BeneficiaryDto, mPrefix: string, fPrefix: string) => {
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

    // Alternates
    if (formValue.alternates?.length) {
      if (payload.alternatePayee1 && formValue.alternates[0]) {
        const a = formValue.alternates[0];
        Object.assign(payload.alternatePayee1, {
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
          payeePhoneNo: a.payeePhoneNo
        });
        delete (payload.alternatePayee1 as any).biometrics;
      }
      if (payload.alternatePayee2 && formValue.alternates[1]) {
        const a = formValue.alternates[1];
        Object.assign(payload.alternatePayee2, {
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
          payeePhoneNo: a.payeePhoneNo
        });
        delete (payload.alternatePayee2 as any).biometrics;
      }
    }

    // Nominees
    payload.nominees = this.nominees.value.map((n: any) => ({
      id: n.id,
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

    delete (payload as any).biometrics;
    return payload;
  }

  // ========= Submit =========
  onSubmit() {
    this.beneficiaryForm.markAllAsTouched();
    if (!this.beneficiaryForm.valid) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please fix the highlighted errors.' });
      return;
    }

    const beneficiary = this.buildUpdatePayload(this.beneficiaryForm.getRawValue());
    const payload = { beneficiaries: [beneficiary] };

    this.isLoading = true;
    this.api.POST('api/beneficiary/update/batch', payload)
      .then((res: any) => {
        const responses = res?.bulkResponse || res?.data?.bulkResponse || [];
        if (!responses.length) {
          this.messageService.add({ severity: 'error', summary: 'Update Failed', detail: 'No response returned from server.' });
          return;
        }
        const first = responses[0];
        if (first.result === 'SUCCESS') {
          this.messageService.add({ severity: 'success', summary: 'Update Successful', detail: 'Beneficiary edit request sent successfully!' });
          setTimeout(() => this.router.navigate(['/beneficiary/list']), 3000);
        } else if (first.result === 'FAILED') {
          this.messageService.add({ severity: 'error', summary: 'Update Failed', detail: first.errorMessage || 'Unknown error occurred' });
        } else {
          this.messageService.add({ severity: 'warn', summary: 'Update Status', detail: `Unexpected result: ${first.result}` });
        }
      })
      .catch((err) => {
        console.error('Update failed:', err);
        this.messageService.add({ severity: 'error', summary: 'Update Failed', detail: 'Request could not be processed' });
      })
      .finally(() => { this.isLoading = false; this.cdr.detectChanges(); });
  }

  // ========= Selection reasons =========
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
    if (supportType === 'Public Works') {
      this.filteredReasons = this.allReasons.filter(r => r.value.startsWith('LIPW_REASON'));
    } else if (supportType === 'Direct Income Support') {
      this.filteredReasons = this.allReasons.filter(r => r.value.startsWith('DIS_REASON'));
    } else {
      this.filteredReasons = [];
    }
  }
  isReasonSelected(value: string): boolean {
    const reasons = this.beneficiaryForm.get('selectionReasons')?.value || [];
    return reasons.includes(value);
  }

  // ========= Arrays =========
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
      otherOccupation: [n.otherOccupation || '']
    });

    // OTHER relationship
    g.get('relationshipWithHouseholdHead')?.valueChanges.subscribe(v => {
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

    // OTHER occupation
    g.get('nomineeOccupation')?.valueChanges.subscribe(v => {
      const c = g.get('otherOccupation')!;
      if (v === 'OTHER') {
        c.setValidators([Validators.required, this.pattern(this.RGX_CHARS_SPACES, 'Only letters and spaces'), this.size(2, 25)]);
      } else {
        c.clearValidators(); c.setValue('', { emitEvent: false });
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
      payeePhoneNo: [a.payeePhoneNo || '', [this.optionalPattern(this.RGX_PHONE_13, 'Phone number length must be 13')]],
      hasNationalId: [a.documentType && a.documentType !== 'NONE' ? 'Yes' : 'No']
    });

    // OTHER relationship
    g.get('relationshipWithHouseholdHead')?.valueChanges.subscribe(v => {
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
            this.pattern(isRef ? this.RGX_REFUGEE_ID : this.RGX_ALPHANUM_SPACE, isRef ? 'ID number must contain digits, letters, hyphen only' : 'ID number must contain digits, letters'),
            this.size(5, 14)
          ]);
        }
      } else { // hasId === 'No'
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

  // ========= Template helpers =========
  c(name: string): AbstractControl | null { return this.beneficiaryForm.get(name); }
  showError(name: string, key?: string): boolean {
    const ctrl = this.c(name);
    if (!ctrl) return false;
    const touched = ctrl.touched || ctrl.dirty;
    return touched && (!!ctrl.errors && (key ? !!ctrl.errors[key] : true));
  }
  getError(name: string): string | null {
    const ctrl = this.c(name);
    if (!ctrl?.errors) return null;
    const firstKey = Object.keys(ctrl.errors)[0];
    return (ctrl.errors as any)[firstKey] || firstKey;
  }

  // ========= Custom validators =========
  private capitalized() {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value || '').toString().trim();
      if (!v) return null;
      return /^[A-Z]/.test(v) ? null : { capitalized: 'Must start with a capital letter' };
    };
  }
  private onlyLetters() {
    return this.pattern(this.RGX_ONLY_CHARS, 'Must not contain space, digits or special characters');
  }
  private size(min: number, max: number) {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value ?? '').toString();
      if (!v) return null;
      if (v.length < min) return { size: `Must be at least ${min} characters` };
      if (v.length > max) return { size: `Must be at most ${max} characters` };
      return null;
    };
  }
  private optionalCapitalizedName() {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = (c.value || '').toString().trim();
      if (!v) return null;
      if (v.length < this.MIN_NAME) return { size: `Must be at least ${this.MIN_NAME} characters` };
      if (!/^[A-Z]/.test(v)) return { capitalized: 'Must start with a capital letter' };
      if (!this.RGX_ONLY_CHARS.test(v)) return { pattern: 'Must not contain space, digits or special characters' };
      if (v.length > this.MAX_NAME) return { size: `Must be at most ${this.MAX_NAME} characters` };
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
      if (v === '' || v === null || v === undefined) return { required: 'Input age properly' };
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
      if (v === '' || v === null || v === undefined) return { required: 'Monthly income not given' };
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
          const mt = +fg.get(m)?.value || 0;
          const ft = +fg.get(f)?.value || 0;
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
