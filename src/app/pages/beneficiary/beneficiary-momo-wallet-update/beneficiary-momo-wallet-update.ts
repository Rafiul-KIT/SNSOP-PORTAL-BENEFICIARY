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
import { BeneficiaryDto } from '../../../models/beneficiary';
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

  // ✅ dropdown values are integers 0/1/2
  mobileMoneyOptions = [
    { label: 'Momo', value: 0 },
    { label: 'mGurush', value: 1 },
    { label: 'DigiCash', value: 2 },
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
      mobileWalletId: [{ value: null, disabled: true }], // ✅ number 0/1/2
      mobileWalletNumber: [{ value: '', disabled: true }],
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

  // API returns provider string: MOMO/MGURUSH/DIGICASH
  private providerStringToId(provider?: string | null): number | null {
    if (!provider) return null;

    switch (provider.toUpperCase()) {
      case 'MOMO':
        return 0;
      case 'MGURUSH':
        return 1;
      case 'DIGICASH':
        return 2;
      default:
        return null;
    }
  }

  private updateWalletValidators(hasWallet: boolean): void {
    const mobileWalletIdControl = this.beneficiaryForm.get('mobileWalletId');
    const mobileWalletNumberControl = this.beneficiaryForm.get('mobileWalletNumber');

    if (hasWallet) {
      mobileWalletIdControl?.setValidators([Validators.required]);
      mobileWalletIdControl?.enable({ emitEvent: false });

      mobileWalletNumberControl?.setValidators([
        Validators.required,
        Validators.pattern('^[0-9]{9}$'),
      ]);
      mobileWalletNumberControl?.enable({ emitEvent: false });
    } else {
      mobileWalletIdControl?.clearValidators();
      mobileWalletIdControl?.disable({ emitEvent: false });
      mobileWalletIdControl?.reset(null, { emitEvent: false });

      mobileWalletNumberControl?.clearValidators();
      mobileWalletNumberControl?.disable({ emitEvent: false });
      mobileWalletNumberControl?.reset('', { emitEvent: false });
    }

    mobileWalletIdControl?.updateValueAndValidity({ emitEvent: false });
    mobileWalletNumberControl?.updateValueAndValidity({ emitEvent: false });
  }

  async fetchBeneficiaryDetails(applicationId: string) {
    try {
      const res = await this.api.GET(`api/beneficiary/details/${applicationId}`);
      const dto = res?.data as BeneficiaryDto;

      this.beneficiaryDetails = dto;

      if (dto?.biometrics?.photoData) {
        this.beneficiaryPhoto = 'data:image/png;base64,' + dto.biometrics.photoData;
      }

      // Existing wallet number display
      if (dto?.mobileWalletNumber) {
        let display = dto.mobileWalletNumber;
        if (!display.startsWith('+211')) display = '+211' + display;

        this.beneficiaryForm.patchValue({ currentMomoNumber: display }, { emitEvent: false });
      } else {
        this.beneficiaryForm.patchValue({ currentMomoNumber: '' }, { emitEvent: false });
      }

      // ✅ patch hasWallet and provider (string -> int)
      const providerId = this.providerStringToId(dto?.mobileMoneyProvider);

      this.beneficiaryForm.patchValue(
        {
          hasMobileWallet: !!dto?.hasMobileWallet,
          mobileWalletId: providerId,
        },
        { emitEvent: false }
      );

      // since emitEvent:false, subscription won't fire
      this.updateWalletValidators(!!dto?.hasMobileWallet);

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

    fieldList.push({
      fieldName: 'hasMobileWallet',
      fieldValue: formValues.hasMobileWallet ? 1 : 0,
    });

    if (formValues.hasMobileWallet) {
      fieldList.push({
        fieldName: 'mobileWalletId',
        fieldValue: formValues.mobileWalletId, // ✅ 0/1/2 integer
      });

      fieldList.push({
        fieldName: 'mobileWalletNumber',
        fieldValue: `+211${formValues.mobileWalletNumber}`,
      });
    } else {
      fieldList.push({ fieldName: 'mobileWalletId', fieldValue: null });
      fieldList.push({ fieldName: 'mobileWalletNumber', fieldValue: null });
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
        detail: 'Please fill all required fields.',
      });
      return;
    }

    const requestBody = this.buildFieldUpdatePayload();

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
