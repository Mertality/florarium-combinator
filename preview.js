/*!
 * Florarium Combinator — SVG Preview Module (drop-in)
 * Требует мост в app.js:
 *   window.__fc = Object.freeze({
 *     get state() { return state },
 *     get D() { return D },
 *     get DB() { return DB },
 *     get t() { return t }
 *   })
 * Если моста нет — модуль тихо отключается.
 */
(function () {
  'use strict'
  if (window.__fcPreviewInit) return
  window.__fcPreviewInit = true

  // ─── bridge ───
  const B = () => window.__fc || null
  const getState = () => { const b = B(); return b && b.state }
  const getD = () => { const b = B(); return (b && b.D) || {} }
  const getDB = () => { const b = B(); return (b && b.DB) || {} }
  const tr = (key, fallback) => {
    try { const b = B(); return (b && b.t && b.t(key)) || fallback }
    catch { return fallback }
  }
  const esc = (s) => String(s == null ? '' : s).replace(/[<>&"]/g,
    c => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;' }[c]))

  // ─── geometry ───
  const PV_W = 240, PV_H = 320, PV_MARGIN = 20

  const pvSizePx = (size) =>
    size === 'micro' ? 8 : size === 'large' ? 32 : 20

  const pvVesselPath = (shape, x, y, w, h) => {
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
      case 'jar':
      default:
        return `M${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} L${x + r},${y + h} Q${x},${y + h} ${x},${y + h - r} L${x},${y + r} Q${x},${y} ${x + r},${y} Z`
    }
  }

  // ─── data helpers ───
  const pvFindItem = (DB, id) => {
    if (!DB || !id) return null
    for (const key of Object.keys(DB)) {
      const arr = DB[key] && DB[key].items
      if (Array.isArray(arr)) {
        const hit = arr.find(o => o && o.id === id)
        if (hit) return hit
      }
    }
    return null
  }

  const pvResolveVessel = (state, DB) => {
    const v = (state && state.vessel) || {}
    if (v.dims_cm && v.shape) return v
    const presets = (DB && DB.vessels && DB.vessels.presets) || []
    const p = presets.find(x => x.id === v.preset)
    if (!p) return v
    return {
      ...p, ...v,
      shape: v.shape || p.shape,
      dims_cm: v.dims_cm || p.dims_cm || {}
    }
  }

  // ─── render ───
  const pvRender = (state, D, DB) => {
    const vessel = pvResolveVessel(state, DB)
    const dims = vessel.dims_cm || {}
    const shape = vessel.shape || 'jar'
    const hCm = dims.height || 20
    const wCm = dims.width || dims.diameter || dims.length || 10

    const items = (state.items || []).map(it => ({ ...it, def: pvFindItem(DB, it.id) }))
    const plants = items.filter(i => i.kind === 'plant' && i.def).map(i => i.def)
    const fauna = items.filter(i => i.kind === 'fauna' && i.def).map(i => i.def)
    const hardscape = items.filter(i => i.kind === 'hardscape' && i.def).map(i => i.def)

    const availW = PV_W - PV_MARGIN * 2
    const availH = PV_H - PV_MARGIN * 2
    const scale = Math.min(availW / wCm, availH / hCm)
    const vW = wCm * scale
    const vH = hCm * scale
    const vX = (PV_W - vW) / 2
    const vY = PV_H - PV_MARGIN - vH
    const bottomY = vY + vH

    const drainageCm = D.drainage || 1
    const charcoalCm = (DB.norms && DB.norms.layers && DB.norms.layers.charcoal) || 0.5
    const separatorCm = 0.2
    const substrateCm = Math.max(0.3, (D.depth || 3) - drainageCm - charcoalCm - separatorCm)
    const topDressingCm = 0.3

    const drainageY = bottomY - drainageCm * scale
    const charcoalY = drainageY - charcoalCm * scale
    const separatorY = charcoalY - separatorCm * scale
    const substrateTopY = separatorY - substrateCm * scale
    const topDressingY = substrateTopY - topDressingCm * scale

    const vesselPath = pvVesselPath(shape, vX, vY, vW, vH)
    const clipId = 'pv-clip'

    let s = `<svg viewBox="0 0 ${PV_W} ${PV_H}" class="pv-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(tr('preview.aria', 'Схема террариума'))}">`
    s += `<defs><clipPath id="${clipId}"><path d="${vesselPath}"/></clipPath></defs>`
    s += `<path d="${vesselPath}" fill="rgba(180,200,180,.08)"/>`
    s += `<g clip-path="url(#${clipId})">`
    s += `<rect x="${vX}" y="${drainageY}" width="${vW}" height="${bottomY - drainageY}" fill="#7a9e85" opacity="0.55"/>`
    s += `<rect x="${vX}" y="${charcoalY}" width="${vW}" height="${drainageY - charcoalY}" fill="#2e2e2e" opacity="0.85"/>`
    s += `<rect x="${vX}" y="${separatorY}" width="${vW}" height="${charcoalY - separatorY}" fill="#d4c9b8" opacity="0.85"/>`
    s += `<rect x="${vX}" y="${substrateTopY}" width="${vW}" height="${separatorY - substrateTopY}" fill="#3a2a1e" opacity="0.9"/>`
    s += `<rect x="${vX}" y="${topDressingY}" width="${vW}" height="${substrateTopY - topDressingY}" fill="#5a7a5e" opacity="0.7"/>`

    // камни
    const stones = hardscape.slice(0, 3)
    stones.forEach((st, i) => {
      const x = vX + vW * (i + 1) / (stones.length + 1)
      s += `<polygon points="${x-6},${substrateTopY} ${x-3},${substrateTopY-7} ${x+2},${substrateTopY-7} ${x+6},${substrateTopY}" fill="#8a8a8a" stroke="#555" stroke-width="0.5"/>`
    })

    const habitOf = p => p.layer_form || p.habit || 'groundcover'
    const byHabit = h => plants.filter(p => habitOf(p) === h)
    const groundcover = byHabit('groundcover').slice(0, 8)
    const upright = byHabit('upright').slice(0, 6)
    const trailing = byHabit('trailing').slice(0, 6)
    const mount = [...byHabit('mount'), ...byHabit('epiphyte')].slice(0, 4)

    if (mount.length) {
      const branchY = substrateTopY - vH * 0.35
      s += `<line x1="${vX + vW*0.15}" y1="${branchY}" x2="${vX + vW*0.85}" y2="${branchY-4}" stroke="#5a3a28" stroke-width="1.8"/>`
      mount.forEach((p, i) => {
        const x = vX + vW * (0.25 + 0.5 * i / Math.max(1, mount.length - 1))
        const h = pvSizePx(p.size)
        s += `<ellipse cx="${x}" cy="${branchY - h/2}" rx="${h*0.5}" ry="${h/2}" fill="${p.color || '#7a9e85'}" opacity="0.9"/>`
      })
    }

    groundcover.forEach((p, i) => {
      const x = vX + vW * (i + 1) / (groundcover.length + 1)
      const h = pvSizePx(p.size)
      s += `<ellipse cx="${x}" cy="${substrateTopY - h/2}" rx="${h*0.4}" ry="${h/2}" fill="${p.color || '#7a9e85'}" opacity="0.9"/>`
    })

    upright.forEach((p, i) => {
      const x = vX + vW * (i + 1) / (upright.length + 1)
      const h = pvSizePx(p.size) * 1.5, w = h * 0.3
      s += `<path d="M${x},${substrateTopY} Q${x-w},${substrateTopY-h*0.5} ${x},${substrateTopY-h} Q${x+w},${substrateTopY-h*0.5} ${x},${substrateTopY}" fill="${p.color || '#7a9e85'}" opacity="0.9"/>`
    })

    trailing.forEach((p, i) => {
      const x = vX + 12 + (vW - 24) * (i / Math.max(1, trailing.length))
      s += `<path d="M${x},${vY+4} Q${x-4},${vY+20} ${x-2},${vY+35} Q${x+2},${vY+45} ${x},${vY+55}" stroke="${p.color || '#7a9e85'}" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.9"/>`
    })

    fauna.forEach((f, i) => {
      const count = Math.min(6, (f.starter_count && f.starter_count.recommended) || 1)
      for (let k = 0; k < count; k++) {
        const x = vX + 8 + (vW - 16) * (i*6 + k) / Math.max(1, fauna.length*6)
        s += `<circle cx="${x}" cy="${substrateTopY-3}" r="1.3" fill="#1a1a1a" opacity="0.85"/>`
      }
    })

    s += `</g>`
    s += `<path d="${vesselPath}" fill="none" stroke="#7a9e85" stroke-width="1.5" stroke-linejoin="round"/>`

    const freeH = D.freeHeight
    if (freeH && freeH > 0.5) {
      const yMid = (vY + topDressingY) / 2
      s += `<line x1="${vX+4}" y1="${vY+4}" x2="${vX+4}" y2="${topDressingY-2}" stroke="#999" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.4"/>`
      s += `<text x="${vX+8}" y="${yMid}" font-size="7" fill="#888">${esc(tr('preview.free','free'))} ${Math.round(freeH)} ${esc(tr('preview.cm','см'))}</text>`
    }

    s += `</svg>`
    return s
  }

  // ─── sync / mount ───
  const findPanel = () =>
    document.querySelector('.jar, .jar-panel, #jar, [data-panel="jar"]')

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

  const pvSig = (state) => {
    try {
      return JSON.stringify({
        v: state.vessel,
        i: (state.items || []).map(x => x.kind + ':' + x.id),
        f: (getD() || {}).freeHeight,
        l: (document.documentElement.lang) || ''
      })
    } catch { return String(Date.now()) }
  }

  const sync = () => {
    const state = getState()
    if (!state || !state.vessel) return
    const panel = findPanel()
    if (!panel) return
    const host = ensureHost(panel)
    const sig = pvSig(state)
    if (host.dataset.sig === sig) return
    host.dataset.sig = sig
    try {
      host.innerHTML = pvRender(state, getD(), getDB())
    } catch (e) {
      console.warn('[fc-preview] render failed', e)
    }
  }

  // ─── main loop (rAF, visibility-aware, auto-disable on errors) ───
  let raf = 0, fails = 0, stopped = false
  const tick = () => {
    if (stopped) return
    if (document.visibilityState === 'visible') {
      try { sync(); fails = 0 }
      catch (e) {
        fails++
        if (fails > 30) { stopped = true; console.warn('[fc-preview] disabled', e); return }
      }
    }
    raf = requestAnimationFrame(tick)
  }
  const start = () => { if (!raf && !stopped) raf = requestAnimationFrame(tick) }
  const stop  = () => { if (raf) { cancelAnimationFrame(raf); raf = 0 } }

  document.addEventListener('visibilitychange', () =>
    document.visibilityState === 'visible' ? start() : stop())

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', start)
  else
    start()
})()
