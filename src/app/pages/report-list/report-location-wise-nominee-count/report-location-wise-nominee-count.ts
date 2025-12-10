import { Component, inject, input } from '@angular/core';
import { signal } from '@angular/core';
import FileSaver from 'file-saver';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { LookupService } from '../../../services/lookup.service';

interface Column {
  field: string;
  nestedField?: string;
  header: string;
  customExportHeader?: string;
}

interface ExportColumn {
  title: string;
  dataKey: string;
}

@Component({
  selector: 'app-report-location-wise-nominee-count',
  standalone: true,
  imports: [TableModule, ButtonModule, TooltipModule], // Import PrimeNG modules
  templateUrl: './report-location-wise-nominee-count.html',
  styleUrls: ['./report-location-wise-nominee-count.scss'],
})
export class ReportLocationWiseNomineeCount {

  reportResult = input<any>(null);

  // Signals to hold column configurations and export data
  cols = signal<Column[]>([]);
  exportColumns = signal<ExportColumn[]>([]);
  nomineeCountList = signal<any[]>([]);

  public lookupService = inject(LookupService);


  async exportPdf() {
    // Dynamically import jsPDF and autoTable
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
  
    // Get the data from nomineeCountList and exportColumns
    const nomineeData = this.nomineeCountList();
    const exportColumns = this.exportColumns();
  
    // Check if the data is not empty
    if (!nomineeData || nomineeData.length === 0) {
      console.error("No data to export.");
      return;
    }
  
    if (!exportColumns || exportColumns.length === 0) {
      console.error("No columns defined for export.");
      return;
    }
  
    // Create a new jsPDF instance
    const doc = new jsPDF('landscape', 'px', 'a4');
  
    // Prepare the data with names for state, county, payam, and boma
    const formattedData = nomineeData.map((row: any) => {
      return {
        State: this.lookupService.getStateNameById(row.stateId) ?? '-',
        County: this.lookupService.getCountyNameById(row.countyId) ?? '-',
        Payam: this.lookupService.getPayamNameById(row.payamId) ?? '-',
        Boma: this.lookupService.getBomaNameById(row.bomaId) ?? '-',
        Count: row.householdCount || 0,
      };
    });
    // Map columns correctly for autoTable
    const columns = exportColumns.map((col) => ({
      header: col.title,
      dataKey: col.dataKey,
    }));
  
    // Ensure autoTable is added to jsPDF instance
    autoTable(doc, {
      body: formattedData,
      columns: columns,
      margin: { top: 20, left: 20 },
      theme: 'grid',
    });
  
    // Save the PDF with a unique filename
    doc.save(`location_wise_nominee_count_${Date.now()}.pdf`);
  }







  // Excel Export Function
  async exportExcel() {
    const filteredListForXL: any[] = this.nomineeCountList().map((element: any) => ({
      State: element.stateId > 0 ? this.lookupService.getStateNameById(element.stateId) : '-',
      County: element.countyId > 0 ? this.lookupService.getCountyNameById(element.countyId) : '-',
      Payam: element.payamId > 0 ? this.lookupService.getPayamNameById(element.payamId) : '-',
      Boma: element.bomaId > 0 ? this.lookupService.getBomaNameById(element.bomaId) : '-',
      Count: element.householdCount,
    }));

    const xlsx = await import('xlsx');
    const worksheet = xlsx.utils.json_to_sheet(filteredListForXL);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, 'location_wise_nominee_count_');
  }

  // Save as Excel File function
  private saveAsExcelFile(buffer: any, fileName: string): void {
    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const EXCEL_EXTENSION = '.xlsx';
    const data = new Blob([buffer], { type: EXCEL_TYPE });
    FileSaver.saveAs(data, `${fileName}${Date.now()}${EXCEL_EXTENSION}`);
  }

  // Component initialization
  ngOnInit() {
    // Define table columns
    this.cols.set([
      { field: 'stateId', header: 'STATE' },
      { field: 'countyId', header: 'COUNTY' },
      { field: 'payamId', header: 'PAYAM' },
      { field: 'bomaId', header: 'BOMA' },
      { field: 'householdCount', header: 'NOMINEE COUNT' },
    ]);

    // Define export columns with properties
    this.exportColumns.set([
      { dataKey: 'State', title: 'State' },
      { dataKey: 'County', title: 'County' },
      { dataKey: 'Payam', title: 'Payam' },
      { dataKey: 'Boma', title: 'Boma' },
      { dataKey: 'Count', title: 'Nominee Count' },
    ]);

    // Set nominee count list (dummy data for now)
    this.nomineeCountList.set(this.reportResult()?.dataList ?? []);
  }
}
