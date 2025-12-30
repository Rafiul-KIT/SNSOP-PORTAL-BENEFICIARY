import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TabsModule } from 'primeng/tabs';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { InputTextModule } from 'primeng/inputtext';
import { Loader } from '../../../components/loader/loader';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { Toast } from "primeng/toast";
import { BeneficiaryDto } from '../../../models/beneficiary';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-beneficiary-momo-wallet-update',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TabsModule,
    BreadcrumbModule,
    InputTextModule,
    Loader,
    ButtonModule,
    Toast
  ],
  templateUrl: './beneficiary-momo-wallet-update.html',
  styleUrl: './beneficiary-momo-wallet-update.scss',
  providers: [MessageService],
})
export class BeneficiaryMomoWalletUpdate implements OnInit {
  isSubmitting: boolean = false;
  isLoading: boolean = true;
  items = [
    {
      label: 'Beneficiary List',
      icon: 'fas fa-users me-2',
      routerLink: '/beneficiary/momo-list',
    },
    { label: 'MOMO Number Update', icon: 'fas fa-user-plus me-2' },
  ];
  home = { icon: 'fas fa-home me-2', routerLink: '/' };
  beneficiaryForm!: FormGroup;
  beneficiaryDetails!: BeneficiaryDto;
  beneficiaryPhoto = 'images/dummyHuman.jpg';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('bid'); // applicationId from route
    if (!id) return;
    this.beneficiaryForm = this.fb.group({
      currentMomoNumber: [{ value: '', disabled: true }],
      mobileWalletNumber: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
    });
    this.fetchBeneficiaryDetails(id);
  }

  async fetchBeneficiaryDetails(applicationId: string) {
    try {
      const res = await this.api.GET(
        `api/beneficiary/details/${applicationId}`
      );
      const dto = res?.data as BeneficiaryDto;
      this.beneficiaryDetails = dto;

      if (dto.biometrics?.photoData) {
        this.beneficiaryPhoto =
          'data:image/png;base64,' + dto.biometrics.photoData;
      }
      if (this.beneficiaryDetails.mobileWalletNumber) {
        let displayMomo = this.beneficiaryDetails.mobileWalletNumber;
        if (!displayMomo.startsWith('+211')) {
          displayMomo = '+211' + displayMomo;
        }
        this.beneficiaryForm.patchValue({
          currentMomoNumber: displayMomo
        });
      }

    } catch (err) {
      console.error('Error fetching beneficiary details:', err);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
  private buildMomoUpdatePayload(): BeneficiaryDto {
    const wphone = this.beneficiaryForm.value.mobileWalletNumber;
    
    // Create a deep copy to avoid mutating the original object
    const payload: BeneficiaryDto = JSON.parse(JSON.stringify(this.beneficiaryDetails));

    // Update the mobileWalletNumber
    payload.mobileWalletNumber = wphone ? `+211${wphone}` : null;
    
    return payload;
  }

  onSubmit() {
    if (!this.beneficiaryForm.valid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please enter a valid MOMO number.',
      });
      return;
    }

    const singleBeneficiaryPayload = this.buildMomoUpdatePayload();
    const requestBody = { beneficiaries: [singleBeneficiaryPayload] };

    this.isSubmitting = true;
    this.isLoading = true;

    this.api
      .POST('api/beneficiary/update/batch', requestBody)
      .then((res: any) => {
        const responses = res?.bulkResponse || res?.data?.bulkResponse || [];
        if (!responses.length) {
          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: 'No response returned from server.',
          });
          return;
        }
        const first = responses[0];
        if (first.result === 'SUCCESS') {
          this.messageService.add({
            severity: 'success',
            summary: 'Update Successful',
            detail: 'Beneficiary edit request sent successfully!',
          });
          setTimeout(() => this.router.navigate(['/beneficiary/list']), 3000);
        } else if (first.result === 'FAILED') {
          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: first.errorMessage || 'Unknown error occurred',
          });
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Update Status',
            detail: `Unexpected result: ${first.result}`,
          });
        }
      })
      .catch((err) => {
        console.error('Update failed:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Request could not be processed',
        });
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  // keep approve/reject stubs
  onApprove() {
    // TODO: call Approve API with comment
  }

  onReject() {
    // TODO: call Reject API with comment
  }
}
