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
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  isLoading = true;  // Initially loading
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
    this.getSummary(); // fetch data immediately when the category changes
  }

  ngOnInit(): void {
    this.getSummary(); // load data immediately on component initialization
  }

  getSummary = () => {
    this.isLoading = true; // Set loading to true before fetching data

    // 👉 Fetching real-time data or mock data immediately
    this.dashboardSummary = {
      countyWiseBeneficiary: {
        '101': 120, '102': 90, '103': 150,
        '104': 110, '105': 130, '106': 140, '107': 95, '108': 160
      },
      countyWiseDeduplicate: {
        '101': 5, '102': 3, '103': 8,
        '104': 6, '105': 4, '106': 7, '107': 2, '108': 9
      },
      lipwCount: 400,
      disCount: 350,
      maleCount: 420,
      femaleCount: 330,
      totalBeneficiary: 750,
      countyWiseNominee: [
        { county: '101', maleNominee: 50, femaleNominee: 70 },
        { county: '102', maleNominee: 30, femaleNominee: 60 },
        { county: '103', maleNominee: 40, femaleNominee: 80 },
        { county: '104', maleNominee: 45, femaleNominee: 65 },
        { county: '105', maleNominee: 60, femaleNominee: 70 },
        { county: '106', maleNominee: 55, femaleNominee: 85 },
        { county: '107', maleNominee: 35, femaleNominee: 60 },
        { county: '108', maleNominee: 70, femaleNominee: 90 }
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
    this.isLoading = false; // Set loading to false once data is ready
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
      { id: '103', name: 'MELUTH', target: 180 },
      { id: '104', name: 'YAMBIO', target: 160 },
      { id: '105', name: 'TORIT', target: 190 },
      { id: '106', name: 'BOR', target: 170 },
      { id: '107', name: 'KAJO-KEJI', target: 140 },
      { id: '108', name: 'WAU', target: 210 }
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
      const names: any = {
        '101': 'JUBA',
        '102': 'PARIANG',
        '103': 'MELUTH',
        '104': 'YAMBIO',
        '105': 'TORIT',
        '106': 'BOR',
        '107': 'KAJO-KEJI',
        '108': 'WAU'
      };
      return names[id] || id;
    }
  };
}
