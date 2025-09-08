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
  selector: 'app-beneficiary-migration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TabsModule,
    BreadcrumbModule,
    InputTextModule,
    SelectModule,
    Loader,
    ButtonModule,
  ],
  templateUrl: './beneficiary-migration.html',
  styleUrl: './beneficiary-migration.scss',
})
export class BeneficiaryMigration {
  isSubmitting = false;
  isLoading = false;
  items = [
    {
      label: 'Beneficiary List',
      icon: 'fas fa-users me-2',
      routerLink: '/beneficiary/list',
    },
    { label: 'Migrate Beneficiary', icon: 'fas fa-user-plus me-2' },
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

  beneficiaryDetails: any;
  beneficiaryPhoto = '/images/dummyHuman.jpg';

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeDemoData();
    this.beneficiaryForm = this.fb.group({
      state: [''],
      county: [''],
      payam: [''],
      boma: [''],
      gpsLat: [''],
      gpsLong: [''],
      approvalComment: [''],
    });
  }

  initializeDemoData(): void {
    this.beneficiaryDetails = {
      applicationId: 'HH001',
      name: 'John Doe',
      age: 45,
      gender: 'Male',
      phone: '123-456-7890',

      address: {
        state: 'Central Equatoria',
        county: 'Juba',
        payam: 'Munuki',
        boma: 'Gudele',
        lat: '4.8517',
        lon: '31.5822',
      },
    };
  }

  onSubmit() {
    if (this.beneficiaryForm.valid) {
      console.log('Form submitted:', this.beneficiaryForm.value);
      alert('Form submitted successfully!');
    } else {
      alert('Please fill out all required fields.');
    }
  }

  onApprove() {
    this.isSubmitting = true;
    const comment = this.beneficiaryForm.get('approvalComment')?.value ?? '';
    try {
      // TODO: call Approve API with comment + IDs you need
      // this.service.approve(this.beneficiaryDetails.applicationId, comment).subscribe(...)
    } finally {
      this.isSubmitting = false;
    }
  }

  onReject() {
    this.isSubmitting = true;
    const comment = this.beneficiaryForm.get('approvalComment')?.value ?? '';
    try {
      // TODO: call Reject API with comment + IDs you need
      // this.service.reject(this.beneficiaryDetails.applicationId, comment).subscribe(...)
    } finally {
      this.isSubmitting = false;
    }
  }
}
