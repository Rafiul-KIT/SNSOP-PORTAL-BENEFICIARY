import { Component, effect, inject, input, OnInit, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { LookupService } from '../../../services/lookup.service';
import { ApiService } from '../../../services/api.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { saveAs } from 'file-saver'; // Import saveAs

interface Column {
  field: string;
  header: string;
}

@Component({
  selector: 'app-report-payment-method-wise-beneficiary-list',
  standalone: true,
  imports: [CommonModule, PaginatorModule, TableModule, ButtonModule],
  templateUrl: './report-payment-method-wise-beneficiary-list.html',
  styleUrl: './report-payment-method-wise-beneficiary-list.scss',
})
export class ReportPaymentMethodWiseBeneficiaryList implements OnInit {
  reportResult = input<any>(null);
  searchCriteria = input<any>(null);
  endpoint = input<string>('');

  cols = signal<Column[]>([]);
  beneficiaryList = signal<any[]>([]);
  displayedList = signal<any[]>([]);

  totalRecords = signal(0);
  rows = signal(10);
  first = signal(0);

  public lookupService = inject(LookupService);
  private apiService = inject(ApiService);

  constructor() {
    effect(() => {
      const result = this.reportResult();
      if (result && result.beneficiaries) {
        this.beneficiaryList.set(result.beneficiaries ?? []);
        this.totalRecords.set(result.totalCount ?? 0);
        this.first.set(0);
        untracked(() => this.sliceList());
      } else {
        this.beneficiaryList.set([]);
        this.totalRecords.set(0);
        this.first.set(0);
        untracked(() => this.sliceList());
      }
    });
  }

  ngOnInit(): void {
    this.cols.set([
      { field: 'householdNumber', header: 'Household Number' },
      { field: 'name', header: 'Name' },
      { field: 'gender', header: 'Gender' },
      { field: 'age', header: 'Age' },
      { field: 'phoneNumber', header: 'Phone Number' },
      { field: 'supportType', header: 'Support Type' },
      { field: 'paymentMethod', header: 'Payment Method' },
      { field: 'mobilePaymentProvider', header: 'Mobile Payment Provider' },
      { field: 'mobileWalletNumber', header: 'Mobile Wallet Number' },
    ]);
  }

  sliceList() {
    const start = this.first();
    const end = start + this.rows();
    this.displayedList.set(this.beneficiaryList().slice(start, end));
  }

  handlePageChange(event: PaginatorState) {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? 10);
    this.sliceList();
  }

  downloadPdf(): void {
  const payload = { ...this.searchCriteria() };
  payload.stateId = payload.stateId ? parseInt(payload.stateId, 10) : null;
  payload.countyId = payload.countyId ? parseInt(payload.countyId, 10) : null;
  payload.payamId = payload.payamId ? parseInt(payload.payamId, 10) : null;
  payload.bomaId = payload.bomaId ? parseInt(payload.bomaId, 10) : null;

  this.apiService.POST('api/report/payment-method-wise-report/pdf', payload, 'global', { responseType: 'blob' })
    .then((res: any) => {
      const blob = new Blob([res.data], { type: 'application/pdf' }); // ← res.data not res
      saveAs(blob, `payment_method_wise_beneficiary_report_${Date.now()}.pdf`);
    })
    .catch((err: any) => {
      console.error('Error downloading PDF:', err);
    });
}

  downloadCsv(): void {
  const payload = { ...this.searchCriteria() };
  payload.stateId = payload.stateId ? parseInt(payload.stateId, 10) : null;
  payload.countyId = payload.countyId ? parseInt(payload.countyId, 10) : null;
  payload.payamId = payload.payamId ? parseInt(payload.payamId, 10) : null;
  payload.bomaId = payload.bomaId ? parseInt(payload.bomaId, 10) : null;

  this.apiService.POST('api/report/payment-method-wise-report/csv', payload, 'global', { responseType: 'blob' })
    .then((res: any) => {
      const blob = new Blob([res.data], { type: 'text/csv' }); // ← res.data not res
      saveAs(blob, `payment_method_wise_beneficiary_report_${Date.now()}.csv`);
    })
    .catch((err: any) => {
      console.error('Error downloading CSV:', err);
    });
}
}
