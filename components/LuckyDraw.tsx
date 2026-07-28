'use client'

import { useEffect, useRef } from 'react'

const STYLES = `
.lucky-draw-root{
  --bg1:#031338; --bg2:#060a1d; --neon:#3aa7ff; --white:#f4fbff;
  position:fixed; inset:0; margin:0; overflow:hidden; color:white;
  font-family: "Arial","Malgun Gothic",sans-serif;
  background: radial-gradient(circle at 50% 45%, #0b3f91 0%, var(--bg1) 40%, var(--bg2) 100%);
}
.lucky-draw-root *{box-sizing:border-box}
.lucky-draw-root #stage{position:relative; width:100%; height:100%;}
.lucky-draw-root #bgImage{
  position:absolute; inset:0; z-index:0;
  background-size:cover; background-position:center; background-repeat:no-repeat;
  display:none;
}
.lucky-draw-root #bgDim{
  position:absolute; inset:0; z-index:1; background:#000; opacity:0; pointer-events:none;
}
.lucky-draw-root canvas{position:absolute; inset:0; width:100%; height:100%; z-index:2;}
.lucky-draw-root .topbar{
  position:absolute; top:18px; left:22px; right:22px; display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap;
  z-index:10; opacity:.92;
}
.lucky-draw-root .panel{
  background:rgba(0,0,0,.35); border:1px solid rgba(92,180,255,.45); border-radius:14px;
  padding:10px 14px; backdrop-filter: blur(6px); font-size:14px;
}
.lucky-draw-root input,.lucky-draw-root button,.lucky-draw-root select,.lucky-draw-root textarea{
  background:rgba(255,255,255,.12); color:white; border:1px solid rgba(255,255,255,.28);
  border-radius:8px; padding:7px 9px; font-size:14px;
}
.lucky-draw-root input[type=number]{width:90px}
.lucky-draw-root input[type=range]{padding:0; width:110px; vertical-align:middle}
.lucky-draw-root button{cursor:pointer}
.lucky-draw-root button:hover{background:rgba(80,170,255,.35)}
.lucky-draw-root select{cursor:pointer}
.lucky-draw-root select option{color:#111}
.lucky-draw-root #numberSettings.disabled{opacity:.35; pointer-events:none}
.lucky-draw-root #title{
  position:absolute; top:6.5vh; width:100%; text-align:center; z-index:4;
  font-size:clamp(24px,4.2vw,72px); font-weight:900; letter-spacing:.08em;
  text-shadow:0 0 18px #48a9ff, 0 0 40px #0066ff;
}
.lucky-draw-root #winnerBox{
  position:absolute; inset:0; display:flex; align-items:center; justify-content:center; flex-direction:column;
  pointer-events:none; z-index:5;
}
.lucky-draw-root #winnerLabel{
  font-size:clamp(24px,3vw,56px); font-weight:900; opacity:0;
  text-shadow:0 0 16px #6bd0ff; margin-bottom:8px;
}
.lucky-draw-root #winner{
  font-size:clamp(100px,18vw,310px); line-height:1; font-weight:1000;
  letter-spacing:.02em; color:var(--white);
  max-width:92vw; text-align:center; word-break:keep-all; overflow-wrap:break-word;
  text-shadow:0 0 16px white, 0 0 46px #44a7ff, 0 0 90px #005eff;
  transform:scale(.82); opacity:.95;
}
.lucky-draw-root .pop #winner{animation:lucky-draw-pop .75s ease-out}
.lucky-draw-root .pop #winnerLabel{opacity:1; animation:lucky-draw-label .7s ease-out}
@keyframes lucky-draw-pop{0%{transform:scale(.35);filter:blur(14px);opacity:0}65%{transform:scale(1.16);filter:blur(0);opacity:1}100%{transform:scale(.82)}}
@keyframes lucky-draw-label{0%{transform:translateY(20px);opacity:0}100%{transform:none;opacity:1}}
.lucky-draw-root #help{
  position:absolute; left:22px; bottom:22px; z-index:10; opacity:.85;
}
.lucky-draw-root #remainInfo{margin-left:6px; opacity:.8; font-size:13px}
.lucky-draw-root.hide-ui .topbar,.lucky-draw-root.hide-ui #help{display:none}

.lucky-draw-root .modal{
  position:fixed; inset:0; z-index:50; display:none;
  align-items:center; justify-content:center;
  background:rgba(0,0,10,.6); backdrop-filter:blur(4px);
}
.lucky-draw-root .modal.open{display:flex}
.lucky-draw-root .modal .box{
  background:rgba(6,18,48,.95);
  border:1px solid rgba(92,180,255,.55); border-radius:16px; padding:20px 22px;
  box-shadow:0 0 40px rgba(30,120,255,.35);
}
.lucky-draw-root .modal h3{margin:0 0 6px; font-size:20px; text-shadow:0 0 12px #48a9ff}
.lucky-draw-root .modal p{margin:0 0 12px; font-size:13px; opacity:.8; line-height:1.5}
.lucky-draw-root .modal .row{display:flex; gap:10px; margin-top:12px; align-items:center}

.lucky-draw-root #nameModal .box{width:min(560px,92vw)}
.lucky-draw-root #nameInput{
  width:100%; height:38vh; resize:vertical; font-size:15px; line-height:1.5;
  font-family:inherit;
}
.lucky-draw-root #nameCountInfo{flex:1; font-size:13px; opacity:.85}

.lucky-draw-root #historyModal .box{
  width:min(1100px,94vw); max-height:88vh; display:flex; flex-direction:column;
}
.lucky-draw-root #historyGrid{
  flex:1; overflow:auto; margin-top:8px;
  display:grid; grid-template-columns:repeat(auto-fill, minmax(200px,1fr)); gap:12px;
}
.lucky-draw-root #historyGrid .item{
  background:rgba(255,255,255,.08); border:1px solid rgba(120,190,255,.4);
  border-radius:12px; padding:14px 16px; text-align:center;
  font-size:clamp(20px,2.2vw,34px); font-weight:900;
  text-shadow:0 0 12px rgba(80,170,255,.8);
}
.lucky-draw-root #historyGrid .item small{
  display:block; font-size:12px; font-weight:400; opacity:.6; margin-bottom:4px; text-shadow:none;
}
.lucky-draw-root #historyGrid .empty{grid-column:1/-1; text-align:center; opacity:.6; padding:40px 0; font-size:16px}
.lucky-draw-root #historyCount{flex:1; font-size:13px; opacity:.85}
`

export default function LuckyDraw() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const prevBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const $ = <T extends Element = Element>(sel: string) => root.querySelector(sel) as T

    const canvas = $('#fx') as HTMLCanvasElement
    const ctx = canvas.getContext('2d')!
    const winner = $('#winner') as HTMLDivElement
    const winnerBox = $('#winnerBox') as HTMLDivElement
    const remainInfo = $('#remainInfo') as HTMLSpanElement
    const modeSel = $('#modeSel') as HTMLSelectElement
    const numberSettings = $('#numberSettings') as HTMLSpanElement
    const nameModal = $('#nameModal') as HTMLDivElement
    const nameInput = $('#nameInput') as HTMLTextAreaElement
    const nameCountInfo = $('#nameCountInfo') as HTMLSpanElement
    const historyModal = $('#historyModal') as HTMLDivElement
    const historyGrid = $('#historyGrid') as HTMLDivElement
    const historyCount = $('#historyCount') as HTMLSpanElement
    const bgImage = $('#bgImage') as HTMLDivElement
    const bgDim = $('#bgDim') as HTMLDivElement
    const minNoInput = $('#minNo') as HTMLInputElement
    const maxNoInput = $('#maxNo') as HTMLInputElement
    const digitsInput = $('#digits') as HTMLInputElement
    const ballCountInput = $('#ballCount') as HTMLInputElement
    const bgDimRange = $('#bgDimRange') as HTMLInputElement
    const bgFileInput = $('#bgFileInput') as HTMLInputElement

    type Ball = { x: number; y: number; r: number; vx: number; vy: number; label: string; rot: number; vr: number }
    type Particle = { x: number; y: number; vx: number; vy: number; life: number; r: number }

    let W = 0, H = 0
    let balls: Ball[] = []
    let particles: Particle[] = []
    let minNo = 1, maxNo = 1000, digits = 4, ballCount = 55
    let rolling = false, lastTick = 0
    let mode: 'number' | 'name' = 'number'
    const used = new Set<number>()
    let names: string[] = []
    let historyItems: string[] = []
    let rafId = 0
    let running = true
    let audioCtx: AudioContext | null = null

    function resize() {
      W = canvas.width = root!.clientWidth
      H = canvas.height = root!.clientHeight
    }
    window.addEventListener('resize', resize)
    resize()

    function pad(n: number) { return String(n).padStart(digits, '0') }
    function rand(a: number, b: number) { return Math.random() * (b - a) + a }
    function randi(a: number, b: number) { return Math.floor(rand(a, b + 1)) }

    // ---------- 배경 이미지 ----------
    function onBgUploadClick() { bgFileInput.click() }
    function onBgFileChange(e: Event) {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        bgImage.style.backgroundImage = `url(${ev.target?.result})`
        bgImage.style.display = 'block'
        bgDim.style.opacity = String(Number(bgDimRange.value) / 100)
      }
      reader.readAsDataURL(file)
      ;(e.target as HTMLInputElement).value = ''
    }
    function onBgClearClick() {
      bgImage.style.display = 'none'
      bgImage.style.backgroundImage = ''
      bgDim.style.opacity = '0'
    }
    function onBgDimInput(e: Event) {
      if (bgImage.style.display === 'block') {
        bgDim.style.opacity = String(Number((e.target as HTMLInputElement).value) / 100)
      }
    }

    // ---------- 명단 파싱 ----------
    function parseNames(text: string) {
      return text.split(/[\n,\t]+/).map((s) => s.trim()).filter(Boolean)
    }
    function updateNameCount() {
      nameCountInfo.textContent = parseNames(nameInput.value).length + '명'
    }

    // ---------- 표시 문자열 ----------
    function randomDisplay() {
      if (mode === 'name' && names.length) return names[randi(0, names.length - 1)]
      return pad(randi(minNo, maxNo))
    }
    function setWinnerText(str: string) {
      winner.textContent = str
      if (mode === 'name') {
        const len = [...str].length
        let vw = 18
        if (len > 3) vw = Math.max(6, 54 / len)
        winner.style.fontSize = `clamp(60px, ${vw}vw, 310px)`
      } else {
        winner.style.fontSize = ''
      }
    }

    // ---------- 공 ----------
    function ballLabel() {
      if (mode === 'name' && names.length) return names[randi(0, names.length - 1)]
      return String(randi(minNo, maxNo))
    }
    function makeBalls() {
      balls = []
      for (let i = 0; i < ballCount; i++) {
        balls.push({
          x: rand(0, W), y: rand(H * 0.18, H * 0.82), r: rand(28, 64),
          vx: rand(-1.8, 1.8), vy: rand(-1.2, 1.2),
          label: ballLabel(), rot: rand(0, Math.PI * 2), vr: rand(-0.025, 0.025),
        })
      }
    }

    // ---------- 설정 적용 ----------
    function applySettings() {
      mode = modeSel.value as 'number' | 'name'
      minNo = parseInt(minNoInput.value || '1')
      maxNo = parseInt(maxNoInput.value || '1000')
      digits = parseInt(digitsInput.value || '4')
      ballCount = parseInt(ballCountInput.value || '55')
      if (maxNo < minNo) { [minNo, maxNo] = [maxNo, minNo] }
      used.clear(); historyItems = []; renderHistory()
      numberSettings.classList.toggle('disabled', mode === 'name')
      if (mode === 'name') {
        if (!names.length) setWinnerText('명단을 입력하세요')
        else setWinnerText('')
      } else {
        setWinnerText(pad(minNo))
      }
      makeBalls()
      updateRemainInfo()
    }

    function updateRemainInfo() {
      if (mode === 'name') {
        remainInfo.textContent = names.length ? `잔여 ${names.length - used.size} / ${names.length}명` : ''
      } else {
        remainInfo.textContent = `잔여 ${(maxNo - minNo + 1) - used.size}개`
      }
    }

    // ---------- 사운드 ----------
    function beep(freq = 440, dur = 0.12, type: OscillatorType = 'sine', gain = 0.04) {
      try {
        if (!audioCtx) {
          const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
          audioCtx = new Ctor()
        }
        const ac = audioCtx
        const o = ac.createOscillator(), g = ac.createGain()
        o.type = type; o.frequency.value = freq; g.gain.value = gain
        o.connect(g); g.connect(ac.destination); o.start()
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur)
        o.stop(ac.currentTime + dur)
      } catch { /* 오디오 미지원 브라우저는 무시 */ }
    }
    function drum() { beep(90, 0.06, 'square', 0.025) }
    function tada() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.18, 'triangle', 0.055), i * 90)) }

    // ---------- 추첨 ----------
    function available() {
      if (mode === 'name') {
        const arr: number[] = []
        for (let i = 0; i < names.length; i++) if (!used.has(i)) arr.push(i)
        return arr
      }
      const arr: number[] = []
      for (let i = minNo; i <= maxNo; i++) if (!used.has(i)) arr.push(i)
      return arr
    }
    function pick(): number | null {
      const arr = available()
      if (!arr.length) {
        alert(mode === 'name' ? '더 이상 추첨할 인원이 없습니다.' : '더 이상 추첨할 번호가 없습니다.')
        rolling = false
        return null
      }
      return arr[Math.floor(Math.random() * arr.length)]
    }
    function toggleDraw() {
      if (mode === 'name' && !names.length) {
        openModal(nameModal); updateNameCount(); nameInput.focus(); return
      }
      if (!rolling) {
        rolling = true; winnerBox.classList.remove('pop'); beep(180, 0.12, 'sawtooth', 0.035)
      } else {
        rolling = false
        const p = pick(); if (p == null) return
        used.add(p)
        const label = mode === 'name' ? names[p] : pad(p)
        setWinnerText(label)
        winnerBox.classList.remove('pop'); void winnerBox.offsetWidth; winnerBox.classList.add('pop')
        historyItems.push(label); renderHistory()
        burst(); tada(); updateRemainInfo()
      }
    }

    // ---------- 당첨 이력 화면 ----------
    function renderHistory() {
      if (!historyItems.length) {
        historyGrid.innerHTML = '<div class="empty">아직 당첨자가 없습니다.</div>'
        historyCount.textContent = ''
        return
      }
      historyGrid.innerHTML = historyItems.map((v, i) =>
        `<div class="item"><small>${i + 1}번째</small>${v}</div>`
      ).join('')
      historyCount.textContent = `총 ${historyItems.length}명 당첨`
    }
    function onHistoryBtnClick() { openModal(historyModal) }
    function onHistoryCloseClick() { closeModal(historyModal) }
    async function onHistoryCopyClick() {
      if (!historyItems.length) { alert('복사할 이력이 없습니다.'); return }
      const text = historyItems.map((v, i) => `${i + 1}\t${v}`).join('\n')
      try {
        await navigator.clipboard.writeText(text)
        alert('당첨 이력이 복사되었습니다. 엑셀에 붙여넣을 수 있습니다.')
      } catch {
        prompt('아래 내용을 직접 복사하세요:', text)
      }
    }

    function burst() {
      for (let i = 0; i < 160; i++) {
        particles.push({ x: W / 2, y: H / 2, vx: rand(-8, 8), vy: rand(-7, 7), life: rand(45, 95), r: rand(2, 6) })
      }
    }

    // ---------- 공 렌더링 ----------
    function drawBall(b: Ball) {
      b.x += b.vx; b.y += b.vy; b.rot += b.vr
      if (b.x < -100) b.x = W + 100; if (b.x > W + 100) b.x = -100
      if (b.y < 80 || b.y > H - 80) b.vy *= -1
      const g = ctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.45, b.r * 0.1, b.x, b.y, b.r)
      g.addColorStop(0, 'rgba(255,255,255,.98)')
      g.addColorStop(0.45, 'rgba(118,190,255,.86)')
      g.addColorStop(1, 'rgba(4,41,115,.72)')
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot)
      ctx.shadowColor = '#55b9ff'; ctx.shadowBlur = 22
      ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill()
      ctx.shadowBlur = 0
      const len = [...String(b.label)].length
      const fs = Math.min(b.r * 0.72, (b.r * 1.7) / Math.max(1, len))
      ctx.fillStyle = 'rgba(0,0,0,.82)'; ctx.font = `900 ${fs}px "Malgun Gothic",Arial`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(String(b.label), 0, 2)
      ctx.restore()
    }

    function animate(t: number) {
      if (!running) return
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(70,170,255,.04)'
      for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.arc(rand(0, W), rand(0, H), rand(1, 2.5), 0, Math.PI * 2); ctx.fill() }
      balls.forEach((b, i) => {
        if (rolling && i % 3 === 0) b.label = ballLabel()
        drawBall(b)
      })
      if (rolling && t - lastTick > 42) {
        setWinnerText(randomDisplay())
        lastTick = t; drum()
      }
      particles = particles.filter((p) => p.life-- > 0)
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.08
        ctx.globalAlpha = Math.max(0, p.life / 80)
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = 'white'; ctx.fill()
        ctx.globalAlpha = 1
      })
      rafId = requestAnimationFrame(animate)
    }

    // ---------- 모달 공통 ----------
    function openModal(m: HTMLElement) { m.classList.add('open') }
    function closeModal(m: HTMLElement) { m.classList.remove('open') }
    function onModalBackdropClick(m: HTMLElement, e: MouseEvent) { if (e.target === m) closeModal(m) }
    const onNameModalBackdrop = (e: MouseEvent) => onModalBackdropClick(nameModal, e)
    const onHistoryModalBackdrop = (e: MouseEvent) => onModalBackdropClick(historyModal, e)

    // ---------- 명단 모달 ----------
    function onNameListBtnClick() { openModal(nameModal); updateNameCount(); nameInput.focus() }
    function onNameCancelClick() { closeModal(nameModal) }
    function onNameClearClick() { nameInput.value = ''; updateNameCount() }
    function onNameApplyClick() {
      const parsed = parseNames(nameInput.value)
      if (!parsed.length) { alert('입력된 명단이 없습니다.'); return }
      names = parsed
      modeSel.value = 'name'
      closeModal(nameModal)
      applySettings()
      beep(600, 0.12, 'triangle', 0.05)
    }

    // ---------- 버튼/단축키 ----------
    function onResetClick() {
      if (historyItems.length && !confirm('당첨 이력을 모두 초기화할까요?')) return
      used.clear(); historyItems = []; renderHistory(); updateRemainInfo()
      winnerBox.classList.remove('pop')
      if (mode === 'name') setWinnerText('')
      beep(300, 0.1)
    }
    function onFullBtnClick() { document.documentElement.requestFullscreen?.() }
    function onUiBtnClick() { root!.classList.toggle('hide-ui') }

    function onKeydown(e: KeyboardEvent) {
      const anyModalOpen = nameModal.classList.contains('open') || historyModal.classList.contains('open')
      if (anyModalOpen) {
        if (e.key === 'Escape') { closeModal(nameModal); closeModal(historyModal) }
        return
      }
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); toggleDraw() }
      const k = e.key.toLowerCase()
      if (k === 'f') document.documentElement.requestFullscreen?.()
      if (k === 'h') root!.classList.toggle('hide-ui')
      if (k === 'n') { openModal(nameModal); updateNameCount(); nameInput.focus() }
      if (k === 'l') openModal(historyModal)
    }

    const applyBtn = $('#applyBtn') as HTMLButtonElement
    const drawBtn = $('#drawBtn') as HTMLButtonElement
    const resetBtn = $('#resetBtn') as HTMLButtonElement
    const fullBtn = $('#fullBtn') as HTMLButtonElement
    const uiBtn = $('#uiBtn') as HTMLButtonElement
    const bgUploadBtn = $('#bgUploadBtn') as HTMLButtonElement
    const bgClearBtn = $('#bgClearBtn') as HTMLButtonElement
    const nameListBtn = $('#nameListBtn') as HTMLButtonElement
    const nameCancelBtn = $('#nameCancelBtn') as HTMLButtonElement
    const nameClearBtn = $('#nameClearBtn') as HTMLButtonElement
    const nameApplyBtn = $('#nameApplyBtn') as HTMLButtonElement
    const historyBtn = $('#historyBtn') as HTMLButtonElement
    const historyCloseBtn = $('#historyCloseBtn') as HTMLButtonElement
    const historyCopyBtn = $('#historyCopyBtn') as HTMLButtonElement

    modeSel.addEventListener('change', applySettings)
    bgUploadBtn.addEventListener('click', onBgUploadClick)
    bgFileInput.addEventListener('change', onBgFileChange)
    bgClearBtn.addEventListener('click', onBgClearClick)
    bgDimRange.addEventListener('input', onBgDimInput)
    nameInput.addEventListener('input', updateNameCount)
    historyBtn.addEventListener('click', onHistoryBtnClick)
    historyCloseBtn.addEventListener('click', onHistoryCloseClick)
    historyCopyBtn.addEventListener('click', onHistoryCopyClick)
    nameModal.addEventListener('click', onNameModalBackdrop)
    historyModal.addEventListener('click', onHistoryModalBackdrop)
    nameListBtn.addEventListener('click', onNameListBtnClick)
    nameCancelBtn.addEventListener('click', onNameCancelClick)
    nameClearBtn.addEventListener('click', onNameClearClick)
    nameApplyBtn.addEventListener('click', onNameApplyClick)
    applyBtn.addEventListener('click', applySettings)
    drawBtn.addEventListener('click', toggleDraw)
    resetBtn.addEventListener('click', onResetClick)
    fullBtn.addEventListener('click', onFullBtnClick)
    uiBtn.addEventListener('click', onUiBtnClick)
    window.addEventListener('keydown', onKeydown)

    applySettings()
    renderHistory()
    rafId = requestAnimationFrame(animate)

    return () => {
      running = false
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeydown)
      modeSel.removeEventListener('change', applySettings)
      bgUploadBtn.removeEventListener('click', onBgUploadClick)
      bgFileInput.removeEventListener('change', onBgFileChange)
      bgClearBtn.removeEventListener('click', onBgClearClick)
      bgDimRange.removeEventListener('input', onBgDimInput)
      nameInput.removeEventListener('input', updateNameCount)
      historyBtn.removeEventListener('click', onHistoryBtnClick)
      historyCloseBtn.removeEventListener('click', onHistoryCloseClick)
      historyCopyBtn.removeEventListener('click', onHistoryCopyClick)
      nameModal.removeEventListener('click', onNameModalBackdrop)
      historyModal.removeEventListener('click', onHistoryModalBackdrop)
      nameListBtn.removeEventListener('click', onNameListBtnClick)
      nameCancelBtn.removeEventListener('click', onNameCancelClick)
      nameClearBtn.removeEventListener('click', onNameClearClick)
      nameApplyBtn.removeEventListener('click', onNameApplyClick)
      applyBtn.removeEventListener('click', applySettings)
      drawBtn.removeEventListener('click', toggleDraw)
      resetBtn.removeEventListener('click', onResetClick)
      fullBtn.removeEventListener('click', onFullBtnClick)
      uiBtn.removeEventListener('click', onUiBtnClick)
      document.body.style.overflow = prevBodyOverflow
    }
  }, [])

  return (
    <>
      <style>{STYLES}</style>
      <div ref={rootRef} className="lucky-draw-root">
        <div id="stage">
          <div id="bgImage" />
          <div id="bgDim" />
          <canvas id="fx" />
          <div id="title">Lucky Draw</div>
          <div className="topbar">
            <div className="panel">
              모드
              <select id="modeSel" defaultValue="number">
                <option value="number">번호</option>
                <option value="name">명단(이름)</option>
              </select>
              <span id="numberSettings">
                최소 <input id="minNo" type="number" defaultValue={1} />
                최대 <input id="maxNo" type="number" defaultValue={1000} />
                자릿수 <input id="digits" type="number" defaultValue={4} />
              </span>
              공 개수 <input id="ballCount" type="number" defaultValue={55} />
              <button id="applyBtn">적용</button>
              <button id="nameListBtn">명단 입력</button>
              <span id="remainInfo" />
            </div>
            <div className="panel">
              <button id="drawBtn">추첨 시작/정지 Space</button>
              <button id="historyBtn">당첨 이력 L</button>
              <button id="resetBtn">이력 초기화</button>
              <button id="fullBtn">전체화면</button>
              <button id="uiBtn">UI 숨김</button>
            </div>
            <div className="panel">
              <button id="bgUploadBtn">배경 이미지</button>
              <button id="bgClearBtn">배경 제거</button>
              어둡게 <input id="bgDimRange" type="range" min={0} max={85} defaultValue={45} />
              <input id="bgFileInput" type="file" accept="image/*" style={{ display: 'none' }} />
            </div>
          </div>
          <div id="winnerBox">
            <div id="winnerLabel">당첨</div>
            <div id="winner">0000</div>
          </div>
          <div id="help" className="panel">
            Space/Enter: 추첨 시작·정지 · L: 당첨 이력 · F: 전체화면 · H: UI 숨김 · N: 명단 입력<br />
            중복 당첨은 자동 제외됩니다.
          </div>

          <div id="nameModal" className="modal">
            <div className="box">
              <h3>명단 입력</h3>
              <p>
                한 줄에 한 명씩 붙여넣으세요. 쉼표(,)나 탭으로 구분된 텍스트도 인식합니다.<br />
                엑셀에서 이름을 복사해 그대로 붙여넣어도 됩니다. 동명이인은 각각 별도 인원으로 처리됩니다.
              </p>
              <textarea id="nameInput" placeholder={'홍길동\n김철수\n이영희'} />
              <div className="row">
                <span id="nameCountInfo">0명</span>
                <button id="nameClearBtn">비우기</button>
                <button id="nameCancelBtn">닫기</button>
                <button id="nameApplyBtn"><b>명단 적용</b></button>
              </div>
            </div>
          </div>

          <div id="historyModal" className="modal">
            <div className="box">
              <h3>당첨 이력</h3>
              <div id="historyGrid"><div className="empty">아직 당첨자가 없습니다.</div></div>
              <div className="row">
                <span id="historyCount" />
                <button id="historyCopyBtn">목록 복사</button>
                <button id="historyCloseBtn">닫기</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
