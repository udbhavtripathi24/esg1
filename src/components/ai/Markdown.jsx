/**
 * The small Markdown subset VISTA AI is asked to write: ### headings, "- " bullets, **bold**, paragraphs.
 * Text is rendered as React text nodes (never as HTML), so a model reply cannot inject markup.
 */
function inline(text, key) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) => (p.startsWith('**') && p.endsWith('**') && p.length > 4
    ? <strong key={`${key}-${i}`} className="font-semibold text-ink-900">{p.slice(2, -2)}</strong>
    : p))
}

export default function Markdown({ text, accent = '#26890D' }) {
  const blocks = []
  let list = null
  const lines = (text || '').split('\n')
  lines.forEach((raw, i) => {
    const line = raw.trimEnd()
    const bullet = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/)
    if (bullet) {
      if (!list) { list = []; blocks.push({ type: 'ul', items: list, key: i }) }
      list.push(bullet[1])
      return
    }
    list = null
    if (!line.trim()) return
    const h = line.match(/^#{1,6}\s+(.*)$/)
    if (h) blocks.push({ type: 'h', text: h[1].replace(/\*\*/g, ''), key: i })
    else blocks.push({ type: 'p', text: line, key: i })
  })
  return (
    <div className="space-y-2 text-[12px] leading-relaxed text-ink-700">
      {blocks.map((b) => {
        if (b.type === 'h') {
          return (
            <h4 key={b.key} className="text-[12px] font-semibold text-ink-900 pt-1 flex items-center gap-1.5">
              <span className="w-1 h-3.5 rounded-full" style={{ background: accent }} aria-hidden="true" />{b.text}
            </h4>
          )
        }
        if (b.type === 'ul') {
          return (
            <ul key={b.key} className="space-y-1.5">
              {b.items.map((it, j) => (
                <li key={j} className="flex gap-2">
                  <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent }} aria-hidden="true" />
                  <span>{inline(it, `${b.key}-${j}`)}</span>
                </li>
              ))}
            </ul>
          )
        }
        return <p key={b.key}>{inline(b.text, b.key)}</p>
      })}
    </div>
  )
}
