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
import { Router } from '@angular/router';

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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
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
  respondentMaritalStatus: string;
  respondentLegalStatus: string;
  respondentId: string;
  phone: string;
  documentType: string;
  mobileMoneyProvider?: MobileMoneyProvider;
  mobileWalletNumber?: string;
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
    biometric?: BiometricDto;
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
}


@Component({
  selector: 'app-beneficiary-edit-approval-details',
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
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './beneficiary-edit-approval-details.html',
  styleUrl: './beneficiary-edit-approval-details.scss'
})
export class BeneficiaryEditApprovalDetails {
  approvalComment: string = '';
  isSubmitting = false;
  isLoading = true;
  isOnTaskDetails: boolean = false;
  oldDetails!: BeneficiaryVm | null;    // ← Old (from /beneficiary/details/{householdId})
  editedDetails!: BeneficiaryVm | null; // ← Edited (from /approval/details/{taskId})

  oldRightFingers: FingerVm[] = [];
  oldLeftFingers: FingerVm[] = [];
  editedRightFingers: FingerVm[] = [];
  editedLeftFingers: FingerVm[] = [];

  taskId: string | null = null;
  householdId: string | null = null; // helpful when in task mode

  items = [
    {
      label: 'Beneficiary List',
      icon: 'fas fa-users me-2',
      routerLink: '/beneficiary/list',
    },
    { label: 'Beneficiary Details', icon: 'fas fa-user-cog me-2' },
  ];
  home = { icon: 'fas fa-home me-2', routerLink: '/' };

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    public lookup: LookupService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) { }

  approveTask() {
    if (!this.taskId) {
      console.error('Approve clicked, but task id is missing:', this.taskId);
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to approve task #${this.taskId}?`,
      header: 'Confirm Approval',
      icon: 'fas fa-check-circle',
      rejectButtonProps: {
        severity: 'danger',
      },
      accept: () => {
        const payload = {
          approvalTaskId: this.taskId,
          approved: true,
        };

        this.api
          .POST('/api/approval/doApprove', payload)
          .then(() => {
            const life = 1200;
            this.messageService.add({
              severity: 'success',
              summary: 'Approved',
              detail: `Task #${this.taskId} approved successfully.`,
              life,
            });
            setTimeout(() => {
              this.router.navigate(['/beneficiary-approval-list/edit']);
            }, life);
          })
          .catch((err: any) => {
            console.error(err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to approve task',
            });
          });
      },
    });
  }

  rejectTask() {
    if (!this.taskId) {
      console.error('Reject clicked, but task id is missing:', this.taskId);
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to reject task #${this.taskId}?`,
      header: 'Confirm Rejection',
      icon: 'fas fa-ban',
      rejectButtonProps: {
        severity: 'danger',
      },
      accept: () => {
        const payload = {
          approvalTaskId: this.taskId,
          approved: false,
        };

        this.api
          .POST('/api/approval/doApprove', payload)
          .then(() => {
            const life = 1200;
            this.messageService.add({
              severity: 'warn',
              summary: 'Rejected',
              detail: `Task #${this.taskId} rejected successfully.`,
              life,
            });
            setTimeout(() => {
              this.router.navigate(['/beneficiary-approval-list/edit']); // note the leading slash
            }, life);
          })
          .catch((err: any) => {
            console.error(err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to reject task',
            });
          });
      },
    });
  }

  /*ngOnInit() {
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
  }*/

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const isTaskMode = this.route.snapshot.queryParamMap.get('taskMode') === 'true';
    this.isOnTaskDetails = isTaskMode;

    if (isTaskMode) this.taskId = id!;
    else this.householdId = id!;

    if (!id) return;

    this.isLoading = true;
    Promise.all([
      this.lookup.getOrFetchStateList(),
      this.lookup.getCountyListByStateId(''),
      this.lookup.getPayamListByCountyId(''),
      this.lookup.getBomaListByPayamId(''),
    ])
      .then(async () => {
        if (isTaskMode && this.taskId) {
          const editedDto = await this.loadTaskDetailsDto(this.taskId);
          this.editedDetails = this.mapToVm(editedDto);
          this.prepareFingerImages(editedDto.biometric, 'edited');

          // Derive the id to load OLD
          this.householdId =
            (editedDto as any).householdId ??
            (editedDto as any).beneficiaryId ??
            editedDto.applicationId; // only if your old API accepts applicationId

          if (this.householdId) {
            const oldDto = await this.loadBeneficiaryDetailsDto(this.householdId);
            this.oldDetails = this.mapToVm(oldDto);
            this.prepareFingerImages(oldDto.biometric, 'old');
          } else {
            console.warn('Could not determine householdId from task details payload.');
          }
        } else if (this.householdId) {
          await this.fetchBeneficiaryDetails(this.householdId);
        }
      })
      .catch(err => console.error(err))
      .finally(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }



  fetchBeneficiaryDetails(householdId: string) {
    this.isLoading = true;
    this.api.GET(`api/beneficiary/details/${householdId}`)
      .then((res: any) => {
        const dto = res?.data as BeneficiaryDto;
        this.oldDetails = this.mapToVm(dto);
        this.prepareFingerImages(dto.biometric, 'old');
      })
      .finally(() => { this.isLoading = false; this.cdr.detectChanges(); });
  }

  fetchTaskDetails(taskId: string) {
    this.isLoading = true;
    this.api.GET(`api/approval/details/${taskId}`)
      .then((res: any) => {
        const dto = res?.data?.taskDetails as BeneficiaryDto;
        this.editedDetails = this.mapToVm(dto);
        this.prepareFingerImages(dto.biometric, 'edited');
      })
      .finally(() => { this.isLoading = false; this.cdr.detectChanges(); });
  }

  private mapToVm(dto: BeneficiaryDto): BeneficiaryVm {
    // helper: adds prefix if base64 exists, otherwise empty string (or placeholder if you want)
    const normalizePhoto = (img?: string): string =>
      img ? `data:image/jpeg;base64,${img}` : '/images/dummyHuman.jpg';

    const normalizeFinger = (img?: string): string =>
      img ? `data:image/jpeg;base64,${img}` : '/images/tick.jpg';

    return {
      applicationId: dto.applicationId,
      name: [
        dto.respondentFirstName,
        dto.respondentMiddleName,
        dto.respondentLastName,
      ]
        .filter(Boolean)
        .join(' '),

      spouseName: [dto.spouseFirstName,
      dto.spouseMiddleName,
      dto.spouseLastName,
      ]
        .filter(Boolean)
        .join(' '),
      age: dto.respondentAge,
      gender: dto.respondentGender,
      relationshipWithHouseholdHead: dto.relationshipWithHouseholdHead,
      respondentMaritalStatus: dto.respondentMaritalStatus,
      respondentLegalStatus: dto.respondentLegalStatus,
      respondentId: dto.respondentId,
      documentType: dto.documentType,
      mobileMoneyProvider: dto.mobileMoneyProvider,
      mobileWalletNumber: dto.mobileWalletNumber,
      registrationPhase: dto.registrationPhase,

      phone: dto.respondentPhoneNo,
      photo: normalizePhoto(dto.biometric?.photoData),

      household: {
        incomeSource: dto.householdIncomeSource,
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
        lat: dto.address?.location?.lat,
        lon: dto.address?.location?.lon,
      },

      alternates: [dto.alternatePayee1, dto.alternatePayee2]
        .filter((alt): alt is AlternatePayeeDto => !!alt)
        .map((alt) => ({
          name: `${alt.payeeFirstName ?? ''} ${alt.payeeLastName ?? ''}`.trim(),
          age: alt.payeeAge ?? 0,
          gender: alt.payeeGender,
          relationshipWithHouseholdHead: alt.relationshipWithHouseholdHead,
          relationshipOther: alt.relationshipOther,
          nationalId: alt.nationalId ?? '',
          phone: alt.payeePhoneNo ?? '',
          documentType: alt.documentType,
          photo: normalizePhoto(alt.biometric?.photoData),
          biometric: alt.biometric,

          // ✨ alternate-specific finger sets
          rightFingers: [
            {
              label: 'Thumb',
              tooltip: 'Right Thumb',
              image: normalizeFinger(alt.biometric?.rtFingerData),
            },
            {
              label: 'Index',
              tooltip: 'Right Index',
              image: normalizeFinger(alt.biometric?.riFingerData),
            },
            {
              label: 'Middle',
              tooltip: 'Right Middle',
              image: normalizeFinger(alt.biometric?.rmFingerData),
            },
            {
              label: 'Ring',
              tooltip: 'Right Ring',
              image: normalizeFinger(alt.biometric?.rrFingerData),
            },
            {
              label: 'Little',
              tooltip: 'Right Little',
              image: normalizeFinger(alt.biometric?.rsFingerData),
            },
          ],
          leftFingers: [
            {
              label: 'Thumb',
              tooltip: 'Left Thumb',
              image: normalizeFinger(alt.biometric?.ltFingerData),
            },
            {
              label: 'Index',
              tooltip: 'Left Index',
              image: normalizeFinger(alt.biometric?.liFingerData),
            },
            {
              label: 'Middle',
              tooltip: 'Left Middle',
              image: normalizeFinger(alt.biometric?.lmFingerData),
            },
            {
              label: 'Ring',
              tooltip: 'Left Ring',
              image: normalizeFinger(alt.biometric?.lrFingerData),
            },
            {
              label: 'Little',
              tooltip: 'Left Little',
              image: normalizeFinger(alt.biometric?.lsFingerData),
            },
          ],
        })),

      nominees: (dto.nominees || []).map((n: NomineeDto) => ({
        name: [n.nomineeFirstName, n.nomineeMiddleName, n.nomineeLastName]
          .filter(Boolean)
          .join(' '),
        age: n.nomineeAge,
        gender: n.nomineeGender,
        relation: n.relationshipWithHouseholdHead,
        relationshipOther: n.relationshipOther,
        nomineeOccupation: n.nomineeOccupation,
        photo: normalizeFinger(n.biometric?.photoData),
        isReadWrite: n.isReadWrite

      })),

      rightFingers: [
        {
          label: 'Thumb',
          tooltip: 'Right Thumb',
          image: normalizeFinger(dto.biometric?.rtFingerData),
        },
        {
          label: 'Index',
          tooltip: 'Right Index',
          image: normalizeFinger(dto.biometric?.riFingerData),
        },
        {
          label: 'Middle',
          tooltip: 'Right Middle',
          image: normalizeFinger(dto.biometric?.rmFingerData),
        },
        {
          label: 'Ring',
          tooltip: 'Right Ring',
          image: normalizeFinger(dto.biometric?.rrFingerData),
        },
        {
          label: 'Little',
          tooltip: 'Right Little',
          image: normalizeFinger(dto.biometric?.rsFingerData),
        },
      ],
      leftFingers: [
        {
          label: 'Thumb',
          tooltip: 'Left Thumb',
          image: normalizeFinger(dto.biometric?.ltFingerData),
        },
        {
          label: 'Index',
          tooltip: 'Left Index',
          image: normalizeFinger(dto.biometric?.liFingerData),
        },
        {
          label: 'Middle',
          tooltip: 'Left Middle',
          image: normalizeFinger(dto.biometric?.lmFingerData),
        },
        {
          label: 'Ring',
          tooltip: 'Left Ring',
          image: normalizeFinger(dto.biometric?.lrFingerData),
        },
        {
          label: 'Little',
          tooltip: 'Left Little',
          image: normalizeFinger(dto.biometric?.lsFingerData),
        },
      ],
    };
  }

  private prepareFingerImages(bio: BiometricDto | undefined, target: 'old' | 'edited') {
    const nf = (img?: string) => (img ? `data:image/jpeg;base64,${img}` : '/images/tick.jpg');

    const right = !bio ? [] : [
      { label: 'Thumb', image: nf(bio.rtFingerData), tooltip: 'Right Thumb' },
      { label: 'Index', image: nf(bio.riFingerData), tooltip: 'Right Index' },
      { label: 'Middle', image: nf(bio.rmFingerData), tooltip: 'Right Middle' },
      { label: 'Ring', image: nf(bio.rrFingerData), tooltip: 'Right Ring' },
      { label: 'Little', image: nf(bio.rsFingerData), tooltip: 'Right Little' },
    ];
    const left = !bio ? [] : [
      { label: 'Thumb', image: nf(bio.ltFingerData), tooltip: 'Left Thumb' },
      { label: 'Index', image: nf(bio.liFingerData), tooltip: 'Left Index' },
      { label: 'Middle', image: nf(bio.lmFingerData), tooltip: 'Left Middle' },
      { label: 'Ring', image: nf(bio.lrFingerData), tooltip: 'Left Ring' },
      { label: 'Little', image: nf(bio.lsFingerData), tooltip: 'Left Little' },
    ];

    if (target === 'old') {
      this.oldRightFingers = right;
      this.oldLeftFingers = left;
    } else {
      this.editedRightFingers = right;
      this.editedLeftFingers = left;
    }
  }


  private async loadBeneficiaryDetailsDto(householdId: string): Promise<BeneficiaryDto> {
    const res: any = await this.api.GET(`api/beneficiary/details/${householdId}`);
    return res?.data as BeneficiaryDto;
  }

  private async loadTaskDetailsDto(taskId: string): Promise<BeneficiaryDto> {
    const res: any = await this.api.GET(`api/approval/details/${taskId}`);
    return res?.data?.taskDetails as BeneficiaryDto;
  }

  get nomineeCount(): number {
    const oldLen = this.oldDetails?.nominees?.length ?? 0;
    const editedLen = this.editedDetails?.nominees?.length ?? 0;
    return Math.max(oldLen, editedLen);
  }

  // Helper to build [0, 1, 2, ... n-1]
  range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }

  // (optional) trackBy to keep DOM stable
  trackIndex = (_: number, i: number) => i;

}
