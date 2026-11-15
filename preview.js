/*!
 * Florarium Combinator — SVG Preview Module (drop-in)
 * Требует: window.__fc с геттерами state/D/DB/t (см. app.js, конец файла).
 */
(function () {
  'use strict'
  if (window.__fcPreviewInit) return
  window.__fcPreviewInit = true

  const B      = () => window.__fc || null
  const getSt  = () => { const b = B(); return b && b.state }
  const getD   = () => { const b = B(); return (b && b.D) || null }
  const getDB  = () => { const b = B(); return (b && b.DB) || {} }
  const tr = (k, fb) => { try { const b = B(); return (b && b.t && b.t(k)) || fb } catch { return fb } }
  const esc = s => String(s == null ? '' : s).replace(/[<>&"]/g,
    c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;' }[c]))

  const PV_W = 240, PV_H = 320, PV_MARGIN = 20
  const sizePx = s => s === 'micro' ? 8 : s === 'large' ? 32 : 20

  // 1-в-1 как в app.js
  const habitOf = p => {
    const l = p.layer_form || []
    if (l.length === 1 && l[0] === 'mount') return 'mount'
    if (l.some(x => x === 'bush' || x === 'accent')) return 'upright'
    if (l.indexOf('vine') >= 0) return 'trailing'
    return 'groundcover'
  }

  const vesselPath = (shape, x, y, w, h) => {
    const r = Math.min(w, h) * 0.08
    switch (shape) {
      case 'bowl': {
        const ry = w * 0.35
        return `M${x},${y} L${x},${y + h - ry} Q${x},${y + h} ${x + w / 2},${y + h} Q${x + w},${y + h} ${x + w},${y + h - ry} L${x + w},${y}`
      }
      case 'sphere': {
        const cx = x + w / 2, cy = y + h / 2, r0 = Math.min(w, h) / 2
        return `M${cx - r0},${cy} A${r0},${r0} 0 1,1 ${cx + r0},${cy} A${r0},${r0} 0 1,1 ${cx - r0},${cy}`
      }
      case 'cube': {
        const s = Math.min(w, h), cx = x + w / 2, cy = y + h / 2
        return `M${cx - s/2},${cy - s/2} L${cx + s/2},${cy - s/2} L${cx + s/2},${cy + s/2} L${cx - s/2},${cy + s/2} Z`
      }
      case 'bottle': {
        const nW = w * 0.4, nX = x + (w - nW) / 2, nH = h * 0.25
        return `M${nX},${y} L${nX},${y + nH} L${x},${y + nH + h * 0.1} L${x},${y + h} L${x + w},${y + h} L${x + w},${y + nH + h * 0.1} L${nX + nW},${y + nH} L${nX + nW},${y}`
      }
      case 'geo_house': {
        const peak = h * 0.4
        return `M${x + w / 2},${y} L${x + w},${y + peak} L${x + w},${y + h} L${x},${y + h} L${x},${y + peak} Z`
      }
      case 'tank':
        return `M${x},${y} L${x + w},${y} L${x + w},${y + h} L${x},${y + h} Z`
      default:
        return `M${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} L${x + r},${y + h} Q${x},${y + h} ${x},${y + h - r} L${x},${y + r} Q${x},${y} ${x + r},${y} Z`
    }
  }

  // ищет в DB.plants, DB.fauna и во всех DB.materials.*
  const findItem = (DB, id) => {
    if (!DB || !id) return null
    if (Array.isArray(DB.plants)) { const h = DB.plants.find(o => o && o.id === id); if (h) return h }
    if (Array.isArray(DB.fauna))  { const h = DB.fauna.find(o => o && o.id === id);  if (h) return h }
    if (DB.materials) {
      for (const k of Object.keys(DB.materials)) {
        const arr = DB.materials[k]
        if (Array.isArray(arr)) { const h = arr.find(o => o && o.id === id); if (h) return h }
      }
    }
    return null
  }

  const render = (state, D, DB) => {
    const v   = state.vessel || {}
    const hCm = +v.height || 20
    const wCm = +v.width || +v.diameter || +v.depth || 10
    const shape = v.shape || 'jar'

    const plants = (state.items || []).filter(i => i.kind === 'plant')
      .map(i => findItem(DB, i.id)).filter(Boolean)
    const fauna  = (state.items || []).filter(i => i.kind === 'fauna')
      .map(i => findItem(DB, i.id)).filter(Boolean)
    const stoneList = (state.stones || [])
      .map(id => (DB.materials && DB.materials.stones || []).find(s => s.id === id))
      .filter(Boolean).slice(0, 3)

    const availW = PV_W - PV_MARGIN * 2
    const availH = PV_H - PV_MARGIN * 2
    const scale = Math.min(availW / wCm, availH / hCm)
    const vW = wCm * scale, vH = hCm * scale
    const vX = (PV_W - vW) / 2, vY = PV_H - PV_MARGIN - vH
    const bottomY = vY + vH

    const drainageCm = (D && D.drainage) || 1
    const charcoalCm = (DB.norms && DB.norms.layers &&
      (DB.norms.layers.charcoal_cm ||
       (DB.norms.layers.charcoal && DB.norms.layers.charcoal.default))) || 0.5
    const sepCm = 0.2
    const subCm = Math.max(0.3, ((D && D.depth) || 3) - drainageCm - charcoalCm - sepCm)
    const topCm = 0.3

    const drainY = bottomY - drainageCm * scale
    const charY  = drainY   - charcoalCm * scale
    const sepY   = charY    - sepCm * scale
    const subTop = sepY     - subCm * scale
    const topY   = subTop   - topCm * scale

    const path = vesselPath(shape, vX, vY, vW, vH)
    const clipId = 'pv-clip'

    let s = `<svg viewBox="0 0 ${PV_W} ${PV_H}" class="pv-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(tr('preview.aria','Схема террариума'))}">`
    s += `<defs><clipPath id="${clipId}"><path d="${path}"/></clipPath></defs>`
    s += `<path d="${path}" fill="rgba(180,200,180,.08)"/>`
    s += `<g clip-path="url(#${clipId})">`
    s += `<rect x="${vX}" y="${drainY}" width="${vW}" height="${bottomY - drainY}" fill="#7a9e85" opacity="0.55"/>`
    s += `<rect x="${vX}" y="${charY}"  width="${vW}" height="${drainY - charY}"   fill="#2e2e2e" opacity="0.85"/>`
    s += `<rect x="${vX}" y="${sepY}"   width="${vW}" height="${charY - sepY}"    fill="#d4c9b8" opacity="0.85"/>`
    s += `<rect x="${vX}" y="${subTop}" width="${vW}" height="${sepY - subTop}"   fill="#3a2a1e" opacity="0.9"/>`
    s += `<rect x="${vX}" y="${topY}"   width="${vW}" height="${subTop - topY}"   fill="#5a7a5e" opacity="0.7"/>`

    stoneList.forEach((st, i) => {
      const x = vX + vW * (i + 1) / (stoneList.length + 1)
      s += `<polygon points="${x-6},${subTop} ${x-3},${subTop-7} ${x+2},${subTop-7} ${x+6},${subTop}" fill="#8a8a8a" stroke="#555" stroke-width="0.5"/>`
    })

    const byH = h => plants.filter(p => habitOf(p) === h)
    const gc = byH('groundcover').slice(0, 8)
    const up = byH('upright').slice(0, 6)
    const trl = byH('trailing').slice(0, 6)
    const mt  = byH('mount').slice(0, 4)

    if (mt.length) {
      const bY = subTop - vH * 0.35
      s += `<line x1="${vX + vW*0.15}" y1="${bY}" x2="${vX + vW*0.85}" y2="${bY-4}" stroke="#5a3a28" stroke-width="1.8"/>`
      mt.forEach((p, i) => {
        const x = vX + vW * (0.25 + 0.5 * i / Math.max(1, mt.length - 1))
        const h = sizePx(p.size)
        s += `<ellipse cx="${x}" cy="${bY - h/2}" rx="${h*0.5}" ry="${h/2}" fill="#7a9e85" opacity="0.9"/>`
      })
    }

    gc.forEach((p, i) => {
      const x = vX + vW * (i + 1) / (gc.length + 1)
      const h = sizePx(p.size)
      s += `<ellipse cx="${x}" cy="${subTop - h/2}" rx="${h*0.4}" ry="${h/2}" fill="#7a9e85" opacity="0.9"/>`
    })

    up.forEach((p, i) => {
      const x = vX + vW * (i + 1) / (up.length + 1)
      const h = sizePx(p.size) * 1.5, w = h * 0.3
      s += `<path d="M${x},${subTop} Q${x-w},${subTop-h*0.5} ${x},${subTop-h} Q${x+w},${subTop-h*0.5} ${x},${subTop}" fill="#7a9e85" opacity="0.9"/>`
    })

    trl.forEach((p, i) => {
      const x = vX + 12 + (vW - 24) * (i / Math.max(1, trl.length))
      s += `<path d="M${x},${vY+4} Q${x-4},${vY+20} ${x-2},${vY+35} Q${x+2},${vY+45} ${x},${vY+55}" stroke="#7a9e85" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.9"/>`
    })

    fauna.forEach((f, i) => {
      const count = Math.min(6, (f.starter_count && f.starter_count.recommended) || 1)
      for (let k = 0; k < count; k++) {
        const x = vX + 8 + (vW - 16) * (i * 6 + k) / Math.max(1, fauna.length * 6)
        s += `<circle cx="${x}" cy="${subTop - 3}" r="1.3" fill="#1a1a1a" opacity="0.85"/>`
      }
    })

    s += `</g>`
    s += `<path d="${path}" fill="none" stroke="#7a9e85" stroke-width="1.5" stroke-linejoin="round"/>`

    const freeH = D && D.freeHeight
    if (freeH && freeH > 0.5) {
      const yMid = (vY + topY) / 2
      s += `<line x1="${vX+4}" y1="${vY+4}" x2="${vX+4}" y2="${topY-2}" stroke="#999" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.4"/>`
      s += `<text x="${vX+8}" y="${yMid}" font-size="7" fill="#888">${esc(tr('preview.free','free'))} ${Math.round(freeH)}</text>`
    }

    s += `</svg>`
    return s
  }

  // ── host management ──
  const findPanel = () =>
    document.getElementById('jarPanel') ||
    document.querySelector('.jar, .jar-panel, [data-panel="jar"]')

  const ensureHost = (panel) => {
    let host = panel.querySelector(':scope > .pv-host')
    if (host) return host
    host = document.createElement('section')
    host.className = 'pv-host'
    host.setAttribute('role', 'img')
    host.setAttribute('aria-label', tr('preview.aria', 'Превью террариума'))
    panel.insertBefore(host, panel.firstChild)
    return host
  }

  const sig = (state, D) => {
    try {
      return JSON.stringify({
        v: [state.vessel.shape, state.vessel.height, state.vessel.width, state.vessel.diameter],
        i: (state.items || []).map(x => x.kind + ':' + x.id),
        s: state.stones,
        f: D && D.freeHeight,
        l: document.documentElement.lang
      })
    } catch { return '' }
  }

  const sync = () => {
    const st = getSt(), D = getD()
    if (!st || !st.vessel || !D) return
    const vb = document.getElementById('view-builder')
    if (vb && vb.classList.contains('hidden')) return
    const panel = findPanel()
    if (!panel) return
    const host = ensureHost(panel)
    const s2 = sig(st, D)
    if (host.dataset.sig === s2) return
    host.dataset.sig = s2
    try { host.innerHTML = render(st, D, getDB()) }
    catch (e) { console.warn('[fc-preview] render failed', e) }
  }

  let raf = 0, fails = 0, stopped = false
  const tick = () => {
    if (stopped) return
    if (document.visibilityState === 'visible') {
      try { sync(); fails = 0 }
      catch (e) { if (++fails > 30) { stopped = true; console.warn('[fc-preview] disabled', e); return } }
    }
    raf = requestAnimationFrame(tick)
  }
  const start = () => { if (!raf && !stopped) raf = requestAnimationFrame(tick) }
  const stop  = () => { if (raf) { cancelAnimationFrame(raf); raf = 0 } }

  document.addEventListener('visibilitychange', () =>
    document.visibilityState === 'visible' ? start() : stop())

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', start)
  else start()
})()
