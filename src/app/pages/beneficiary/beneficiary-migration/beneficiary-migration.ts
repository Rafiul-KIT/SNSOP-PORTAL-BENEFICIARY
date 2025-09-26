import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TabsModule } from 'primeng/tabs';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { InputTextModule } from 'primeng/inputtext';
import { Loader } from '../../../components/loader/loader';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { LookupService, LookupItem } from '../../../services/lookup.service';
import { Toast } from "primeng/toast";
import { BeneficiaryDto } from '../../../models/beneficiary';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-beneficiary-migration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TabsModule,
    BreadcrumbModule,
    InputTextModule,
    SelectModule,
    Loader,
    ButtonModule,
    Toast
  ],
  templateUrl: './beneficiary-migration.html',
  styleUrl: './beneficiary-migration.scss',
})
export class BeneficiaryMigration implements OnInit {
  isSubmitting: boolean = false;
  isLoading: boolean = true;
  items = [
    {
      label: 'Beneficiary List',
      icon: 'fas fa-users me-2',
      routerLink: '/beneficiary/list',
    },
    { label: 'Migrate Beneficiary', icon: 'fas fa-user-plus me-2' },
  ];
  home = { icon: 'fas fa-home me-2', routerLink: '/' };
  beneficiaryForm!: FormGroup;
  beneficiaryDetails!: BeneficiaryDto;
  beneficiaryPhoto = '/images/dummyHuman.jpg';

  // Lookup dropdowns
  stateList: LookupItem[] = [];
  countyList: LookupItem[] = [];
  payamList: LookupItem[] = [];
  bomaList: LookupItem[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private api: ApiService,
    private lookup: LookupService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('bid'); // applicationId from route
    if (!id) return;
    this.beneficiaryForm = this.fb.group({
      state: [''],
      county: [''],
      payam: [''],
      boma: [''],
      gpsLat: [''],
      gpsLong: [''],
      approvalComment: [''],
    });
    this.setupLocationListeners();
    // step 1: load states first
    this.lookup.getOrFetchStateList().then((states) => {
      this.stateList = states;
      // step 2: fetch beneficiary details AFTER we have states
      this.fetchBeneficiaryDetails(id);
    });
  }

  private setupLocationListeners() {
    this.beneficiaryForm
      .get('state')
      ?.valueChanges.subscribe((stateId: string) => {
        if (stateId) {
          this.lookup.getCountyListByStateId(stateId).then((list) => {
            this.countyList = list;
            this.beneficiaryForm.patchValue(
              { county: null, payam: null, boma: null },
              { emitEvent: false }
            );
            this.payamList = [];
            this.bomaList = [];
          });
        } else {
          this.countyList = [];
          this.payamList = [];
          this.bomaList = [];
        }
      });

    this.beneficiaryForm
      .get('county')
      ?.valueChanges.subscribe((countyId: string) => {
        if (countyId) {
          this.lookup.getPayamListByCountyId(countyId).then((list) => {
            this.payamList = list;
            this.beneficiaryForm.patchValue(
              { payam: null, boma: null },
              { emitEvent: false }
            );
            this.bomaList = [];
          });
        } else {
          this.payamList = [];
          this.bomaList = [];
        }
      });

    this.beneficiaryForm
      .get('payam')
      ?.valueChanges.subscribe((payamId: string) => {
        if (payamId) {
          this.lookup.getBomaListByPayamId(payamId).then((list) => {
            this.bomaList = list;
            this.beneficiaryForm.patchValue(
              { boma: null },
              { emitEvent: false }
            );
          });
        } else {
          this.bomaList = [];
        }
      });
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

      if (dto.address) {
        this.beneficiaryForm.patchValue(
          {
            gpsLat: dto.address.location?.lat ?? '',
            gpsLong: dto.address.location?.lon ?? '',
          },
          { emitEvent: false }
        );

        // ✅ cast to string so it matches lookup.id
        if (dto.address.stateId != null) {
          this.beneficiaryForm.patchValue(
            { state: String(dto.address.stateId) },
            { emitEvent: false }
          );
          this.countyList = await this.lookup.getCountyListByStateId(
            String(dto.address.stateId)
          );
        }

        if (dto.address.countyId != null) {
          this.beneficiaryForm.patchValue(
            { county: String(dto.address.countyId) },
            { emitEvent: false }
          );
          this.payamList = await this.lookup.getPayamListByCountyId(
            String(dto.address.countyId)
          );
        }

        if (dto.address.payam != null) {
          this.beneficiaryForm.patchValue(
            { payam: String(dto.address.payam) },
            { emitEvent: false }
          );
          this.bomaList = await this.lookup.getBomaListByPayamId(
            String(dto.address.payam)
          );
        }

        if (dto.address.boma) {
          this.beneficiaryForm.patchValue(
            { boma: dto.address.boma },
            { emitEvent: false }
          );
        }
      }
    } catch (err) {
      console.error('Error fetching beneficiary details:', err);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private buildUpdatePayload(formValue: any): BeneficiaryDto {
    const updatedGeo = formValue;

    return {
      ...this.beneficiaryDetails,
      address: {
        ...this.beneficiaryDetails.address,
        stateId: updatedGeo.state,
        countyId: updatedGeo.county,
        payam: updatedGeo.payam,
        boma: updatedGeo.boma,
        location: {
          lat: updatedGeo.gpsLat,
          lon: updatedGeo.gpsLong,
        },
      },
    };
  }
onSubmit() {
  if (!this.beneficiaryForm.valid) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Validation',
      detail: 'Please fill out all required fields.'
    });
    return;
  }

  const beneficiary = this.buildUpdatePayload(this.beneficiaryForm.value);
  const payload = { beneficiaries: [beneficiary] };

  this.isLoading = true;

  this.api
    .POST('api/beneficiary/migration/batch', payload)
    .then((res: any) => {
      console.log('API raw response:', res);

      // Handle both axios-style (res.data) and fetch-style (res directly)
      const responses = res?.bulkResponse || res?.data?.bulkResponse || [];

      if (!responses.length) {
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'No response returned from server.'
        });
        return;
      }

      // Assuming one beneficiary per request
      const first = responses[0];

      if (first.result === 'SUCCESS') {
        this.messageService.add({
          severity: 'success',
          summary: 'Migration Successful',
          detail: 'Beneficiary migration request sent successfully!'
        });
        setTimeout(() => {
          this.router.navigate(['/beneficiary/list']);
        }, 3000);
      } else if (first.result === 'FAILED') {
        this.messageService.add({
          severity: 'error',
          summary: 'Migration Failed',
          detail: first.errorMessage || 'Unknown error occurred'
        });
      } else {
        this.messageService.add({
          severity: 'warn',
          summary: 'Update Status',
          detail: `Unexpected result: ${first.result}`
        });
      }
    })
    .catch((err) => {
      console.error('Update failed:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Migration Failed',
        detail: 'Request could not be processed'
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
