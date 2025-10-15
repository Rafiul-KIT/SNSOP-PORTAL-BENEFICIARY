import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
import { TabsModule } from 'primeng/tabs';
import { Loader } from '../../../components/loader/loader';

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
    TabsModule,
    Loader,
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

  beneficiaryPhoto: string = '';
  beneficiaryRightHandFingerPrints: any = {
    RT: 'assets/tick.jpg',
    RI: 'assets/tick.jpg',
    RM: 'assets/tick.jpg',
    RR: 'assets/tick.jpg',
    RL: 'assets/tick.jpg',
  };
  beneficiaryLeftHandFingerPrints: any = {
    LT: 'assets/tick.jpg',
    LI: 'assets/tick.jpg',
    LM: 'assets/tick.jpg',
    LR: 'assets/tick.jpg',
    LL: 'assets/tick.jpg',
  };

  allBiometrciDataFromMatchList: any[] = [];
  currentPage: number = 0;
  pageSize: number = 10;
  totalRecords: number = 0;

  ref: DynamicDialogRef | undefined;

  constructor(
    private activatedRoute: ActivatedRoute,
    private apiService: ApiService,
    public lookupService: LookupService,
    public dialogService: DialogService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.items = [
      {
        label: 'Adjudication',
        icon: 'fas fa-users-viewfinder me-2',
        routerLink: '/adjudication-list',
      },
      {
        label: 'Match List',
        icon: 'fas fa-people-arrows me-2',
      },
    ];
    this.home = {
      icon: 'fas fa-home me-2',
      routerLink: '/dashboard',
    };

    this.activatedRoute.params.subscribe((prms) => {
      this.fetchBeneficiaryMatchList(prms['aId']);
    });
  }

  fetchBeneficiaryMatchList(
    applicationId: string,
    page: number = 0,
    size: number = this.pageSize
  ): void {
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
        console.log('API Response:', res.data);

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
      })
      .catch((err) => {
        console.error('Error Fetching Data:', err);
        this.beneficiaryMatchList = null;
        this.isLoading = false;
      });
  }

  getBeneficiaryBiometricFromObject(biometric: any): void {
    this.beneficiaryPhoto = biometric?.photoData
      ? `data:image/png;base64,${biometric.photoData}`
      : 'assets/dummy.png';

    const right = this.beneficiaryRightHandFingerPrints;
    const left = this.beneficiaryLeftHandFingerPrints;

    right.RT = biometric?.rtFingerData
      ? `data:image/png;base64,${biometric.rtFingerData}`
      : 'assets/tick.jpg';
    right.RI = biometric?.riFingerData
      ? `data:image/png;base64,${biometric.riFingerData}`
      : 'assets/tick.jpg';
    right.RM = biometric?.rmFingerData
      ? `data:image/png;base64,${biometric.rmFingerData}`
      : 'assets/tick.jpg';
    right.RR = biometric?.rrFingerData
      ? `data:image/png;base64,${biometric.rrFingerData}`
      : 'assets/tick.jpg';
    right.RL = biometric?.rsFingerData
      ? `data:image/png;base64,${biometric.rsFingerData}`
      : 'assets/tick.jpg';

    left.LT = biometric?.ltFingerData
      ? `data:image/png;base64,${biometric.ltFingerData}`
      : 'assets/tick.jpg';
    left.LI = biometric?.liFingerData
      ? `data:image/png;base64,${biometric.liFingerData}`
      : 'assets/tick.jpg';
    left.LM = biometric?.lmFingerData
      ? `data:image/png;base64,${biometric.lmFingerData}`
      : 'assets/tick.jpg';
    left.LR = biometric?.lrFingerData
      ? `data:image/png;base64,${biometric.lrFingerData}`
      : 'assets/tick.jpg';
    left.LL = biometric?.lsFingerData
      ? `data:image/png;base64,${biometric.lsFingerData}`
      : 'assets/tick.jpg';
  }

  parseMatchList(matches: any[]): void {
    this.allBiometrciDataFromMatchList = matches.map((match) => {
      const biometric = match.biometric || {};
      return {
        photo: biometric.photoData
          ? `data:image/png;base64,${biometric.photoData}`
          : 'assets/dummy.png',
        rightHand: {
          RT: biometric.rtFingerData
            ? `data:image/png;base64,${biometric.rtFingerData}`
            : 'assets/tick.jpg',
          RI: biometric.riFingerData
            ? `data:image/png;base64,${biometric.riFingerData}`
            : 'assets/tick.jpg',
          RM: biometric.rmFingerData
            ? `data:image/png;base64,${biometric.rmFingerData}`
            : 'assets/tick.jpg',
          RR: biometric.rrFingerData
            ? `data:image/png;base64,${biometric.rrFingerData}`
            : 'assets/tick.jpg',
          RL: biometric.rsFingerData
            ? `data:image/png;base64,${biometric.rsFingerData}`
            : 'assets/tick.jpg',
        },
        leftHand: {
          LT: biometric.ltFingerData
            ? `data:image/png;base64,${biometric.ltFingerData}`
            : 'assets/tick.jpg',
          LI: biometric.liFingerData
            ? `data:image/png;base64,${biometric.liFingerData}`
            : 'assets/tick.jpg',
          LM: biometric.lmFingerData
            ? `data:image/png;base64,${biometric.lmFingerData}`
            : 'assets/tick.jpg',
          LR: biometric.lrFingerData
            ? `data:image/png;base64,${biometric.lrFingerData}`
            : 'assets/tick.jpg',
          LL: biometric.lsFingerData
            ? `data:image/png;base64,${biometric.lsFingerData}`
            : 'assets/tick.jpg',
        },
      };
    });
  }

  onPageChange(event: any): void {
    console.log('Pagination Event:', event);
    this.currentPage = event.page;
    this.pageSize = event.rows;

    console.log(
      `Fetching page: ${this.currentPage}, pageSize: ${this.pageSize}`
    );
    this.fetchBeneficiaryMatchList(
      this.activatedRoute.snapshot.params['aId'],
      this.currentPage,
      this.pageSize
    );
  }

  imagePreviewModal(
    primaryImage: string,
    secondaryImage: string,
    title: string
  ): void {
    this.ref = this.dialogService.open(ImageComparePreview, {
      data: {
        primary: primaryImage,
        secondary: secondaryImage,
      },
      header: `Image Comparison: (${title})`,
      width: '50%',
      contentStyle: { overflow: 'auto' },
    });
  }

  adjudicate(status: boolean, applicationId: string): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to mark this as ${
        status ? 'Matched' : 'Not Matched'
      }?`,
      header: 'Adjudication Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptIcon: 'fas fa-check me-2',
      rejectIcon: 'fas fa-times me-2',
      rejectButtonStyleClass: 'btn btn-danger',
      acceptButtonStyleClass: 'btn btn-success',
      accept: () => {
        this.isLoading = true;
        const payload = {
          approval: status,
          referenceId: applicationId,
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
        referenceNo: this.activatedRoute.snapshot.params['aId'],
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
              const photo = biometricData[index]?.photo || 'assets/dummy.png';

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
            }, 300);
          });
        }
      })
      .catch((err) => {
        console.error('Error fetching all matched data:', err);
        this.isGeneratingPdf = false;
      });
  }

  fetchAllBiometricData(allMatchList: any[]): Promise<any[]> {
    return new Promise((resolve) => {
      const biometricDataArray: any[] = [];

      allMatchList.forEach((match, index) => {
        if (match.biometrics && match.biometrics.length > 0) {
          let photo = 'assets/dummy.png';

          match.biometrics.forEach((biometric: any) => {
            if (
              biometric.biometricType === 'PHOTO' &&
              biometric.biometricData
            ) {
              photo = `data:image/png;base64,${biometric.biometricData}`;
            }
          });

          biometricDataArray[index] = { photo };
        } else {
          biometricDataArray[index] = { photo: 'assets/dummy.png' };
        }
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
