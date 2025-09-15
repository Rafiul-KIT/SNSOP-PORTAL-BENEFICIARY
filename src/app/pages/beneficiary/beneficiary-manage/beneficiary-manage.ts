import { Component, OnInit } from '@angular/core';
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

  ageGroups = [
    { label: '0-2 yrs', maleNormal: 'mn0_2', maleDisability: 'md0_2', maleChronic: 'mc0_2', femaleNormal: 'fn0_2', femaleDisability: 'fd0_2', femaleChronic: 'fc0_2' },
    { label: '3-5 yrs', maleNormal: 'mn3_5', maleDisability: 'md3_5', maleChronic: 'mc3_5', femaleNormal: 'fn3_5', femaleDisability: 'fd3_5', femaleChronic: 'fc3_5' },
    { label: '6-17 yrs', maleNormal: 'mn6_17', maleDisability: 'md6_17', maleChronic: 'mc6_17', femaleNormal: 'fn6_17', femaleDisability: 'fd6_17', femaleChronic: 'fc6_17' },
    { label: '18-35 yrs', maleNormal: 'mn18_35', maleDisability: 'md18_35', maleChronic: 'mc18_35', femaleNormal: 'fn18_35', femaleDisability: 'fd18_35', femaleChronic: 'fc18_35' },
    { label: '36-64 yrs', maleNormal: 'mn36_64', maleDisability: 'md36_64', maleChronic: 'mc36_64', femaleNormal: 'fn36_64', femaleDisability: 'fd36_64', femaleChronic: 'fc36_64' },
    { label: '65 yrs and Above', maleNormal: 'mn65', maleDisability: 'md65', maleChronic: 'mc65', femaleNormal: 'fn65', femaleDisability: 'fd65', femaleChronic: 'fc65' },
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
    private lookup: LookupService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.genderOptions = this.lookup.getGenderList();
    this.maritalStatusOptions = this.lookup.getMaritalStatusEnum();
    this.relationshipOptions = this.lookup.getRelationshipEnum();
    this.legalStatusOptions = this.lookup.getLegalStatusEnum();
    this.idTypeOptions = this.lookup.getDocumentTypeEnum();
    this.occupationOptions = this.lookup.getOccupationEnum();

    this.ageGroups.forEach((group) => {
      this.beneficiaryForm.addControl(group.maleNormal, this.fb.control(''));
      this.beneficiaryForm.addControl(group.maleDisability, this.fb.control(''));
      this.beneficiaryForm.addControl(group.maleChronic, this.fb.control(''));
      this.beneficiaryForm.addControl(group.femaleNormal, this.fb.control(''));
      this.beneficiaryForm.addControl(group.femaleDisability, this.fb.control(''));
      this.beneficiaryForm.addControl(group.femaleChronic, this.fb.control(''));
    });

    const applicationId = this.route.snapshot.paramMap.get('applicationId');
    if (applicationId) {
      this.loadBeneficiary(applicationId);
    }

    this.isLoading = false;
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
      canReadWrite: [''],
      literate1835Count: [''],
      householdSize: [''],

      // Alternate Payees
      alt1Name: [''],
      alt1Gender: [''],
      alt1Age: [''],
      alt1HasNationalId: [''],
      alt1IdType: [''],
      alt1IdNumber: [''],
      alt1Phone: [''],
      alt2Name: [''],
      alt2Gender: [''],
      alt2Age: [''],
      alt2HasNationalId: [''],
      alt2IdType: [''],
      alt2IdNumber: [''],
      alt2Phone: [''],
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
          canReadWrite: dto.isReadWrite ? 'Yes' : 'No',
          literate1835Count: dto.memberReadWrite,
          householdSize: dto.householdSize,
        });

        // ✅ Patch alternates
        if (dto.alternatePayee1) {
          this.beneficiaryForm.patchValue({
            alt1Name: `${dto.alternatePayee1.payeeFirstName} ${dto.alternatePayee1.payeeLastName}`.trim(),
            alt1Gender: dto.alternatePayee1.payeeGender,
            alt1Age: dto.alternatePayee1.payeeAge,
            alt1HasNationalId: dto.alternatePayee1.documentType !== 'NONE' ? 'Yes' : 'No',
            alt1IdType: dto.alternatePayee1.documentType,
            alt1IdNumber: dto.alternatePayee1.nationalId,
            alt1Phone: dto.alternatePayee1.payeePhoneNo,
          });
        }
        if (dto.alternatePayee2) {
          this.beneficiaryForm.patchValue({
            alt2Name: `${dto.alternatePayee2.payeeFirstName} ${dto.alternatePayee2.payeeLastName}`.trim(),
            alt2Gender: dto.alternatePayee2.payeeGender,
            alt2Age: dto.alternatePayee2.payeeAge,
            alt2HasNationalId: dto.alternatePayee2.documentType !== 'NONE' ? 'Yes' : 'No',
            alt2IdType: dto.alternatePayee2.documentType,
            alt2IdNumber: dto.alternatePayee2.nationalId,
            alt2Phone: dto.alternatePayee2.payeePhoneNo,
          });
        }
      })
      .catch((err) => console.error('Failed to load beneficiary:', err))
      .finally(() => (this.isLoading = false));
  }

  private buildUpdatePayload(formValue: any): BeneficiaryDto {
    const payload: BeneficiaryDto = JSON.parse(JSON.stringify(this.originalDto));

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
    payload.isReadWrite = formValue.canReadWrite === 'Yes';
    payload.memberReadWrite = formValue.literate1835Count;
    payload.householdSize = formValue.householdSize;

    if (payload.alternatePayee1) {
      payload.alternatePayee1.payeeFirstName = formValue.alt1Name?.split(' ')[0] || '';
      payload.alternatePayee1.payeeLastName = formValue.alt1Name?.split(' ')[1] || '';
      payload.alternatePayee1.payeeGender = formValue.alt1Gender;
      payload.alternatePayee1.payeeAge = formValue.alt1Age;
      payload.alternatePayee1.documentType = formValue.alt1IdType;
      payload.alternatePayee1.nationalId = formValue.alt1IdNumber;
      payload.alternatePayee1.payeePhoneNo = formValue.alt1Phone;
    }

    if (payload.alternatePayee2) {
      payload.alternatePayee2.payeeFirstName = formValue.alt2Name?.split(' ')[0] || '';
      payload.alternatePayee2.payeeLastName = formValue.alt2Name?.split(' ')[1] || '';
      payload.alternatePayee2.payeeGender = formValue.alt2Gender;
      payload.alternatePayee2.payeeAge = formValue.alt2Age;
      payload.alternatePayee2.documentType = formValue.alt2IdType;
      payload.alternatePayee2.nationalId = formValue.alt2IdNumber;
      payload.alternatePayee2.payeePhoneNo = formValue.alt2Phone;
    }

    return payload;
  }

  onSubmit() {
    if (!this.beneficiaryForm.valid) {
      alert('Please fill out all required fields.');
      return;
    }

    const beneficiary = this.buildUpdatePayload(this.beneficiaryForm.value);

    const payload = {
      beneficiaries: [beneficiary]
    };

    this.api
      .POST('api/beneficiary/update/batch', payload)
      .then(() => {
        alert('Beneficiary updated successfully!');
      })
      .catch((err) => {
        console.error('Update failed:', err);
        alert('Failed to update beneficiary');
      });
  }
}
