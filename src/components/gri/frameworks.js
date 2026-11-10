/** What differs between the GRI and SASB workspaces: names, wording and downloads. */
import { downloadContentIndex, downloadGriReport } from '../../api/gri.js'
import { downloadSasbIndex, downloadSasbReport } from '../../api/sasb.js'

export const FRAMEWORK_UI = {
  gri: {
    key: 'gri',
    name: 'GRI',
    title: 'GRI Standards',
    noun: 'requirement',
    nouns: 'requirements',
    searchHint: 'e.g. 305-1 or water',
    remarksLabel: 'Mapping note',
    omitHint: 'GRI allows an omission with one of four reasons and an explanation.',
    downloads: [
      { id: 'xlsx', short: 'Content Index', label: 'GRI Content Index', fn: downloadContentIndex },
      { id: 'docx', short: 'Word report', label: 'GRI report', fn: downloadGriReport },
    ],
  },
  sasb: {
    key: 'sasb',
    name: 'SASB',
    title: 'SASB Standards',
    noun: 'metric',
    nouns: 'metrics',
    searchHint: 'e.g. 130a or energy',
    remarksLabel: 'Note',
    omitHint: 'Say why the metric is not reported (one of four reasons) and explain it.',
    setupTitle: 'Choose your SASB industry',
    setupHint: 'An administrator picks the industry and sub-industry in Admin Console → Frameworks & KPIs → SASB setup. Its metrics then appear here.',
    downloads: [
      { id: 'xlsx', short: 'SASB index', label: 'SASB index', fn: downloadSasbIndex },
      { id: 'docx', short: 'Word report', label: 'SASB report', fn: downloadSasbReport },
    ],
  },
}
