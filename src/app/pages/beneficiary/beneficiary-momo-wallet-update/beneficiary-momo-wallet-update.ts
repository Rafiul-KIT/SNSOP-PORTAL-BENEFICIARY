// beneficiary-momo-wallet-update.ts

import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
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
import { Toast } from 'primeng/toast';
import { BeneficiaryDto, PaymentMethod } from '../../../models/beneficiary';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';


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
    FloatLabelModule,
    RadioButtonModule,
    SelectModule,
  ],
  templateUrl: './beneficiary-momo-wallet-update.html',
  styleUrl: './beneficiary-momo-wallet-update.scss',
  providers: [MessageService],
})
export class BeneficiaryMomoWalletUpdate implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isSubmitting = false;
  isLoading = true;

  items = [
    {
      label: 'Beneficiary list',
      icon: 'fas fa-users',
      routerLink: '/beneficiary/momo-list',
    },
    { label: 'Wallet Number Update', icon: 'fas fa-user-cog' },
  ];

  home = { icon: 'fas fa-home', routerLink: '/' };

  beneficiaryForm!: FormGroup;
  beneficiaryDetails!: BeneficiaryDto;

  // properties to store initial state
  private initialHasMobileWallet: boolean = false;
  private initialMobileMoneyProvider: string | null = null;
  private initialMobileWalletNumber: string | null = null;
  private initialPaymentMethod: 'cash' | 'mobile_wallet' = 'cash';

  beneficiaryPhoto = 'images/dummyHuman.jpg';

  mobileMoneyOptions = [
    { label: 'Momo', value: 'MOMO' },
    { label: 'mGurush', value: 'MGURUSH' },
    { label: 'DigiCash', value: 'DIGICASH' },
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('bid');

    if (!id) {
      this.isLoading = false;
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing ID',
        detail: 'Beneficiary ID not found in route.',
      });
      return;
    }

    this.beneficiaryForm = this.fb.group({
      currentMomoNumber: [{ value: '', disabled: true }],
      hasMobileWallet: [false], // ✅ boolean
      mobileMoneyProvider: [{ value: null, disabled: true }],
      mobileWalletNumber: [{ value: '', disabled: true }],
      paymentMethod: ['cash', Validators.required],
    });

    this.beneficiaryForm
      .get('hasMobileWallet')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value: boolean) => {
        this.updateWalletValidators(value);
        this.beneficiaryForm.updateValueAndValidity();
      });

    this.fetchBeneficiaryDetails(id);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateWalletValidators(hasWallet: boolean): void {
    const mobileMoneyProviderControl = this.beneficiaryForm.get('mobileMoneyProvider');
    const mobileWalletNumberControl = this.beneficiaryForm.get('mobileWalletNumber');
    const paymentMethodControl = this.beneficiaryForm.get('paymentMethod');

    if (hasWallet) {
      mobileMoneyProviderControl?.setValidators([Validators.required]);
      mobileMoneyProviderControl?.enable({ emitEvent: false });

      mobileWalletNumberControl?.setValidators([
        Validators.pattern('^[0-9]{9}$'),
      ]);
      mobileWalletNumberControl?.enable({ emitEvent: false });

      paymentMethodControl?.enable({ emitEvent: false });
    } else {
      mobileMoneyProviderControl?.clearValidators();
      mobileMoneyProviderControl?.disable({ emitEvent: false });
      mobileMoneyProviderControl?.reset(null, { emitEvent: false });

      mobileWalletNumberControl?.clearValidators();
      mobileWalletNumberControl?.disable({ emitEvent: false });
      mobileWalletNumberControl?.reset('', { emitEvent: false });

      paymentMethodControl?.setValue('cash', { emitEvent: false });
      paymentMethodControl?.disable({ emitEvent: false });
    }

    mobileMoneyProviderControl?.updateValueAndValidity({ emitEvent: false });
    mobileWalletNumberControl?.updateValueAndValidity({ emitEvent: false });
    paymentMethodControl?.updateValueAndValidity({ emitEvent: false });
  }

  isUnchanged(): boolean {
    const formValues = this.beneficiaryForm.getRawValue();

    if (formValues.hasMobileWallet !== this.initialHasMobileWallet) return false;
    if (formValues.paymentMethod !== this.initialPaymentMethod) return false;
    if (formValues.mobileMoneyProvider !== this.initialMobileMoneyProvider) return false;
    if (formValues.mobileWalletNumber.trim() !== '') return false; // a new number has been entered

    return true; // if we reach here, nothing has changed
  }

  async fetchBeneficiaryDetails(applicationId: string) {
    try {
      const res = await this.api.GET(`api/beneficiary/details/${applicationId}`);
      const dto = res?.data as BeneficiaryDto;

      this.beneficiaryDetails = dto;

      // --- Unified State Initialization ---
      // This block sets the initial state and patches the form in one go to ensure consistency.

      // 1. Determine Payment Method (with default)
      let paymentMethod: 'cash' | 'mobile_wallet' = 'cash'; // Default to 'cash'
      if (dto.paymentMethod === 'MOBILE_WALLET') {
        paymentMethod = 'mobile_wallet';
      }

      // 2. Determine other wallet values
      const hasMobileWallet = !!dto?.hasMobileWallet;
      const provider = dto?.mobileMoneyProvider || null;
      const mobileWalletNumber = dto?.mobileWalletNumber || null;
      let currentMomoDisplay = '';
      if (mobileWalletNumber) {
        currentMomoDisplay = mobileWalletNumber.startsWith('+211')
          ? mobileWalletNumber
          : `+211${mobileWalletNumber}`;
      }

      // 3. Store all initial values
      this.initialHasMobileWallet = hasMobileWallet;
      this.initialMobileMoneyProvider = provider;
      this.initialMobileWalletNumber = mobileWalletNumber;
      this.initialPaymentMethod = paymentMethod;

      // 4. Patch the form with the same values
      this.beneficiaryForm.patchValue({
        hasMobileWallet: hasMobileWallet,
        mobileMoneyProvider: provider,
        currentMomoNumber: currentMomoDisplay,
        paymentMethod: paymentMethod,
      }, { emitEvent: false });

      // 5. Set photo and update validators
      if (dto?.biometrics?.photoData) {
        this.beneficiaryPhoto = 'data:image/png;base64,' + dto.biometrics.photoData;
      }
      this.updateWalletValidators(hasMobileWallet);

      this.beneficiaryForm.updateValueAndValidity({ emitEvent: false });
    } catch (err) {
      console.error('Error fetching beneficiary details:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Load Failed',
        detail: 'Could not load beneficiary details.',
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private buildFieldUpdatePayload() {
    const formValues = this.beneficiaryForm.getRawValue();
    const fieldList: { fieldName: string; fieldValue: any }[] = [];

    // 1. Check hasMobileWallet
    if (formValues.hasMobileWallet !== this.initialHasMobileWallet) {
      fieldList.push({
        fieldName: 'hasMobileWallet',
        fieldValue: formValues.hasMobileWallet ? 1 : 0,
      });
    }

    // 2. Check paymentMethod
    if (formValues.paymentMethod !== this.initialPaymentMethod) {
      let paymentMethodForApi: PaymentMethod = 'CASH';
      if (formValues.paymentMethod === 'mobile_wallet') {
        paymentMethodForApi = 'MOBILE_WALLET';
      }
      fieldList.push({
        fieldName: 'paymentMethod',
        fieldValue: paymentMethodForApi,
      });
    }

    // 3. Check mobileMoneyProvider - only if hasMobileWallet is true
    if (formValues.hasMobileWallet && formValues.mobileMoneyProvider !== this.initialMobileMoneyProvider) {
      fieldList.push({
        fieldName: 'mobileMoneyProvider',
        fieldValue: formValues.mobileMoneyProvider,
      });
    }

    // 4. Check for a new mobileWalletNumber
    if (formValues.hasMobileWallet && formValues.mobileWalletNumber.trim() !== '') {
      fieldList.push({
        fieldName: 'mobileWalletNumber',
        fieldValue: `+211${formValues.mobileWalletNumber}`,
      });
    }

    // If hasMobileWallet was turned off, we need to null out the wallet fields
    if (this.initialHasMobileWallet && !formValues.hasMobileWallet) {
        fieldList.push({ fieldName: 'mobileMoneyProvider', fieldValue: null });
        fieldList.push({ fieldName: 'mobileWalletNumber', fieldValue: null });
    }

    if (fieldList.length === 0) {
      return null; // No changes detected
    }

    return {
      requestId: null,
      createdBy: this.beneficiaryDetails?.createdBy ?? null,
      updatedBy: this.beneficiaryDetails?.updatedBy ?? null,
      householdNumber: this.beneficiaryDetails?.applicationId,
      fieldList,
    };
  }

  onSubmit() {
    if (!this.beneficiaryForm.valid) {
      this.beneficiaryForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fill all required fields correctly.',
      });
      return;
    }

    const requestBody = this.buildFieldUpdatePayload();

    if (!requestBody) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Changes',
        detail: 'No changes detected to update.',
      });
      return;
    }

    this.isSubmitting = true;
    this.isLoading = true;

    this.api
      .POST('api/beneficiary/update/fields', requestBody)
      .then((res: any) => {
        if (res?.status === 200) {
          this.messageService.add({
            severity: 'success',
            summary: 'Update Successful',
            detail: 'Beneficiary wallet information updated successfully!',
          });
          setTimeout(() => this.router.navigate(['/beneficiary/momo-list']), 1500);
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
        this.isSubmitting = false;
        this.cdr.detectChanges();
      });
  }

  onApprove() {}
  onReject() {}
}
