/**
 * Reporting units (Admin Console → Units): the unit the Dashboard and Analytics show a quantity in.
 *
 * The KPI engine computes in fixed units (energy MJ, water kL, emissions tCO₂e, waste tonnes); this converts
 * a figure already labelled with any unit of the same quantity to the company's choice. Intensities convert
 * too ("GJ per ₹ crore" → "MWh per ₹ crore"). BRSR, GRI and SASB keep their own units and do not use this.
 */
export const QUANTITIES = {
  energy: { default: 'GJ', factors: { MJ: 1, GJ: 1e-3, MWh: 1 / 3600, kWh: 1 / 3.6, TJ: 1e-6 } },
  water: { default: 'kL', factors: { kL: 1, 'm³': 1, ML: 1e-3 } },
  emissions: { default: 'tCO₂e', factors: { 'tCO₂e': 1, 'ktCO₂e': 1e-3, 'kgCO₂e': 1e3 } },
  waste: { default: 't', factors: { t: 1, MT: 1, kg: 1e3 } },
}

function quantityOf(unit) {
  return Object.keys(QUANTITIES).find((q) => unit in QUANTITIES[q].factors)
}

/** {unit, scale} for a figure shown as `value * scale` in `unit`, re-expressed in the company's unit. */
export function convertUnit(unit, scale = 1, prefs) {
  if (!unit || !prefs) return { unit, scale }
  const [head, ...rest] = unit.split(' per ')
  const q = quantityOf(head)
  const want = q && prefs[q]
  if (!want || want === head || !(want in QUANTITIES[q].factors)) return { unit, scale }
  const f = QUANTITIES[q].factors
  return { unit: [want, ...rest].join(' per '), scale: scale * (f[want] / f[head]) }
}

/** {value, unit} for a value given in `unit`. */
export function convertValue(value, unit, prefs) {
  const c = convertUnit(unit, 1, prefs)
  return { value: value === null || value === undefined ? value : value * c.scale, unit: c.unit, scale: c.scale }
}

/** An Analytics domain (viz.js DOMAINS) with its headline, tiles and mix in the company's units. */
export function withUnits(domain, prefs) {
  if (!prefs) return domain
  const h = convertUnit(domain.headline.unit, domain.headline.scale, prefs)
  const m = convertUnit(domain.mix.unit, domain.mix.scale, prefs)
  return {
    ...domain,
    headline: { ...domain.headline, ...h },
    tiles: domain.tiles.map(([code, label, unit, scale]) => {
      const t = convertUnit(unit, scale, prefs)
      return [code, label, t.unit, t.scale]
    }),
    mix: { ...domain.mix, ...m },
  }
}

/** Upload conversions (parse_sheet's `conversions`) grouped by from → to: one line per pair, not per column. */
export function groupConversions(list) {
  const out = []
  for (const c of list || []) {
    const g = out.find((x) => x.from === c.from && x.to === c.to)
    if (g) g.columns.push(c.column.replace(/_/g, ' '))
    else out.push({ from: c.from, to: c.to, factor: Number(c.factor.toPrecision(6)), columns: [c.column.replace(/_/g, ' ')] })
  }
  return out
}
