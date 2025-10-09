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
import { FormsModule } from '@angular/forms';

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
  relationshipOther?: string;
  respondentMaritalStatus: string;
  respondentLegalStatus: string;
  respondentId: string;
  phone: string;
  documentType: string;
  documentTypeOther?: string;
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
    documentTypeOther?: string;
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

interface ApprovalDetailsResponse {
  oldBeneficiary: BeneficiaryDto;
  taskDetails: BeneficiaryDto;
  differences?: Record<string, string>; // keys = field paths, values = "Old:..., New:..." or any message
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
    FormsModule
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
  approvalStatus: string = '';
  householdId: string | null = null; // helpful when in task mode
  currentTaskId?: number;
  isApprove: boolean = true;

  items = [
    {
      label: 'Approval List',
      icon: 'fas fa-users me-2',
      routerLink: '/beneficiary-approval-list/edit',
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
    acceptButtonProps: { label: 'Yes', severity: 'success', disabled: this.isLoading },
    rejectButtonProps: { label: 'No', severity: 'danger', disabled: this.isLoading },
    accept: () => this.handleApproval()
  });
}

private handleApproval() {
  
  if (!this.isApprove && (!this.approvalComment || !this.approvalComment.trim())) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Comment Required',
      detail: 'Please provide a reason for rejection before proceeding.'
    });
    return;
  }

  this.isLoading = true;

  const payload = {
    approvalTaskId: this.taskId,
    approved: this.isApprove,
    comment: this.approvalComment
  };

  this.api.POST('/api/approval/doApprove', payload)
    .then(() => {
      const life = 1200;
      this.messageService.add({
        severity: this.isApprove ? 'success' : 'warn',
        summary: this.isApprove ? 'Approved' : 'Rejected',
        detail: `Task #${this.taskId} ${this.isApprove ? 'approved' : 'rejected'} successfully.`,
        life,
      });
      this.isLoading = false;
      setTimeout(() => {
        this.router.navigate(['/beneficiary-approval-list/edit']);
      }, life);
    })
    .catch((err: any) => {
      console.error(err);
      this.isLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to ${this.isApprove ? 'approve' : 'reject'} task`,
      });
    });
}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const isTaskMode = (this.route.snapshot.queryParamMap.get('taskMode') || '').toLowerCase() === 'true';
    this.isOnTaskDetails = isTaskMode;

    if (isTaskMode) this.taskId = id!;
    else this.householdId = id!;

    if (!id) return;

    this.isLoading = true;
    try {
      // preload lookups
      await Promise.all([
        this.lookup.getOrFetchStateList(),
        this.lookup.getCountyListByStateId(''),
        this.lookup.getPayamListByCountyId(''),
        this.lookup.getBomaListByPayamId(''),
      ]);

      // 🔑 Single API call for both modes
      const approval = await this.loadTaskDetails(id);
      this.approvalStatus = (approval as any)?.approvalStatus || '';
      if (isTaskMode && approval.taskDetails) {
        const editedDto = approval.taskDetails as BeneficiaryDto;
        this.editedDetails = this.mapToVm(editedDto);
        this.prepareFingerImages(editedDto.biometrics, 'edited');

        this.setDifferences(approval.differences);

        // derive householdId from task details
        this.householdId =
          (editedDto as any).householdId ??
          (editedDto as any).beneficiaryId ??
          editedDto.applicationId;
      }

      if (approval.oldBeneficiary) {
        const oldDto = approval.oldBeneficiary as BeneficiaryDto;
        this.oldDetails = this.mapToVm(oldDto);
        this.prepareFingerImages(oldDto.biometrics, 'old');
      } else {
        console.warn('No oldBeneficiary found in approval/details payload.');
      }

    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
      
    }
  }

  private mapToVm(dto: BeneficiaryDto): BeneficiaryVm {
    // helper: adds prefix if base64 exists, otherwise empty string (or placeholder if you want)
    const normalizePhoto = (img?: string): string =>
      img ? `data:image/jpeg;base64,${img}` : 'images/dummyHuman.jpg';

    const normalizeFinger = (img?: string): string =>
      img ? `data:image/jpeg;base64,${img}` : 'images/tick.jpg';

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

      spouseName: [dto.spouseFirstName,
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
      documentTypeOther: dto.documentTypeOther,
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

      alternates: [dto.alternatePayee1, dto.alternatePayee2]
        .filter((alt): alt is AlternatePayeeDto => !!alt)
        .map((alt) => ({
          name: `${alt.payeeFirstName ?? ''} ${alt.payeeMiddleName ?? ''} ${alt.payeeLastName ?? ''} ${alt.payeeNickName ?? ''}`.trim(),
          age: alt.payeeAge ?? 0,
          gender: alt.payeeGender,
          relationshipWithHouseholdHead: alt.relationshipWithHouseholdHead,
          relationshipOther: alt.relationshipOther,
          nationalId: alt.nationalId ?? '',
          phone: alt.payeePhoneNo ?? '',
          documentType: alt.documentType,
          documentTypeOther: alt.documentTypeOther,
          photo: normalizePhoto(alt.biometrics?.photoData),
          biometric: alt.biometrics,

          // ✨ alternate-specific finger sets
          rightFingers: [
            {
              label: 'Thumb',
              tooltip: 'Right Thumb',
              image: normalizeFinger(alt.biometrics?.rtFingerData),
            },
            {
              label: 'Index',
              tooltip: 'Right Index',
              image: normalizeFinger(alt.biometrics?.riFingerData),
            },
            {
              label: 'Middle',
              tooltip: 'Right Middle',
              image: normalizeFinger(alt.biometrics?.rmFingerData),
            },
            {
              label: 'Ring',
              tooltip: 'Right Ring',
              image: normalizeFinger(alt.biometrics?.rrFingerData),
            },
            {
              label: 'Little',
              tooltip: 'Right Little',
              image: normalizeFinger(alt.biometrics?.rsFingerData),
            },
          ],
          leftFingers: [
            {
              label: 'Thumb',
              tooltip: 'Left Thumb',
              image: normalizeFinger(alt.biometrics?.ltFingerData),
            },
            {
              label: 'Index',
              tooltip: 'Left Index',
              image: normalizeFinger(alt.biometrics?.liFingerData),
            },
            {
              label: 'Middle',
              tooltip: 'Left Middle',
              image: normalizeFinger(alt.biometrics?.lmFingerData),
            },
            {
              label: 'Ring',
              tooltip: 'Left Ring',
              image: normalizeFinger(alt.biometrics?.lrFingerData),
            },
            {
              label: 'Little',
              tooltip: 'Left Little',
              image: normalizeFinger(alt.biometrics?.lsFingerData),
            },
          ],
        })),

      nominees: (dto.nominees || []).map((n: NomineeDto) => ({
        name: [n.nomineeFirstName, n.nomineeMiddleName, n.nomineeLastName, n.nomineeNickName]
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
          image: normalizeFinger(dto.biometrics?.rtFingerData),
        },
        {
          label: 'Index',
          tooltip: 'Right Index',
          image: normalizeFinger(dto.biometrics?.riFingerData),
        },
        {
          label: 'Middle',
          tooltip: 'Right Middle',
          image: normalizeFinger(dto.biometrics?.rmFingerData),
        },
        {
          label: 'Ring',
          tooltip: 'Right Ring',
          image: normalizeFinger(dto.biometrics?.rrFingerData),
        },
        {
          label: 'Little',
          tooltip: 'Right Little',
          image: normalizeFinger(dto.biometrics?.rsFingerData),
        },
      ],
      leftFingers: [
        {
          label: 'Thumb',
          tooltip: 'Left Thumb',
          image: normalizeFinger(dto.biometrics?.ltFingerData),
        },
        {
          label: 'Index',
          tooltip: 'Left Index',
          image: normalizeFinger(dto.biometrics?.liFingerData),
        },
        {
          label: 'Middle',
          tooltip: 'Left Middle',
          image: normalizeFinger(dto.biometrics?.lmFingerData),
        },
        {
          label: 'Ring',
          tooltip: 'Left Ring',
          image: normalizeFinger(dto.biometrics?.lrFingerData),
        },
        {
          label: 'Little',
          tooltip: 'Left Little',
          image: normalizeFinger(dto.biometrics?.lsFingerData),
        },
      ],
    };
  }

  private prepareFingerImages(bio: BiometricDto | undefined, target: 'old' | 'edited') {
    const nf = (img?: string) => (img ? `data:image/jpeg;base64,${img}` : 'images/tick.jpg');

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

  private async loadTaskDetails(taskId: string): Promise<ApprovalDetailsResponse> {
    const res: any = await this.api.GET(`api/approval/details/${taskId}`);
    this.approvalStatus = res?.approvalStatus || '';
    return (res?.data || {}) as ApprovalDetailsResponse;
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


  //--obaydur start--
  differences: Record<string, string> = {};
  private diffKeySet = new Set<string>();

  /** Normalize a path to a few common candidates so we’re resilient to dot/bracket styles. */
  private candidatesFor(path: string): string[] {
    const dot = path.replace(/\[(\d+)\]/g, '.$1');
    const bracket = path.replace(/\.([0-9]+)/g, '[$1]');
    return [path, dot, bracket];
  }

  private setDifferences(d: Record<string, string> | undefined) {
    this.differences = d || {};
    this.diffKeySet = new Set(Object.keys(this.differences));
  }

  /** True if ANY of the given paths changed. */
  isChanged(paths: string | string[]): boolean {
    const arr = Array.isArray(paths) ? paths : [paths];
    return arr.some(p => this.candidatesFor(p).some(c => this.diffKeySet.has(c)));
  }

  /** True if any key in differences starts with ANY of the given prefixes. */
  isChangedPrefix(prefixes: string | string[]): boolean {
    const arr = Array.isArray(prefixes) ? prefixes : [prefixes];
    for (const k of this.diffKeySet) {
      if (arr.some(p => k.startsWith(p))) return true;
    }
    return false;
  }

  /** Return a tooltip string (merged if multiple) for changed paths. */
  diffTip(paths: string | string[]): string | undefined {
    const arr = Array.isArray(paths) ? paths : [paths];
    const msgs = new Set<string>();   // ✅ avoid duplicates
    for (const p of arr) {
      for (const c of this.candidatesFor(p)) {
        const v = this.differences[c];
        if (v) msgs.add(`${c}: ${v}`);
      }
    }
    return msgs.size ? Array.from(msgs).join('\n') : undefined;
  }

  /** Convenience for ngClass. */
  changedClass(paths: string | string[]) {
    return this.isChanged(paths) ? 'changed' : '';
  }
  changedClassPrefix(prefixes: string | string[]) {
    return this.isChangedPrefix(prefixes) ? 'changed' : '';
  }

  // Paths that depend on index
  altPath(i: number, field: string) {
    return `alternatePayee${i + 1}.${field}`;
  }

  altFingerPath(i: number, hand: 'right' | 'left', j: number) {
    const mapRight = ['rtFingerData', 'riFingerData', 'rmFingerData', 'rrFingerData', 'rsFingerData'];
    const mapLeft = ['ltFingerData', 'liFingerData', 'lmFingerData', 'lrFingerData', 'lsFingerData'];
    return `alternatePayee${i + 1}.biometric.${hand === 'right' ? mapRight[j] : mapLeft[j]}`;
  }

  nomineePath(i: number, field: string) {
    return `nominees[${i}].${field}`;
  }


}
