import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TabsModule } from 'primeng/tabs';
import { AccordionModule } from 'primeng/accordion';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { Loader } from '../../../components/loader/loader';
import { ButtonModule } from 'primeng/button';
import { ApiService } from '../../../services/api.service';
import { LookupService, LookupItem } from '../../../services/lookup.service';

import {
  BeneficiaryDto,
  BiometricDto,
  AlternatePayeeDto,
  NomineeDto,
} from '../../../models/beneficiary';

// ---------- ViewModel for UI ----------
interface BeneficiaryVm {
  applicationId: string;
  name: string;
  age: number;
  gender: string;
  phone: string;

  photo?: string;
  household: any;
  address: any;

  alternates: {
    name: string;
    age: number;
    gender: string;
    nationalId: string;
    phone: string;
    documentType: string;
    photo?: string;
    biometric?: BiometricDto;
  }[];

  nominees: {
    name: string;
    age: number;
    gender: string;
    relation: string;
    photo?: string;
  }[];
}

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

  beneficiaryDetails!: BeneficiaryVm | null;
  rightFingers: any[] = [];
  leftFingers: any[] = [];

  items = [
    { label: 'Beneficiary List', icon: 'fas fa-users me-2', routerLink: '/beneficiary/list' },
    { label: 'Beneficiary Details', icon: 'fas fa-user-cog me-2' },
  ];
  home = { icon: 'fas fa-home me-2', routerLink: '/' };

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private lookup: LookupService,
  ) { }

  ngOnInit() {
  const applicationId = this.route.snapshot.paramMap.get('applicationId');

  if (applicationId) {
    // 1. preload geo lookup data first
    Promise.all([
      this.lookup.getOrFetchStateList(),
      this.lookup.getCountyListByStateId(''),
      this.lookup.getPayamListByCountyId(''),
      this.lookup.getBomaListByPayamId('')
    ])
    .then(() => {
      // 2. only then fetch beneficiary details
      this.fetchBeneficiaryDetails(applicationId);
    });
  }
}

  fetchBeneficiaryDetails(householdId: string) {

    this.isLoading = true;
    this.api
      .GET(`api/beneficiary/details/${householdId}`)
      .then((res: any) => {
        const dto = res?.data as BeneficiaryDto;
        this.beneficiaryDetails = this.mapToVm(dto);
        this.prepareFingerImages(dto.biometric);
      })
      .catch((err) => console.error('Error loading beneficiary details:', err))
      .finally(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  private mapToVm(dto: BeneficiaryDto): BeneficiaryVm {
    return {
      applicationId: dto.applicationId,
      name: [dto.respondentFirstName, dto.respondentMiddleName, dto.respondentLastName]
        .filter(Boolean)
        .join(' '),
      age: dto.respondentAge,
      gender: dto.respondentGender,
      phone: dto.respondentPhoneNo,
      photo: dto.biometric?.photo,

      household: {
        incomeSource: dto.householdIncomeSource,
        monthlyIncome: dto.householdMonthlyAvgIncome,
        selectionCriteria: dto.selectionCriteria,
        selectionReasons: dto.selectionReason,
        size: dto.householdSize,
        isReadWrite: dto.isReadWrite,
        memberReadWrite: dto.memberReadWrite,
        group2: dto.householdMember2,
        group5: dto.householdMember5,
        group17: dto.householdMember17,
        group35: dto.householdMember35,
        group64: dto.householdMember64,
        group65: dto.householdMember65,
      },

      address: {
        state: dto.address?.stateId != null ? this.lookup.getStateNameById(String(dto.address.stateId)) : '',
        county: dto.address?.countyId != null ? this.lookup.getCountyNameById(String(dto.address.countyId)) : '',
        payam: dto.address?.payam != null ? this.lookup.getPayamNameById(String(dto.address.payam)) : '',
        boma: dto.address?.boma ? this.lookup.getBomaNameById(dto.address.boma) : '',
        lat: dto.address?.location?.lat,
        lon: dto.address?.location?.lon,
      },

      alternates: [dto.alternatePayee1, dto.alternatePayee2]
        .filter((alt): alt is AlternatePayeeDto => !!alt)
        .map((alt) => ({
          name: `${alt.payeeFirstName ?? ''} ${alt.payeeLastName ?? ''}`.trim(),
          age: alt.payeeAge ?? 0,
          gender: alt.payeeGender,
          nationalId: alt.nationalId ?? '',
          phone: alt.payeePhoneNo ?? '',
          documentType: alt.documentType,
          photo: alt.biometric?.photo,
          biometric: alt.biometric,
        })),

      nominees: (dto.nominees || []).map((n: NomineeDto) => ({
        name: [n.nomineeFirstName, n.nomineeMiddleName, n.nomineeLastName].filter(Boolean).join(' '),
        age: n.nomineeAge,
        gender: n.nomineeGender,
        relation: n.relationshipWithHouseholdHead,
        photo: n.biometric?.photo,
      })),
    };
  }

  private prepareFingerImages(bio?: BiometricDto) {
    if (!bio) {
      this.rightFingers = [];
      this.leftFingers = [];
      return;
    }
    this.rightFingers = [
      { label: 'Thumb', image: bio.wsqRt || '/images/tick.jpg', tooltip: 'Right Thumb' },
      { label: 'Index', image: bio.wsqRi || '/images/tick.jpg', tooltip: 'Right Index' },
      { label: 'Middle', image: bio.wsqRm || '/images/tick.jpg', tooltip: 'Right Middle' },
      { label: 'Ring', image: bio.wsqRr || '/images/tick.jpg', tooltip: 'Right Ring' },
      { label: 'Little', image: bio.wsqRs || '/images/tick.jpg', tooltip: 'Right Little' },
    ];

    this.leftFingers = [
      { label: 'Thumb', image: bio.wsqLt || '/images/tick.jpg', tooltip: 'Left Thumb' },
      { label: 'Index', image: bio.wsqLi || '/images/tick.jpg', tooltip: 'Left Index' },
      { label: 'Middle', image: bio.wsqLm || '/images/tick.jpg', tooltip: 'Left Middle' },
      { label: 'Ring', image: bio.wsqLr || '/images/tick.jpg', tooltip: 'Left Ring' },
      { label: 'Little', image: bio.wsqLs || '/images/tick.jpg', tooltip: 'Left Little' },
    ];
  }

  onApprove(comment: string) {
    this.isSubmitting = true;
    try {
      // TODO: integrate with approval API
    } finally {
      this.isSubmitting = false;
    }
  }

  onReject(comment: string) {
    this.isSubmitting = true;
    try {
      // TODO: integrate with reject API
    } finally {
      this.isSubmitting = false;
    }
  }
}
