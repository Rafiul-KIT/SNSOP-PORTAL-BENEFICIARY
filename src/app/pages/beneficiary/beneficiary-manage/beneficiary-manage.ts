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
  ],
  templateUrl: './beneficiary-manage.html',
  styleUrls: ['./beneficiary-manage.scss'],
})
export class BeneficiaryManage implements OnInit {
  isLoading: boolean = true;
  items = [
    {
      label: 'Beneficiary List',
      icon: 'fas fa-users me-2',
      routerLink: '/beneficiary/list',
    },
    { label: 'Manage Beneficiary', icon: 'fas fa-user-pen me-2' },
  ];
  home = { icon: 'fas fa-home me-2', routerLink: '/' };

  beneficiaryForm!: FormGroup;
  stateList = [
    { id: 1, name: 'Juba' },
    { id: 2, name: 'Wau' },
  ];
  countyList = [
    { id: 1, name: 'County A' },
    { id: 2, name: 'County B' },
  ];
  payamList = [
    { id: 1, name: 'Payam A' },
    { id: 2, name: 'Payam B' },
  ];
  bomaList = [
    { id: 1, name: 'Boma A' },
    { id: 2, name: 'Boma B' },
  ];

  ageGroups = [
    {
      label: '0-2 yrs',
      maleNormal: 'mn0_2',
      maleDisability: 'md0_2',
      maleChronic: 'mc0_2',
      femaleNormal: 'fn0_2',
      femaleDisability: 'fd0_2',
      femaleChronic: 'fc0_2',
    },
    {
      label: '3-5 yrs',
      maleNormal: 'mn3_5',
      maleDisability: 'md3_5',
      maleChronic: 'mc3_5',
      femaleNormal: 'fn3_5',
      femaleDisability: 'fd3_5',
      femaleChronic: 'fc3_5',
    },
    {
      label: '6-17 yrs',
      maleNormal: 'mn0_2',
      maleDisability: 'md0_2',
      maleChronic: 'mc0_2',
      femaleNormal: 'fn0_2',
      femaleDisability: 'fd0_2',
      femaleChronic: 'fc0_2',
    },
    {
      label: '18-35 yrs',
      maleNormal: 'mn3_5',
      maleDisability: 'md3_5',
      maleChronic: 'mc3_5',
      femaleNormal: 'fn3_5',
      femaleDisability: 'fd3_5',
      femaleChronic: 'fc3_5',
    },
    {
      label: '36-64 yrs',
      maleNormal: 'mn0_2',
      maleDisability: 'md0_2',
      maleChronic: 'mc0_2',
      femaleNormal: 'fn0_2',
      femaleDisability: 'fd0_2',
      femaleChronic: 'fc0_2',
    },
    {
      label: '65 yrs and Above',
      maleNormal: 'mn3_5',
      maleDisability: 'md3_5',
      maleChronic: 'mc3_5',
      femaleNormal: 'fn3_5',
      femaleDisability: 'fd3_5',
      femaleChronic: 'fc3_5',
    },
    // Add more as needed
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.beneficiaryForm = this.fb.group({
      respondentFirstName: ['', Validators.required],
      respondentMiddleName: ['', Validators.required],
      respondentLastName: ['', Validators.required],
      respondentNickName: ['', Validators.required],
      relationship: [''],
      respondentAge: ['', Validators.required],
      gender: [''],
      maritalStatus: [''],
      spouseFirstName: [''],
      spouseMiddleName: [''],
      spouseLastName: [''],
      legalStatus: [''],
      hasNationalId: [''],
      idType: [''],
      respondentIdNumber: [''],
      respondentPhone: ['', [Validators.pattern(/^[0-9]{10,}$/)]],
      mainIncomeSource: [''],
      otherIncomeSource: [''],
      avgMonthlyIncome: [''],
      supportType: [''],
      state: [''],
      county: [''],
      payam: [''],
      boma: [''],
      gpsLat: [''],
      gpsLong: [''],
      canReadWrite: [''],
      literate1835Count: [''],
      householdSize: [''],
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

    // Dynamically add form controls for ageGroups
    this.ageGroups.forEach((group) => {
      this.beneficiaryForm.addControl(group.maleNormal, this.fb.control(''));
      this.beneficiaryForm.addControl(
        group.maleDisability,
        this.fb.control('')
      );
      this.beneficiaryForm.addControl(group.maleChronic, this.fb.control(''));
      this.beneficiaryForm.addControl(group.femaleNormal, this.fb.control(''));
      this.beneficiaryForm.addControl(
        group.femaleDisability,
        this.fb.control('')
      );
      this.beneficiaryForm.addControl(group.femaleChronic, this.fb.control(''));
    });

    this.isLoading = false;
  }

  onSubmit() {
    if (this.beneficiaryForm.valid) {
      console.log('Form submitted:', this.beneficiaryForm.value);
      alert('Form submitted successfully!');
    } else {
      alert('Please fill out all required fields.');
    }
  }
}
