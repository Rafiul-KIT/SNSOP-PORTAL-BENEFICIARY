import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { AccordionModule } from 'primeng/accordion';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { Loader } from '../../../components/loader/loader';
import { ButtonModule } from 'primeng/button';

@Component({
  standalone: true,
  selector: 'app-beneficiary-details',
  templateUrl: './beneficiary-details.html',
  styleUrl: './beneficiary-details.scss',
  imports: [
    CommonModule,
    TabsModule,
    AccordionModule,
    BreadcrumbModule,
    TooltipModule,
    TableModule,
    ScrollPanelModule,
    Loader,
    ButtonModule,
  ],
})
export class BeneficiaryDetails implements OnInit {
  approvalComment: string = '';
  isSubmitting = false;
  isLoading = true;
  beneficiaryPhoto = '/images/dummyHuman.jpg';
  alternate1Photo = '/images/dummyHuman.jpg';
  alternate2Photo = '/images/dummyHuman.jpg';
  finger = '/images/tick.jpg';

  beneficiaryDetails: any = null;
  rightFingers: any[] = [];
  leftFingers: any[] = [];
  items = [
    {
      label: 'Beneficiary List',
      icon: 'fas fa-users me-2',
      routerLink: '/beneficiary/list',
    },
    { label: 'Beneficiary Details', icon: 'fas fa-user-cog me-2' },
  ];
  home = { icon: 'fas fa-home me-2', routerLink: '/' };

  ngOnInit() {
    this.initializeDemoData();
    this.isLoading = false;
  }

  initializeDemoData(): void {
    this.beneficiaryDetails = {
      applicationId: 'HH001',
      name: 'John Doe',
      age: 45,
      gender: 'Male',
      phone: '123-456-7890',
      household: {
        incomeSource: 'Casual Labour',
        monthlyIncome: 'SDG 6000',
        selectionCriteria: 'Public Works',
        selectionReasons: [
          'Household contain able bodied youth member (18–35)',
        ],
        size: 2,
        female: 0,
        male: 2,
        chronicallyIll: 0,
        disability: 0,
        ageGroup_0_2: 0,
        ageGroup_3_5: 0,
        ageGroup_6_17: 0,
        ageGroup_18_35: 2,
        ageGroup_36_64: 0,
        ageGroup_64_plus: 0,
        memberReadWrite: 2,
        isReadWrite: true,
      },
      address: {
        state: 'Central Equatoria',
        county: 'Juba',
        payam: 'Munuki',
        boma: 'Gudele',
        lat: '4.8517',
        lon: '31.5822',
      },
      alternatePayees: [
        {
          name: 'Mary Thomas',
          age: 40,
          gender: 'Female',
          nationalId: 'ALT123',
          phone: '0987654321',
          documentType: 'National ID',
          photo: 'assets/dummy.png',
        },
      ],
      nominees: [
        { name: 'Jane Doe', age: 20, gender: 'Female', relation: 'Daughter' },
        { name: 'Alex Smith', age: 22, gender: 'Male', relation: 'Son' },
      ],
    };

    this.rightFingers = [
      { label: 'Thumb', image: '/images/tick.jpg', tooltip: 'Right Thumb' },
      { label: 'Index', image: '/images/tick.jpg', tooltip: 'Right Index' },
      { label: 'Middle', image: '/images/tick.jpg', tooltip: 'Right Middle' },
      { label: 'Ring', image: '/images/tick.jpg', tooltip: 'Right Ring' },
      { label: 'Little', image: '/images/tick.jpg', tooltip: 'Right Little' },
    ];

    this.leftFingers = [
      { label: 'Thumb', image: '/images/tick.jpg', tooltip: 'Left Thumb' },
      { label: 'Index', image: '/images/tick.jpg', tooltip: 'Left Index' },
      { label: 'Middle', image: '/images/tick.jpg', tooltip: 'Left Middle' },
      { label: 'Ring', image: '/images/tick.jpg', tooltip: 'Left Ring' },
      { label: 'Little', image: '/images/tick.jpg', tooltip: 'Left Little' },
    ];
  }
  onApprove(comment: string) {
    this.isSubmitting = true;
    try {
      // TODO: call your service/API to approve
      // this.approvalService.approve(this.beneficiaryDetails.applicationId, comment)...
    } finally {
      this.isSubmitting = false;
    }
  }

  onReject(comment: string) {
    this.isSubmitting = true;
    try {
      // TODO: call your service/API to reject
      // this.approvalService.reject(this.beneficiaryDetails.applicationId, comment)...
    } finally {
      this.isSubmitting = false;
    }
  }
}
