import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  Chart,
  registerables,
  ChartConfiguration,
  ChartData,
  ChartType,
  ChartEvent,
} from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Tabs, Tab, TabList, TabPanels, TabPanel } from 'primeng/tabs';
import { Tooltip as PTooltip } from 'primeng/tooltip';
import { Loader } from '../../components/loader/loader';
import { ApiService } from '../../services/api.service';
import { LookupService } from '../../services/lookup.service';
import { Router } from '@angular/router';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  imports: [
    NgTemplateOutlet,
    Loader,
    BaseChartDirective,
    Tabs,
    Tab,
    TabList,
    TabPanels,
    TabPanel,
    PTooltip,
  ],
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard implements OnInit {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  isLoading: boolean = true;
  countyList: any = [];
  dashboardSummary: any = null;
  countyWiseNomineeListByGender: any = [];
  countyWiseDuplicateBeneficaiaryList: any = [];
  totalBeneficiaryCount: number = 0;
  dailyCountList: any = [];
  activeCategory: number = 3;

  constructor(
    private apiService: ApiService,
    public lookupService: LookupService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}
  private countyAxis: Array<{ id: string; name: string }> = [];
  public genderLegendOptions: ChartConfiguration['options'];
  public supportLegendOptions: ChartConfiguration['options'];
  public barChartOptions: ChartConfiguration['options'] = {
    scales: {
      x: {},
      y: {
        min: 1,
      },
    },
    plugins: {
      legend: {
        display: true,
      },
    },
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [],
  };
  public barChartCountyData: ChartData<'bar'> = {
    labels: [],
    datasets: [],
  };

  // Doughnut
  public doughnutChartType: ChartType = 'doughnut';
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [],
  };
  public doughnutChartGenderData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [],
  };
  public doughnutChartSupportCategoryData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [],
  };

  setCategory(value: number | string | undefined) {
    // PrimeNG emits the tab's [value], not an event object
    this.activeCategory = Number(value);

    // 3 = ALL, 1 = PP, 2 = AF, 4 = RP
    console.log('Tab switched to category:', value);

    this.getSummary();
  }

  getSummary = () => {
    this.isLoading = true;
    this.countyList = this.lookupService.getCountyList();

    let apiUrl = '';
    if (this.activeCategory === 1) {
      apiUrl = 'api/dashboard/summary/PARENT'; // Category 1 endpoint
    } else if (this.activeCategory === 2) {
      apiUrl = 'api/dashboard/summary/AF'; // Category 2 endpoint
    } else if (this.activeCategory === 3) {
      apiUrl = 'api/dashboard/summary'; // Category 3 endpoint
    } else if (this.activeCategory === 4) {
      apiUrl = 'api/dashboard/summary/RP'; // Category 4 endpoint
    }

    this.apiService
      .GET(apiUrl)
      .then((res) => {
        if (res.status == 200) {
          this.dashboardSummary = res.data;
          this.setGraphData(this.dashboardSummary);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      })
      .catch((err) => {
        console.error(err);
        this.dashboardSummary = null;
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  };

  setGraphData = (graphData: any) => {
    const allIds = new Set<string>();
    (this.countyList || []).forEach((c: any) => allIds.add(String(c.id)));
    Object.keys(graphData?.countyWiseBeneficiary || {}).forEach((id) =>
      allIds.add(String(id))
    );
    Object.keys(graphData?.countyWiseDeduplicate || {}).forEach((id) =>
      allIds.add(String(id))
    );

    const labels: string[] = [];
    const beneficiaryCounts: number[] = [];
    const targetCounts: number[] = [];
    const duplicateRows: Array<{ county: string; count: number }> = [];

    this.countyAxis = [];

    // 👉 filter out counties whose target == 0 for the active category
    const filteredIds = Array.from(allIds).filter((id) => {
      const targetTotal =
        this.lookupService.getTargetRegistrationTotalById(
          id,
          this.activeCategory
        ) || 0;
      const countyBeneficiary = graphData?.countyWiseBeneficiary?.[id] ?? 0;
      const countyDuplicate = graphData?.countyWiseDeduplicate?.[id] ?? 0;

      return (
        targetTotal > 0 ||
        (this.activeCategory === 4 &&
          (countyBeneficiary > 0 || countyDuplicate > 0))
      );
    });

    for (const id of filteredIds) {
      const name = this.lookupService.getCountyNameById(id) || id;

      const countyBeneficiary = graphData?.countyWiseBeneficiary?.[id] ?? 0;
      const countyDuplicate = graphData?.countyWiseDeduplicate?.[id] ?? 0;
      const targetTotal =
        this.lookupService.getTargetRegistrationTotalById(
          id,
          this.activeCategory
        ) ?? 0;

      this.countyAxis.push({ id, name });
      labels.push(name);
      beneficiaryCounts.push(countyBeneficiary);
      targetCounts.push(targetTotal);
      // Duplicate table also ignores zero-target counties:
      duplicateRows.push({ county: name, count: countyDuplicate });
    }

    if (!labels.length) {
      this.barChartCountyData = {
        labels: ['No Data'],
        datasets: [
          {
            data: [0],
            label: 'No Data Available',
            backgroundColor: '#e9ecef',
            borderColor: '#dee2e6',
            borderWidth: 2,
          },
        ],
      };
    } else {
      this.barChartCountyData = {
        labels,
        datasets: [
          {
            data: beneficiaryCounts,
            label: 'Beneficiary',
            backgroundColor: '#F06292',
            borderColor: '#F06292',
            borderWidth: 2,
            hoverBackgroundColor: '#ff2420',
          },
          {
            data: targetCounts,
            label: 'Target',
            backgroundColor: '#10b981',
            borderColor: '#10b981',
            borderWidth: 2,

            hoverBackgroundColor: '#10b981',
          },
        ],
      };
    }

    this.doughnutChartSupportCategoryData = {
      labels: ['LIPW', 'DIS'],
      datasets: [
        {
          data: [graphData?.lipwCount || 0, graphData?.disCount || 0],
          label: '',
          backgroundColor: ['#00b7f2', '#e64950ff'],
          borderColor: ['#0099cc', '#c4161d'],
          borderWidth: 2,
          hoverBackgroundColor: ['#0099cc', '#c4161d'],
          hoverBorderColor: ['#007a99', '#a0121a'],
        },
      ],
    };

    this.doughnutChartGenderData = {
      labels: ['MALE', 'FEMALE'],
      datasets: [
        {
          data: [graphData?.maleCount || 0, graphData?.femaleCount || 0],
          label: '',
          backgroundColor: ['#00b7f2', '#e64950ff'],
          borderColor: ['#0099cc', '#c4161d'],
          borderWidth: 2,
          hoverBackgroundColor: ['#0099cc', '#c4161d'],
          hoverBorderColor: ['#007a99', '#a0121a'],
        },
      ],
    };

    this.totalBeneficiaryCount = graphData?.totalBeneficiary || 0;
    this.countyWiseDuplicateBeneficaiaryList = duplicateRows;
    this.countyWiseNomineeListByGender = graphData?.countyWiseNominee || [];
    this.barChartCountyData;
    this.dailyCountList = [];
    const daysCountKeys = Object.keys(
      this.dashboardSummary?.dayWiseCount || {}
    );
    daysCountKeys.sort().forEach((dck: any) => {
      this.dailyCountList.push({
        day: dck,
        count: this.dashboardSummary.dayWiseCount[dck],
      });
    });
  };

  gotoBeneficiaryList(kind?: 'gender' | 'support', label?: string) {
    // let phase = '';
    // let searchPreset: any = {
    //   page: 0,
    //   size: 10,
    //   sortColumn: 'CREATED',
    //   sortOrder: 'DESC',
    // };

    // if (this.activeCategory === 1) {
    //   phase = 'PARENT';
    //   searchPreset.criteria = [
    //     { fieldName: 'REGISTRATION_PHASE', operator: 'EQUAL', value: phase },
    //   ];
    // } else if (this.activeCategory === 2) {
    //   phase = 'AF';
    //   searchPreset.criteria = [
    //     { fieldName: 'REGISTRATION_PHASE', operator: 'EQUAL', value: phase },
    //   ];
    // } else if (this.activeCategory === 3) {
    //   // Don't include 'REGISTRATION_PHASE' criteria for category 3
    //   searchPreset.criteria = [];
    // }

    // if (kind && label) {
    //   const L = (label ?? '').toString().trim().toUpperCase();
    //   let criteria: Array<{
    //     fieldName: string;
    //     operator: string;
    //     value: string;
    //   }> = [];

    //   if (kind === 'gender') {
    //     // MALE -> "0", FEMALE -> "1"
    //     const genderCode = L === 'FEMALE' || L === '1' ? '1' : '0';
    //     criteria.push({
    //       fieldName: 'RESPONDENT_GENDER',
    //       operator: 'EQUAL',
    //       value: genderCode,
    //     });
    //   } else {
    //     // LIPW -> "0", DIS -> "1"
    //     const supportCode = L === 'DIS' || L === '1' ? '1' : '0';
    //     criteria.push({
    //       fieldName: 'SELECTION_CRITERIA',
    //       operator: 'LIKE',
    //       value: supportCode,
    //     });
    //   }
    //   searchPreset.criteria = [...searchPreset.criteria, ...criteria];
    // }

    // this.router.navigate(['beneficiary/list'], { state: { searchPreset } });
  }

  private buildLegendOptions(): ChartConfiguration['options'] {
    return {
      plugins: {
        legend: {
          display: true,
          // ✅ do NOT override onClick → default toggle works
        },
      },
    };
  }

  private handleDoughnutSelection(kind: 'gender' | 'support', label: string) {
    let phase = '';
    if (this.activeCategory === 1) {
      phase = 'PARENT';
    } else if (this.activeCategory === 2) {
      phase = 'AF';
    } else if (this.activeCategory === 3) {
      phase = ''; // ✅ or "" if you want to skip filtering
    } else if (this.activeCategory === 4) {
      phase = 'RP';
    }

    const L = (label ?? '').toString().trim().toUpperCase();

    let criteria: Array<{
      fieldName: string;
      operator: string;
      value: string;
    }> = [];

    if (kind === 'gender') {
      // MALE -> "0", FEMALE -> "1"
      const genderCode = L === 'FEMALE' || L === '1' ? '1' : '0';
      criteria.push({
        fieldName: 'RESPONDENT_GENDER',
        operator: 'EQUAL',
        value: genderCode,
      });
    } else {
      // LIPW -> "0", DIS -> "1"
      const supportCode = L === 'DIS' || L === '1' ? '1' : '0';
      criteria.push({
        fieldName: 'SELECTION_CRITERIA',
        operator: 'LIKE',
        value: supportCode,
      });
    }

    // Add REGISTRATION_PHASE criteria only if activeCategory is not 3
    if (this.activeCategory !== 3) {
      criteria.push({
        fieldName: 'REGISTRATION_PHASE',
        operator: 'EQUAL',
        value: phase,
      });
    }

    const searchPreset = {
      criteria,
      page: 0,
      size: 10,
      sortColumn: 'CREATED',
      sortOrder: 'DESC',
    };

    this.router.navigate(['beneficiary/list'], { state: { searchPreset } });
  }

  onDoughnutClick(
    e: { event?: ChartEvent; active?: any[] },
    kind: 'gender' | 'support'
  ) {
    // const active = e?.active;
    // if (!active?.length) return;

    // const sliceIndex = active[0].index;
    // if (sliceIndex === undefined) return;

    // const labels = (
    //   kind === 'gender'
    //     ? this.doughnutChartGenderData.labels
    //     : this.doughnutChartSupportCategoryData.labels
    // ) as string[];

    // const label = labels?.[sliceIndex];
    // if (label) this.handleDoughnutSelection(kind, label);
  }

  onBarClick(e: { event?: ChartEvent; active?: any[] }) {
    // const active = e?.active;
    // if (!active?.length) return;

    // const barIndex = active[0].index;
    // if (barIndex === undefined) return;

    // const selected = this.countyAxis[barIndex];
    // if (!selected) return;

    // this.handleBarSelectionById(selected.id);
  }

  private handleBarSelectionById(countyId: string) {
    let phase = '';
    if (this.activeCategory === 1) phase = 'PARENT';
    else if (this.activeCategory === 2) phase = 'AF';
    else if (this.activeCategory === 4) phase = 'RP';
    else phase = '';

    const criteria: Array<{
      fieldName: string;
      operator: string;
      value: string | number;
    }> = [{ fieldName: 'COUNTY_ID', operator: 'EQUAL', value: countyId }];

    if (this.activeCategory !== 3) {
      criteria.push({
        fieldName: 'REGISTRATION_PHASE',
        operator: 'EQUAL',
        value: phase,
      });
    }

    const searchPreset = {
      criteria,
      page: 0,
      size: 10,
      sortColumn: 'CREATED',
      sortOrder: 'DESC',
    };

    this.router.navigate(['beneficiary/list'], { state: { searchPreset } });
  }

  ngOnInit(): void {
    this.genderLegendOptions = this.buildLegendOptions();
    this.supportLegendOptions = this.buildLegendOptions();
    this.getSummary();
    this.cdr.detectChanges();
  }
}
