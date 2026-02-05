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
import { LookupService, LookupItem } from '../../../services/lookup.service';
import { FormsModule } from '@angular/forms';

import {
  BeneficiaryDto,
  BiometricDto,
  AlternatePayeeDto,
  NomineeDto,
  MobileMoneyProvider,
  RelationshipWithHead,
  Occupation,
} from '../../../models/beneficiary';
import Swal from 'sweetalert2';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { Card } from 'primeng/card';

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
    relationshipOther?: string;
    photo?: string;
    isReadWrite?: boolean;
  }[];

  rightFingers: FingerVm[];
  leftFingers: FingerVm[];

  comment: string;
}

@Component({
  standalone: true,
  selector: 'app-beneficiary-archive-approval-details',
  templateUrl: './beneficiary-archive-approval-details.html',
  styleUrl: './beneficiary-archive-approval-details.scss',
  imports: [
    CommonModule,
    TabsModule,
    AccordionModule,
    BreadcrumbModule,
    TooltipModule,
    TableModule,
    ScrollPanelModule,
    ToastModule,
    ConfirmDialogModule,
    Loader,
    ButtonModule,
    FormsModule,
    Card,
  ],
  providers: [MessageService, ConfirmationService],
})
export class BeneficiaryArchiveApprovalDetails implements OnInit {
  approvalComment: string = '';
  isSubmitting = false;
  isLoading = true;
  isOnTaskDetails: boolean = false;
  taskId: any = null;
  beneficiaryDetails!: BeneficiaryVm | null;
  rightFingers: any[] = [];
  leftFingers: any[] = [];
  isApprove: boolean = true;
  approvalStatus: string = '';
  user: any;
  isUserLoading: boolean = false;

  items = [
    {
      label: 'Update Approval',
      icon: 'fas fa-user-check',
      routerLink: '/beneficiary-approval/list',
    },
    { label: 'Beneficiary Archiving Details', icon: 'fas fa-user' },
  ];
  home = { icon: 'fas fa-home', routerLink: '/' };

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    public lookup: LookupService,
    private messageService: MessageService,
    private router: Router,
    private confirmationService: ConfirmationService
  ) {}

  openApprovalDialog(isApprove: boolean) {
    if (!this.taskId) {
      console.error('Task id missing');
      return;
    }

    this.isApprove = isApprove;
    this.approvalComment = '';

    this.confirmationService.confirm({
      key: 'approvalDialog',
      header: isApprove ? 'Confirm Approval' : 'Confirm Rejection',
      icon: isApprove ? 'fas fa-check-circle' : 'fas fa-ban',
      acceptButtonProps: {
        label: 'Yes',
        severity: 'success',
        disabled: this.isLoading,
      },
      rejectButtonProps: {
        label: 'No',
        severity: 'danger',
        disabled: this.isLoading,
      },
      accept: () => this.handleApproval(),
    });
  }

  private handleApproval() {
    if (
      !this.isApprove &&
      (!this.approvalComment || !this.approvalComment.trim())
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Comment Required',
        detail: 'Please provide a reason for rejection before proceeding.',
      });
      return;
    }

    this.isLoading = true;

    const payload = {
      approvalTaskId: this.taskId,
      approved: this.isApprove,
      comment: this.approvalComment,
    };

    this.api
      .POST('/api/approval/doApprove', payload)
      .then((res: any) => {
        this.isLoading = false;
        this.cdr.detectChanges();

        const operationResult = res?.data?.operationResult;
        const isSuccess = operationResult === 'SUCCESS';

        const responseMessage =
          res?.data?.message ||
          `Archiving request for ${this.beneficiaryDetails?.name} ${
            isSuccess ? 'approved' : 'rejected'
          } successfully.`;

        Swal.fire({
          icon: isSuccess ? 'success' : 'warning',
          title: isSuccess ? 'Approved' : 'Rejected',
          text: responseMessage,
          confirmButtonText: 'OK',
        }).then(() => {
          this.router.navigate(['/beneficiary-approval/list']);
        });
      })
      .catch((err: any) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();

        const errorMessage =
          err?.response?.data?.message ||
          `Failed to ${this.isApprove ? 'approve' : 'reject'} task`;

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
          confirmButtonText: 'OK',
        });
      });
  }

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

  async loadUserDetails(userId: number): Promise<void> {
    if (!userId) {
      return;
    }
    try {
      this.isUserLoading = true;
      this.cdr.detectChanges();

      const url = `api/users/findOne?id=${userId}`;
      const axiosResponse = await this.api.GET<any>(url, {}, 'alt');
      const res = axiosResponse.data;

      if (res) {
        this.user = res;
      }
    } catch (err: any) {
      console.error('Failed to load user details', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to load user details from server.',
      });
    } finally {
      this.isUserLoading = false;
      this.cdr.detectChanges();
    }
  }

  fetchTaskDetails(taskId: string) {
    this.isLoading = true;
    this.api
      .GET(`api/approval/details/${taskId}`)
      .then(async (res: any) => {
        this.approvalStatus = res?.data?.approvalStatus || '';
        const dto = res?.data?.taskDetails as BeneficiaryDto; // 👈 use taskDetails
        this.beneficiaryDetails = this.mapToVm(dto);
        this.beneficiaryDetails.comment =
          res?.data?.comment || dto?.comment || '';
        this.prepareFingerImages(dto.biometrics);
        if (res.data.updatedBy) {
          await this.loadUserDetails(res.data.updatedBy);
        }
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
            name: `${alt.payeeFirstName ?? ''} ${alt.payeeMiddleName ?? ''} ${
              alt.payeeLastName ?? ''
            } ${alt.payeeNickName ?? ''}`.trim(),
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
        photo: normalizeFinger(n.biometric?.photoData),
        isReadWrite: n.isReadWrite,
      })),

      // Beneficiary finger images
      rightFingers: this.rightFingers.slice(0, 5), // Get the first 5 right fingers
      leftFingers: this.leftFingers.slice(0, 5), // Get the first 5 left fingers
      comment: dto.comment,
    };
  }

  private prepareFingerImages(
    bio?: BiometricDto,
    alternatesBiometrics?: BiometricDto
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
}
