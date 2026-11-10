/**
 * Chart palette, number formats and the ESG domains shown on the Dashboard and in Analytics.
 *
 * Every figure is a KPI from the KPI library (backend: app/kpis), computed from approved data sheets —
 * the same numbers as the KPI catalogue, BRSR and GRI. Units shown here may be scaled for reading
 * (energy MJ → GJ; intensities per rupee → per ₹ crore); `scale` says how.
 *
 * Colour: one brand green for single-series charts, a neutral grey for "last year" (always labelled),
 * and the validated categorical order below for compositions, assigned by position in each domain's
 * fixed `parts` list — never by rank, so a filter never repaints a series. Slots 3, 4 and 5 sit below
 * 3:1 contrast on white, so every composition chart has a legend and a table view.
 */
import { Cloud, Droplet, Factory, HardHat, Leaf, Recycle, ShieldCheck, Sun, Users, UsersRound, Waves, Zap } from 'lucide-react'

export const BRAND = '#26890D'
export const BRAND_LIGHT = '#64BC44'
export const PREVIOUS = '#9B9A94'
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300']
export const GRID = '#EEEEEC'
export const AXIS = { fontSize: 10, fill: '#6B6B6B' }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
/** '2025-04' -> 'April 2025' */
export function monthLong(ym) {
  const [y, m] = ym.split('-')
  return `${LONG[Number(m) - 1]} ${y}`
}

/** '2025-04' -> 'Apr 25' */
export function monthLabel(ym) {
  const [y, m] = ym.split('-')
  return `${MONTHS[Number(m) - 1]} ${y.slice(2)}`
}

export function fmtValue(v, digits) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  const a = Math.abs(v)
  const d = digits ?? (a >= 1000 ? 0 : a >= 100 ? 1 : a >= 1 ? 2 : 3)
  return v.toLocaleString('en-IN', { maximumFractionDigits: d })
}

export function compact(v) {
  if (v === null || v === undefined) return ''
  const a = Math.abs(v)
  if (a >= 1e7) return `${(v / 1e7).toFixed(1).replace(/\.0$/, '')} Cr`
  if (a >= 1e5) return `${(v / 1e5).toFixed(1).replace(/\.0$/, '')} L`
  if (a >= 1e3) return `${(v / 1e3).toFixed(1).replace(/\.0$/, '')}K`
  return fmtValue(v)
}

export const scaled = (v, scale = 1) => (v === null || v === undefined ? null : v * scale)

/** Percentage change; null when either side is missing or the base is 0. */
export function changePct(value, previous) {
  if (value === null || value === undefined || previous === null || previous === undefined || previous === 0) return null
  return ((value - previous) / Math.abs(previous)) * 100
}

/** 'good' | 'bad' | 'neutral' for a change, given which direction is better. */
export function changeTone(pct, better) {
  if (pct === null || Math.abs(pct) < 0.05 || !better) return 'neutral'
  return (pct < 0) === (better === 'lower') ? 'good' : 'bad'
}

// tile: [code, label, unit shown, scale]
export const DOMAINS = [
  {
    key: 'energy', label: 'Energy', icon: Zap,
    headline: { code: 'energy_total_mj', label: 'Total energy consumed', unit: 'GJ', scale: 0.001 },
    tiles: [
      ['renewable_share_pct', 'Renewable share', '%', 1],
      ['ren_total_mj', 'Renewable energy', 'GJ', 0.001],
      ['nonren_total_mj', 'Non-renewable energy', 'GJ', 0.001],
      ['energy_intensity_mj_per_inr', 'Energy intensity', 'GJ per ₹ crore', 1e4],
    ],
    mix: {
      title: 'Renewable and non-renewable energy', unit: 'GJ', scale: 0.001,
      parts: [['nonren_total_mj', 'Non-renewable'], ['ren_total_mj', 'Renewable']],
      colors: ['#2a78d6', '#1baf7a'], // blue / aqua-green: slots 1 and 3, validated as a pair
    },
  },
  {
    key: 'emissions', label: 'GHG emissions', icon: Factory,
    headline: { code: 'ghg_total', label: 'Scope 1 + 2 emissions', unit: 'tCO₂e', scale: 1 },
    tiles: [
      ['scope1_total', 'Scope 1 (direct)', 'tCO₂e', 1],
      ['scope2_total', 'Scope 2 (purchased electricity)', 'tCO₂e', 1],
      ['scope3_total', 'Scope 3 (travel, commute, third parties)', 'tCO₂e', 1],
      ['ghg_intensity_per_inr', 'Scope 1 + 2 intensity', 'tCO₂e per ₹ crore', 1e7],
    ],
    mix: {
      title: 'Emissions by scope', unit: 'tCO₂e', scale: 1,
      parts: [['scope1_total', 'Scope 1'], ['scope2_total', 'Scope 2'], ['scope3_total', 'Scope 3']],
    },
  },
  {
    key: 'water', label: 'Water', icon: Droplet,
    headline: { code: 'water_withdrawal_total', label: 'Water withdrawn', unit: 'kL', scale: 1 },
    tiles: [
      ['water_discharge_total', 'Water discharged', 'kL', 1],
      ['water_consumption', 'Water consumed', 'kL', 1],
      ['water_stress_withdrawal_total', 'Withdrawn in water-stressed areas', 'kL', 1],
    ],
    mix: {
      title: 'Water withdrawn by source', unit: 'kL', scale: 1,
      parts: [
        ['water_withdrawal_surface', 'Surface water'], ['water_withdrawal_ground', 'Groundwater'],
        ['water_withdrawal_third_party', 'Third-party water'], ['water_withdrawal_sea', 'Seawater'],
        ['water_withdrawal_other', 'Other'],
      ],
    },
  },
  {
    key: 'waste', label: 'Waste', icon: Recycle,
    headline: { code: 'waste_total_generated', label: 'Waste generated', unit: 't', scale: 1 },
    tiles: [
      ['waste_diverted_pct', 'Recycled, reused or recovered', '%', 1],
      ['waste_total_recovered', 'Diverted from disposal', 't', 1],
      ['waste_total_disposed', 'Sent to disposal', 't', 1],
    ],
    mix: {
      title: 'What happened to the waste', unit: 't', scale: 1,
      parts: [
        ['waste_total_recycled', 'Recycled'], ['waste_total_reused', 'Reused'],
        ['waste_total_recovered_other', 'Other recovery'], ['waste_total_incinerated', 'Incinerated'],
        ['waste_total_landfilled', 'Landfilled'], ['waste_total_disposed_other', 'Other disposal'],
      ],
    },
  },
  {
    key: 'people', label: 'Workforce', icon: Users,
    headline: { code: 'all_total', label: 'Employees and workers', unit: 'people', scale: 1 },
    tiles: [
      ['all_female_pct', 'Women in the workforce', '%', 1],
      ['turnover_perm_total_pct', 'Turnover (permanent)', '%', 1],
      ['training_hours_per_employee', 'Training hours per employee', 'hours', 1],
      ['hires_new_total', 'New hires', 'people', 1],
    ],
    mix: {
      title: 'Workforce by gender', unit: 'people', scale: 1, latest: true,
      parts: [['all_male', 'Men'], ['all_female', 'Women'], ['all_others', 'Others']],
    },
  },
  {
    key: 'safety', label: 'Health & safety', icon: HardHat,
    headline: { code: 'ltifr_employees', label: 'Lost-time injury frequency (employees)', unit: 'per million hours', scale: 1 },
    tiles: [
      ['recordable_employees', 'Recordable injuries', 'cases', 1],
      ['high_consequence_employees', 'High-consequence injuries', 'cases', 1],
      ['fatalities_total', 'Fatalities', 'people', 1],
      ['hours_employees', 'Hours worked', 'hours', 1],
    ],
    mix: {
      title: 'Injuries by month', unit: 'cases', scale: 1,
      parts: [['recordable_employees', 'Recordable injuries'], ['high_consequence_employees', 'High-consequence']],
    },
  },
]

/**
 * Each domain's colour theme on the Analytics page (decorative: cards, banner, tile accents, the
 * headline line chart). `accent` tints backgrounds and icon chips; `deep` is the 700 shade used for
 * the chart line and icon strokes (≥ 4.5:1 on white). Text always stays in ink colours. Compositions
 * keep the validated SERIES palette above.
 */
export const THEMES = {
  energy: { accent: '#eab308', deep: '#a16207', soft: '#fef9c3', mark: Sun, tagline: 'Electricity, fuels and renewables across your sites' },
  emissions: { accent: '#f97316', deep: '#c2410c', soft: '#ffedd5', mark: Cloud, tagline: 'Scope 1, 2 and 3 greenhouse gas emissions' },
  water: { accent: '#0ea5e9', deep: '#0369a1', soft: '#e0f2fe', mark: Waves, tagline: 'Water withdrawn, discharged and consumed' },
  waste: { accent: '#10b981', deep: '#047857', soft: '#d1fae5', mark: Leaf, tagline: 'Waste generated and how much is kept out of landfill' },
  people: { accent: '#8b5cf6', deep: '#6d28d9', soft: '#ede9fe', mark: UsersRound, tagline: 'Headcount, diversity, turnover and training' },
  safety: { accent: '#f43f5e', deep: '#be123c', soft: '#ffe4e6', mark: ShieldCheck, tagline: 'Injuries, lost time and hours worked' },
}
export const themeOf = (key) => THEMES[key] || { accent: BRAND, deep: BRAND, soft: '#ecfdf5', mark: Leaf, tagline: '' }

export function codesOf(domain) {
  return [domain.headline.code, ...domain.tiles.map((t) => t[0]), ...domain.mix.parts.map((p) => p[0])]
}
