// ponytail: tiny Markdown subset for AI output; swap for marked + DOMPurify if you need more.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const inline = (s) => s
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  .replace(/(?<!href="|">)\bhttps?:\/\/[^\s<|]+/g, (u) => { const url = u.replace(/[.,;:)\]]+$/, ''); return `<a href="${url}" target="_blank" rel="noopener">${url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 48)}${url.length > 56 ? '…' : ''}</a>${u.slice(url.length)}` })

const isRow = (l) => /^\s*\|.*\|\s*$/.test(l)
const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim()))

export function md(src = '') {
  const blocks = []
  // pull out fenced code first so nothing inside is formatted
  const lines = esc(src).replace(/```(\w*)\n?([\s\S]*?)(```|$)/g, (_, lang, code) => {
    blocks.push(`<pre><code>${code.replace(/\n$/, '')}</code></pre>`)
    return `\n\u0000${blocks.length - 1}\u0000\n`
  }).split('\n')
  const out = []
  let list = null
  const close = () => { if (list) { out.push(`</${list}>`); list = null } }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    let m
    if (isRow(line) && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1] || '')) {
      close()
      const head = cells(line), rows = []
      for (i += 2; i < lines.length && isRow(lines[i]); i++) rows.push(cells(lines[i]))
      i--
      out.push(`<div class="table-scroll"><table><thead><tr>${head.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`)
    }
    else if ((m = line.match(/^\u0000(\d+)\u0000$/))) { close(); out.push(blocks[m[1]]) }
    else if ((m = line.match(/^(#{1,4})\s+(.*)/))) { close(); const h = Math.min(m[1].length + 1, 4); out.push(`<h${h}>${inline(m[2])}</h${h}>`) }
    else if (/^\s*([-*_])\s*\1\s*\1[\s\-*_]*$/.test(line)) { close(); out.push('<hr>') }
    else if ((m = line.match(/^&gt;\s?(.*)/))) { close(); out.push(`<blockquote>${inline(m[1])}</blockquote>`) }
    else if ((m = line.match(/^\s*[-*•]\s+(.*)/))) { if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul' } out.push(`<li>${inline(m[1])}</li>`) }
    else if ((m = line.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol' } out.push(`<li>${inline(m[1])}</li>`) }
    else if (!line.trim()) close()
    else { close(); out.push(`<p>${inline(line)}</p>`) }
  }
  close()
  return out.join('')
}
