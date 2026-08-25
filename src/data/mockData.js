// Central mock data for the ESG platform. Swap for real API calls later —
// every export here is shaped like what the eventual backend should return.

export const currentConsultant = {
  id: 'u-001',
  name: 'James Whitfield',
  role: 'Senior ESG Consultant',
  email: 'james.whitfield@deloitte.com',
  initials: 'JW',
}

export const currentClientUser = {
  id: 'cu-001',
  name: 'John Doe',
  role: 'Head of Sustainability',
  company: 'ABC Holding',
  email: 'john.doe@abcholding.com',
  initials: 'JD',
}

export const kpiSummary = [
  { label: 'Total Clients', value: '247', icon: 'building', tint: 'green' },
  { label: 'Enterprise Clients', value: '64', icon: 'shield', tint: 'purple' },
  { label: 'Professional Clients', value: '98', icon: 'briefcase', tint: 'blue' },
  { label: 'Basic Clients', value: '85', icon: 'users', tint: 'gray' },
  { label: 'Total Revenue', value: '$4.2M', icon: 'wallet', tint: 'amber' },
]

export const registrationQueue = [
  { company: 'ABC Holdings', date: '12-05-2026', plan: 'Enterprise', status: 'Approved', consultant: 'James Whitfield' },
  { company: 'QWC Holdings', date: '12-05-2026', plan: 'Basic', status: 'Pending', consultant: '-' },
  { company: 'WHF Holdings', date: '12-05-2026', plan: 'Professional', status: 'Under Review', consultant: '-' },
  { company: 'QRT Holdings', date: '12-05-2026', plan: 'Basic', status: 'Under Review', consultant: 'John Doe' },
  { company: 'CVBV Holdings', date: '12-05-2026', plan: 'Basic', status: 'Pending', consultant: '-' },
  { company: 'ACHJ Holdings', date: '12-05-2026', plan: 'Basic', status: 'Pending', consultant: '-' },
  { company: 'Xyz Holdings', date: '12-05-2026', plan: 'Basic', status: 'Pending', consultant: '-' },
]

export const subscriptionDistribution = [
  { label: 'Professional Clients', value: 98, pct: 40, color: '#2563EB' },
  { label: 'Basic Clients', value: 85, pct: 34, color: '#9CA3AF' },
  { label: 'Enterprise Clients', value: 64, pct: 26, color: '#8B5CF6' },
]

export const consultantWorkload = [
  { name: 'James Whitfield', role: 'Senior ESG Consultant', clients: 8, projects: 12, pct: 89 },
  { name: 'John Doe', role: 'Junior ESG Consultant', clients: 10, projects: 10, pct: 55 },
  { name: 'Lenart Karl', role: 'Senior ESG Consultant', clients: 5, projects: 7, pct: 35 },
  { name: 'James Rodriguez', role: 'Senior ESG Consultant', clients: 18, projects: 7, pct: 89 },
]

export const userDirectory = [
  { id: 'u1', name: 'John Doe', email: 'abc@deloitte.com', department: 'ESG Advisory', role: 'Administrator' },
  { id: 'u2', name: 'Sarah Jacob', email: 'abc@deloitte.com', department: 'Frameworks', role: 'Consultant' },
  { id: 'u3', name: 'James Whitehall', email: 'abc@deloitte.com', department: 'Client Success', role: 'Reviewer' },
  { id: 'u4', name: 'John Doe', email: 'abc@deloitte.com', department: 'ESG Advisory', role: 'Support' },
  { id: 'u5', name: 'Jane Doe', email: 'abc@deloitte.com', department: 'ESG Advisory', role: 'Reviewer' },
  { id: 'u6', name: 'Jacob John', email: 'abc@deloitte.com', department: 'ESG Advisory', role: 'Reviewer' },
  { id: 'u7', name: 'Susan Sebastian', email: 'abc@deloitte.com', department: 'ESG Advisory', role: 'Reviewer' },
]

export const clientPool = [
  {
    id: 'cl-001',
    name: 'ABC Holdings Pvt. Ltd.', consultant: 'Sarah Jacob', plan: 'Enterprise', regStatus: 'Approved',
    reportStatus: 'In Progress', lastActivity: 'Today, 09:12', location: 'Kochi, Kerala',
    industry: 'Energy', employees: '4,200', country: 'India',
    contact: { name: 'Neha Sharma', title: 'Head of Sustainability', phone: '989739xxxx', email: 's_neha@abc.com' },
    subscription: { plan: 'Enterprise', start: '15 Jun 2026', end: '14 Jun 2027' },
    consultants: ['John Doe', 'Sarah Jacob'],
    frameworks: ['GRI', 'SASB', 'BRSR'],
    progress: 89,
  },
  {
    id: 'cl-002',
    name: 'LRC Holdings Pvt. Ltd.', consultant: 'Sarah Jacob', plan: 'Enterprise', regStatus: 'Approved',
    reportStatus: 'In Progress', lastActivity: 'Today, 09:12', location: 'Mumbai, Maharashtra',
    industry: 'Manufacturing', employees: '6,800', country: 'India',
    contact: { name: 'Arjun Mehta', title: 'ESG Program Lead', phone: '981234xxxx', email: 'a_mehta@lrc.com' },
    subscription: { plan: 'Enterprise', start: '02 Feb 2026', end: '01 Feb 2027' },
    consultants: ['Sarah Jacob', 'James Rodriguez'],
    frameworks: ['GRI', 'IFRS S1', 'IFRS S2'],
    progress: 64,
  },
  {
    id: 'cl-003',
    name: 'LRC Holdings Pvt. Ltd.', consultant: 'Sarah Jacob', plan: 'Basic', regStatus: 'Approved',
    reportStatus: 'In Progress', lastActivity: 'Today, 09:12', location: 'Pune, Maharashtra',
    industry: 'Consumer', employees: '1,150', country: 'India',
    contact: { name: 'Riya Kapoor', title: 'Sustainability Manager', phone: '990045xxxx', email: 'r_kapoor@lrc.com' },
    subscription: { plan: 'Basic', start: '10 Mar 2026', end: '09 Mar 2027' },
    consultants: ['Sarah Jacob'],
    frameworks: ['GRI'],
    progress: 41,
  },
  {
    id: 'cl-004',
    name: 'LRC Holdings Pvt. Ltd.', consultant: 'Sarah Jacob', plan: 'Basic', regStatus: 'Pending',
    reportStatus: '-', lastActivity: 'Today, 09:12', location: 'Ahmedabad, Gujarat',
    industry: 'Infrastructure', employees: '890', country: 'India',
    contact: { name: 'Karan Shah', title: 'Compliance Officer', phone: '997766xxxx', email: 'k_shah@lrc.com' },
    subscription: { plan: 'Basic', start: '-', end: '-' },
    consultants: [],
    frameworks: [],
    progress: 0,
  },
  {
    id: 'cl-005',
    name: 'LRC Holdings Pvt. Ltd.', consultant: 'Sarah Jacob', plan: 'Basic', regStatus: 'Approved',
    reportStatus: 'In Progress', lastActivity: 'Today, 09:12', location: 'Chennai, Tamil Nadu',
    industry: 'Real Estate', employees: '2,300', country: 'India',
    contact: { name: 'Divya Nair', title: 'Head of ESG', phone: '984433xxxx', email: 'd_nair@lrc.com' },
    subscription: { plan: 'Basic', start: '21 Apr 2026', end: '20 Apr 2027' },
    consultants: ['Sarah Jacob'],
    frameworks: ['GRI', 'BRSR'],
    progress: 58,
  },
  {
    id: 'cl-006',
    name: 'LRC Holdings Pvt. Ltd.', consultant: 'Sarah Jacob', plan: 'Enterprise', regStatus: 'Approved',
    reportStatus: 'In Progress', lastActivity: 'Today, 09:12', location: 'Bengaluru, Karnataka',
    industry: 'Financial Services', employees: '9,400', country: 'India',
    contact: { name: 'Vikram Rao', title: 'Group Sustainability Head', phone: '976655xxxx', email: 'v_rao@lrc.com' },
    subscription: { plan: 'Enterprise', start: '05 Jan 2026', end: '04 Jan 2027' },
    consultants: ['Sarah Jacob', 'John Doe', 'James Rodriguez'],
    frameworks: ['GRI', 'SASB', 'PRI', 'SFDR'],
    progress: 92,
  },
  {
    id: 'cl-007',
    name: 'LRC Holdings Pvt. Ltd.', consultant: 'Sarah Jacob', plan: 'Enterprise', regStatus: 'Approved',
    reportStatus: 'In Progress', lastActivity: 'Today, 09:12', location: 'Hyderabad, Telangana',
    industry: 'Energy', employees: '5,600', country: 'India',
    contact: { name: 'Meera Iyer', title: 'VP Sustainability', phone: '992211xxxx', email: 'm_iyer@lrc.com' },
    subscription: { plan: 'Enterprise', start: '18 May 2026', end: '17 May 2027' },
    consultants: ['Sarah Jacob', 'Lenart Karl'],
    frameworks: ['GRI', 'CBAM', 'IFRS S2'],
    progress: 76,
  },
]

export const companies = [
  {
    id: 'co-abc',
    name: 'ABC Holdings Pvt. Ltd.',
    team: [
      { id: 't1', name: 'John Doe', email: 'abc@deloitte.com', role: 'Administrator' },
      { id: 't2', name: 'Sarah Jacob', email: 'abc@deloitte.com', role: 'Consultant' },
      { id: 't3', name: 'James Whitehall', email: 'abc@deloitte.com', role: 'Reviewer' },
      { id: 't4', name: 'John Doe', email: 'abc@deloitte.com', role: 'Support' },
      { id: 't5', name: 'Jane Doe', email: 'abc@deloitte.com', role: 'Reviewer' },
      { id: 't6', name: 'Jacob John', email: 'abc@deloitte.com', role: 'Reviewer' },
      { id: 't7', name: 'Susan Sebastian', email: 'abc@deloitte.com', role: 'Reviewer' },
    ],
  },
  {
    id: 'co-lrc1',
    name: 'LRC Holdings Pvt. Ltd. — Mumbai',
    team: [
      { id: 't8', name: 'Sarah Jacob', email: 'abc@deloitte.com', role: 'Administrator' },
      { id: 't9', name: 'James Rodriguez', email: 'abc@deloitte.com', role: 'Consultant' },
    ],
  },
  {
    id: 'co-lrc2',
    name: 'LRC Holdings Pvt. Ltd. — Bengaluru',
    team: [
      { id: 't10', name: 'Sarah Jacob', email: 'abc@deloitte.com', role: 'Administrator' },
      { id: 't11', name: 'John Doe', email: 'abc@deloitte.com', role: 'Consultant' },
      { id: 't12', name: 'James Rodriguez', email: 'abc@deloitte.com', role: 'Reviewer' },
    ],
  },
]

export const datasets = [
  { id: 'ds1', name: 'Q2 Renewable Energy Dataset', framework: 'GRI', domain: 'Energy', period: 'Q2 2026', date: 'Jul 3, 2026', uploadedBy: 'Daniel Walsh', status: 'Pending', docs: 2, company: 'Meridian Energy Corp', assignedReviewer: 'Sarah Chen' },
  { id: 'ds2', name: 'Q2 Renewable Energy Dataset', framework: 'AWS', domain: 'Water', period: 'Q2 2026', date: 'Jul 3, 2026', uploadedBy: 'Daniel Walsh', status: 'Changes Requested', docs: 3, company: 'Meridian Energy Corp', assignedReviewer: 'Sarah Chen' },
  { id: 'ds3', name: 'Q2 Renewable Energy Dataset', framework: 'SASB', domain: 'Emissions', period: 'Q2 2026', date: 'Jul 3, 2026', uploadedBy: 'Daniel Walsh', status: 'Approved', docs: 1, company: 'Meridian Energy Corp', assignedReviewer: 'Sarah Chen' },
  { id: 'ds4', name: 'Q2 Renewable Energy Dataset', framework: 'GRI', domain: 'Waste', period: 'Q2 2026', date: 'Jul 3, 2026', uploadedBy: 'Daniel Walsh', status: 'Approved', docs: 4, company: 'Meridian Energy Corp', assignedReviewer: 'Sarah Chen' },
  { id: 'ds5', name: 'Q2 Renewable Energy Dataset', framework: 'BRSR', domain: 'Social', period: 'Q2 2026', date: 'Jul 3, 2026', uploadedBy: 'Daniel Walsh', status: 'Approved', docs: 2, company: 'Meridian Energy Corp', assignedReviewer: 'Sarah Chen' },
]

export const clientKpiOverview = [
  { label: 'Energy Consumption', value: '127,420', unit: 'MWh', delta: '8.3%', trend: 'up', icon: 'zap' },
  { label: 'Water Withdrawal', value: '2,241', unit: 'ML', delta: '8.3%', trend: 'up', icon: 'droplet' },
  { label: 'Carbon Emissions', value: '7.4', unit: 'ktCO2e', delta: '8.3%', trend: 'up', icon: 'cloud' },
  { label: 'Water Recycled', value: '78', unit: '%', delta: '8.3%', trend: 'up', icon: 'recycle' },
  { label: 'Data collection', value: '82', unit: '%', delta: '8.3%', trend: 'up', icon: 'database' },
]

export const frameworkStatus = [
  { code: 'AWS', name: 'Alliance for Water Stewardship', stage: 'Data collection', pct: 82, color: '#8B5CF6', dueDate: 'Aug 15, 2025', owner: 'Sarah Chen', openIssues: 2 },
  { code: 'SASB', name: 'Sustainability Accounting Standards Board', stage: 'Data review', pct: 63, color: '#3B82F6', dueDate: 'Aug 22, 2025', owner: 'Sarah Chen', openIssues: 0 },
  { code: 'BRSR', name: 'Business Responsibility & Sustainability Report', stage: 'Data collection', pct: 82, color: '#DC2626', dueDate: 'Sep 1, 2025', owner: 'Sarah Chen', openIssues: 0 },
  { code: 'GRI', name: 'Global Reporting Initiative', stage: 'Data collection', pct: 82, color: '#22C55E', dueDate: 'Sep 10, 2025', owner: 'Sarah Chen', openIssues: 0 },
]

export const myTasks = [
  { title: 'Upload Q2 Energy Dataset', desc: 'Site A, B and C energy meter readings', priority: 'High', status: 'Pending', updated: '03/06/26' },
  { title: 'Upload Q2 Energy Dataset', desc: 'Site A, B and C energy meter readings', priority: 'High', status: 'Pending', updated: '03/06/26' },
  { title: 'Upload Q2 Energy Dataset', desc: 'Site A, B and C energy meter readings', priority: 'High', status: 'Pending', updated: '03/06/26' },
  { title: 'Upload Q2 Energy Dataset', desc: 'Site A, B and C energy meter readings', priority: 'High', status: 'Pending', updated: '03/06/26' },
]

export const reportingCalendar = [
  { date: '12', month: 'Jun', label: 'Q2 Data Submission Deadline' },
  { date: '12', month: 'Jun', label: 'Consultant Check-in — Sarah Chen' },
  { date: '12', month: 'Jun', label: 'SASB Quarterly Submission' },
  { date: '12', month: 'Jun', label: 'Q2 Data Submission Deadline' },
  { date: '12', month: 'Jun', label: 'Q2 Data Submission Deadline' },
]

export const assuranceStats = [
  { icon: 'hash', label: 'Total KPIs', value: 6, tint: 'gray' },
  { icon: 'square', label: 'Assurance Complete', value: 3, tint: 'green' },
  { icon: 'file-check', label: 'Under Assurance', value: 1, tint: 'purple' },
  { icon: 'triangle-alert', label: 'Needs Action', value: 1, tint: 'amber' },
  { icon: 'timer', label: 'Ready for Assurance', value: 1, tint: 'blue' },
]

export const assuranceFilters = {
  domains: ['All Domains', 'Energy', 'Water', 'Emissions', 'Waste'],
  years: ['FY 202425', 'FY 202526'],
  businessUnits: ['All Frameworks', 'GRI', 'SASB', 'BRSR', 'AWS'],
}

export const assuranceKpiDetail = {
  title: 'GRI Sustainability Report — Q2 2026',
  statusBadge: 'Assurance Passed',
  frameworkBadge: 'GRI',
  category: 'Environment — Emissions · FY 2024-25',
  reportedValue: '12,450',
  reportedUnit: 'tCO2e',
  submittedBy: 'Rachel Kim',
  submittedOn: '2 Jun 2025',
  internalReviewer: 'Michael Chen',
  reviewedOn: '10 Jun 2025',
  assuranceStatus: 'Passed',
  calculationLogic: 'Scope 1 = Σ (Activity Data × Emission Factor) for stationary combustion, mobile combustion and fugitive emissions across all owned facilities.',
  emissionFactors: [
    'Natural gas: 56.1 kgCO2e/GJ',
    'Diesel: 74.1 kgCO2e/GJ',
    'HFCs: GWP per AR6',
  ],
  assumptions: [
    'Excludes leased facilities where energy bills not received',
    'HFC leakage estimated using IPCC Tier 1 method',
  ],
  observation: 'No Observations Raised. This KPI passed assurance without any observations.',
  timeline: [
    { title: 'Dataset Submitted', detail: 'Q2 Energy Consumption uploaded by Daniel Walsh', date: 'Jul 1, 2026', done: true },
    { title: 'Review Started', detail: 'Sarah Chen (Deloitte) assigned and review commenced', date: 'Jul 1, 2026', done: true },
    { title: 'Comments Added', detail: '3 review comments added — Site C discrepancy flagged', date: 'Jul 1, 2026', done: true },
    { title: 'Client Response', detail: 'Awaiting response from ESG team', date: 'Jul 1, 2026', done: false },
  ],
}

export const assuranceSummary = [
  { label: 'Total KPIs', value: 6, tint: 'gray' },
  { label: 'Assurance Complete', value: 3, tint: 'green' },
  { label: 'Under Assurance', value: 1, tint: 'purple' },
  { label: 'Needs Action', value: 1, tint: 'amber' },
  { label: 'Ready for Assurance', value: 1, tint: 'blue' },
]

export const assuranceItems = [
  { dataset: 'GRI Sustainability Report — Q2 2026', reviewer: 'Daniel Walsh', updated: 'Jul 3, 2026', priority: 'High', status: 'Assurance Passed' },
  { dataset: 'GRI Sustainability Report — Q2 2026', reviewer: 'Daniel Walsh', updated: 'Jul 3, 2026', priority: 'High', status: 'Clarification Required' },
  { dataset: 'GRI Sustainability Report — Q2 2026', reviewer: 'Daniel Walsh', updated: 'Jul 3, 2026', priority: 'Medium', status: 'Under Assurance' },
  { dataset: 'GRI Sustainability Report — Q2 2026', reviewer: 'Daniel Walsh', updated: 'Jul 3, 2026', priority: 'Low', status: 'Assurance Passed' },
  { dataset: 'GRI Sustainability Report — Q2 2026', reviewer: 'Daniel Walsh', updated: 'Jul 3, 2026', priority: 'High', status: 'Assurance Passed' },
]

export const benchmarkingOverview = {
  overallScore: { value: 82, label: 'Overall ESG Score', delta: '+8 vs last year' },
  industryAverage: { value: 74, label: 'Industry Average' },
  industryRanking: { value: 'Top 20%', label: 'Industry Ranking' },
  bestPerformerScore: { value: 91, label: 'Best Performer Score' },
}

export const pillarPerformance = [
  { pillar: 'Environment', yourOrg: 78, industryAvg: 88, bestPerformer: 68 },
  { pillar: 'Social', yourOrg: 85, industryAvg: 92, bestPerformer: 72 },
  { pillar: 'Governance', yourOrg: 80, industryAvg: 90, bestPerformer: 86 },
]

export const esgDimensionRadar = {
  axes: ['Energy', 'Water', 'Waste', 'Emissions', 'Diversity', 'Safety'],
  yourOrg: [82, 88, 70, 75, 65, 80],
  industryAvg: [70, 75, 60, 68, 72, 74],
}

export const improvementOpportunities = [
  { area: 'Supplier ESG Compliance', gap: 22 },
  { area: 'Employee Training Hours', gap: 12 },
  { area: 'Waste Diversion Rate', gap: 15 },
  { area: 'Water Recycling', gap: 27 },
  { area: 'Renewable Energy Adoption', gap: 22 },
]

export const renewableEnergyAdoption = {
  sector: 'Consumer Goods sector',
  period: 'FY2024',
  orgCount: 22,
  rows: [
    { org: 'Your Organization', score: 82, rank: 'Top 20%', status: 'Above Average', highlight: true },
    { org: 'Peer A — bgh holdings', score: 85, rank: 'Top 10%', status: 'Excellent' },
    { org: 'Peer B — bgh holdings', score: 79, rank: 'Top 30%', status: 'Good' },
    { org: 'Peer C — bgh holdings', score: 68, rank: 'Top 40%', status: 'Average' },
    { org: 'Peer D — bgh holdings', score: 80, rank: '—', status: 'Average' },
  ],
}
export const analyticsFilters = {
  years: ['2024', '2023', '2022', '2021', '2020'],
  quarters: ['All', 'Q1', 'Q2', 'Q3', 'Q4'],
  businessUnits: ['All', 'Manufacturing', 'Supply Chain', 'Corporate', 'Energy', 'Logistics'],
  regions: ['All', 'North America', 'Europe', 'Asia Pacific', 'Latin America', 'Africa'],
}

export const benchmarkingData = {
  overall: { score: 78.6, goal: 85, delta: '+7.06%' },
  environmental: { score: 82.1, goal: 85, delta: '+3.41%' },
  social: { score: 73.4, goal: 80, delta: '+6.6%' },
  governance: { score: 80.3, goal: 85, delta: '+4.7%' },
  totalEmissions: { value: '45.1K', unit: 'ktCO2e', delta: '-6.3%', vsLabel: 'vs FY 48.1K' },
  emissionsByScope: [
    { year: 2020, scope1: 30.3, scope2: 22, scope3: 12 },
    { year: 2021, scope1: 28.7, scope2: 20, scope3: 10 },
    { year: 2022, scope1: 24.6, scope2: 19, scope3: 9 },
    { year: 2023, scope1: 22.1, scope2: 17, scope3: 9 },
    { year: 2024, scope1: 21.1, scope2: 16, scope3: 8 },
  ],
  scoreTrend: {
    years: [2020, 2021, 2022, 2023, 2024],
    series: [
      { label: 'Overall ESG Score', color: '#64BC44', values: [70, 74, 77, 76, 78.6] },
      { label: 'Environmental', color: '#22C55E', values: [75, 79, 83, 80, 82.1] },
      { label: 'Social', color: '#93C5FD', values: [65, 68, 71, 70, 73.4] },
      { label: 'Governance', color: '#1E3A8A', values: [72, 75, 79, 78, 80.3] },
    ],
  },
  scoreByBusinessUnit: [
    { unit: 'Manufacturing', value: 85.2, color: '#1B5E3A' },
    { unit: 'Supply Chain', value: 79.1, color: '#4B9B5F' },
    { unit: 'Corporate', value: 76.4, color: '#3F8F82' },
    { unit: 'Energy', value: 72.8, color: '#3B6FA0' },
    { unit: 'Logistics', value: 70.2, color: '#1E3A5F' },
  ],
  energyBySource: [
    { label: 'Electricity', pct: 52.4, color: '#3D9B4F' },
    { label: 'Natural Gas', pct: 21.7, color: '#1E3A5F' },
    { label: 'Renewables', pct: 15.8, color: '#7EB6E8' },
    { label: 'Fuel Oil', pct: 6.1, color: '#C4C4C4' },
    { label: 'Others', pct: 4.0, color: '#A8D5A2' },
  ],
  goals: [
    { goal: 'Reduce GHG Emissions (Scope 1 & 2)', target: '-15%', progress: 70, status: 'On Track' },
    { goal: 'Increase Renewable Energy Use', target: '40%', progress: 60, status: 'On Track' },
    { goal: 'Reduce Water Withdrawal', target: '-10%', progress: 35, status: 'At Risk' },
    { goal: 'Improve Employee Diversity', target: '35%', progress: 40, status: 'At Risk' },
    { goal: 'Zero Lost Time Injuries', target: '0', progress: 95, status: 'On Track' },
  ],
  ghgByRegion: [
    { region: 'North America', value: 15.2 },
    { region: 'Europe', value: 12.4 },
    { region: 'Asia Pacific', value: 10.8 },
    { region: 'Latin America', value: 5.1 },
    { region: 'Africa', value: 2.9 },
  ],
}

export const reportingFilters = {
  years: ['2026', '2025', '2024'],
  periods: ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'],
  businessUnits: ['All Business Units', 'Manufacturing', 'Supply Chain', 'Corporate', 'Energy', 'Logistics'],
  legalEntities: ['All Legal Entities', 'ABC Holdings Pvt. Ltd.', 'ABC Energy Corp'],
  statuses: ['All Statuses', 'Ready', 'In Progress'],
}

export const frameworkReadiness = [
  {
    code: 'AWS', name: 'Alliance for Water Stewardship', pct: 96, status: 'Ready',
    badge: 'bg-purple-100 text-purple-700', bar: '#8B5CF6',
    period: 'Q2 2026', lastGenerated: 'Jun 20, 2026',
    readiness: 'Ready to Generate', readinessColor: 'text-status-approved',
    canGenerate: true,
  },
  {
    code: 'SASB', name: 'Sustainability Accounting Standards Board', pct: 56, status: 'In Progress',
    badge: 'bg-red-100 text-red-600', bar: '#DC2626',
    period: 'Q2 2026', lastGenerated: 'Jun 20, 2026',
    readiness: 'Awaiting data — 55% complete', readinessColor: 'text-status-pending',
    canGenerate: false,
  },
  {
    code: 'GRI', name: 'Global Reporting Initiative', pct: 72, status: 'In Progress',
    badge: 'bg-blue-100 text-blue-700', bar: '#2563EB',
    period: 'Q2 2026', lastGenerated: 'Jun 20, 2026',
    readiness: 'Awaiting verification', readinessColor: 'text-blue-600',
    canGenerate: false,
  },
  {
    code: 'BRSR', name: 'Business Responsibility & Sustainability Report', pct: 35, status: 'In Progress',
    badge: 'bg-amber-100 text-amber-700', bar: '#D98A1F',
    period: 'Q2 2026', lastGenerated: 'Jun 20, 2026',
    readiness: 'Insufficient data', readinessColor: 'text-amber-600',
    canGenerate: false,
  },
]

export const generatedReportsList = [
  { dataset: 'GRI Sustainability Report — Q2 2026', framework: 'GRI', publishedBy: 'Daniel Walsh', period: 'Q2 2026', date: 'Jul 3, 2026', version: 'v2.1', status: 'Published' },
  { dataset: 'GRI Sustainability Report — Q2 2026', framework: 'AWS', publishedBy: 'Daniel Walsh', period: 'Q2 2026', date: 'Jul 3, 2026', version: 'v2.1', status: 'Not Published' },
  { dataset: 'GRI Sustainability Report — Q2 2026', framework: 'SASB', publishedBy: 'Daniel Walsh', period: 'Q2 2026', date: 'Jul 3, 2026', version: 'v2.1', status: 'Published' },
  { dataset: 'GRI Sustainability Report — Q2 2026', framework: 'GRI', publishedBy: 'Daniel Walsh', period: 'Q2 2026', date: 'Jul 3, 2026', version: 'v2.1', status: 'Published' },
  { dataset: 'GRI Sustainability Report — Q2 2026', framework: 'BRSR', publishedBy: 'Daniel Walsh', period: 'Q2 2026', date: 'Jul 3, 2026', version: 'v2.1', status: 'Published' },
]

export const reportingFrameworksList = [
  { code: 'GRI', name: 'Global Reporting Initiative', category: 'Non-Regulatory' },
  { code: 'SASB', name: 'Sustainability Accounting Standards Board', category: 'Investor/Lender' },
  { code: 'BRSR', name: 'Business Responsibility & Sustainability Report', category: 'Regulatory' },
  { code: 'IFRS S1', name: 'General Sustainability Disclosures', category: 'Regulatory' },
  { code: 'IFRS S2', name: 'Climate-related Disclosures', category: 'Regulatory' },
  { code: 'PRI', name: 'Principles for Responsible Investment', category: 'Investor/Lender' },
  { code: 'CBAM', name: 'Carbon Border Adjustment Mechanism', category: 'Regulatory' },
  { code: 'SFDR', name: 'Sustainable Finance Disclosure Regulation', category: 'Regulatory' },
  { code: 'IFC PS', name: 'IFC Performance Standards', category: 'Investor/Lender' },
  { code: 'Integrated Reporting', name: 'Integrated Reporting Framework', category: 'Non-Regulatory' },
]

export const surveysList = [
  { name: 'Employee Wellbeing Survey 2026', responses: '142/200', status: 'Active', framework: 'Social' },
  { name: 'Supplier ESG Due Diligence', responses: '38/60', status: 'Active', framework: 'Governance' },
  { name: 'Community Impact Assessment', responses: '210/210', status: 'Closed', framework: 'Social' },
]

export const domainGuidance = {
  Energy: {
    description: 'Upload energy consumption data including electricity, natural gas, fuel and renewable sources across all reported sites.',
    columns: ['Site name or ID', 'Energy type (electricity, gas, diesel)', 'Consumption value', 'Unit (kWh, GJ, L)', 'Reporting period'],
    metricLabel: 'Energy (kWh)',
  },
  Water: {
    description: 'Upload water withdrawal, discharge and recycling data across all reported sites.',
    columns: ['Site name or ID', 'Water source type', 'Volume withdrawn', 'Volume recycled', 'Unit (ML, m³)', 'Reporting period'],
    metricLabel: 'Water (ML)',
  },
  Emissions: {
    description: 'Upload Scope 1, 2 and 3 emissions data along with the calculation methodology used.',
    columns: ['Site name or ID', 'Emission scope', 'Activity data', 'Emission factor used', 'Unit (tCO2e)', 'Reporting period'],
    metricLabel: 'Emissions (tCO2e)',
  },
  Waste: {
    description: 'Upload waste generation, diversion and disposal data across all reported sites.',
    columns: ['Site name or ID', 'Waste type', 'Quantity generated', 'Disposal method', 'Unit (t, kg)', 'Reporting period'],
    metricLabel: 'Waste (t)',
  },
}

export const questionBank = {
  'Climate Risk': {
    framework: 'GRI',
    guidance: 'Provide a clear and specific narrative that directly addresses the question. Reference policies, governance bodies, data and outcomes where applicable.',
    questions: [
      'Describe your approach to identifying and assessing climate-related risks and opportunities.',
      'Describe any scenario analysis conducted to assess long-term climate resilience.',
      'Describe governance structures and accountability for climate-related decisions.',
    ],
    tips: [
      'Reference specific programs or initiatives by name',
      'Include quantitative data where available',
      'Link to relevant policies or board resolutions',
      'Describe governance structures and accountability',
      'Explain changes or improvements from prior year',
    ],
  },
  Governance: {
    framework: 'BRSR',
    guidance: 'Explain board-level oversight and accountability mechanisms clearly, citing specific committees or policies where relevant.',
    questions: [
      'Describe the board\'s oversight role for ESG-related risks and opportunities.',
      'Describe policies in place to prevent conflicts of interest at the board level.',
      'Describe the process for evaluating executive performance against ESG targets.',
    ],
    tips: [
      'Name specific board committees involved',
      'Reference policy documents by title',
      'Describe frequency of ESG oversight reviews',
      'Include escalation procedures where relevant',
    ],
  },
  Social: {
    framework: 'SASB',
    guidance: 'Focus on measurable workforce and community outcomes, citing programs and data points that demonstrate impact.',
    questions: [
      'Describe programs in place to support employee wellbeing and development.',
      'Describe your approach to engaging with local communities around operating sites.',
      'Describe diversity, equity and inclusion initiatives and their measured outcomes.',
    ],
    tips: [
      'Include participation or completion rates',
      'Reference specific community programs by name',
      'Cite year-over-year changes in workforce metrics',
      'Describe grievance mechanisms where applicable',
    ],
  },
}

export const surveysData = [
  { id: 'sv1', name: 'Employee ESG Awareness Survey Q2', type: 'Climate Risk', createdBy: 'Sarah Johnson', createdOn: '12 Jun 2025', dueDate: 'Jul 9, 2026', participants: 24, responses: 12, status: 'Active' },
  { id: 'sv2', name: 'GRI Stakeholder Engagement Survey', type: 'Due Diligence', createdBy: 'Michael Chen', createdOn: '12 Jun 2025', dueDate: 'Jul 9, 2026', participants: 15, responses: 15, status: 'Completed' },
  { id: 'sv3', name: 'Board ESG Governance Readiness', type: 'AWS', createdBy: 'Rachel Kim', createdOn: '12 Jun 2025', dueDate: 'Jul 9, 2026', participants: 12, responses: 10, status: 'In Progress' },
  { id: 'sv4', name: 'Annual Employee Awareness', type: 'Custom', createdBy: 'David Patel', createdOn: '12 Jun 2025', dueDate: 'Jul 9, 2026', participants: 120, responses: 102, status: 'In Progress' },
  { id: 'sv5', name: 'GRI Stakeholder Engagement Survey', type: 'BRSR', createdBy: 'Sarah Johnson', createdOn: '12 Jun 2025', dueDate: 'Jul 9, 2026', participants: 30, responses: 12, status: 'Active' },
]

export const assessmentDetails = {
  as1: {
    completionRate: 75,
    responsesReceived: 18,
    totalParticipants: 24,
    statusBreakdown: { completed: 75, inProgress: 17, notStarted: 8 },
    questions: [
      { id: 1, text: 'Describe the primary physical climate risks that your department has identified in the past 12 months.', required: true },
      { id: 2, text: 'Has your department conducted a formal climate risk review this financial year?', required: true },
      { id: 3, text: 'Which climate-related risks has your team formally identified? Select all that apply.', required: true },
      { id: 4, text: "Rate your team's current climate risk management maturity (1 = Early stage, 5 = Leading practice).", required: true },
      { id: 5, text: 'Does your team have a documented climate risk mitigation plan in place?', required: true },
      { id: 6, text: 'What additional resources or support would help your team better manage climate-related risks?', required: false },
      { id: 7, text: 'Upload any supporting evidence such as risk registers, reports or previous assessments.', required: false },
    ],
    summary: { totalQuestions: 7, estCompletion: '10 mins', type: 'Internal', responseType: 'Non-Anonymous', deadline: '30 Aug 2025' },
    responses: [
      { participant: 'Michael Chen', email: 'mchen@acme.com', department: 'Operations', status: 'Completed', submitted: '12 Jun 2025', timeTaken: 15 },
      { participant: 'Rachel Kim', email: 'rkim@acme.com', department: 'Finance', status: 'Completed', submitted: '12 Jun 2025', timeTaken: 13 },
      { participant: 'David Patel', email: 'dpatel@acme.com', department: 'Procurement', status: 'In Progress', submitted: '12 Jun 2025', timeTaken: null },
      { participant: 'David Patel', email: 'dpatel@acme.com', department: 'Risk & Compliance', status: 'In Progress', submitted: '12 Jun 2025', timeTaken: null },
      { participant: 'David Patel', email: 'dpatel@acme.com', department: 'Operations', status: 'Completed', submitted: '12 Jun 2025', timeTaken: 18 },
      { participant: 'David Patel', email: 'dpatel@acme.com', department: 'Finance', status: 'In Progress', submitted: '12 Jun 2025', timeTaken: null },
      { participant: 'David Patel', email: 'dpatel@acme.com', department: 'Procurement', status: 'Completed', submitted: '12 Jun 2025', timeTaken: 16 },
      { participant: 'David Patel', email: 'dpatel@acme.com', department: 'Risk & Compliance', status: 'Completed', submitted: '12 Jun 2025', timeTaken: 17 },
      { participant: 'David Patel', email: 'dpatel@acme.com', department: 'Operations', status: 'Completed', submitted: '12 Jun 2025', timeTaken: 22 },
      { participant: 'David Patel', email: 'dpatel@acme.com', department: 'Finance', status: 'Completed', submitted: '12 Jun 2025', timeTaken: 11 },
      { participant: 'David Patel', email: 'dpatel@acme.com', department: 'Procurement', status: 'In Progress', submitted: '12 Jun 2025', timeTaken: null },
    ],
  },
}

export const assessmentsData = [
  { id: 'as1', name: 'Climate Risk Assessment Q2 2025', type: 'Climate Risk', createdBy: 'Sarah Johnson', createdOn: '12 Jun 2025', dueDate: 'Jul 9, 2026', participants: 24, responses: 12, status: 'Active' },
  { id: 'as2', name: 'Tier-1 Supplier ESG Due Diligence', type: 'Due Diligence', createdBy: 'Michael Chen', createdOn: '12 Jun 2025', dueDate: 'Jul 9, 2026', participants: 15, responses: 15, status: 'Completed' },
  { id: 'as3', name: 'AWS Water Stewardship Assessment', type: 'AWS', createdBy: 'Rachel Kim', createdOn: '12 Jun 2025', dueDate: 'Jul 9, 2026', participants: 12, responses: 10, status: 'In Progress' },
  { id: 'as4', name: 'Annual Employee ESG Awareness', type: 'Custom', createdBy: 'David Patel', createdOn: '12 Jun 2025', dueDate: 'Jul 9, 2026', participants: 120, responses: 102, status: 'In Progress' },
  { id: 'as5', name: 'BRSR Material Topics Assessment', type: 'BRSR', createdBy: 'Sarah Johnson', createdOn: '12 Jun 2025', dueDate: 'Jul 9, 2026', participants: 30, responses: 12, status: 'Active' },
]

export const emissionFactors = [
  { id: 'ef1', name: 'Municipal Water Supply', category: 'Water', value: 0.344, unit: 'kgCO2e/m³', source: 'Local Authority', region: 'India', effYear: 2026, priority: 'Active', effectiveDate: '01-04-2026', expiryDate: '31-03-2027', description: 'Embodied carbon in treated municipal water supply including pumping and treatment.' },
  { id: 'ef2', name: 'Wastewater Treatment — Aerobic', category: 'Water', value: 0.708, unit: 'kgCO2e/m³', source: 'EPA', region: 'Global', effYear: 2025, priority: 'Active', effectiveDate: '01-04-2025', expiryDate: '31-03-2026', description: 'Emission factor for aerobic wastewater treatment processes.' },
  { id: 'ef3', name: 'Paper Recycling', category: 'Waste', value: 0.12, unit: 'kgCO2e/kg', source: 'EPA', region: 'Global', effYear: 2025, priority: 'Inactive', effectiveDate: '01-04-2025', expiryDate: '31-03-2026', description: 'Avoided emissions factor for recycled paper and cardboard.' },
  { id: 'ef4', name: 'Mixed Waste — Landfill', category: 'Waste', value: 0.587, unit: 'kgCO2e/kg', source: 'DEFRA', region: 'Global', effYear: 2025, priority: 'Active', effectiveDate: '01-04-2025', expiryDate: '31-03-2026', description: 'Emission factor for mixed waste sent to landfill.' },
  { id: 'ef5', name: 'Hazardous Waste — Incineration', category: 'Waste', value: 1.24, unit: 'kgCO2e/kg', source: 'EPA', region: 'Global', effYear: 2025, priority: 'Active', effectiveDate: '01-04-2025', expiryDate: '31-03-2026', description: 'Emission factor for incineration of hazardous waste streams.' },
  { id: 'ef6', name: 'Grid Electricity — India', category: 'Energy', value: 0.71, unit: 'kgCO2e/kWh', source: 'CEA', region: 'India', effYear: 2025, priority: 'Inactive', effectiveDate: '01-04-2025', expiryDate: '31-03-2026', description: 'Emission factor for grid electricity consumption in India.' },
  { id: 'ef7', name: 'Natural Gas Combustion', category: 'Emission Factor', value: 2.03, unit: 'kgCO2e/m³', source: 'DEFRA', region: 'Global', effYear: 2025, priority: 'Active', effectiveDate: '01-04-2025', expiryDate: '31-03-2026', description: 'Stationary combustion emissions factor for natural gas.' },
  { id: 'ef8', name: 'Diesel Combustion', category: 'Emission Factor', value: 2.68, unit: 'kgCO2e/L', source: 'DEFRA', region: 'Global', effYear: 2025, priority: 'Active', effectiveDate: '01-04-2025', expiryDate: '31-03-2026', description: 'Stationary combustion emissions factor for diesel fuel.' },
]

export const factorFilters = {
  categories: ['All Categories', 'Water', 'Waste', 'Energy', 'Emission Factor'],
  sources: ['All Sources', 'Local Authority', 'EPA', 'DEFRA', 'CEA'],
  years: ['All Years', '2026', '2025'],
}

export const kpiTeamMembers = ['Ananya Nair', 'Priya Thomas', 'Rahul Menon']

export const kpiRoleAssignments = [
  { id: 'kra1', domain: 'Energy', dataType: 'Quantitative', uploaders: ['Ananya Nair', 'Priya Thomas', 'Rahul Menon'], reviewers: ['Ananya Nair', 'Priya Thomas', 'Rahul Menon'] },
  { id: 'kra2', domain: 'Energy', dataType: 'Qualitative', uploaders: ['Ananya Nair', 'Priya Thomas', 'Rahul Menon'], reviewers: ['Ananya Nair', 'Priya Thomas', 'Rahul Menon'] },
  { id: 'kra3', domain: 'Water', dataType: 'Quantitative', uploaders: ['Ananya Nair', 'Priya Thomas', 'Rahul Menon'], reviewers: ['Ananya Nair', 'Priya Thomas', 'Rahul Menon'] },
  { id: 'kra4', domain: 'Water', dataType: 'Qualitative', uploaders: ['Ananya Nair', 'Priya Thomas', 'Rahul Menon'], reviewers: ['Ananya Nair', 'Priya Thomas', 'Rahul Menon'] },
  { id: 'kra5', domain: 'Waste Management', dataType: 'Quantitative', uploaders: ['Ananya Nair', 'Priya Thomas', 'Rahul Menon'], reviewers: ['Ananya Nair', 'Priya Thomas', 'Rahul Menon'] },
  { id: 'kra6', domain: 'Waste Management', dataType: 'Qualitative', uploaders: ['Ananya Nair', 'Priya Thomas', 'Rahul Menon'], reviewers: ['Ananya Nair', 'Priya Thomas', 'Rahul Menon'] },
  { id: 'kra7', domain: 'Greenhouse Gas Emissions', dataType: 'Quantitative', uploaders: ['Ananya Nair', 'Priya Thomas', 'Rahul Menon'], reviewers: ['Ananya Nair', 'Priya Thomas', 'Rahul Menon'] },
  { id: 'kra8', domain: 'Greenhouse Gas Emissions', dataType: 'Qualitative', uploaders: ['Ananya Nair', 'Priya Thomas', 'Rahul Menon'], reviewers: ['Ananya Nair', 'Priya Thomas', 'Rahul Menon'] },
]

export const auditLogs = [
  { event: 'Login', user: 'emma.r@unilever.com', message: 'User logged in successfully', recordId: 'LOG-000131', timestamp: '15 Jul 2025, 09:02', ip: '192.168.1.25' },
  { event: 'Dataset Updated', user: 'emma.r@unilever.com', message: 'Energy dataset updated — FY2024 Q2', recordId: 'KPI-204', timestamp: '15 Jul 2025, 09:02', ip: '192.168.1.40' },
  { event: 'Approval', user: 'emma.r@unilever.com', message: 'Social & Labour dataset approved', recordId: 'KPI-204', timestamp: '15 Jul 2025, 09:02', ip: '10.0.0.5' },
  { event: 'User Created', user: 'emma.r@unilever.com', message: 'Energy dataset updated — FY2024 Q2', recordId: 'USR-042', timestamp: '15 Jul 2025, 09:02', ip: '192.168.1.40' },
  { event: 'Logout', user: 'emma.r@unilever.com', message: 'Energy dataset updated — FY2024 Q2', recordId: 'LOG-000123', timestamp: '15 Jul 2025, 09:02', ip: '192.168.1.40' },
]

export const logFilters = {
  time: ['All Time', 'Today', 'Last 7 days', 'Last 30 days'],
  events: ['All Events', 'Login', 'Logout', 'Dataset Updated', 'Approval', 'User Created'],
}

export const connectedSystems = [
  { domain: 'HR', system: 'Workday HCM, Oracle HCM', status: 'Connected', lastSync: '15 Jul 2025, 09:00' },
  { domain: 'Energy', system: 'Siemens EnergyIP, Schneider EcoStruxere', status: 'Connected', lastSync: '15 Jul 2025, 09:00' },
  { domain: 'Water', system: 'Custom API', status: 'Error', lastSync: '15 Jul 2025, 09:00' },
  { domain: 'Waste', system: 'Veolia WIMS', status: 'Disconnected', lastSync: '15 Jul 2025, 09:00' },
  { domain: 'Supply Chain', system: 'SAP Ariba', status: 'Connected', lastSync: '15 Jul 2025, 09:00' },
  { domain: 'Finance', system: 'Oracle Financials', status: 'Disconnected', lastSync: '15 Jul 2025, 09:00' },
]

// Client company's own internal admin console (distinct from Deloitte's Control Center)
export const clientEmployeeDirectory = [
  { id: 'ce1', name: 'John Doe', email: 'abc@abc.com', department: 'Sustainability', role: 'Administrator', status: 'Active' },
  { id: 'ce2', name: 'Sarah Jacob', email: 'abc@abc.com', department: 'Operations', role: 'Reviewer', status: 'Active' },
  { id: 'ce3', name: 'James Whitehall', email: 'abc@abc.com', department: 'Finance', role: 'Approver', status: 'Active' },
  { id: 'ce4', name: 'John Doe', email: 'abc@abc.com', department: 'Facilities', role: 'Uploader', status: 'Inactive' },
  { id: 'ce5', name: 'Jane Doe', email: 'abc@abc.com', department: 'Operations', role: 'Approver', status: 'Active' },
  { id: 'ce6', name: 'Jacob John', email: 'abc@abc.com', department: 'Sustainability', role: 'Approver', status: 'Active' },
  { id: 'ce7', name: 'Susan Sebastian', email: 'abc@abc.com', department: 'Sustainability', role: 'Approver', status: 'Active' },
  { id: 'ce8', name: 'Susan Sebastian', email: 'abc@abc.com', department: 'Sustainability', role: 'Approver', status: 'Active' },
  { id: 'ce9', name: 'Susan Sebastian', email: 'abc@abc.com', department: 'Sustainability', role: 'Approver', status: 'Active' },
]

export const clientRoleOptions = ['Administrator', 'Reviewer', 'Uploader', 'Approver']

export const esgTargets = [
  { id: 't1', name: 'Carbon Emissions', target: '100,000 MWh', current: '7.4 ktCO2e', progress: 55, status: 'On Track' },
  { id: 't2', name: 'Energy Reduction', target: '100,000 MWh', current: '127,420 MWh', progress: 61, status: 'On Track' },
  { id: 't3', name: 'Water Usage', target: '1,800 ML', current: '2,241 ML', progress: 49, status: 'At Risk' },
  { id: 't4', name: 'Renewable Energy Share', target: '40%', current: '28%', progress: 70, status: 'On Track' },
]

export const approvalHistory = [
  { dataset: 'Q1 Energy Dataset', approvedBy: 'Alexandra Chen', date: 'Jun 15, 2026', framework: 'GRI', status: 'Approved', comments: 'Compliant' },
  { dataset: 'Q1 Water Data — Sites A/B', approvedBy: 'James Thornton', date: 'Jun 15, 2026', framework: 'AWS', status: 'Approved', comments: 'Minor notes' },
  { dataset: 'Board Governance Report', approvedBy: 'Priya Nair', date: 'Jun 15, 2026', framework: 'SASB', status: 'Approved', comments: 'No comments' },
  { dataset: 'Waste Management Survey', approvedBy: 'Alexandra Chen', date: 'Jun 15, 2026', framework: 'GRI', status: 'Rejected', comments: 'Incomplete data' },
  { dataset: 'Scope 2 Emissions — Q2', approvedBy: 'James Thornton', date: 'Jun 15, 2026', framework: 'BRSR', status: 'Under Review', comments: '-' },
  { dataset: 'Supply Chain Assessment', approvedBy: 'Priya Nair', date: 'Jun 15, 2026', framework: 'SASB', status: 'Pending', comments: '-' },
]


export const systemLogs = [
  { id: 'LOG-000129', type: 'Dataset Updated', module: 'Upload Data', user: 'john.k@unilever.corp', role: 'ESG Administrator', timestamp: '14 Jul 2026, 16:15', status: 'Success' },
  { id: 'LOG-000128', type: 'User Role Changed', module: 'Control Center', user: 'sarah.j@deloitte.com', role: 'Administrator', timestamp: '14 Jul 2026, 11:02', status: 'Success' },
  { id: 'LOG-000127', type: 'Dataset Rejected', module: 'Review Center', user: 'james.w@deloitte.com', role: 'Reviewer', timestamp: '13 Jul 2026, 17:41', status: 'Success' },
]

export const roleOptions = ['Admin', 'Consultant', 'Reviewer', 'Support']

export const industries = ['Energy', 'Financial Services', 'Manufacturing', 'Real Estate', 'Infrastructure', 'Consumer']

export const securityFeatures = [
  { icon: 'cloud', title: 'Secure Cloud Infrastructure', desc: 'Enterprise-grade security with SOC 2 Type II compliance and ISO 27001 certification.' },
  { icon: 'user-check', title: 'Role-Based Access', desc: 'Granular permissions and access controls to protect sensitive ESG data.' },
  { icon: 'route', title: 'Audit Trails', desc: 'Complete activity logging and comprehensive audit trails for compliance.' },
  { icon: 'shield-check', title: 'Data Privacy Controls', desc: 'GDPR and data protection compliance with advanced privacy features.' },
]

export const faqItems = [
  {
    q: 'Which ESG reporting frameworks do you support?',
    a: 'Our platform supports both regulatory frameworks (BRSR, IFRS S1, IFRS S2, CBAM, SFDR) and non-regulatory frameworks (GRI, PRI, IFC Performance Standards, Integrated Reporting). We continuously update our framework coverage to align with evolving global standards.',
  },
  { q: 'How long does implementation typically take?', a: 'Most clients are fully onboarded within 4-6 weeks, depending on the number of business units and reporting frameworks involved. Our Deloitte team manages the setup end-to-end.' },
  { q: 'Can we migrate data from our existing ESG tools?', a: 'Yes. We support bulk data import via CSV/Excel and can configure API integrations with common HR, energy, and finance systems during onboarding.' },
  { q: 'Is the platform compliant with data privacy regulations?', a: 'Yes. The platform is SOC 2 Type II and ISO 27001 certified, with GDPR-aligned data handling and configurable data residency options.' },
  { q: 'What level of support is included?', a: 'All plans include email support. Professional and Enterprise plans include priority support and a dedicated Deloitte account manager for Enterprise clients.' },
  { q: 'Can we customize KPIs and reporting templates?', a: 'Enterprise clients can request custom module development and tailored KPI catalogues in addition to the standard framework templates.' },
  { q: 'How is pricing determined?', a: 'Pricing depends on company size, number of reporting frameworks, and required modules. Contact our sales team for a tailored quote.' },
]

export const testimonials = [
  { icon: 'trending-up', title: 'Reporting Efficiency Improvement', desc: 'Global manufacturing company reduced ESG reporting time from 3 months to 6 weeks using our automated platform.' },
  { icon: 'clock', title: 'Reduced Manual Effort', desc: 'Financial services firm eliminated manual data collection processes, saving 200+ hours per quarter.' },
]

export const pricingTiers = [
  {
    name: 'Basic', tagline: 'Data management + reporting', mostPopular: false,
    features: ['ESG Data Management', 'Regulatory Reporting', 'Non-Regulatory', 'Reporting', 'Basic KPI Catalogue', 'Email Support'],
  },
  {
    name: 'Professional', tagline: 'Reporting + benchmarking + dashboards', mostPopular: true,
    features: ['Everything in Basic', 'Advanced Dashboards', 'Industry Benchmarking', 'KPI Monitoring', 'Investor/Lender', 'Reporting', 'Priority Support'],
  },
  {
    name: 'Enterprise', tagline: 'Customized modules + integrations + assessments', mostPopular: false,
    features: ['Everything in Professional', 'Custom Module Development', 'System Integrations', 'Materiality Assessment', 'Maturity Assessment', 'Due Diligence', 'Climate Risk Analysis', 'Dedicated Account Manager'],
  },
]

export const statusTint = {
  Approved: 'bg-status-approved/10 text-status-approved',
  Pending: 'bg-status-pending/10 text-status-pending',
  'Under Review': 'bg-status-review/10 text-status-review',
  'Changes Requested': 'bg-status-pending/10 text-status-pending',
  'Assurance Passed': 'bg-status-approved/10 text-status-approved',
  'Clarification Required': 'bg-status-review/10 text-status-review',
  'Under Assurance': 'bg-blue-50 text-blue-600',
  'On Track': 'bg-status-approved/10 text-status-approved',
  'At Risk': 'bg-status-review/10 text-status-review',
  Active: 'bg-status-approved/10 text-status-approved',
  Inactive: 'bg-ink-100 text-ink-500',
  Closed: 'bg-ink-100 text-ink-500',
  Connected: 'bg-status-approved/10 text-status-approved',
  Disconnected: 'bg-ink-100 text-ink-500',
  Error: 'bg-status-pending/10 text-status-pending',
  Rejected: 'bg-status-pending/10 text-status-pending',
  Ready: 'bg-status-approved/10 text-status-approved',
  'In Progress': 'bg-blue-50 text-blue-600',
  Published: 'bg-status-approved/10 text-status-approved',
  'Not Published': 'bg-status-pending/10 text-status-pending',
}

export const notifications = [
  { id: 'n1', type: 'review', icon: 'check-circle', title: 'Dataset Approved', message: 'Your Q2 Energy Dataset was approved by Sarah Chen.', time: '2 hours ago', read: false },
  { id: 'n2', type: 'action', icon: 'alert-circle', title: 'Changes Requested', message: 'Site C discrepancy flagged on your GRI Sustainability Report.', time: '5 hours ago', read: false },
  { id: 'n3', type: 'info', icon: 'file-text', title: 'Report Generated', message: 'AWS Sustainability Report — Q2 2026 is ready to download.', time: 'Yesterday', read: true },
  { id: 'n4', type: 'system', icon: 'settings', title: 'New Connection Added', message: 'Workday HCM was successfully connected under HR.', time: '2 days ago', read: true },
  { id: 'n5', type: 'review', icon: 'trending-up', title: 'Benchmark Updated', message: 'Your industry ranking improved to Top 20%.', time: '3 days ago', read: true },
]
