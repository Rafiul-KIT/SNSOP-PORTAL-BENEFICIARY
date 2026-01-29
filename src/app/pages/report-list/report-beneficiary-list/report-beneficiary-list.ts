import { Component, effect, inject, input, output, signal } from '@angular/core';

import { saveAs } from 'file-saver';

import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { LookupService } from '../../../services/lookup.service';

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
  selector: 'app-report-beneficiary-list',
  standalone: true,
  imports: [PaginatorModule],
  templateUrl: './report-beneficiary-list.html',
  styleUrls: ['./report-beneficiary-list.scss'],
})
export class ReportBeneficiaryList {
  reportResult = input<any>(null);
  onPageChange = output<PaginatorState>();

  cols = signal<Column[]>([]);
  exportColumns = signal<ExportColumn[]>([]);
  beneficiaryList = signal<any[]>([]);

  totalRecords = signal(0);
  rows = signal(10);
  first = signal(0);

  public lookupService = inject(LookupService);

  constructor() {
    effect(() => {
      const result = this.reportResult();
      if (result) {
        this.beneficiaryList.set(result.data ?? []);
        this.totalRecords.set(result.totalCount ?? 0);
      }
    });
  }

  private async createPdfDoc() {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: 'a4',
    });

    const pdfColumns = [
      { header: 'Application ID', dataKey: 'applicationId' },
      { header: 'Respondent First Name', dataKey: 'respondentFirstName' },
      { header: 'Respondent Middle Name', dataKey: 'respondentMiddleName' },
      { header: 'Respondent Last Name', dataKey: 'respondentLastName' },
      { header: 'Respondent Nick Name', dataKey: 'respondentNickName' },
      { header: 'Respondent Gender', dataKey: 'respondentGender' },
      { header: 'Respondent Age', dataKey: 'respondentAge' },
      { header: 'Registration Phase', dataKey: 'registrationPhase' },
      { header: 'State', dataKey: 'state' },
      { header: 'County', dataKey: 'county' },
      { header: 'Payam', dataKey: 'payam' },
      { header: 'Boma', dataKey: 'boma' },
    ];

    const bodyData = this.beneficiaryList().map((beneficiary) => ({
      applicationId: beneficiary.applicationId,
      respondentFirstName: beneficiary.respondentFirstName,
      respondentMiddleName: beneficiary.respondentMiddleName,
      respondentLastName: beneficiary.respondentLastName,
      respondentNickName: beneficiary.respondentNickName,
      respondentGender: this.lookupService.getGenderEnumByValue(
        beneficiary.respondentGender
      ),
      respondentAge: beneficiary.respondentAge,
      registrationPhase: beneficiary.registrationPhase,
      state:
        this.lookupService.getStateNameById(beneficiary.address?.stateId) ??
        '-',
      county:
        this.lookupService.getCountyNameById(beneficiary.address?.countyId) ??
        '-',
      payam:
        this.lookupService.getPayamNameById(beneficiary.address?.payam) ?? '-',
      boma:
        this.lookupService.getBomaNameById(beneficiary.address?.boma) ?? '-',
    }));

    autoTable(doc, {
      columns: pdfColumns,
      body: bodyData,
    });

    return doc;
  }

  async previewPdf() {
    const doc = await this.createPdfDoc();
    doc.output('dataurlnewwindow');
  }

  // Export to PDF
  async exportPdf() {
    const doc = await this.createPdfDoc();
    doc.save(`beneficiary_list_${Date.now()}.pdf`);
  }

  // Export to Excel
  async exportExcel() {
    const filteredListForXL: any[] = [];
    this.beneficiaryList().forEach((elem: any) => {
      const selectionReasonList = elem.selectionReason || [];
      const selectionReasonValues: string[] = selectionReasonList.map(
        (reason: string, idx: number) =>
          `${idx + 1}. ${this.lookupService.getSelectionReasonEnumByValue(reason)}`
      );

      let columns: any = {
        "State Name": this.lookupService.getStateNameById(elem.address?.stateId) ?? '',
        "County Name": this.lookupService.getCountyNameById(elem.address?.countyId) ?? '',
        "Payam Name": this.lookupService.getPayamNameById(elem.address?.payam) ?? '',
        "Boma Name": this.lookupService.getBomaNameById(elem.address?.boma) ?? '',
        "Application ID": elem.applicationId ?? '',
        "Respondent First Name": elem.respondentFirstName ?? '',
        "Respondent Middle Name": elem.respondentMiddleName ?? '',
        "Respondent Last Name": elem.respondentLastName ?? '',
        "Respondent Nick Name": elem.respondentNickName ?? '',
        "Respondent relationship to the household head": elem.relationshipOther ? elem.relationshipOther : (this.lookupService.getRelationshipEnumByValue(elem.relationshipWithHouseholdHead) ?? ''),
        "Age": elem.respondentAge ?? '',
        "Registration Phase": elem.registrationPhase ?? '',
        "Respondent gender": elem.respondentGender ?? '',
        "Do you have an ID": elem.respondentId ? 'true' : 'false',
        "What type of ID": elem.documentTypeOther ? elem.documentTypeOther : (this.lookupService.getDocumentTypeEnumByValue(elem.documentType) ?? ''),
        "ID number": elem.respondentId ?? '',
        "Respondent Phone Number": elem.respondentPhoneNo ?? '',
        "Household Main Source of Income": elem.incomeSourceOther ? elem.incomeSourceOther : (this.lookupService.getHouseHoldIncomeSourceByValue(elem.householdIncomeSource) ?? ''),
        "Household Monthly Average Income (In SSP)": elem.householdMonthlyAvgIncome ?? '',
        "Respondent Marital Status": this.lookupService.getMaritalStatusEnumByValue(elem.respondentMaritalStatus) ?? '',
        "Respondent Legal Status": this.lookupService.getLegalStatusEnumByValue(elem.respondentLegalStatus) ?? '',
        "Support type": this.lookupService.getSelectionCriteriaEnumByValue(elem.selectionCriteria) ?? '',
        "Reason for support type": selectionReasonValues.toString(),
        "Household Size": elem.householdSize ?? '',

        "Total males between 0-2 yrs": elem.householdMember2?.maleTotal ?? '',
        "Total males between 3-5 yrs": elem.householdMember5?.maleTotal ?? '',
        "Total males between 6-17 yrs": elem.householdMember17?.maleTotal ?? '',
        "Total males between 18-35 yrs": elem.householdMember35?.maleTotal ?? '',
        "Total males between 36-64 yrs": elem.householdMember64?.maleTotal ?? '',
        "Total males between 65 yrs or above": elem.householdMember65?.maleTotal ?? '',

        "Total females between 0-2 yrs": elem.householdMember2?.femaleTotal ?? '',
        "Total females between 3-5 yrs": elem.householdMember5?.femaleTotal ?? '',
        "Total females between 6-17 yrs": elem.householdMember17?.femaleTotal ?? '',
        "Total females between 18-35 yrs": elem.householdMember35?.femaleTotal ?? '',
        "Total lactating females between 18-35 yrs": elem.householdMemberLactating35?.femaleTotal ?? '',
        "Total females between 36-64 yrs": elem.householdMember64?.femaleTotal ?? '',
        "Total lactating females between 36-64 yrs": elem.householdMemberLactating64?.femaleTotal ?? '',
        "Total females between 65 yrs or above": elem.householdMember65?.femaleTotal ?? '',

        "Disabled males between 0-2 yrs": elem.householdMember2?.maleDisable ?? '',
        "Disabled males between 3-5 yrs": elem.householdMember5?.maleDisable ?? '',
        "Disabled males between 6-17 yrs": elem.householdMember17?.maleDisable ?? '',
        "Disabled males between 18-35 yrs": elem.householdMember35?.maleDisable ?? '',
        "Disabled males between 36-64 yrs": elem.householdMember64?.maleDisable ?? '',
        "Disabled males between 65 yrs or above": elem.householdMember65?.maleDisable ?? '',

        "Disabled females between 0-2 yrs": elem.householdMember2?.femaleDisable ?? '',
        "Disabled females between 3-5 yrs": elem.householdMember5?.femaleDisable ?? '',
        "Disabled females between 6-17 yrs": elem.householdMember17?.femaleDisable ?? '',
        "Disabled females between 18-35 yrs": elem.householdMember35?.femaleDisable ?? '',
        "Disabled females between 36-64 yrs": elem.householdMember64?.femaleDisable ?? '',
        "Disabled females between 65 yrs or above": elem.householdMember65?.femaleDisable ?? '',

        "Chronically ill males between 0-2 yrs": elem.householdMember2?.maleChronicalIll ?? '',
        "Chronically ill males between 3-5 yrs": elem.householdMember5?.maleChronicalIll ?? '',
        "Chronically ill males between 6-17 yrs": elem.householdMember17?.maleChronicalIll ?? '',
        "Chronically ill males between 18-35 yrs": elem.householdMember35?.maleChronicalIll ?? '',
        "Chronically ill males between 36-64 yrs": elem.householdMember64?.maleChronicalIll ?? '',
        "Chronically ill males between 65 yrs or above": elem.householdMember65?.maleChronicalIll ?? '',

        "Chronically ill females between 0-2 yrs": elem.householdMember2?.femaleChronicalIll ?? '',
        "Chronically ill females between 3-5 yrs": elem.householdMember5?.femaleChronicalIll ?? '',
        "Chronically ill females between 6-17 yrs": elem.householdMember17?.femaleChronicalIll ?? '',
        "Chronically ill females between 18-35 yrs": elem.householdMember35?.femaleChronicalIll ?? '',
        "Chronically ill females between 36-64 yrs": elem.householdMember64?.femaleChronicalIll ?? '',
        "Chronically ill females between 65 yrs or above": elem.householdMember65?.femaleChronicalIll ?? '',

        "Both disabled and chronically ill males between 0-2 yrs": elem.householdMember2?.maleBoth ?? '',
        "Both disabled and chronically ill males between 3-5 yrs": elem.householdMember5?.maleBoth ?? '',
        "Both disabled and chronically ill males between 6-17 yrs": elem.householdMember17?.maleBoth ?? '',
        "Both disabled and chronically ill males between 18-35 yrs": elem.householdMember35?.maleBoth ?? '',
        "Both disabled and chronically ill males between 36-64 yrs": elem.householdMember64?.maleBoth ?? '',
        "Both disabled and chronically ill males between 65 yrs or above": elem.householdMember65?.maleBoth ?? '',

        "Both disabled and chronically ill females between 0-2 yrs": elem.householdMember2?.femaleBoth ?? '',
        "Both disabled and chronically ill females between 3-5 yrs": elem.householdMember5?.femaleBoth ?? '',
        "Both disabled and chronically ill females between 6-17 yrs": elem.householdMember17?.femaleBoth ?? '',
        "Both disabled and chronically ill females between 18-35 yrs": elem.householdMember35?.femaleBoth ?? '',
        "Both disabled and chronically ill females between 36-64 yrs": elem.householdMember64?.femaleBoth ?? '',
        "Both disabled and chronically ill females between 65 yrs or above": elem.householdMember65?.femaleBoth ?? '',

        "Does respondent read and write": elem.isReadWrite ?? '',
        "How many members in the HH are between 18 and 35 and can read and write": elem.memberReadWrite ?? '',

        "Alternate One Household Name": "-",
        "Alternate One First Name": elem.alternatePayee1?.payeeFirstName ?? '',
        "Alternate One Middle Name": elem.alternatePayee1?.payeeMiddleName ?? '',
        "Alternate One Last Name": elem.alternatePayee1?.payeeLastName ?? '',
        "Alternate One Nick Name": elem.alternatePayee1?.payeeNickName ?? '',
        "Alternate One Age": elem.alternatePayee1?.payeeAge ?? '',
        "Alternate One Do you have an ID": elem.alternatePayee1?.nationalId ? 'true' : 'false',
        "Alternate One What type of ID": elem.documentTypeOther ? elem.documentTypeOther : (this.lookupService.getDocumentTypeEnumByValue(elem.alternatePayee1?.documentType) ?? ''),
        "Alternate One ID number": elem.alternatePayee1?.nationalId ?? '',
        "Alternate One Phone Number": elem.alternatePayee1?.payeePhoneNo ?? '',
        "Alternate One Relationship": elem.relationshipOther ? elem.relationshipOther : (this.lookupService.getRelationshipEnumByValue(elem.alternatePayee1?.relationshipWithHouseholdHead) ?? ''),
        "Alternate One Gender": elem.alternatePayee1?.payeeGender ?? '',

        "Alternate Two Household Name": "-",
        "Alternate Two First Name": elem.alternatePayee2?.payeeFirstName ?? '',
        "Alternate Two Middle Name": elem.alternatePayee2?.payeeMiddleName ?? '',
        "Alternate Two Last Name": elem.alternatePayee2?.payeeLastName ?? '',
        "Alternate Two Nick Name": elem.alternatePayee2?.payeeNickName ?? '',
        "Alternate Two Age": elem.alternatePayee2?.payeeAge ?? '',
        "Alternate Two Do you have an ID": elem.alternatePayee2?.nationalId ? 'true' : 'false',
        "Alternate Two What type of ID": elem.documentTypeOther ? elem.documentTypeOther : (this.lookupService.getDocumentTypeEnumByValue(elem.alternatePayee2?.documentType) ?? ''),
        "Alternate Two ID number": elem.alternatePayee2?.nationalId ?? '',
        "Alternate Two Phone Number": elem.alternatePayee2?.payeePhoneNo ?? '',
        "Alternate Two Relationship": elem.relationshipOther ? elem.relationshipOther : (this.lookupService.getRelationshipEnumByValue(elem.alternatePayee2?.relationshipWithHouseholdHead) ?? ''),
        "Alternate Two Gender": elem.alternatePayee2?.payeeGender ?? '',

        "Would anyone in Household be interested in participating?": elem.isOtherMemberPerticipating ?? '',
        "Reason for why not": elem.notPerticipationOtherReason ? elem.notPerticipationOtherReason : (this.lookupService.getNotParticipationReasonEnumByValue(elem.notPerticipationReason) ?? ''),
      };

      if (elem.nominees != null && elem.nominees.length > 0) {
        elem.nominees.forEach((nomi: any, indx: number) => {
          // columns[`Nominee_${indx + 1} Application ID`] = nomi?.applicationId ?? '';
          // columns[`Nominee_${indx + 1} Index`] = nomi?.nomineeIndex ?? '';
          columns[`Nominee_${indx + 1} First Name`] = nomi?.nomineeFirstName ?? '';
          columns[`Nominee_${indx + 1} Middle Name`] = nomi?.nomineeMiddleName ?? '';
          columns[`Nominee_${indx + 1} Last Name`] = nomi?.nomineeLastName ?? '';
          columns[`Nominee_${indx + 1} Nick Name`] = nomi?.nomineeNickName ?? '';
          columns[`Nominee_${indx + 1} Relationship to the household head`] = nomi?.relationshipOther ? nomi.relationshipOther : (this.lookupService.getRelationshipEnumByValue(nomi?.relationshipWithHouseholdHead) ?? '');
          columns[`Nominee_${indx + 1} Age`] = nomi?.nomineeAge ?? '';
          columns[`Nominee_${indx + 1} Gender`] = nomi?.nomineeGender ?? '';
          columns[`Nominee_${indx + 1} Popup Response`] = nomi?.nomineePopupResponse ?? '';
          columns[`Nominee_${indx + 1} Does nominee read and write`] = nomi?.isReadWrite ?? '';
          columns[`Nominee_${indx + 1} Occupation`] = nomi?.otherOccupation ? nomi.otherOccupation : (this.lookupService.getNomineeOccupationEnumByValue(nomi?.nomineeOccupation) ?? '');
        });
      }
      filteredListForXL.push(columns);
    });


    const csvContent = this.convertToCSV(filteredListForXL);
    this.saveAsCsvFile(csvContent, 'household_survey_report');
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    // Separate base headers and nominee headers
    const baseHeaders: string[] = [];
    const nomineeHeadersSet = new Set<string>();

    // Get base headers from first row (non-nominee columns)
    if (data.length > 0) {
      Object.keys(data[0]).forEach(key => {
        if (!key.startsWith('Nominee_')) {
          baseHeaders.push(key);
        }
      });
    }

    // Collect all nominee headers from all rows
    data.forEach(row => {
      Object.keys(row).forEach(key => {
        if (key.startsWith('Nominee_')) {
          nomineeHeadersSet.add(key);
        }
      });
    });

    // Sort nominee headers by nominee number and field order
    const nomineeFieldOrder = [
      'Application ID', 'Index', 'First Name', 'Middle Name', 'Last Name', 'Nick Name',
      'Relationship to the household head', 'Age', 'Gender',
      'Popup Response', 'Does nominee read and write', 'Occupation'
    ];

    const nomineeHeaders = Array.from(nomineeHeadersSet).sort((a, b) => {
      const numA = parseInt(a.match(/Nominee_(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/Nominee_(\d+)/)?.[1] || '0');
      if (numA !== numB) return numA - numB;

      const fieldA = a.replace(/Nominee_\d+ /, '');
      const fieldB = b.replace(/Nominee_\d+ /, '');
      return nomineeFieldOrder.indexOf(fieldA) - nomineeFieldOrder.indexOf(fieldB);
    });

    // Combine base headers with sorted nominee headers
    const headers = [...baseHeaders, ...nomineeHeaders];

    const headerRow = headers.map(h => this.escapeCSVValue(h)).join(',');

    const dataRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        return this.escapeCSVValue(value);
      }).join(',');
    });

    return [headerRow, ...dataRows].join('\n');
  }

  private escapeCSVValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  private saveAsCsvFile(csvContent: string, fileName: string): void {
    const CSV_TYPE = 'text/csv;charset=utf-8;';
    const CSV_EXTENSION = '.csv';

    const blob = new Blob([csvContent], { type: CSV_TYPE });
    saveAs(blob, `${fileName}_${Date.now()}${CSV_EXTENSION}`);
  }


  ngOnInit() {

    this.cols.set([
      { field: 'applicationId', header: 'Application ID' },
      { field: 'respondentFirstName', header: 'Respondent First Name' },
      { field: 'respondentMiddleName', header: 'Respondent Middle Name' },
      { field: 'respondentLastName', header: 'Respondent Last Name' },
      { field: 'respondentNickName', header: 'Respondent Nick Name' },
      { field: 'respondentGender', header: 'Respondent Gender' },
      { field: 'respondentAge', header: 'Respondent Age' },
      { field: 'registrationPhase', header: 'Registration Phase' },
    ]);


    this.exportColumns.set(
      this.cols().map((col) => ({ title: col.header, dataKey: col.field }))
    );
  }

  handlePageChange(event: PaginatorState) {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? 10);
    this.onPageChange.emit(event);
  }
}