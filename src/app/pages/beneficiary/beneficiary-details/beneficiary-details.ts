import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TabsModule } from 'primeng/tabs';
import { AccordionModule } from 'primeng/accordion';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { Loader } from '../../../components/loader/loader';
import { ButtonModule } from 'primeng/button';
import { ApiService } from '../../../services/api.service';
import { LookupService } from '../../../services/lookup.service';

import {
  BeneficiaryDto,
  BiometricDto,
  AlternatePayeeDto,
  NomineeDto,
  MobileMoneyProvider,
  RelationshipWithHead,
  Occupation,
} from '../../../models/beneficiary';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { environment } from '../../../../environments/environment';

export interface FingerVm {
  label: string;
  image: string;
  tooltip: string;
}

interface HouseholdMemberBreakdown {
  maleTotal: number;
  maleDisable: number;
  maleChronicalIll: number;
  maleBoth: number;
  femaleTotal: number;
  femaleDisable: number;
  femaleChronicalIll: number;
  femaleBoth: number;
}

interface HouseholdBreakdownRow {
  label: string;
  key: string;
  group: HouseholdMemberBreakdown;
}

// ---------- ViewModel for UI ----------
interface BeneficiaryVm {
  applicationId: string;
  name: string;
  spouseName: string;
  age: number;
  gender: string;
  relationshipWithHouseholdHead: string;
  relationshipOther?: string | null;
  respondentMaritalStatus: string;
  respondentLegalStatus: string;
  respondentId?: string | null;
  phone?: string | null;
  documentType: string;
  mobileMoneyProvider?: MobileMoneyProvider;
  mobileWalletNumber?: string | null;
  registrationPhase: string;
  paymentMethod: string | null | undefined;
  created: Date;

  photo?: string;
  household: any;
  address: any;

  householdSize: number;
  householdMember2: any;
  householdMember5: any;
  householdMember17: any;
  householdMember35: any;
  householdMember64: any;
  householdMember65: any;
  householdMemberLactating35: any;
  householdMemberLactating64: any;

  alternates: {
    name: string;
    age: number;
    gender: string;
    relationshipWithHouseholdHead: RelationshipWithHead;
    relationshipOther?: string;
    nationalId: string;
    phone: string;
    documentType: string;
    photo?: string;
    biometrics?: BiometricDto;
    rightFingers: FingerVm[];
    leftFingers: FingerVm[];
  }[];

  nominees: {
    name: string;
    age: number;
    gender: string;
    relation: string;
    nomineeOccupation: Occupation;
    otherOccupation?: string;
    relationshipOther?: string;
    photo?: string;
    isReadWrite?: boolean;
  }[];

  rightFingers: FingerVm[];
  leftFingers: FingerVm[];
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
    ToastModule,
    DialogModule,
    FormsModule,
    Loader,
    ButtonModule,
  ],
  providers: [MessageService, ConfirmationService],
})
export class BeneficiaryDetails implements OnInit {
  approvalComment: string = '';
  isSubmitting = false;
  isLoading = true;
  isOnTaskDetails: boolean = false;
  taskId: any = null;
  beneficiaryDetails!: BeneficiaryVm | null;
  rightFingers: any[] = [];
  leftFingers: any[] = [];
  activeStatus: number | null = null;
  isRestoreDialogVisible = false;
  restoreComment: string = '';
  isRunningModel = false;
  modelComparisonDialogVisible = false;
  currentSupportType = '';
  modelSupportType = '';

  ageGroups = [
    { label: '0-2 yrs', key: 'householdMember2' },
    { label: '3-5 yrs', key: 'householdMember5' },
    { label: '6-17 yrs', key: 'householdMember17' },
    { label: '18-35 yrs', key: 'householdMember35' },
    { label: '36-64 yrs', key: 'householdMember64' },
    { label: '65+ yrs', key: 'householdMember65' },
  ] as const;

  householdBreakdown: Record<string, HouseholdMemberBreakdown> = {
    householdMember2: this.emptyBreakdownGroup(),
    householdMember5: this.emptyBreakdownGroup(),
    householdMember17: this.emptyBreakdownGroup(),
    householdMember35: this.emptyBreakdownGroup(),
    householdMember64: this.emptyBreakdownGroup(),
    householdMember65: this.emptyBreakdownGroup(),
    householdMemberLactating35: this.emptyBreakdownGroup(),
    householdMemberLactating64: this.emptyBreakdownGroup(),
  };
  breakdownRows: HouseholdBreakdownRow[] = [];
  lactating35Breakdown: HouseholdMemberBreakdown =
    this.householdBreakdown['householdMemberLactating35'];
  lactating64Breakdown: HouseholdMemberBreakdown =
    this.householdBreakdown['householdMemberLactating64'];

  items = [
    {
      label: 'Beneficiary Update',
      icon: 'fas fa-user-gear',
      routerLink: '/beneficiary/list',
    },
    { label: 'Beneficiary Details', icon: 'fas fa-user' },
  ];
  home = { icon: 'fas fa-home me-2', routerLink: '/' };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    public lookup: LookupService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    this.syncBreakdownRows();
    const id = this.route.snapshot.paramMap.get('id');
    const isTaskMode =
      this.route.snapshot.queryParamMap.get('taskMode') === 'true';
    this.isOnTaskDetails = isTaskMode;
    if (this.isOnTaskDetails) {
      this.taskId = id;
    }
    if (id) {
      // preload geo lookup data first
      Promise.all([
        this.lookup.getOrFetchStateList(),
        this.lookup.getCountyListByStateId(''),
        this.lookup.getPayamListByCountyId(''),
        this.lookup.getBomaListByPayamId(''),
      ]).then(() => {
        if (isTaskMode) {
          this.fetchTaskDetails(id); // 👈 call task details API
        } else {
          this.fetchBeneficiaryDetails(id); // 👈 call beneficiary details API
        }
      });
    }
  }

  fetchBeneficiaryDetails(householdId: string) {
    this.isLoading = true;
    this.api
      .GET(`api/beneficiary/details/${householdId}`)
      .then((res: any) => {
        this.activeStatus = res?.data?.activeStatus ?? null;
        console.log('Active status details:', this.activeStatus);
        const dto = res?.data as BeneficiaryDto;
        this.beneficiaryDetails = this.mapToVm(dto);
        this.prepareFingerImages(dto.biometrics);
        this.populateHouseholdBreakdown(dto);
      })
      .catch((err) => console.error('Error loading beneficiary details:', err))
      .finally(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  fetchTaskDetails(taskId: string) {
    this.isLoading = true;
    this.api
      .GET(`api/approval/details/${taskId}`)
      .then((res: any) => {
        this.activeStatus = res?.data?.activeStatus ?? null;
        console.log('Active status task:', this.activeStatus);
        const dto = res?.data?.taskDetails as BeneficiaryDto; // 👈 use taskDetails
        this.beneficiaryDetails = this.mapToVm(dto);
        this.prepareFingerImages(dto.biometrics);
        this.populateHouseholdBreakdown(dto);
      })
      .catch((err) => console.error('Error loading task details:', err))
      .finally(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  private populateHouseholdBreakdown(dto: BeneficiaryDto) {
    this.householdBreakdown = {
      householdMember2: this.toBreakdownGroup(dto.householdMember2),
      householdMember5: this.toBreakdownGroup(dto.householdMember5),
      householdMember17: this.toBreakdownGroup(dto.householdMember17),
      householdMember35: this.toBreakdownGroup(dto.householdMember35),
      householdMember64: this.toBreakdownGroup(dto.householdMember64),
      householdMember65: this.toBreakdownGroup(dto.householdMember65),
      householdMemberLactating35: this.toBreakdownGroup(
        dto.householdMemberLactating35,
        true,
      ),
      householdMemberLactating64: this.toBreakdownGroup(
        dto.householdMemberLactating64,
        true,
      ),
    };
    this.syncBreakdownRows();
  }

  private emptyBreakdownGroup(): HouseholdMemberBreakdown {
    return {
      maleTotal: 0,
      maleDisable: 0,
      maleChronicalIll: 0,
      maleBoth: 0,
      femaleTotal: 0,
      femaleDisable: 0,
      femaleChronicalIll: 0,
      femaleBoth: 0,
    };
  }

  private toNumber(value: unknown): number {
    const n = Number(value ?? 0);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  private toBreakdownGroup(
    value: any,
    femaleOnly = false,
  ): HouseholdMemberBreakdown {
    if (value && typeof value === 'object') {
      return {
        maleTotal: femaleOnly ? 0 : this.toNumber(value.maleTotal),
        maleDisable: femaleOnly ? 0 : this.toNumber(value.maleDisable),
        maleChronicalIll: femaleOnly
          ? 0
          : this.toNumber(value.maleChronicalIll),
        maleBoth: femaleOnly ? 0 : this.toNumber(value.maleBoth),
        femaleTotal: this.toNumber(value.femaleTotal),
        femaleDisable: this.toNumber(value.femaleDisable),
        femaleChronicalIll: this.toNumber(value.femaleChronicalIll),
        femaleBoth: this.toNumber(value.femaleBoth),
      };
    }

    return {
      ...this.emptyBreakdownGroup(),
      femaleTotal: femaleOnly ? this.toNumber(value) : 0,
    };
  }

  private syncBreakdownRows() {
    this.breakdownRows = this.ageGroups.map((ageGroup) => ({
      ...ageGroup,
      group: this.householdBreakdown[ageGroup.key],
    }));
    this.lactating35Breakdown =
      this.householdBreakdown['householdMemberLactating35'];
    this.lactating64Breakdown =
      this.householdBreakdown['householdMemberLactating64'];
  }

  private mapToVm(dto: BeneficiaryDto): BeneficiaryVm {
    // Helper functions to normalize images
    const normalizePhoto = (img?: string): string =>
      img ? `data:image/jpeg;base64,${img}` : 'images/dummyHuman.jpg';

    const normalizeFinger = (img?: string): string =>
      img ? `data:image/jpeg;base64,${img}` : 'images/finger.png';

    // Handle the biometric data processing for the beneficiary
    this.prepareFingerImages(dto.biometrics);

    return {
      applicationId: dto.applicationId,
      name: [
        dto.respondentFirstName,
        dto.respondentMiddleName,
        dto.respondentLastName,
        dto.respondentNickName,
      ]
        .filter(Boolean)
        .join(' '),

      spouseName: [
        dto.spouseFirstName,
        dto.spouseMiddleName,
        dto.spouseLastName,
        dto.spouseNickName,
      ]
        .filter(Boolean)
        .join(' '),
      age: dto.respondentAge,
      gender: dto.respondentGender,
      relationshipWithHouseholdHead: dto.relationshipWithHouseholdHead,
      relationshipOther: dto.relationshipOther,
      respondentMaritalStatus: dto.respondentMaritalStatus,
      respondentLegalStatus: dto.respondentLegalStatus,
      respondentId: dto.respondentId,
      documentType: dto.documentType,
      mobileMoneyProvider: dto.mobileMoneyProvider,
      mobileWalletNumber: dto.mobileWalletNumber,
      registrationPhase: dto.registrationPhase,
      paymentMethod: dto.paymentMethod,
      created: new Date(dto.created),

      phone: dto.respondentPhoneNo,
      photo: normalizePhoto(dto.biometrics?.photoData),

      household: {
        incomeSource: dto.householdIncomeSource,
        incomeSourceOther: dto.incomeSourceOther,
        monthlyIncome: dto.householdMonthlyAvgIncome,
        selectionCriteria: dto.selectionCriteria,
        selectionReasons: (dto.selectionReason || []).map((r: string) =>
          this.lookup.getSelectionReasonEnumByValue(r),
        ),
        size: dto.householdSize,
        isReadWrite: dto.isReadWrite,
        memberReadWrite: dto.memberReadWrite,
      },
      householdSize: dto.householdSize ?? 0,
      householdMember2: dto.householdMember2,
      householdMember5: dto.householdMember5,
      householdMember17: dto.householdMember17,
      householdMember35: dto.householdMember35,
      householdMember64: dto.householdMember64,
      householdMember65: dto.householdMember65,
      householdMemberLactating35: dto.householdMemberLactating35,
      householdMemberLactating64: dto.householdMemberLactating64,

      address: {
        state:
          dto.address?.stateId != null
            ? this.lookup.getStateNameById(String(dto.address.stateId))
            : '',
        county:
          dto.address?.countyId != null
            ? this.lookup.getCountyNameById(String(dto.address.countyId))
            : '',
        payam:
          dto.address?.payam != null
            ? this.lookup.getPayamNameById(String(dto.address.payam))
            : '',
        boma: dto.address?.boma
          ? this.lookup.getBomaNameById(dto.address.boma)
          : '',
        lat: dto.address?.lat,
        lon: dto.address?.lon,
      },

      // Process alternates biometrics
      alternates: [dto.alternatePayee1, dto.alternatePayee2]
        .filter((alt): alt is AlternatePayeeDto => !!alt)
        .map((alt) => {
          const biometrics = alt.biometrics;

          // Call prepareFingerImages for each alternate's biometrics
          this.prepareFingerImages(undefined, biometrics); // Use `null` for beneficiary's biometrics

          return {
            name: `${alt.payeeFirstName ?? ''} ${alt.payeeMiddleName ?? ''} ${alt.payeeLastName ?? ''} ${alt.payeeNickName ?? ''}`.trim(),
            age: alt.payeeAge ?? 0,
            gender: alt.payeeGender,
            relationshipWithHouseholdHead: alt.relationshipWithHouseholdHead,
            relationshipOther: alt.relationshipOther,
            nationalId: alt.nationalId ?? '',
            phone: alt.payeePhoneNo ?? '',
            documentType: alt.documentType,
            photo: normalizePhoto(alt.biometrics?.photoData),
            biometrics: alt.biometrics,

            // Alternate-specific finger sets
            rightFingers: this.rightFingers.slice(-5), // Use the last 5 right fingers
            leftFingers: this.leftFingers.slice(-5), // Use the last 5 left fingers
          };
        }),

      // Nominees
      nominees: (dto.nominees || []).map((n: NomineeDto) => ({
        name: [
          n.nomineeFirstName,
          n.nomineeMiddleName,
          n.nomineeLastName,
          n.nomineeNickName,
        ]
          .filter(Boolean)
          .join(' '),
        age: n.nomineeAge,
        gender: n.nomineeGender,
        relation: n.relationshipWithHouseholdHead,
        relationshipOther: n.relationshipOther,
        nomineeOccupation: n.nomineeOccupation,
        otherOccupation: n.otherOccupation,
        photo: normalizeFinger(n.biometric?.photoData),
        isReadWrite: n.isReadWrite,
      })),

      // Beneficiary finger images
      rightFingers: this.rightFingers.slice(0, 5), // Get the first 5 right fingers
      leftFingers: this.leftFingers.slice(0, 5), // Get the first 5 left fingers
    };
  }

  private prepareFingerImages(
    bio?: BiometricDto,
    alternatesBiometrics?: BiometricDto,
  ) {
    const checkForWsq = (wsqField: string | undefined): boolean =>
      wsqField != null && wsqField !== '';

    // Prepare for beneficiary's biometric data
    if (bio) {
      // Right Fingers
      this.rightFingers = [
        {
          label: 'Thumb',
          image: checkForWsq(bio.wsqRt)
            ? 'images/finger.png'
            : 'images/no-finger.png',
          tooltip: 'Right Thumb',
        },
        {
          label: 'Index',
          image: checkForWsq(bio.wsqRi)
            ? 'images/finger.png'
            : 'images/no-finger.png',
          tooltip: 'Right Index',
        },
        {
          label: 'Middle',
          image: checkForWsq(bio.wsqRm)
            ? 'images/finger.png'
            : 'images/no-finger.png',
          tooltip: 'Right Middle',
        },
        {
          label: 'Ring',
          image: checkForWsq(bio.wsqRr)
            ? 'images/finger.png'
            : 'images/no-finger.png',
          tooltip: 'Right Ring',
        },
        {
          label: 'Little',
          image: checkForWsq(bio.wsqRs)
            ? 'images/finger.png'
            : 'images/no-finger.png',
          tooltip: 'Right Little',
        },
      ];

      // Left Fingers
      this.leftFingers = [
        {
          label: 'Thumb',
          image: checkForWsq(bio.wsqLt)
            ? 'images/finger.png'
            : 'images/no-finger.png',
          tooltip: 'Left Thumb',
        },
        {
          label: 'Index',
          image: checkForWsq(bio.wsqLi)
            ? 'images/finger.png'
            : 'images/no-finger.png',
          tooltip: 'Left Index',
        },
        {
          label: 'Middle',
          image: checkForWsq(bio.wsqLm)
            ? 'images/finger.png'
            : 'images/no-finger.png',
          tooltip: 'Left Middle',
        },
        {
          label: 'Ring',
          image: checkForWsq(bio.wsqLr)
            ? 'images/finger.png'
            : 'images/no-finger.png',
          tooltip: 'Left Ring',
        },
        {
          label: 'Little',
          image: checkForWsq(bio.wsqLs)
            ? 'images/finger.png'
            : 'images/no-finger.png',
          tooltip: 'Left Little',
        },
      ];
    } else {
      // If no biometric data for the beneficiary, clear the finger images
      this.rightFingers = [];
      this.leftFingers = [];
    }

    // Prepare for alternates' biometric data
    if (alternatesBiometrics) {
      // Right Fingers for alternates
      this.rightFingers = this.rightFingers.concat([
        {
          label: 'Thumb',
          image: checkForWsq(alternatesBiometrics.wsqRt)
            ? 'images/finger.png'
            : 'images/no-finger.png',
          tooltip: 'Right Thumb',
        },
        {
          label: 'Index',
          image: checkForWsq(alternatesBiometrics.wsqRi)
            ? 'images/finger.png'
            : 'images/no-finger.png',
          tooltip: 'Right Index',
        },
        {
          label: 'Middle',
          image: checkForWsq(alternatesBiometrics.wsqRm)
            ? 'images/finger.png'
            : 'images/no-finger.png',
          tooltip: 'Right Middle',
        },
        {
          label: 'Ring',
          image: checkForWsq(alternatesBiometrics.wsqRr)
            ? 'images/finger.png'
            : 'images/no-finger.png',
          tooltip: 'Right Ring',
        },
        {
          label: 'Little',
          image: checkForWsq(alternatesBiometrics.wsqRs)
            ? 'images/finger.png'
            : 'images/no-finger.png',
          tooltip: 'Right Little',
        },
      ]);

      // Left Fingers for alternates
      this.leftFingers = this.leftFingers.concat([
        {
          label: 'Thumb',
          image: checkForWsq(alternatesBiometrics.wsqLt)
            ? 'images/finger.png'
            : 'images/no-finger.png',
          tooltip: 'Left Thumb',
        },
        {
          label: 'Index',
          image: checkForWsq(alternatesBiometrics.wsqLi)
            ? 'images/finger.png'
            : 'images/no-finger.png',
          tooltip: 'Left Index',
        },
        {
          label: 'Middle',
          image: checkForWsq(alternatesBiometrics.wsqLm)
            ? 'images/finger.png'
            : 'images/no-finger.png',
          tooltip: 'Left Middle',
        },
        {
          label: 'Ring',
          image: checkForWsq(alternatesBiometrics.wsqLr)
            ? 'images/finger.png'
            : 'images/no-finger.png',
          tooltip: 'Left Ring',
        },
        {
          label: 'Little',
          image: checkForWsq(alternatesBiometrics.wsqLs)
            ? 'images/finger.png'
            : 'images/no-finger.png',
          tooltip: 'Left Little',
        },
      ]);
    }
  }

  restoreBeneficiary() {
    if (!this.beneficiaryDetails?.applicationId) return;
    this.restoreComment = ''; // Reset comment before showing dialog
    this.isRestoreDialogVisible = true;
  }

  cancelRestore() {
    this.isRestoreDialogVisible = false;
  }

  confirmRestore() {
    // ✅ Validate comment
    if (!this.restoreComment.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Comment Required',
        detail: 'Please write a reason for restoring this beneficiary.',
      });
      return;
    }

    const payload = {
      householdId: this.beneficiaryDetails!.applicationId,
      comment: this.restoreComment.trim(),
    };

    this.isLoading = true;
    this.isRestoreDialogVisible = false; // Hide dialog

    this.api
      .POST('/api/beneficiary/archive', payload)
      .then((res: any) => {
        if (res?.data?.operationResult) {
          this.messageService.add({
            severity: 'success',
            summary: 'Restored',
            detail: 'Beneficiary restored successfully.',
          });

          // Redirect after a short delay to allow user to see the message
          setTimeout(() => {
            this.router.navigate(['/restore/list']);
          }, 1500);
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Restore Failed',
            detail: res?.data?.errorMsg || 'Unable to restore beneficiary.',
          });
        }
      })
      .catch((err) => {
        console.error('Restore API error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to restore beneficiary.',
        });
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  private normalCount(
    group: HouseholdMemberBreakdown,
    gender: 'male' | 'female',
  ): number {
    const total = gender === 'male' ? group.maleTotal : group.femaleTotal;
    const disabled =
      gender === 'male' ? group.maleDisable : group.femaleDisable;
    const chronic =
      gender === 'male' ? group.maleChronicalIll : group.femaleChronicalIll;
    const both = gender === 'male' ? group.maleBoth : group.femaleBoth;
    return Math.max(
      this.toNumber(total) -
        this.toNumber(disabled) -
        this.toNumber(chronic) -
        this.toNumber(both),
      0,
    );
  }

  private addFemaleGroup(
    base: HouseholdMemberBreakdown,
    extra: HouseholdMemberBreakdown,
  ): HouseholdMemberBreakdown {
    return {
      ...base,
      femaleTotal:
        this.toNumber(base.femaleTotal) + this.toNumber(extra.femaleTotal),
      femaleDisable:
        this.toNumber(base.femaleDisable) + this.toNumber(extra.femaleDisable),
      femaleChronicalIll:
        this.toNumber(base.femaleChronicalIll) +
        this.toNumber(extra.femaleChronicalIll),
      femaleBoth:
        this.toNumber(base.femaleBoth) + this.toNumber(extra.femaleBoth),
    };
  }

  private setModelHouseholdFields(
    payload: Record<string, number>,
    suffix: string,
    group: HouseholdMemberBreakdown,
  ) {
    payload[`female_${suffix}_both`] = this.toNumber(group.femaleBoth);
    payload[`female_${suffix}_chronically_ill`] = this.toNumber(
      group.femaleChronicalIll,
    );
    payload[`female_${suffix}_disabled`] = this.toNumber(group.femaleDisable);
    payload[`female_${suffix}_normal`] = this.normalCount(group, 'female');
    payload[`male_${suffix}_both`] = this.toNumber(group.maleBoth);
    payload[`male_${suffix}_chronically_ill`] = this.toNumber(
      group.maleChronicalIll,
    );
    payload[`male_${suffix}_disabled`] = this.toNumber(group.maleDisable);
    payload[`male_${suffix}_normal`] = this.normalCount(group, 'male');
  }

  private buildModelRequestBody() {
    const household: Record<string, number> = {};
    const groups = [
      { suffix: '0_2', group: this.householdBreakdown['householdMember2'] },
      { suffix: '3_5', group: this.householdBreakdown['householdMember5'] },
      { suffix: '6_17', group: this.householdBreakdown['householdMember17'] },
      {
        suffix: '18_35',
        group: this.addFemaleGroup(
          this.householdBreakdown['householdMember35'],
          this.householdBreakdown['householdMemberLactating35'],
        ),
      },
      {
        suffix: '36_64',
        group: this.addFemaleGroup(
          this.householdBreakdown['householdMember64'],
          this.householdBreakdown['householdMemberLactating64'],
        ),
      },
      {
        suffix: '65_plus',
        group: this.householdBreakdown['householdMember65'],
      },
    ];

    groups.forEach((item) =>
      this.setModelHouseholdFields(household, item.suffix, item.group),
    );

    return { household };
  }

  async runAutomatedTargetingModel() {
    this.isRunningModel = true;
    this.currentSupportType =
      this.beneficiaryDetails?.household?.selectionCriteria || 'N/A';
    this.modelSupportType = '';

    try {
      const url = `${environment.modelApi.replace(/\/$/, '')}/get_support_type`;
      const res: any = await this.api.POST(url, this.buildModelRequestBody());
      this.modelSupportType = res?.data?.support_type || 'N/A';
      this.modelComparisonDialogVisible = true;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Automated targeting model failed:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Model Failed',
        detail: 'Unable to run automated targeting model.',
      });
    } finally {
      this.isRunningModel = false;
      this.cdr.detectChanges();
    }
  }
}
