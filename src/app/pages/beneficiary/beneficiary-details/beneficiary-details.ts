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

export interface FingerVm {
  label: string;
  image: string;
  tooltip: string;
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



  items = [
    {
      label: 'Beneficiary Update',
      icon: 'fas fa-users me-2',
      routerLink: '/beneficiary/list',
    },
    { label: 'Beneficiary Details', icon: 'fas fa-user-cog me-2' },
  ];
  home = { icon: 'fas fa-home me-2', routerLink: '/' };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    public lookup: LookupService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }


  ngOnInit() {
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
      })
      .catch((err) => console.error('Error loading task details:', err))
      .finally(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
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

    phone: dto.respondentPhoneNo,
    photo: normalizePhoto(dto.biometrics?.photoData),

    household: {
      incomeSource: dto.householdIncomeSource,
      incomeSourceOther: dto.incomeSourceOther,
      monthlyIncome: dto.householdMonthlyAvgIncome,
      selectionCriteria: dto.selectionCriteria,
      selectionReasons: (dto.selectionReason || []).map((r: string) =>
        this.lookup.getSelectionReasonEnumByValue(r)
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
          leftFingers: this.leftFingers.slice(-5),   // Use the last 5 left fingers
        };
      }),

    // Nominees
    nominees: (dto.nominees || []).map((n: NomineeDto) => ({
      name: [n.nomineeFirstName, n.nomineeMiddleName, n.nomineeLastName, n.nomineeNickName]
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


  private prepareFingerImages(bio?: BiometricDto, alternatesBiometrics?: BiometricDto) {
    const checkForWsq = (wsqField: string | undefined): boolean => wsqField != null && wsqField !== '';

    // Prepare for beneficiary's biometric data
    if (bio) {
      // Right Fingers
      this.rightFingers = [
        {
          label: 'Thumb',
          image: checkForWsq(bio.wsqRt) ? 'images/finger.png' : 'images/no-finger.png',
          tooltip: 'Right Thumb',
        },
        {
          label: 'Index',
          image: checkForWsq(bio.wsqRi) ? 'images/finger.png' : 'images/no-finger.png',
          tooltip: 'Right Index',
        },
        {
          label: 'Middle',
          image: checkForWsq(bio.wsqRm) ? 'images/finger.png' : 'images/no-finger.png',
          tooltip: 'Right Middle',
        },
        {
          label: 'Ring',
          image: checkForWsq(bio.wsqRr) ? 'images/finger.png' : 'images/no-finger.png',
          tooltip: 'Right Ring',
        },
        {
          label: 'Little',
          image: checkForWsq(bio.wsqRs) ? 'images/finger.png' : 'images/no-finger.png',
          tooltip: 'Right Little',
        },
      ];

      // Left Fingers
      this.leftFingers = [
        {
          label: 'Thumb',
          image: checkForWsq(bio.wsqLt) ? 'images/finger.png' : 'images/no-finger.png',
          tooltip: 'Left Thumb',
        },
        {
          label: 'Index',
          image: checkForWsq(bio.wsqLi) ? 'images/finger.png' : 'images/no-finger.png',
          tooltip: 'Left Index',
        },
        {
          label: 'Middle',
          image: checkForWsq(bio.wsqLm) ? 'images/finger.png' : 'images/no-finger.png',
          tooltip: 'Left Middle',
        },
        {
          label: 'Ring',
          image: checkForWsq(bio.wsqLr) ? 'images/finger.png' : 'images/no-finger.png',
          tooltip: 'Left Ring',
        },
        {
          label: 'Little',
          image: checkForWsq(bio.wsqLs) ? 'images/finger.png' : 'images/no-finger.png',
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
          image: checkForWsq(alternatesBiometrics.wsqRt) ? 'images/finger.png' : 'images/no-finger.png',
          tooltip: 'Right Thumb',
        },
        {
          label: 'Index',
          image: checkForWsq(alternatesBiometrics.wsqRi) ? 'images/finger.png' : 'images/no-finger.png',
          tooltip: 'Right Index',
        },
        {
          label: 'Middle',
          image: checkForWsq(alternatesBiometrics.wsqRm) ? 'images/finger.png' : 'images/no-finger.png',
          tooltip: 'Right Middle',
        },
        {
          label: 'Ring',
          image: checkForWsq(alternatesBiometrics.wsqRr) ? 'images/finger.png' : 'images/no-finger.png',
          tooltip: 'Right Ring',
        },
        {
          label: 'Little',
          image: checkForWsq(alternatesBiometrics.wsqRs) ? 'images/finger.png' : 'images/no-finger.png',
          tooltip: 'Right Little',
        },
      ]);

      // Left Fingers for alternates
      this.leftFingers = this.leftFingers.concat([
        {
          label: 'Thumb',
          image: checkForWsq(alternatesBiometrics.wsqLt) ? 'images/finger.png' : 'images/no-finger.png',
          tooltip: 'Left Thumb',
        },
        {
          label: 'Index',
          image: checkForWsq(alternatesBiometrics.wsqLi) ? 'images/finger.png' : 'images/no-finger.png',
          tooltip: 'Left Index',
        },
        {
          label: 'Middle',
          image: checkForWsq(alternatesBiometrics.wsqLm) ? 'images/finger.png' : 'images/no-finger.png',
          tooltip: 'Left Middle',
        },
        {
          label: 'Ring',
          image: checkForWsq(alternatesBiometrics.wsqLr) ? 'images/finger.png' : 'images/no-finger.png',
          tooltip: 'Left Ring',
        },
        {
          label: 'Little',
          image: checkForWsq(alternatesBiometrics.wsqLs) ? 'images/finger.png' : 'images/no-finger.png',
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

}
