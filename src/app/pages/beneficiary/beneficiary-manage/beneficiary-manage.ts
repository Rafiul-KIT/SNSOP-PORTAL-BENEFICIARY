import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { FormArray } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Toast } from "primeng/toast";
import { Router } from '@angular/router';


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
  isLoading: boolean = true;
  beneficiaryForm!: FormGroup;
  originalDto!: BeneficiaryDto;   // ✅ keep original DTO for update

  genderOptions: LookupItem[] = [];
  maritalStatusOptions: any[] = [];
  relationshipOptions: any[] = [];
  legalStatusOptions: any[] = [];
  idTypeOptions: any[] = [];
  occupationOptions: any[] = [];
  allReasons: any[] = [];
  filteredReasons: any[] = [];


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

  ngOnInit(): void {
    this.initForm();
    this.genderOptions = this.lookup.getGenderList();
    this.maritalStatusOptions = this.lookup.getMaritalStatusEnum();
    this.relationshipOptions = this.lookup.getRelationshipEnum();
    this.legalStatusOptions = this.lookup.getLegalStatusEnum();
    this.idTypeOptions = this.lookup.getDocumentTypeEnum();
    this.occupationOptions = this.lookup.getOccupationEnum();

    this.ageGroups.forEach(group => {
      this.beneficiaryForm.addControl(group.maleTotal, this.fb.control(''));
      this.beneficiaryForm.addControl(group.maleDisable, this.fb.control(''));
      this.beneficiaryForm.addControl(group.maleChronicalIll, this.fb.control(''));
      this.beneficiaryForm.addControl(group.maleBoth, this.fb.control(''));
      this.beneficiaryForm.addControl(group.femaleTotal, this.fb.control(''));
      this.beneficiaryForm.addControl(group.femaleDisable, this.fb.control(''));
      this.beneficiaryForm.addControl(group.femaleChronicalIll, this.fb.control(''));
      this.beneficiaryForm.addControl(group.femaleBoth, this.fb.control(''));
    });

    const applicationId = this.route.snapshot.paramMap.get('applicationId');
    if (applicationId) {
      this.isLoading = true;
      this.loadBeneficiary(applicationId);
    }
    else {
      this.isLoading = false;
    }

    this.beneficiaryForm.get('supportType')?.valueChanges.subscribe(val => {
      this.filterReasons(val);
    });

    this.cdr.detectChanges();
  }

  initForm() {
    this.beneficiaryForm = this.fb.group({
      respondentFirstName: ['', Validators.required],
      respondentMiddleName: [''],
      respondentLastName: [''],
      respondentNickName: [''],
      relationship: [''],
      respondentAge: [''],
      gender: [''],
      maritalStatus: [''],
      spouseFirstName: [''],
      spouseMiddleName: [''],
      spouseLastName: [''],
      legalStatus: [''],
      hasNationalId: [''],
      idType: [''],
      respondentIdNumber: [''],
      respondentPhone: [''],
      mainIncomeSource: [''],
      otherIncomeSource: [''],
      avgMonthlyIncome: [''],
      supportType: [''],
      selectionReasons: this.fb.control([]),
      canReadWrite: [''],
      literate1835Count: [''],
      householdSize: [''],

      // Alternate Payees
      alternates: this.fb.array([]),

      nominees: this.fb.array([])
    });
  }

  private loadBeneficiary(applicationId: string) {
    this.isLoading = true;
    this.api
      .GET(`/api/beneficiary/details/${applicationId}`)
      .then((res: any) => {
        this.originalDto = res?.data;   // ✅ keep full DTO

        const dto = this.originalDto;

        // ✅ Patch personal info
        this.beneficiaryForm.patchValue({
          respondentFirstName: dto.respondentFirstName,
          respondentMiddleName: dto.respondentMiddleName,
          respondentLastName: dto.respondentLastName,
          respondentNickName: dto.respondentNickName,
          relationship: dto.relationshipWithHouseholdHead,
          respondentAge: dto.respondentAge,
          gender: dto.respondentGender,
          maritalStatus: dto.respondentMaritalStatus,
          spouseFirstName: dto.spouseFirstName,
          spouseMiddleName: dto.spouseMiddleName,
          spouseLastName: dto.spouseLastName,
          legalStatus: dto.respondentLegalStatus,
          hasNationalId: dto.documentType !== 'NONE' ? 'Yes' : 'No',
          idType: dto.documentType,
          respondentIdNumber: dto.respondentId,
          respondentPhone: dto.respondentPhoneNo,
          mainIncomeSource: dto.householdIncomeSource,
          otherIncomeSource: dto.incomeSourceOther,
          avgMonthlyIncome: dto.householdMonthlyAvgIncome,
          supportType: dto.selectionCriteria === 'LIPW' ? 'Public Works' : 'Direct Income Support',
          selectionReasons: Array.isArray(dto.selectionReason) ? dto.selectionReason : [dto.selectionReason],
          canReadWrite: dto.isReadWrite ? 'Yes' : 'No',
          literate1835Count: dto.memberReadWrite,
          householdSize: dto.householdSize,
        });
        this.filterReasons(this.beneficiaryForm.get('supportType')?.value);

        // ✅ Patch household member age group data
        if (dto.householdMember2) {
          this.beneficiaryForm.patchValue({
            m0_2_total: dto.householdMember2.maleTotal,
            m0_2_disable: dto.householdMember2.maleDisable,
            m0_2_chronic: dto.householdMember2.maleChronicalIll,
            m0_2_both: dto.householdMember2.maleBoth,
            f0_2_total: dto.householdMember2.femaleTotal,
            f0_2_disable: dto.householdMember2.femaleDisable,
            f0_2_chronic: dto.householdMember2.femaleChronicalIll,
            f0_2_both: dto.householdMember2.femaleBoth,
          });
        }
        if (dto.householdMember5) {
          this.beneficiaryForm.patchValue({
            m3_5_total: dto.householdMember5.maleTotal,
            m3_5_disable: dto.householdMember5.maleDisable,
            m3_5_chronic: dto.householdMember5.maleChronicalIll,
            m3_5_both: dto.householdMember5.maleBoth,
            f3_5_total: dto.householdMember5.femaleTotal,
            f3_5_disable: dto.householdMember5.femaleDisable,
            f3_5_chronic: dto.householdMember5.femaleChronicalIll,
            f3_5_both: dto.householdMember5.femaleBoth,
          });
        }
        if (dto.householdMember17) {
          this.beneficiaryForm.patchValue({
            m6_17_total: dto.householdMember17.maleTotal,
            m6_17_disable: dto.householdMember17.maleDisable,
            m6_17_chronic: dto.householdMember17.maleChronicalIll,
            m6_17_both: dto.householdMember17.maleBoth,
            f6_17_total: dto.householdMember17.femaleTotal,
            f6_17_disable: dto.householdMember17.femaleDisable,
            f6_17_chronic: dto.householdMember17.femaleChronicalIll,
            f6_17_both: dto.householdMember17.femaleBoth,
          });
        }
        if (dto.householdMember35) {
          this.beneficiaryForm.patchValue({
            m18_35_total: dto.householdMember35.maleTotal,
            m18_35_disable: dto.householdMember35.maleDisable,
            m18_35_chronic: dto.householdMember35.maleChronicalIll,
            m18_35_both: dto.householdMember35.maleBoth,
            f18_35_total: dto.householdMember35.femaleTotal,
            f18_35_disable: dto.householdMember35.femaleDisable,
            f18_35_chronic: dto.householdMember35.femaleChronicalIll,
            f18_35_both: dto.householdMember35.femaleBoth,
          });
        }
        if (dto.householdMember64) {
          this.beneficiaryForm.patchValue({
            m36_64_total: dto.householdMember64.maleTotal,
            m36_64_disable: dto.householdMember64.maleDisable,
            m36_64_chronic: dto.householdMember64.maleChronicalIll,
            m36_64_both: dto.householdMember64.maleBoth,
            f36_64_total: dto.householdMember64.femaleTotal,
            f36_64_disable: dto.householdMember64.femaleDisable,
            f36_64_chronic: dto.householdMember64.femaleChronicalIll,
            f36_64_both: dto.householdMember64.femaleBoth,
          });
        }
        if (dto.householdMember65) {
          this.beneficiaryForm.patchValue({
            m65_total: dto.householdMember65.maleTotal,
            m65_disable: dto.householdMember65.maleDisable,
            m65_chronic: dto.householdMember65.maleChronicalIll,
            m65_both: dto.householdMember65.maleBoth,
            f65_total: dto.householdMember65.femaleTotal,
            f65_disable: dto.householdMember65.femaleDisable,
            f65_chronic: dto.householdMember65.femaleChronicalIll,
            f65_both: dto.householdMember65.femaleBoth,
          });
        }

        this.alternates.clear();
        // ✅ Patch alternates
        if (dto.alternatePayee1) {
          this.alternates.push(this.createAlternateGroup(dto.alternatePayee1));
        }
        if (dto.alternatePayee2) {
          this.alternates.push(this.createAlternateGroup(dto.alternatePayee2));
        }

        if (dto.nominees && Array.isArray(dto.nominees)) {
          this.nominees.clear(); // reset before patching
          dto.nominees.forEach((n: any) => {
            this.nominees.push(this.createNomineeGroup(n));
          });
        }

      })
      .catch((err) => console.error('Failed to load beneficiary:', err))
      .finally(() => {
        this.isLoading = false; this.cdr.detectChanges();
      });
  }


  private buildUpdatePayload(formValue: any): BeneficiaryDto {
    const payload: BeneficiaryDto = JSON.parse(JSON.stringify(this.originalDto));

    // ✅ Personal info
    payload.respondentFirstName = formValue.respondentFirstName;
    payload.respondentMiddleName = formValue.respondentMiddleName;
    payload.respondentLastName = formValue.respondentLastName;
    payload.respondentNickName = formValue.respondentNickName;
    payload.relationshipWithHouseholdHead = formValue.relationship;
    payload.respondentAge = formValue.respondentAge;
    payload.respondentGender = formValue.gender;
    payload.respondentMaritalStatus = formValue.maritalStatus;
    payload.spouseFirstName = formValue.spouseFirstName;
    payload.spouseMiddleName = formValue.spouseMiddleName;
    payload.spouseLastName = formValue.spouseLastName;
    payload.respondentLegalStatus = formValue.legalStatus;
    payload.documentType = formValue.idType;
    payload.respondentId = formValue.respondentIdNumber;
    payload.respondentPhoneNo = formValue.respondentPhone;
    payload.householdIncomeSource = formValue.mainIncomeSource;
    payload.incomeSourceOther = formValue.otherIncomeSource;
    payload.householdMonthlyAvgIncome = formValue.avgMonthlyIncome;
    payload.selectionCriteria = formValue.supportType === 'Public Works' ? 'LIPW' : 'DIS';
    payload.selectionReason = formValue.selectionReasons;
    payload.isReadWrite = formValue.canReadWrite === 'Yes';
    payload.memberReadWrite = formValue.literate1835Count;
    payload.householdSize = formValue.householdSize;

    // ✅ Household Member Groups
    if (payload.householdMember2) {
      payload.householdMember2 = {
        ...payload.householdMember2,
        maleTotal: formValue.m0_2_total,
        maleDisable: formValue.m0_2_disable,
        maleChronicalIll: formValue.m0_2_chronic,
        maleBoth: formValue.m0_2_both,
        femaleTotal: formValue.f0_2_total,
        femaleDisable: formValue.f0_2_disable,
        femaleChronicalIll: formValue.f0_2_chronic,
        femaleBoth: formValue.f0_2_both,
      };
    }

    if (payload.householdMember5) {
      payload.householdMember5 = {
        ...payload.householdMember5,
        maleTotal: formValue.m3_5_total,
        maleDisable: formValue.m3_5_disable,
        maleChronicalIll: formValue.m3_5_chronic,
        maleBoth: formValue.m3_5_both,
        femaleTotal: formValue.f3_5_total,
        femaleDisable: formValue.f3_5_disable,
        femaleChronicalIll: formValue.f3_5_chronic,
        femaleBoth: formValue.f3_5_both,
      };
    }

    if (payload.householdMember17) {
      payload.householdMember17 = {
        ...payload.householdMember17,
        maleTotal: formValue.m6_17_total,
        maleDisable: formValue.m6_17_disable,
        maleChronicalIll: formValue.m6_17_chronic,
        maleBoth: formValue.m6_17_both,
        femaleTotal: formValue.f6_17_total,
        femaleDisable: formValue.f6_17_disable,
        femaleChronicalIll: formValue.f6_17_chronic,
        femaleBoth: formValue.f6_17_both,
      };
    }

    if (payload.householdMember35) {
      payload.householdMember35 = {
        ...payload.householdMember35,
        maleTotal: formValue.m18_35_total,
        maleDisable: formValue.m18_35_disable,
        maleChronicalIll: formValue.m18_35_chronic,
        maleBoth: formValue.m18_35_both,
        femaleTotal: formValue.f18_35_total,
        femaleDisable: formValue.f18_35_disable,
        femaleChronicalIll: formValue.f18_35_chronic,
        femaleBoth: formValue.f18_35_both,
      };
    }

    if (payload.householdMember64) {
      payload.householdMember64 = {
        ...payload.householdMember64,
        maleTotal: formValue.m36_64_total,
        maleDisable: formValue.m36_64_disable,
        maleChronicalIll: formValue.m36_64_chronic,
        maleBoth: formValue.m36_64_both,
        femaleTotal: formValue.f36_64_total,
        femaleDisable: formValue.f36_64_disable,
        femaleChronicalIll: formValue.f36_64_chronic,
        femaleBoth: formValue.f36_64_both,
      };
    }

    if (payload.householdMember65) {
      payload.householdMember65 = {
        ...payload.householdMember65,
        maleTotal: formValue.m65_total,
        maleDisable: formValue.m65_disable,
        maleChronicalIll: formValue.m65_chronic,
        maleBoth: formValue.m65_both,
        femaleTotal: formValue.f65_total,
        femaleDisable: formValue.f65_disable,
        femaleChronicalIll: formValue.f65_chronic,
        femaleBoth: formValue.f65_both,
      };
    }

    // ✅ Alternates
    if (formValue.alternates && formValue.alternates.length) {
      if (payload.alternatePayee1 && formValue.alternates[0]) {
        const alt1 = formValue.alternates[0];
        payload.alternatePayee1.payeeFirstName = alt1.payeeFirstName;
        payload.alternatePayee1.payeeMiddleName = alt1.payeeMiddleName;
        payload.alternatePayee1.payeeLastName = alt1.payeeLastName;
        payload.alternatePayee1.payeeNickName = alt1.payeeNickName;
        payload.alternatePayee1.payeeGender = alt1.payeeGender;
        payload.alternatePayee1.payeeAge = alt1.payeeAge;
        payload.alternatePayee1.documentType = alt1.documentType;
        payload.alternatePayee1.nationalId = alt1.nationalId;
        payload.alternatePayee1.payeePhoneNo = alt1.payeePhoneNo;
      }

      if (payload.alternatePayee2 && formValue.alternates[1]) {
        const alt2 = formValue.alternates[1];
        payload.alternatePayee2.payeeFirstName = alt2.payeeFirstName;
        payload.alternatePayee2.payeeMiddleName = alt2.payeeMiddleName;
        payload.alternatePayee2.payeeLastName = alt2.payeeLastName;
        payload.alternatePayee2.payeeNickName = alt2.payeeNickName;
        payload.alternatePayee2.payeeGender = alt2.payeeGender;
        payload.alternatePayee2.payeeAge = alt2.payeeAge;
        payload.alternatePayee2.documentType = alt2.documentType;
        payload.alternatePayee2.nationalId = alt2.nationalId;
        payload.alternatePayee2.payeePhoneNo = alt2.payeePhoneNo;
      }
    }


    // ✅ Nominees
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

    return payload;
  }


  onSubmit() {
    if (!this.beneficiaryForm.valid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fill out all required fields.'
      });
      return;
    }

    const beneficiary = this.buildUpdatePayload(this.beneficiaryForm.value);
    const payload = { beneficiaries: [beneficiary] };

    this.isLoading = true;

    this.api
      .POST('api/beneficiary/update/batch', payload)
      .then((res: any) => {
        console.log('API raw response:', res);

        // Handle both axios-style (res.data) and fetch-style (res directly)
        const responses = res?.bulkResponse || res?.data?.bulkResponse || [];

        if (!responses.length) {
          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: 'No response returned from server.'
          });
          return;
        }

        // Assuming one beneficiary per request
        const first = responses[0];

        if (first.result === 'SUCCESS') {
          this.messageService.add({
            severity: 'success',
            summary: 'Update Successful',
            detail: 'Beneficiary edit request sent successfully!'
          });
          setTimeout(() => {
            this.router.navigate(['/beneficiary/list']);
          }, 3000);
        } else if (first.result === 'FAILED') {
          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: first.errorMessage || 'Unknown error occurred'
          });
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Update Status',
            detail: `Unexpected result: ${first.result}`
          });
        }
      })
      .catch((err) => {
        console.error('Update failed:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Request could not be processed'
        });
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }




  onReasonChange(event: any, value: string) {
    const reasons = this.beneficiaryForm.get('selectionReasons')?.value || [];
    if (event.target.checked) {
      if (!reasons.includes(value)) reasons.push(value);
    } else {
      const index = reasons.indexOf(value);
      if (index >= 0) reasons.splice(index, 1);
    }
    this.beneficiaryForm.patchValue({ selectionReasons: reasons });
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

  get nominees(): FormArray {
    return this.beneficiaryForm.get('nominees') as FormArray;
  }

  private createNomineeGroup(nominee: any = {}): FormGroup {
    return this.fb.group({
      id: [nominee.id || null],
      nomineeFirstName: [nominee.nomineeFirstName || ''],
      nomineeMiddleName: [nominee.nomineeMiddleName || ''],
      nomineeLastName: [nominee.nomineeLastName || ''],
      nomineeNickName: [nominee.nomineeNickName || ''],
      relationshipWithHouseholdHead: [nominee.relationshipWithHouseholdHead || ''],
      relationshipOther: [nominee.relationshipOther || ''],
      nomineeAge: [nominee.nomineeAge || ''],
      nomineeGender: [nominee.nomineeGender || ''],
      isReadWrite: [nominee.isReadWrite || false],
      nomineeOccupation: [nominee.nomineeOccupation || ''],
      otherOccupation: [nominee.otherOccupation || '']
    });
  }

  get alternates(): FormArray {
    return this.beneficiaryForm.get('alternates') as FormArray;
  }

  private createAlternateGroup(alt: any = {}): FormGroup {
    return this.fb.group({
      id: [alt.id || null],
      payeeFirstName: [alt.payeeFirstName || ''],
      payeeMiddleName: [alt.payeeMiddleName || ''],
      payeeLastName: [alt.payeeLastName || ''],
      payeeNickName: [alt.payeeNickName || ''],
      payeeGender: [alt.payeeGender || ''],
      payeeAge: [alt.payeeAge || ''],
      documentType: [alt.documentType || ''],
      nationalId: [alt.nationalId || ''],
      payeePhoneNo: [alt.payeePhoneNo || ''],
      hasNationalId: [alt.documentType && alt.documentType !== 'NONE' ? 'Yes' : 'No']
    });
  }

}
