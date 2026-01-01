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
import { ToggleButtonModule } from 'primeng/togglebutton';
import { RadioButtonModule } from 'primeng/radiobutton';

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
    Toast,
    ToggleButtonModule,
    RadioButtonModule,
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
      hasMobileWallet: [false],
      mobileWalletId: [{ value: null, disabled: true }],
      mobileWalletNumber: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
    });

    this.beneficiaryForm.get('hasMobileWallet')?.valueChanges.subscribe(value => {
      const mobileWalletIdControl = this.beneficiaryForm.get('mobileWalletId');
      const mobileWalletNumberControl = this.beneficiaryForm.get('mobileWalletNumber');
      if (value) {
        mobileWalletIdControl?.setValidators([Validators.required]);
        mobileWalletIdControl?.enable();
        mobileWalletNumberControl?.setValidators([Validators.required, Validators.pattern('^[0-9]{9}$')]);
      } else {
        mobileWalletIdControl?.clearValidators();
        mobileWalletIdControl?.disable();
        mobileWalletNumberControl?.clearValidators();
      }
      mobileWalletIdControl?.updateValueAndValidity();
      mobileWalletNumberControl?.updateValueAndValidity();
      this.beneficiaryForm.updateValueAndValidity(); // Ensure parent form validity is updated
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
      this.beneficiaryForm.patchValue({
        hasMobileWallet: this.beneficiaryDetails.hasMobileWallet,
      });

      // Manually enable mobileWalletId control if hasMobileWallet is true
      if (this.beneficiaryDetails.hasMobileWallet) {
        this.beneficiaryForm.get('mobileWalletId')?.enable();
      }

      this.beneficiaryForm.patchValue({
        mobileWalletId: this.beneficiaryDetails.mobileMoneyProvider?.toString() ?? null,
      });

    } catch (err) {
      console.error('Error fetching beneficiary details:', err);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
  private buildFieldUpdatePayload() {
    const formValues = this.beneficiaryForm.value;
    const fieldList: { fieldName: string; fieldValue: any; }[] = [];

    fieldList.push({
      fieldName: 'hasMobileWallet',
      fieldValue: formValues.hasMobileWallet ? 1 : 0,
    });

    if (formValues.hasMobileWallet) {
      fieldList.push({
        fieldName: 'mobileWalletId',
        fieldValue: formValues.mobileWalletId !== null ? parseInt(formValues.mobileWalletId, 10) : null,
      });
      fieldList.push({
        fieldName: 'mobileWalletNumber',
        fieldValue: `+211${formValues.mobileWalletNumber}`,
      });
    } else {
      fieldList.push({
        fieldName: 'mobileWalletId',
        fieldValue: null,
      });
      fieldList.push({
        fieldName: 'mobileWalletNumber',
        fieldValue: null,
      });
    }

    const payload = {
      requestId: null,
      createdBy: this.beneficiaryDetails.createdBy,
      updatedBy: this.beneficiaryDetails.updatedBy,
      householdNumber: this.beneficiaryDetails.applicationId,
      fieldList: fieldList,
    };
    return payload;
  }


  onSubmit() {
    if (!this.beneficiaryForm.valid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fill all the required fields.',
      });
      return;
    }

    const requestBody = this.buildFieldUpdatePayload();
    console.log('Request Body:', requestBody);

    this.isSubmitting = true;
    this.isLoading = true;

    this.api
      .POST('api/beneficiary/update/fields', requestBody)
      .then((res: any) => {
        if (res.status === 200) {
          this.messageService.add({
            severity: 'success',
            summary: 'Update Successful',
            detail: 'Beneficiary wallet information updated successfully!',
          });
          setTimeout(() => this.router.navigate(['/beneficiary/list']), 3000);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: res?.data?.message || 'Unknown error occurred',
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
