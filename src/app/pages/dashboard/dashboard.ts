import { Component, OnInit, ViewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

import { Chart, registerables, ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

// PrimeNG (standalone)
import { Tabs, Tab, TabList, TabPanels, TabPanel } from 'primeng/tabs';
import { Tooltip as PTooltip } from 'primeng/tooltip';

// Your spinner
import { Loader } from '../../components/loader/loader';

// ✅ Register ALL chart.js controllers/elements/scales/plugins at once
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  imports: [
    NgTemplateOutlet,
    Loader,
    BaseChartDirective,
    // PrimeNG standalone imports
    Tabs, Tab, TabList, TabPanels, TabPanel, PTooltip
  ],
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  isLoading = true;
  dashboardSummary: any = null;
  countyWiseNomineeListByGender: Array<{ county: string; maleNominee: number; femaleNominee: number }> = [];
  countyWiseDuplicateBeneficaiaryList: Array<{ county: string; count: number }> = [];
  totalBeneficiaryCount = 0;
  dailyCountList: Array<{ day: string; count: number }> = [];

  // start on "ALL"
  activeCategory: number = 0;

  private countyAxis: Array<{ id: string; name: string }> = [];

  public genderLegendOptions: ChartConfiguration['options'] = { plugins: { legend: { display: true } } };
  public supportLegendOptions: ChartConfiguration['options'] = { plugins: { legend: { display: true } } };

  public barChartOptions: ChartConfiguration['options'] = {
    scales: { x: {}, y: { min: 1 } },
    plugins: { legend: { display: true } }
  };
  public barChartType: ChartType = 'bar';
  public barChartCountyData: ChartData<'bar'> = { labels: [], datasets: [] };

  public doughnutChartType: ChartType = 'doughnut';
  public doughnutChartGenderData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  public doughnutChartSupportCategoryData: ChartData<'doughnut'> = { labels: [], datasets: [] };

  constructor() {}

  // valueChange from <p-tabs> can be string|number; normalize to number
  setCategory(value: string | number) {
    this.activeCategory = Number(value);
    this.getSummary();
  }

  ngOnInit(): void {
    this.getSummary(); // loads mock data initially
  }

  getSummary = () => {
    this.isLoading = true;

    // 👉 Mock data
    setTimeout(() => {
      this.dashboardSummary = {
        countyWiseBeneficiary: { '101': 120, '102': 90, '103': 150 },
        countyWiseDeduplicate: { '101': 5, '102': 3, '103': 8 },
        lipwCount: 200,
        disCount: 150,
        maleCount: 220,
        femaleCount: 130,
        totalBeneficiary: 350,
        countyWiseNominee: [
          { county: '101', maleNominee: 50, femaleNominee: 70 },
          { county: '102', maleNominee: 30, femaleNominee: 60 },
          { county: '103', maleNominee: 40, femaleNominee: 80 }
        ],
        dayWiseCount: {
          '2025-09-16': 20,
          '2025-09-17': 40,
          '2025-09-18': 35,
          '2025-09-19': 50,
          '2025-09-20': 45,
          '2025-09-21': 60,
          '2025-09-22': 100
        }
      };

      this.setGraphData(this.dashboardSummary);
      this.isLoading = false;
    }, 600);
  };

  setGraphData = (graphData: any) => {
    const labels: string[] = [];
    const beneficiaryCounts: number[] = [];
    const targetCounts: number[] = [];
    const duplicateRows: Array<{ county: string; count: number }> = [];

    this.countyAxis = [];

    // county mapping for mock ids
    const counties = [
      { id: '101', name: 'JUBA', target: 200 },
      { id: '102', name: 'PARIANG', target: 150 },
      { id: '103', name: 'MELUTH', target: 180 }
    ];

    counties.forEach((c) => {
      const countyBeneficiary = graphData?.countyWiseBeneficiary?.[c.id] ?? 0;
      const countyDuplicate = graphData?.countyWiseDeduplicate?.[c.id] ?? 0;

      this.countyAxis.push({ id: c.id, name: c.name });
      labels.push(c.name);
      beneficiaryCounts.push(countyBeneficiary);
      targetCounts.push(c.target);
      duplicateRows.push({ county: c.name, count: countyDuplicate });
    });

    this.barChartCountyData = {
      labels,
      datasets: [
        { data: beneficiaryCounts, label: 'Beneficiary' },
        { data: targetCounts, label: 'Target' }
      ]
    };

    this.doughnutChartSupportCategoryData = {
      labels: ['LIPW', 'DIS'],
      // datasets is always an array (no optional chaining needed)
      datasets: [{ data: [graphData?.lipwCount || 0, graphData?.disCount || 0], label: '' }]
    };

    this.doughnutChartGenderData = {
      labels: ['MALE', 'FEMALE'],
      datasets: [{ data: [graphData?.maleCount || 0, graphData?.femaleCount || 0], label: '' }]
    };

    this.totalBeneficiaryCount = graphData?.totalBeneficiary || 0;
    this.countyWiseDuplicateBeneficaiaryList = duplicateRows;
    this.countyWiseNomineeListByGender = graphData?.countyWiseNominee || [];

    // day-wise list
    this.dailyCountList = [];
    const daysCountKeys = Object.keys(graphData?.dayWiseCount || {});
    daysCountKeys.sort().forEach((dck: string) => {
      this.dailyCountList.push({ day: dck, count: graphData.dayWiseCount[dck] });
    });
  };

  // stubs (wire later)
  gotoBeneficiaryList() {}
  onDoughnutClick(e: any, kind: string) {}
  onBarClick(e: any) {}

  // simple mock lookup
  lookupService = {
    getCountyNameById: (id: string) => {
      const names: any = { '101': 'JUBA', '102': 'PARIANG', '103': 'MELUTH' };
      return names[id] || id;
    }
  };
}
