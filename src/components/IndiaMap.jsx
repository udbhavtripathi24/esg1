import { useMemo, useState, useRef, useEffect } from 'react'

// The district boundaries are ~440 KB of JSON. Importing them statically
// put that in the main bundle for every user, including the large
// majority who never open a map. Loading on demand keeps the initial
// bundle where it was and costs one short fetch when a map first opens.
let _geo = null
let _geoPromise = null
function loadGeo() {
  if (_geo) return Promise.resolve(_geo)
  if (!_geoPromise) {
    _geoPromise = import('../data/indiaDistricts.json').then((m) => {
      _geo = m.default
      return _geo
    })
  }
  return _geoPromise
}

/**
 * District-level map of India, drawn as plain SVG.
 *
 * No mapping library and no tile server. A Mercator projection is about
 * fifteen lines of maths, and doing it here keeps the map working
 * offline, inside the existing bundle, with no runtime calls to a third
 * party -- which matters for a dashboard that may run inside a client
 * network.
 *
 * Boundary data note: these are 2011 district boundaries covering all 36
 * states and union territories, extending to 37.1°N and 97.4°E, i.e. the
 * full extent India officially claims including Jammu & Kashmir and
 * Ladakh. Before any external or published use, the boundaries should be
 * validated against Survey of India, since depicting India's borders
 * incorrectly is a legal matter here, not only a cartographic one.
 */

// Mercator. Latitude is projected through the standard log-tangent
// formula; using a plain linear scale would visibly squash the north.
function mercatorY(lat) {
  const r = (lat * Math.PI) / 180
  return Math.log(Math.tan(Math.PI / 4 + r / 2))
}

const VIEW_W = 720
const VIEW_H = 800

// Built once, the first time a map mounts, then cached for the session.
let _built = null

function build(geo) {
  if (_built) return _built

  let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90
  for (const f of geo.features) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
    for (const poly of polys) for (const ring of poly) for (const [lon, lat] of ring) {
      if (lon < minLon) minLon = lon
      if (lon > maxLon) maxLon = lon
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    }
  }
  const y0 = mercatorY(minLat), y1 = mercatorY(maxLat)
  const project = ([lon, lat]) => [
    ((lon - minLon) / (maxLon - minLon)) * VIEW_W,
    VIEW_H - ((mercatorY(lat) - y0) / (y1 - y0)) * VIEW_H,
  ]

  const ringToPath = (ring) => {
    let d = ''
    for (let i = 0; i < ring.length; i++) {
      const [x, y] = project(ring[i])
      d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1)
    }
    return d + 'Z'
  }

  const paths = geo.features.map((f, featureIndex) => {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
    let d = ''
    let x0 = 1e9, y0b = 1e9, x1 = -1e9, y1b = -1e9
    for (const poly of polys) for (const ring of poly) {
      d += ringToPath(ring)
      for (const c of ring) {
        const [x, y] = project(c)
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0b) y0b = y
        if (y > y1b) y1b = y
      }
    }
    return {
      // featureIndex keeps this unique: a few states (Chandigarh,
      // Lakshadweep) have more than one feature with the same district
      // name, which produced duplicate React keys.
      key: `${f.properties.s}|${f.properties.d}|${featureIndex}`,
      lookupKey: `${f.properties.s}|${f.properties.d}`,
      district: f.properties.d,
      state: f.properties.s,
      d, x0, y0: y0b, x1, y1: y1b,
    }
  })

  // State outlines, drawn as strokes above the district fills. These are
  // the features that carry no district name; drawing them in the
  // district layer painted a solid shape over each state's own districts.
  const stateOutlines = (geo.states?.features || []).map((f, i) => {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
    let d = ''
    for (const poly of polys) for (const ring of poly) d += ringToPath(ring)
    return { key: `${f.properties.s}|${i}`, state: f.properties.s, d }
  })

  const stateBox = {}
  for (const p of paths) {
    const b = stateBox[p.state] || (stateBox[p.state] = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 })
    b.x0 = Math.min(b.x0, p.x0); b.y0 = Math.min(b.y0, p.y0)
    b.x1 = Math.max(b.x1, p.x1); b.y1 = Math.max(b.y1, p.y1)
  }

  _built = { paths, stateOutlines, stateBox, project }
  return _built
}

const FULL_VIEW = { x: 0, y: 0, w: VIEW_W, h: VIEW_H }
const MIN_W = VIEW_W / 14   // hard zoom-in limit, about district scale

function clampView(v) {
  const w = Math.min(Math.max(v.w, MIN_W), VIEW_W)
  const h = w * (VIEW_H / VIEW_W)
  // Keep the viewport inside the map so you cannot pan off into blank space.
  const x = Math.min(Math.max(v.x, -w * 0.1), VIEW_W - w * 0.9)
  const y = Math.min(Math.max(v.y, -h * 0.1), VIEW_H - h * 0.9)
  return { x, y, w, h }
}

function boxToView(b, padRatio = 0.18) {
  const w0 = b.x1 - b.x0, h0 = b.y1 - b.y0
  const pad = Math.max(w0, h0) * padRatio
  // Match the SVG's own aspect ratio, or the zoom distorts.
  let w = Math.max(w0 + pad * 2, (h0 + pad * 2) * (VIEW_W / VIEW_H))
  const h = w * (VIEW_H / VIEW_W)
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2
  return clampView({ x: cx - w / 2, y: cy - h / 2, w, h })
}

export default function IndiaMap({
  scores = [],
  focusState = null,
  assets = null,
  onDistrictClick,
  onAssetClick,
  height = 520,
}) {
  const [hover, setHover] = useState(null)
  const [tip, setTip] = useState({ x: 0, y: 0 })
  const [geo, setGeo] = useState(_built)
  const [view, setView] = useState(FULL_VIEW)
  const wrapRef = useRef(null)
  const svgRef = useRef(null)
  const animRef = useRef(null)
  const dragRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    let alive = true
    loadGeo().then((g) => { if (alive) setGeo(build(g)) })
    return () => { alive = false }
  }, [])

  // Animate between views rather than jumping -- a hard cut makes it hard
  // to tell where you landed, especially when zooming from the whole
  // country into one state.
  function animateTo(target) {
    cancelAnimationFrame(animRef.current)
    const from = view
    const t0 = performance.now()
    const dur = 380
    const step = (now) => {
      const k = Math.min((now - t0) / dur, 1)
      const e = 1 - Math.pow(1 - k, 3)   // ease-out
      setView({
        x: from.x + (target.x - from.x) * e,
        y: from.y + (target.y - from.y) * e,
        w: from.w + (target.w - from.w) * e,
        h: from.h + (target.h - from.h) * e,
      })
      if (k < 1) animRef.current = requestAnimationFrame(step)
    }
    animRef.current = requestAnimationFrame(step)
  }
  useEffect(() => () => cancelAnimationFrame(animRef.current), [])

  // Keep the map in step with the State dropdown, so the two controls
  // never disagree about what is being shown.
  useEffect(() => {
    if (!geo) return
    if (focusState && geo.stateBox[focusState]) animateTo(boxToView(geo.stateBox[focusState]))
    else animateTo(FULL_VIEW)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo, focusState])

  function svgPoint(e) {
    const svg = svgRef.current
    if (!svg) return null
    const r = svg.getBoundingClientRect()
    return {
      x: view.x + ((e.clientX - r.left) / r.width) * view.w,
      y: view.y + ((e.clientY - r.top) / r.height) * view.h,
    }
  }

  function handleWheel(e) {
    e.preventDefault()
    const p = svgPoint(e)
    if (!p) return
    cancelAnimationFrame(animRef.current)
    const factor = e.deltaY > 0 ? 1.18 : 1 / 1.18
    const w = view.w * factor
    // Zoom about the pointer so the feature under the cursor stays put.
    const kx = (p.x - view.x) / view.w
    const ky = (p.y - view.y) / view.h
    const h = w * (VIEW_H / VIEW_W)
    setView(clampView({ x: p.x - kx * w, y: p.y - ky * h, w, h }))
  }

  // Attached manually rather than via onWheel: React's synthetic wheel
  // listener is passive, so preventDefault() there is ignored and the
  // page scrolls underneath the map while you are zooming it.
  const wheelRef = useRef(handleWheel)
  wheelRef.current = handleWheel
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const fn = (e) => wheelRef.current(e)
    el.addEventListener('wheel', fn, { passive: false })
    return () => el.removeEventListener('wheel', fn)
  }, [geo])

  function onPointerDown(e) {
    const p = svgPoint(e)
    if (!p) return
    dragRef.current = { start: p, view, moved: false }
    setDragging(true)
  }
  function onPointerMove(e) {
    const r = wrapRef.current?.getBoundingClientRect()
    if (r) setTip({ x: e.clientX - r.left, y: e.clientY - r.top })
    const d = dragRef.current
    if (!d) return
    const svg = svgRef.current.getBoundingClientRect()
    const dx = ((e.clientX - svg.left) / svg.width) * view.w
    const dy = ((e.clientY - svg.top) / svg.height) * view.h
    const nx = d.view.x + (d.start.x - d.view.x) - dx
    const ny = d.view.y + (d.start.y - d.view.y) - dy
    if (Math.abs(dx) + Math.abs(dy) > 0) d.moved = true
    cancelAnimationFrame(animRef.current)
    setView(clampView({ ...view, x: nx, y: ny }))
  }
  function endDrag() { dragRef.current = null; setDragging(false) }

  const scoreByKey = useMemo(() => {
    const m = new Map()
    for (const s of scores) m.set(`${s.state}|${s.district}`, s)
    return m
  }, [scores])

  const assetPoints = useMemo(() => {
    if (!assets || !geo) return []
    return assets.map((a) => {
      const [x, y] = geo.project([a.lon, a.lat])
      return { ...a, x, y }
    })
  }, [assets, geo])

  if (!geo) {
    return (
      <div className="flex items-center justify-center text-[11px] text-ink-400" style={{ height }}>
        Loading map…
      </div>
    )
  }

  const zoomed = view.w < VIEW_W - 1
  // Keep strokes and markers a constant on-screen size as you zoom in,
  // otherwise borders turn into thick slabs at high zoom.
  const k = view.w / VIEW_W
  const viewBox = `${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.w.toFixed(1)} ${view.h.toFixed(1)}`

  function zoomBy(f) {
    cancelAnimationFrame(animRef.current)
    const cx = view.x + view.w / 2, cy = view.y + view.h / 2
    const w = view.w * f, h = w * (VIEW_H / VIEW_W)
    setView(clampView({ x: cx - w / 2, y: cy - h / 2, w, h }))
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={viewBox}
        width="100%"
        height={height}
        style={{ display: 'block', cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={() => { endDrag(); setHover(null) }}
      >
        <g>
          {geo.paths.map((p) => {
            const s = scoreByKey.get(p.lookupKey)
            const dim = focusState && p.state !== focusState
            return (
              <path
                key={p.key}
                d={p.d}
                fill={s ? s.color : '#E8EAED'}
                fillOpacity={dim ? 0.25 : 1}
                stroke="#FFFFFF"
                strokeWidth={0.4 * k}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHover({
                  title: p.district,
                  sub: p.state,
                  value: s ? `${s.score} · ${s.band}` : 'No data',
                })}
                onMouseLeave={() => setHover(null)}
                onClick={() => {
                  // Ignore the click that ends a drag, or panning would
                  // constantly trigger an unwanted zoom.
                  if (dragRef.current?.moved) return
                  onDistrictClick?.(p)
                }}
              />
            )
          })}
        </g>

        <g pointerEvents="none">
          {geo.stateOutlines.map((o) => (
            <path
              key={o.key}
              d={o.d}
              fill="none"
              stroke={focusState && o.state === focusState ? '#1F2937' : '#9AA3AE'}
              strokeWidth={(focusState && o.state === focusState ? 1.1 : 0.7) * k}
              strokeLinejoin="round"
            />
          ))}
        </g>

        {assetPoints.length > 0 && (
          <g>
            {assetPoints.map((a) => (
              <g key={a.id}>
                <circle cx={a.x} cy={a.y} r={9 * k} fill={a.color} fillOpacity={0.25} />
                <circle
                  cx={a.x} cy={a.y} r={5 * k}
                  fill={a.color} stroke="#FFFFFF" strokeWidth={1.5 * k}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHover({
                    title: a.name,
                    sub: `${a.district}, ${a.state} · ${a.type}`,
                    value: `${a.score} · ${a.band}`,
                  })}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => {
                    if (dragRef.current?.moved) return
                    onAssetClick?.(a)
                    if (geo.stateBox[a.state]) animateTo(boxToView(geo.stateBox[a.state], 0.6))
                  }}
                />
              </g>
            ))}
          </g>
        )}
      </svg>

      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <button
          onClick={() => zoomBy(1 / 1.5)}
          title="Zoom in"
          className="w-7 h-7 rounded-md bg-white border border-surface-border text-ink-600 text-sm leading-none hover:bg-surface-muted"
        >+</button>
        <button
          onClick={() => zoomBy(1.5)}
          title="Zoom out"
          className="w-7 h-7 rounded-md bg-white border border-surface-border text-ink-600 text-sm leading-none hover:bg-surface-muted"
        >−</button>
        {zoomed && (
          <button
            onClick={() => { onDistrictClick?.(null); animateTo(FULL_VIEW) }}
            title="Reset to all India"
            className="w-7 h-7 rounded-md bg-white border border-surface-border text-ink-600 text-[9px] leading-none hover:bg-surface-muted"
          >⤢</button>
        )}
      </div>

      <p className="absolute bottom-1 left-2 text-[9px] text-ink-300 pointer-events-none">
        Click a district to zoom · scroll to zoom · drag to pan
      </p>

      {hover && (
        <div
          className="absolute pointer-events-none bg-white border border-surface-border rounded-md shadow-md px-3 py-2 text-[10px] z-10"
          style={{ left: Math.min(tip.x + 12, 320), top: tip.y + 12 }}
        >
          <p className="font-medium text-ink-900">{hover.title}</p>
          <p className="text-ink-400">{hover.sub}</p>
          <p className="text-ink-700 mt-0.5">{hover.value}</p>
        </div>
      )}
    </div>
  )
}

export function RiskLegend({ bands = [] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
      {bands.map((b) => (
        <div key={b.band || b.label} className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: b.color }} />
          <span className="text-[10px] text-ink-500">
            {b.band || b.label}{typeof b.count === 'number' ? ` (${b.count})` : ''}
          </span>
        </div>
      ))}
    </div>
  )
}
