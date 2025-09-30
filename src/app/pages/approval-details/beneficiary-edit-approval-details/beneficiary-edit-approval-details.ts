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

  // ngOnInit() {
  //   const id = this.route.snapshot.paramMap.get('id');
  //   const isTaskMode = this.route.snapshot.queryParamMap.get('taskMode') === 'true';
  //   this.isOnTaskDetails = isTaskMode;

  //   if (isTaskMode) this.taskId = id!;
  //   else this.householdId = id!;

  //   if (!id) return;

  //   this.isLoading = true;
  //   Promise.all([
  //     this.lookup.getOrFetchStateList(),
  //     this.lookup.getCountyListByStateId(''),
  //     this.lookup.getPayamListByCountyId(''),
  //     this.lookup.getBomaListByPayamId(''),
  //   ])
  //     .then(async () => {
  //       if (isTaskMode && this.taskId) {
  //         const edited = await this.loadTaskDetails(this.taskId);

  //         // 1) set edited details
  //         const editedDto = edited.taskDetails as BeneficiaryDto;
  //         this.editedDetails = this.mapToVm(editedDto);
  //         this.prepareFingerImages(editedDto.biometrics, 'edited');

  //         // 2) store differences
  //         this.setDifferences(edited.differences);

  //         // 3) derive householdId and load old
  //         this.householdId =
  //           (editedDto as any).householdId ??
  //           (editedDto as any).beneficiaryId ??
  //           editedDto.applicationId;

  //         if (this.householdId) {
  //           const oldDto = await this.loadBeneficiaryDetailsDto(this.householdId);
  //           this.oldDetails = this.mapToVm(oldDto);
  //           this.prepareFingerImages(oldDto.biometrics, 'old');
  //         } else {
  //           console.warn('Could not determine householdId from task details payload.');
  //         }
  //       } else if (this.householdId) {
  //         await this.fetchBeneficiaryDetails(this.householdId);
  //       }
  //     })
  //     .catch(err => console.error(err))
  //     .finally(() => {
  //       this.isLoading = false;
  //       this.cdr.detectChanges();
  //     });
  // }

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
      photo: normalizePhoto(dto.biometrics?.photoData),

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

  private async loadTaskDetails(taskId: string): Promise<ApprovalDetailsResponse> {
    const res: any = await this.api.GET(`api/approval/details/${taskId}`);
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
