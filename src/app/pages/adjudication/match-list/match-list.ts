import { Tag } from 'primeng/tag';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { PaginatorModule } from 'primeng/paginator';
import { AccordionModule } from 'primeng/accordion';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { ApiService } from '../../../services/api.service';
import { LookupService } from '../../../services/lookup.service';
import { ImageComparePreview } from '../image-compare-preview/image-compare-preview';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Loader } from '../../../components/loader/loader';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-match-list',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbModule,
    PaginatorModule,
    AccordionModule,
    ProgressBarModule,
    TooltipModule,
    TableModule,
    Loader,
    ConfirmDialogModule,
    Tag,
    Toast,
  ],
  templateUrl: './match-list.html',
  styleUrls: ['./match-list.scss'],
  providers: [MessageService, ConfirmationService, DialogService],
})
export class MatchList implements OnInit {
  isLoading: boolean = true;
  items: MenuItem[] | undefined;
  home: MenuItem | undefined;
  beneficiaryMatchList: any = null;
  progressValue: number = 0;
  isGeneratingPdf: boolean = false;

  beneficiaryPhoto: string = 'images/dummyHuman.jpg';
  beneficiaryRightHandFingerPrints: any = {
    RT: 'images/no-finger.png',
    RI: 'images/no-finger.png',
    RM: 'images/no-finger.png',
    RR: 'images/no-finger.png',
    RL: 'images/no-finger.png',
  };
  beneficiaryLeftHandFingerPrints: any = {
    LT: 'images/no-finger.png',
    LI: 'images/no-finger.png',
    LM: 'images/no-finger.png',
    LR: 'images/no-finger.png',
    LL: 'images/no-finger.png',
  };

  allBiometrciDataFromMatchList: any[] = [];
  currentPage: number = 0;
  pageSize: number = 10;
  totalRecords: number = 0;
  private currentApplicationId: string | null = null;

  ref: DynamicDialogRef | undefined | null;

  constructor(
    private activatedRoute: ActivatedRoute,
    private apiService: ApiService,
    public lookupService: LookupService,
    public dialogService: DialogService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentApplicationId = this.route.snapshot.paramMap.get('id');
    this.items = [
      {
        label: 'Adjudication',
        icon: 'fas fa-users-viewfinder',
        routerLink: '/adjudication/list',
      },
      {
        label: 'Match List',
        icon: 'fas fa-people-arrows',
      },
    ];
    this.home = {
      icon: 'fas fa-home',
      routerLink: '/dashboard',
    };

    this.fetchBeneficiaryMatchList(this.currentApplicationId);
  }

  fetchBeneficiaryMatchList(
    applicationId: string | null,
    page: number = 0,
    size: number = this.pageSize
  ): void {
    if (!applicationId) {
      this.isLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Application ID is missing.',
      });
      return;
    }
    this.isLoading = true;
    const payload = {
      ignorePrimary: 0,
      page: page,
      referenceNo: applicationId,
      size: size,
    };

    console.log('Sending Payload:', payload);

    this.apiService
      .POST('api/adjudication/getMatchList/v2', payload)
      .then((res) => {
        if (res.status === 200) {
          this.beneficiaryMatchList = res.data;
          this.totalRecords = res.data.totalMatched || 0;

          if (res.data.primary?.biometric) {
            this.getBeneficiaryBiometricFromObject(res.data.primary.biometric);
          }

          if (res.data.matchList?.length > 0) {
            this.parseMatchList(res.data.matchList);
          }
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      })
      .catch((err) => {
        console.error('Error Fetching Data:', err);
        this.beneficiaryMatchList = null;
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  getBeneficiaryBiometricFromObject(biometric: any): void {
    this.beneficiaryPhoto = biometric?.photoData
      ? `data:image/png;base64,${biometric.photoData}`
      : 'images/dummyHuman.jpg';

    const right = this.beneficiaryRightHandFingerPrints;
    const left = this.beneficiaryLeftHandFingerPrints;

    right.RT = biometric?.rtFingerData
      ? `data:image/png;base64,${biometric.rtFingerData}`
      : 'images/no-finger.png';
    right.RI = biometric?.riFingerData
      ? `data:image/png;base64,${biometric.riFingerData}`
      : 'images/no-finger.png';
    right.RM = biometric?.rmFingerData
      ? `data:image/png;base64,${biometric.rmFingerData}`
      : 'images/no-finger.png';
    right.RR = biometric?.rrFingerData
      ? `data:image/png;base64,${biometric.rrFingerData}`
      : 'images/no-finger.png';
    right.RL = biometric?.rsFingerData
      ? `data:image/png;base64,${biometric.rsFingerData}`
      : 'images/no-finger.png';

    left.LT = biometric?.ltFingerData
      ? `data:image/png;base64,${biometric.ltFingerData}`
      : 'images/no-finger.png';
    left.LI = biometric?.liFingerData
      ? `data:image/png;base64,${biometric.liFingerData}`
      : 'images/no-finger.png';
    left.LM = biometric?.lmFingerData
      ? `data:image/png;base64,${biometric.lmFingerData}`
      : 'images/no-finger.png';
    left.LR = biometric?.lrFingerData
      ? `data:image/png;base64,${biometric.lrFingerData}`
      : 'images/no-finger.png';
    left.LL = biometric?.lsFingerData
      ? `data:image/png;base64,${biometric.lsFingerData}`
      : 'images/no-finger.png';
  }

  parseMatchList(matches: any[]): void {
    this.allBiometrciDataFromMatchList = matches.map((match) => {
      const biometric = match.biometric || {};
      return {
        photo: biometric.photoData
          ? `data:image/png;base64,${biometric.photoData}`
          : 'images/dummyHuman.jpg',
        rightHand: {
          RT: biometric.rtFingerData
            ? `data:image/png;base64,${biometric.rtFingerData}`
            : 'images/no-finger.png',
          RI: biometric.riFingerData
            ? `data:image/png;base64,${biometric.riFingerData}`
            : 'images/no-finger.png',
          RM: biometric.rmFingerData
            ? `data:image/png;base64,${biometric.rmFingerData}`
            : 'images/no-finger.png',
          RR: biometric.rrFingerData
            ? `data:image/png;base64,${biometric.rrFingerData}`
            : 'images/no-finger.png',
          RL: biometric.rsFingerData
            ? `data:image/png;base64,${biometric.rsFingerData}`
            : 'images/no-finger.png',
        },
        leftHand: {
          LT: biometric.ltFingerData
            ? `data:image/png;base64,${biometric.ltFingerData}`
            : 'images/no-finger.png',
          LI: biometric.liFingerData
            ? `data:image/png;base64,${biometric.liFingerData}`
            : 'images/no-finger.png',
          LM: biometric.lmFingerData
            ? `data:image/png;base64,${biometric.lmFingerData}`
            : 'images/no-finger.png',
          LR: biometric.lrFingerData
            ? `data:image/png;base64,${biometric.lrFingerData}`
            : 'images/no-finger.png',
          LL: biometric.lsFingerData
            ? `data:image/png;base64,${biometric.lsFingerData}`
            : 'images/no-finger.png',
        },
      };
    });
  }

  onPageChange(event: any): void {
    this.currentPage = event.page;
    this.pageSize = event.rows;

    this.fetchBeneficiaryMatchList(
      this.currentApplicationId,
      this.currentPage,
      this.pageSize
    );
  }

  imagePreviewModal(
    primaryImage: string,
    secondaryImage: string,
    title: string,
    isProfile: boolean = false
  ): void {
    let primaryImages: string[];
    if (isProfile) {
      primaryImages = [primaryImage];
    } else {
      // 1. Collect all primary fingerprint images into an array
      const allPrimaryFingerprints = [
        this.beneficiaryRightHandFingerPrints.RT,
        this.beneficiaryRightHandFingerPrints.RI,
        this.beneficiaryRightHandFingerPrints.RM,
        this.beneficiaryRightHandFingerPrints.RR,
        this.beneficiaryRightHandFingerPrints.RL,
        this.beneficiaryLeftHandFingerPrints.LT,
        this.beneficiaryLeftHandFingerPrints.LI,
        this.beneficiaryLeftHandFingerPrints.LM,
        this.beneficiaryLeftHandFingerPrints.LR,
        this.beneficiaryLeftHandFingerPrints.LL,
      ];

      // 2. Reorder the array to put the clicked image first.
      primaryImages = [...allPrimaryFingerprints].sort((a) => {
        return a === primaryImage ? -1 : 1;
      });
    }

    this.ref = this.dialogService.open(ImageComparePreview, {
      data: {
        primary: primaryImages, // Pass the full, reordered array
        secondary: secondaryImage,
      },
      header: `Image Comparison: (${title})`,
      width: '50%',
      contentStyle: { overflow: 'auto' },
    });
  }

  adjudicate(status: boolean, currentApplicationId: string): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to mark this as ${
        status ? 'Matched' : 'Not Matched'
      }?`,
      header: 'Adjudication Confirmation',
      icon: 'pi pi-exclamation-triangle',

      acceptLabel: 'Yes',
      rejectLabel: 'No',

      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',

      accept: () => {
        this.isLoading = true;
        const payload = {
          approval: status,
          referenceId: this.currentApplicationId,
        };
        this.apiService
          .POST('api/adjudication/adjudicate', payload)
          .then((res) => {
            if (res.status === 200) {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Adjudicated Successfully.',
                life: 2000,
              });
              this.isLoading = false;
              this.cdr.markForCheck();
              setTimeout(() => {
                // this.router.navigate(['/adjudication/list']);
              }, 2000);
            }
          })
          .catch((err) => {
            console.error(err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Cannot Process your request. Please Try again later.',
              life: 2000,
            });
            this.isLoading = false;
            this.cdr.markForCheck();
            setTimeout(() => {
              // this.router.navigate(['/adjudication/list']);
            }, 2000);
          });
      },
    });
  }

  printPdf(): void {
    const doc = new jsPDF('portrait');
    this.isGeneratingPdf = true;
    this.progressValue = 10;

    setTimeout(() => {
      document
        .querySelector('.scroller')
        ?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);

    doc.setFontSize(18);
    doc.text('Beneficiary Match Report', 10, 10);
    const totalMatched = this.totalRecords || 0;
    doc.setFontSize(12);
    doc.text(`Total Matched: ${totalMatched}`, 160, 10);

    this.apiService
      .POST('api/adjudication/getMatchList/v2', {
        ignorePrimary: 0,
        page: 0,
        referenceNo: this.currentApplicationId,
        size: totalMatched,
      })
      .then((res) => {
        if (res.status === 200) {
          this.progressValue = 40;
          const allMatchList = res.data.matchList || [];

          this.fetchAllBiometricData(allMatchList).then((biometricData) => {
            this.progressValue = 70;

            if (res.data.primary) {
              this.addBeneficiaryPage(
                doc,
                res.data.primary,
                this.beneficiaryPhoto,
                'Primary Beneficiary Information'
              );
            }

            allMatchList.forEach((match: any, index: number) => {
              const score = match.score || 'N/A';
              const photo =
                biometricData[index]?.photo || 'images/dummyHuman.jpg';

              doc.addPage();
              this.addBeneficiaryPage(
                doc,
                match,
                photo,
                `Matched Beneficiary #${index + 1}`,
                score
              );
              this.progressValue = Math.min(
                70 + (index / allMatchList.length) * 30,
                99
              );
            });

            this.progressValue = 100;

            setTimeout(() => {
              doc.save('Beneficiary_Match_List.pdf');
              this.isGeneratingPdf = false;
              document
                .querySelector('.scroller')
                ?.scrollTo({ top: 0, behavior: 'smooth' });
              this.cdr.markForCheck();
            }, 300);
          });
        }
      })
      .catch((err) => {
        console.error('Error fetching all matched data:', err);
        this.isGeneratingPdf = false;
        this.cdr.markForCheck();
      });
  }

  fetchAllBiometricData(allMatchList: any[]): Promise<any[]> {
    return new Promise((resolve) => {
      const biometricDataArray = allMatchList.map((match) => {
        const biometric = match.biometric || {};
        const photo = biometric.photoData
          ? `data:image/png;base64,${biometric.photoData}`
          : 'images/dummyHuman.jpg';
        return { photo };
      });
      resolve(biometricDataArray);
    });
  }

  addBeneficiaryPage(
    doc: jsPDF,
    beneficiaryData: any,
    photo: string,
    title: string,
    score: string = ''
  ): void {
    let currentY = 20;

    doc.setFontSize(14);
    doc.text(title, 10, currentY);
    currentY += 10;

    if (score) {
      doc.setFontSize(12);
      doc.text(`Matched Score: ${score}`, 150, currentY - 10);
    }

    if (photo) {
      doc.addImage(photo, 'PNG', 10, currentY, 40, 40);
      doc.setFontSize(10);
      doc.text('Profile Image', 10, currentY + 45);
    }

    currentY = Math.max(currentY + 55, currentY);

    const matchDate = beneficiaryData.matchCreated
      ? new Date(beneficiaryData.matchCreated)
      : null;
    const formattedMatchDate = matchDate
      ? `${String(matchDate.getDate()).padStart(2, '0')}-${String(
          matchDate.getMonth() + 1
        ).padStart(2, '0')}-${matchDate.getFullYear()}`
      : 'N/A';

    autoTable(doc, {
      startY: currentY,
      head: [['Field', 'Value']],
      body: [
        ['Application ID', beneficiaryData.applicationId || 'N/A'],
        ['Type', beneficiaryData.type || 'N/A'],
        ['First Name', beneficiaryData.respondentFirstName || 'N/A'],
        ['Middle Name', beneficiaryData.respondentMiddleName || 'N/A'],
        ['Last Name', beneficiaryData.respondentLastName || 'N/A'],
        ['Match Date', formattedMatchDate],
        [
          'Gender',
          this.lookupService.getGenderEnumByValue(
            beneficiaryData.respondentGender
          ) || 'N/A',
        ],
        ['Phone No', beneficiaryData.respondentPhoneNo || 'N/A'],
        [
          'State Name',
          beneficiaryData.address
            ? this.lookupService.getStateNameById(
                beneficiaryData.address.stateId
              )
            : 'N/A',
        ],
        [
          'County Name',
          beneficiaryData.address
            ? this.lookupService.getCountyNameById(
                beneficiaryData.address.countyId
              )
            : 'N/A',
        ],
        [
          'Payam Name',
          beneficiaryData.address
            ? this.lookupService.getPayamNameById(beneficiaryData.address.payam)
            : 'N/A',
        ],
        [
          'Boma Name',
          beneficiaryData.address
            ? this.lookupService.getBomaNameById(beneficiaryData.address.boma)
            : 'N/A',
        ],
      ],
      margin: { left: 10 },
    });
  }
}
