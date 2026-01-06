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
  documentTypeOther?: string | null;
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

  alternates:
    | ({
        name: string;
        age: number;
        gender: string;
        relationshipWithHouseholdHead: RelationshipWithHead;
        relationshipOther?: string;
        nationalId?: string | null;
        phone: string;
        documentType?: string;
        documentTypeOther?: string;
        photo?: string;
        biometric?: BiometricDto;
        rightFingers: FingerVm[];
        leftFingers: FingerVm[];
      } | null)[]
    | null;

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
    FormsModule,
    Card,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './beneficiary-edit-approval-details.html',
  styleUrl: './beneficiary-edit-approval-details.scss',
})
export class BeneficiaryEditApprovalDetails {
  approvalComment: string = '';
  isSubmitting = false;
  isLoading = true;
  isOnTaskDetails: boolean = false;
  oldDetails!: BeneficiaryVm | null; // ← Old (from /beneficiary/details/{householdId})
  editedDetails!: BeneficiaryVm | null; // ← Edited (from /approval/details/{taskId})

  oldRightFingers: FingerVm[] = [];
  oldLeftFingers: FingerVm[] = [];
  editedRightFingers: FingerVm[] = [];
  editedLeftFingers: FingerVm[] = [];
  user: any;
  isUserLoading: boolean = false;
  taskId: string | null = null;
  approvalStatus: string = '';
  householdId: string | null = null; // helpful when in task mode
  currentTaskId?: number;
  isApprove: boolean = true;

  items = [
    {
      label: 'Approval List',
      icon: 'fas fa-users me-2',
      routerLink: '/beneficiary-approval/list',
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
      .then(() => {
        const life = 1200;
        this.messageService.add({
          severity: this.isApprove ? 'success' : 'warn',
          summary: this.isApprove ? 'Approved' : 'Rejected',
          detail: `Task #${this.taskId} ${
            this.isApprove ? 'approved' : 'rejected'
          } successfully.`,
          life,
        });
        this.isLoading = false;
        setTimeout(() => {
          this.router.navigate(['/beneficiary-approval/list']);
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
    const isTaskMode =
      (
        this.route.snapshot.queryParamMap.get('taskMode') || ''
      ).toLowerCase() === 'true';
    this.isOnTaskDetails = isTaskMode;

    if (isTaskMode) this.taskId = id!;
    else this.householdId = id!;

    if (!id) return;

    this.isLoading = true;
    try {
      await Promise.all([
        this.lookup.getOrFetchStateList(),
        this.lookup.getCountyListByStateId(''),
        this.lookup.getPayamListByCountyId(''),
        this.lookup.getBomaListByPayamId(''),
      ]);

      const approval = await this.loadTaskDetails(id);
      this.approvalStatus = (approval as any)?.approvalStatus || '';
      if (isTaskMode && approval.taskDetails) {
        const editedDto = approval.taskDetails as BeneficiaryDto;
        this.editedDetails = this.mapToVm(editedDto, false);
        if (editedDto.biometrics) {
          this.prepareFingerImages(
            editedDto.biometrics,
            undefined,
            'edited',
            false
          ); // Pass biometrics and mark as 'edited'
        } else {
          console.warn(
            'No biometrics data available for the edited beneficiary.'
          );
        }

        this.setDifferences(approval.differences);

        this.householdId =
          (editedDto as any).householdId ??
          (editedDto as any).beneficiaryId ??
          editedDto.applicationId;
      }

      if (approval.oldBeneficiary) {
        const oldDto = approval.oldBeneficiary as BeneficiaryDto;
        this.oldDetails = this.mapToVm(oldDto, true);
        if (oldDto.biometrics) {
          this.prepareFingerImages(oldDto.biometrics, undefined, 'old', false); // Pass biometrics and mark as 'old'
        } else {
          console.warn('No biometrics data available for the old beneficiary.');
        }
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

  private mapToVm(dto: BeneficiaryDto, isOld: boolean = false): BeneficiaryVm {
    const normalizePhoto = (img?: string): string =>
      img ? `data:image/jpeg;base64,${img}` : 'images/dummyHuman.jpg';

    const normalizeFinger = (img?: string): string =>
      img ? `data:image/jpeg;base64,${img}` : 'images/tick.jpg';

    const biometrics = dto.biometrics;

    // Prepare finger images based on old or edited data
    if (isOld) {
      this.prepareFingerImages(biometrics, undefined, 'old');
    } else {
      this.prepareFingerImages(biometrics, undefined, 'edited');
    }

    // Map the Beneficiary data
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
        monthlyIncome: dto.householdMonthlyAvgIncome ?? null,
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

      alternates: [dto.alternatePayee1, dto.alternatePayee2].map((alt) => {
        if (!alt) return null;

        const biometrics = alt.biometrics;

        // Handle alternates' biometrics separately for old or edited data
        if (isOld) {
          this.prepareFingerImages(undefined, biometrics, 'old', true);
        } else {
          this.prepareFingerImages(undefined, biometrics, 'edited', true);
        }

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
          documentTypeOther: alt.documentTypeOther ?? undefined,
          photo: normalizePhoto(alt.biometrics?.photoData),
          biometric: alt.biometrics,
          rightFingers: isOld
            ? this.oldRightFingers.slice(-5)
            : this.editedRightFingers.slice(-5),
          leftFingers: isOld
            ? this.oldLeftFingers.slice(-5)
            : this.editedLeftFingers.slice(-5),
        };
      }),

      nominees: (() => {
        const nomineeDtos: any[] = dto.nominees || [];

        // If nomineeIndex is present, build a sparse array based on it.
        if (
          nomineeDtos.length > 0 &&
          nomineeDtos[0].nomineeIndex !== undefined
        ) {
          const sparseNominees: any[] = [];
          for (const n of nomineeDtos) {
            sparseNominees[n.nomineeIndex - 1] = {
              // Adjusted for 1-based index
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
            };
          }
          return sparseNominees;
        }

        // Otherwise, do a direct map (old behavior)
        return nomineeDtos.map((n: NomineeDto) => ({
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
        }));
      })(),

      rightFingers: isOld
        ? this.oldRightFingers.slice(0, 5)
        : this.editedRightFingers.slice(0, 5),
      leftFingers: isOld
        ? this.oldLeftFingers.slice(0, 5)
        : this.editedLeftFingers.slice(0, 5),
    };
  }

  private prepareFingerImages(
    bio?: BiometricDto,
    alternatesBiometrics?: BiometricDto,
    target: 'old' | 'edited' = 'old',
    isAlternate: boolean = false
  ) {
    const getFingerImage = (wsqField: string | undefined): string => {
      if (wsqField === 'NEW-FINGERPRINT-ADDED') {
        return 'images/new-finger.png';
      }
      if (wsqField != null && wsqField !== '') {
        return 'images/finger.png';
      }
      return 'images/no-finger.png';
    };

    // Prepare Beneficiary's biometric data (right and left fingers)
    const prepareFingerData = (bioData?: BiometricDto) => {
      const right = !bioData
        ? []
        : [
            {
              label: 'Thumb',
              image: getFingerImage(bioData.wsqRt),
              tooltip: 'Right Thumb',
            },
            {
              label: 'Index',
              image: getFingerImage(bioData.wsqRi),
              tooltip: 'Right Index',
            },
            {
              label: 'Middle',
              image: getFingerImage(bioData.wsqRm),
              tooltip: 'Right Middle',
            },
            {
              label: 'Ring',
              image: getFingerImage(bioData.wsqRr),
              tooltip: 'Right Ring',
            },
            {
              label: 'Little',
              image: getFingerImage(bioData.wsqRs),
              tooltip: 'Right Little',
            },
          ];

      const left = !bioData
        ? []
        : [
            {
              label: 'Thumb',
              image: getFingerImage(bioData.wsqLt),
              tooltip: 'Left Thumb',
            },
            {
              label: 'Index',
              image: getFingerImage(bioData.wsqLi),
              tooltip: 'Left Index',
            },
            {
              label: 'Middle',
              image: getFingerImage(bioData.wsqLm),
              tooltip: 'Left Middle',
            },
            {
              label: 'Ring',
              image: getFingerImage(bioData.wsqLr),
              tooltip: 'Left Ring',
            },
            {
              label: 'Little',
              image: getFingerImage(bioData.wsqLs),
              tooltip: 'Left Little',
            },
          ];

      return { right, left };
    };

    // Beneficiary Finger Images
    if (bio) {
      const { right, left } = prepareFingerData(bio);
      if (target === 'old') {
        if (isAlternate) {
          this.oldRightFingers = right;
          this.oldLeftFingers = left;
        } else {
          this.oldRightFingers = right;
          this.oldLeftFingers = left;
        }
      } else {
        if (isAlternate) {
          this.editedRightFingers = right;
          this.editedLeftFingers = left;
        } else {
          this.editedRightFingers = right;
          this.editedLeftFingers = left;
        }
      }
    }

    // Alternates Finger Images (if present)
    if (alternatesBiometrics) {
      const { right, left } = prepareFingerData(alternatesBiometrics);

      if (target === 'old') {
        if (isAlternate) {
          this.oldRightFingers = right;
          this.oldLeftFingers = left;
        } else {
          this.oldRightFingers = right;
          this.oldLeftFingers = left;
        }
      } else {
        if (isAlternate) {
          this.editedRightFingers = right;
          this.editedLeftFingers = left;
        } else {
          this.editedRightFingers = right;
          this.editedLeftFingers = left;
        }
      }
    }
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

  private async loadTaskDetails(
    taskId: string
  ): Promise<ApprovalDetailsResponse> {
    const res: any = await this.api.GET(`api/approval/details/${taskId}`);
    this.approvalStatus = res?.approvalStatus || '';

    if (res.data.updatedBy) {
      await this.loadUserDetails(res.data.updatedBy);
    }

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
    return arr.some((p) =>
      this.candidatesFor(p).some((c) => this.diffKeySet.has(c))
    );
  }

  /** True if any key in differences starts with ANY of the given prefixes. */
  isChangedPrefix(prefixes: string | string[]): boolean {
    const arr = Array.isArray(prefixes) ? prefixes : [prefixes];
    for (const k of this.diffKeySet) {
      if (arr.some((p) => k.startsWith(p))) return true;
    }
    return false;
  }

  /** Return a tooltip string (merged if multiple) for changed paths. */
  diffTip(paths: string | string[]): string | undefined {
    const arr = Array.isArray(paths) ? paths : [paths];
    const msgs = new Set<string>(); // ✅ avoid duplicates
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
    const mapRight = [
      'rtFingerData',
      'riFingerData',
      'rmFingerData',
      'rrFingerData',
      'rsFingerData',
    ];
    const mapLeft = [
      'ltFingerData',
      'liFingerData',
      'lmFingerData',
      'lrFingerData',
      'lsFingerData',
    ];
    return `alternatePayee${i + 1}.biometric.${
      hand === 'right' ? mapRight[j] : mapLeft[j]
    }`;
  }

  nomineePath(i: number, field: string) {
    return `nominees[${i}].${field}`;
  }
}
