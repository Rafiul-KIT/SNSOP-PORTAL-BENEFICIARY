import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import FileSaver from 'file-saver';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { LookupService } from '../../../services/lookup.service';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../services/api.service';

interface Column {
  field: string;
  header: string;
  customExportHeader?: string;
}

interface ExportColumn {
  title: string;
  dataKey: string;
}

@Component({
  selector: 'app-report-match-list',
  standalone: true,
  imports: [TableModule, ButtonModule, TooltipModule, PaginatorModule, DatePipe],
  templateUrl: './report-match-list.html',
  styleUrls: ['./report-match-list.scss'],
})
export class ReportMatchList {
  reportResult = input<any>(null);
  searchCriteria = input<any>(null);
  endpoint = input<string>('');

  cols = signal<Column[]>([]);
  exportColumns = signal<ExportColumn[]>([]);
  matchList = signal<any[]>([]);
  displayedList = signal<any[]>([]);
  isReportGenerating = signal<boolean>(false);
  totalRecords = signal(0);
  rows = signal(10);
  first = signal(0);

  public lookupService = inject(LookupService);
  private apiService = inject(ApiService);

  constructor() {
    effect(() => {
      const result = this.reportResult();
      const criteria = this.searchCriteria();

      if (result) {
        const list = this.extractMatchList(result);
        this.matchList.set(list);
        this.totalRecords.set(this.extractTotalRecords(result, list.length));
        this.rows.set(Number(criteria?.size) > 0 ? Number(criteria.size) : 10);
        this.first.set((Number(criteria?.page) || 0) * this.rows());
        untracked(() => this.sliceList());
      }
    });
  }

  private extractMatchList(result: any): any[] {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.matchList)) return result.matchList;
    if (Array.isArray(result?.data?.matchList)) return result.data.matchList;
    if (Array.isArray(result?.data)) return result.data;
    return [];
  }

  private extractTotalRecords(result: any, fallback: number): number {
    return (
      result?.totalRecords ??
      result?.totalCount ??
      result?.count ??
      result?.data?.totalRecords ??
      result?.data?.totalCount ??
      result?.data?.count ??
      fallback
    );
  }

  private sliceList() {
    const criteria = this.searchCriteria();
    const isServerPaged = !!this.endpoint() && Number(criteria?.size) > 0;

    if (isServerPaged) {
      this.displayedList.set(this.matchList());
      return;
    }

    const start = this.first();
    const end = start + this.rows();
    this.displayedList.set(this.matchList().slice(start, end));
  }

  async handlePageChange(event: PaginatorState) {
    const rows = event.rows ?? 10;
    const first = event.first ?? 0;
    const page = event.page ?? Math.floor(first / rows);

    this.rows.set(rows);
    this.first.set(first);

    const criteria = this.searchCriteria();
    const ep = this.endpoint();

    if (!criteria || !ep) {
      this.sliceList();
      return;
    }

    try {
      this.isReportGenerating.set(true);
      const payload = { ...criteria, page, size: rows };
      const res = await this.apiService.POST(ep, payload);

      if (res.status === 200) {
        const list = this.extractMatchList(res.data);
        this.matchList.set(list);
        this.totalRecords.set(this.extractTotalRecords(res.data, list.length));
        this.displayedList.set(list);
      }
    } catch (err) {
      console.error('Failed to fetch AFIS match report page:', err);
    } finally {
      this.isReportGenerating.set(false);
    }
  }

  private async getAllMatchListForExport(): Promise<any[]> {
    const criteria = this.searchCriteria();
    const ep = this.endpoint();

    if (!criteria || !ep) return this.matchList();

    try {
      const payload = { ...criteria, page: 0, size: -1 };
      const res = await this.apiService.POST(ep, payload);
      if (res.status === 200) {
        return this.extractMatchList(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch all AFIS match report data for export:', err);
    }

    return this.matchList();
  }

  async exportPdf() {
    this.isReportGenerating.set(true);
    const filteredListForPDF: any[] = [];
    const allMatchList = await this.getAllMatchListForExport();

    if (allMatchList.length > 0) {
      allMatchList.forEach((nowMatch: any) => {
        if (nowMatch.matchList?.length > 0) {
          nowMatch.matchList.forEach((matched: any) => {
            const primaryMatchDate = nowMatch.primary.matchCreated
              ? new Date(nowMatch.primary.matchCreated)
              : null;
            const formattedPrimaryMatchDate = primaryMatchDate
              ? `${String(primaryMatchDate.getDate()).padStart(
                  2,
                  '0'
                )}-${String(primaryMatchDate.getMonth() + 1).padStart(
                  2,
                  '0'
                )}-${primaryMatchDate.getFullYear()}`
              : 'N/A';

            const matchedMatchDate = matched.matchCreated
              ? new Date(matched.matchCreated)
              : null;
            const formattedMatchedMatchDate = matchedMatchDate
              ? `${String(matchedMatchDate.getDate()).padStart(
                  2,
                  '0'
                )}-${String(matchedMatchDate.getMonth() + 1).padStart(
                  2,
                  '0'
                )}-${matchedMatchDate.getFullYear()}`
              : 'N/A';

            filteredListForPDF.push({
              primary: '',
              household_number: nowMatch.primary.applicationId,
              type:
                nowMatch.primary.type === 'BENEFICIARY'
                  ? 'BENEFICIARY'
                  : 'ALTERNATE',
              registration_phase:
                this.lookupService.getRegistrationPhaseEnumByValue(
                  nowMatch.primary.registrationPhase
                ),
              first_name: nowMatch.primary.respondentFirstName,
              middle_name: nowMatch.primary.respondentMiddleName,
              last_name: nowMatch.primary.respondentLastName,
              nick_name: nowMatch.primary.nickName,
              age: nowMatch.primary.respondentAge,
              gender: nowMatch.primary.respondentGender,
              phone: nowMatch.primary.respondentPhoneNo,
              state: nowMatch.primary.address
                ? this.lookupService.getStateNameById(
                    nowMatch.primary.address.stateId
                  )
                : 'N/A',
              county: nowMatch.primary.address
                ? this.lookupService.getCountyNameById(
                    nowMatch.primary.address.countyId
                  )
                : 'N/A',
              payam: nowMatch.primary.address
                ? this.lookupService.getPayamNameById(
                    nowMatch.primary.address.payam
                  )
                : 'N/A',
              boma: nowMatch.primary.address
                ? this.lookupService.getBomaNameById(
                    nowMatch.primary.address.boma
                  )
                : 'N/A',
              match_date: formattedPrimaryMatchDate,
              matched_with: '',
              household_number_m: matched.applicationId,
              type_m:
                matched.type === 'BENEFICIARY' ? 'BENEFICIARY' : 'ALTERNATE',
              registration_phase_m:
                this.lookupService.getRegistrationPhaseEnumByValue(
                  matched.registrationPhase
                ),
              first_name_m: matched.respondentFirstName,
              middle_name_m: matched.respondentMiddleName,
              last_name_m: matched.respondentLastName,
              nick_name_m: matched.nickName,
              age_m: matched.respondentAge,
              gender_m: matched.respondentGender,
              phone_m: matched.respondentPhoneNo,
              state_m: matched.address
                ? this.lookupService.getStateNameById(matched.address.stateId)
                : 'N/A',
              county_m: matched.address
                ? this.lookupService.getCountyNameById(matched.address.countyId)
                : 'N/A',
              payam_m: matched.address
                ? this.lookupService.getPayamNameById(matched.address.payam)
                : 'N/A',
              boma_m: matched.address
                ? this.lookupService.getBomaNameById(matched.address.boma)
                : 'N/A',
              match_date_m: formattedMatchedMatchDate,
            });
          });
          filteredListForPDF.push({ primary: '' });
        }
      });

      const jsPDF = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF.default('landscape', 'pt', 'a4');
      (doc as any).autoTable(this.exportColumns(), filteredListForPDF);
      doc.save(`match_list_${Date.now()}.pdf`);
    } else {
      this.isReportGenerating.set(false);
    }
    this.isReportGenerating.set(false);
  }

  async exportExcel() {
    this.isReportGenerating.set(true);
    const filteredListForXL: any[] = [];
    const allMatchList = await this.getAllMatchListForExport();

    if (allMatchList.length > 0) {
      allMatchList.forEach((nowMatch: any) => {
        if (nowMatch.matchList?.length > 0) {
          nowMatch.matchList.forEach((matched: any) => {
            const primaryMatchDate = nowMatch.primary.matchCreated
              ? new Date(nowMatch.primary.matchCreated)
              : null;
            const formattedPrimaryMatchDate = primaryMatchDate
              ? `${String(primaryMatchDate.getDate()).padStart(
                  2,
                  '0'
                )}-${String(primaryMatchDate.getMonth() + 1).padStart(
                  2,
                  '0'
                )}-${primaryMatchDate.getFullYear()}`
              : 'N/A';

            const matchedMatchDate = matched.matchCreated
              ? new Date(matched.matchCreated)
              : null;
            const formattedMatchedMatchDate = matchedMatchDate
              ? `${String(matchedMatchDate.getDate()).padStart(
                  2,
                  '0'
                )}-${String(matchedMatchDate.getMonth() + 1).padStart(
                  2,
                  '0'
                )}-${matchedMatchDate.getFullYear()}`
              : 'N/A';

            filteredListForXL.push({
              PRIMARY: '',
              'Household Number': nowMatch.primary.applicationId,
              Type:
                nowMatch.primary.type === 'BENEFICIARY'
                  ? 'BENEFICIARY'
                  : 'ALTERNATE',
              'Registration Phase':
                nowMatch.primary.registrationPhase === 'AF'
                  ? 'AF (Additional Financing)'
                  : nowMatch.primary.registrationPhase === 'PARENT'
                  ? 'PP (Parent Project)'
                  : nowMatch.primary.registrationPhase === 'RP'
                  ? 'RP'
                  : 'N/A',
              'First Name': nowMatch.primary.respondentFirstName,
              'Middle Name': nowMatch.primary.respondentMiddleName,
              'Last Name': nowMatch.primary.respondentLastName,
              'Nick Name': nowMatch.primary.nickName,
              Age: nowMatch.primary.respondentAge,
              Gender: nowMatch.primary.respondentGender,
              Phone: nowMatch.primary.respondentPhoneNo,
              State: nowMatch.primary.address
                ? this.lookupService.getStateNameById(
                    nowMatch.primary.address.stateId
                  )
                : 'N/A',
              County: nowMatch.primary.address
                ? this.lookupService.getCountyNameById(
                    nowMatch.primary.address.countyId
                  )
                : 'N/A',
              Payam: nowMatch.primary.address
                ? this.lookupService.getPayamNameById(
                    nowMatch.primary.address.payam
                  )
                : 'N/A',
              Boma: nowMatch.primary.address
                ? this.lookupService.getBomaNameById(
                    nowMatch.primary.address.boma
                  )
                : 'N/A',
              'Match Date': formattedPrimaryMatchDate,
              'MATCHED WITH': '',
              'Household Number(M)': matched.applicationId,
              'Type(M)':
                matched.type === 'BENEFICIARY' ? 'BENEFICIARY' : 'ALTERNATE',
              'Registration Phase(M)':
                matched.registrationPhase === 'AF'
                  ? 'AF (Additional Financing)'
                  : matched.registrationPhase === 'PARENT'
                  ? 'PP (Parent Project)': matched.registrationPhase === 'RP'
                  ? 'RP'
                  : 'N/A',
              'First Name(M)': matched.respondentFirstName,
              'Middle Name(M)': matched.respondentMiddleName,
              'Last Name(M)': matched.respondentLastName,
              'Nick Name(M)': matched.nickName,
              'Age(M)': matched.respondentAge,
              'Gender(M)': matched.respondentGender,
              'Phone(M)': matched.respondentPhoneNo,
              'State(M)': matched.address
                ? this.lookupService.getStateNameById(matched.address.stateId)
                : 'N/A',
              'County(M)': matched.address
                ? this.lookupService.getCountyNameById(matched.address.countyId)
                : 'N/A',
              'Payam(M)': matched.address
                ? this.lookupService.getPayamNameById(matched.address.payam)
                : 'N/A',
              'Boma(M)': matched.address
                ? this.lookupService.getBomaNameById(matched.address.boma)
                : 'N/A',
              'Match Date(M)': formattedMatchedMatchDate,
            });
          });
        }
      });

      const xlsx = await import('xlsx');
      const worksheet = xlsx.utils.json_to_sheet(filteredListForXL);
      const workbook = {
        Sheets: { Matchlist: worksheet },
        SheetNames: ['Matchlist'],
      };
      const excelBuffer = xlsx.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });
      this.saveAsExcelFile(excelBuffer, 'matchlist_report-');
    } else {
      this.isReportGenerating.set(false);
    }
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const EXCEL_TYPE =
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const EXCEL_EXTENSION = '.xlsx';
    const data = new Blob([buffer], { type: EXCEL_TYPE });
    FileSaver.saveAs(data, `${fileName}${Date.now()}${EXCEL_EXTENSION}`);
    this.isReportGenerating.set(false);
  }

  ngOnInit() {
    this.cols.set([
      { field: 'primary', header: 'PRIMARY' },
      { field: 'household_number', header: 'Household Number' },
      { field: 'type', header: 'Type' },
      { field: 'registration_phase', header: 'Registration Phase' },
      { field: 'first_name', header: 'First Name' },
      { field: 'middle_name', header: 'Middle Name' },
      { field: 'last_name', header: 'Last Name' },
      { field: 'nick_name', header: 'Nick Name' },
      { field: 'age', header: 'Age' },
      { field: 'gender', header: 'Gender' },
      { field: 'phone', header: 'Phone' },
      { field: 'state', header: 'State' },
      { field: 'county', header: 'County' },
      { field: 'payam', header: 'Payam' },
      { field: 'boma', header: 'Boma' },
      { field: 'match_date', header: 'Match Date' },
      { field: 'matched_with', header: 'MATCHED WITH' },
      { field: 'household_number_m', header: 'Household Number(M)' },
      { field: 'type_m', header: 'Type(M)' },
      { field: 'registration_phase_m', header: 'Registration Phase(M)' },
      { field: 'first_name_m', header: 'First Name(M)' },
      { field: 'middle_name_m', header: 'Middle Name(M)' },
      { field: 'last_name_m', header: 'Last Name(M)' },
      { field: 'nick_name_m', header: 'Nick Name(M)' },
      { field: 'age_m', header: 'Age(M)' },
      { field: 'gender_m', header: 'Gender(M)' },
      { field: 'phone_m', header: 'Phone(M)' },
      { field: 'state_m', header: 'State(M)' },
      { field: 'county_m', header: 'County(M)' },
      { field: 'payam_m', header: 'Payam(M)' },
      { field: 'boma_m', header: 'Boma(M)' },
      { field: 'match_date_m', header: 'Match Date(M)' },
    ]);

    this.exportColumns.set(
      this.cols().map((col) => ({ title: col.header, dataKey: col.field }))
    );

    const result = this.reportResult();
    const list = this.extractMatchList(result);
    this.matchList.set(list);
    this.displayedList.set(list);
    this.totalRecords.set(this.extractTotalRecords(result, list.length));
  }
}
