import { useEffect, useMemo, useRef, useState } from 'react'
import { FiHelpCircle, FiMic } from 'react-icons/fi'
import { calculateWage, type Piecework, type WageSession } from './domain/calculation'

const WORK_ITEMS = [
  { id: 'Le Milieu_農園', name: 'Le Milieu_農園', easyName: 'るみりゅー のうえん', rate: 150 },
  { id: 'Le Milieu_ワイナリー', name: 'Le Milieu_ワイナリー', easyName: 'るみりゅー わいなりー', rate: 150 },
  { id: 'KIIYA', name: 'KIIYA', easyName: 'きいや', rate: 150 },
  { id: 'ルート5', name: 'ルート5', easyName: 'るーと ふぁいぶ', rate: 150 },
  { id: '東洋計器', name: '東洋計器', easyName: 'とうようけいき', rate: 150 },
  { id: '販売会準備・片付け', name: '販売会準備・片付け', easyName: 'はんばいかい じゅんび・かたづけ', rate: 100 },
  { id: '手芸', name: '手芸', easyName: 'しゅげい', rate: 100 },
  { id: 'スリーピース', name: 'スリーピース', easyName: 'すりーぴーす', rate: 100 },
  { id: 'PC', name: 'PC', easyName: 'ぴーしー', rate: 100 },
  { id: '就職準備', name: '就職準備', easyName: 'しゅうしょくじゅんび', rate: 100 },
  { id: 'その他内職', name: 'その他内職', easyName: 'そのた ないしょく', rate: 100 },
  { id: '販売会（平日）参加', name: '販売会（平日）参加', easyName: 'はんばいかい さんか', rate: 150 },
  { id: 'シルクスクリーン', name: 'シルクスクリーン', easyName: 'しるくすくりーん', rate: 300 },
] as const
const BONUSES = [0, 50, 100, 200, 300, 400, 500]
const emptySession = (): WageSession => ({ hourlyRate: 0, hours: 0, minutes: 0, bonus: 0 })
const emptyPiecework = (): Piecework => ({ name: '', unitPrice: 0, quantity: 0 })
type SessionKey = 'am' | 'pm'

type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: { error: string }) => void) | null
  onresult: ((event: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

function App() {
  const [sessions, setSessions] = useState<Record<SessionKey, WageSession>>({
    am: { hourlyRate: 150, hours: 2, minutes: 30, bonus: 100 },
    pm: { hourlyRate: 100, hours: 3, minutes: 0, bonus: 100 },
  })
  const [workNames, setWorkNames] = useState<Record<SessionKey, string>>({ am: 'KIIYA', pm: 'PC' })
  const [easyDisplay, setEasyDisplay] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const [tourBubble, setTourBubble] = useState({ top: 20, left: 50, below: false })
  const [nameHelp, setNameHelp] = useState<{ index: number; step: 0 | 1 | 2 } | null>(null)
  const [nameHelpBubble, setNameHelpBubble] = useState({ top: 20, left: 50, below: false })
  const [pieceworks, setPieceworks] = useState<Piecework[]>([{ unitPrice: 10, quantity: 20 }, { unitPrice: 5, quantity: 30 }])
  const [pieceworkNameMode, setPieceworkNameMode] = useState<'select' | 'text'>('select')
  const result = useMemo(() => calculateWage({ ...sessions, pieceworks }), [sessions, pieceworks])
  const tourTargets = useMemo(() => ['am-work', 'am-hours', 'am-bonus', 'am-total', ...pieceworks.slice(0, 1).flatMap((_, index) => [`piecework-${index}-name`, `piecework-${index}-price`, `piecework-${index}-quantity`, `piecework-${index}-amount`]), 'total'], [pieceworks])
  const currentTourTarget = tourTargets[tourStep]
  const tourMessage = currentTourTarget === 'am-work' ? (easyDisplay ? 'きょう はたらいた おしごとの ないようを えらびます' : '今日働いた仕事の内容を選びます') : currentTourTarget === 'am-hours' ? (easyDisplay ? 'きょう はたらいた じかん' : '今日働いた時間') : currentTourTarget === 'am-bonus' ? (easyDisplay ? 'おしごとの のうりょくに あわせて こうちんが もらえます' : '仕事の能力に合わせて工賃がもらえます') : currentTourTarget === 'am-total' ? (easyDisplay ? 'これが こうちんの ごうけいです' : 'これが工賃の合計です') : currentTourTarget?.endsWith('-name') ? (easyDisplay ? 'きょう はたらいた おしごとの ないようを えらびます' : '今日働いた仕事の内容を選びます') : currentTourTarget?.endsWith('-price') ? (easyDisplay ? '1こ あたり もらえる きんがく' : '1つあたりもらえる金額') : currentTourTarget?.endsWith('-quantity') ? (easyDisplay ? 'なんこ できたか' : '何個できたか') : currentTourTarget?.endsWith('-amount') ? (easyDisplay ? 'この きんがくが こうちんに はいります' : 'この金額が工賃に入ります') : currentTourTarget === 'total' ? (easyDisplay ? 'これが こうちんの ごうけいです' : 'これが工賃の合計です') : ''

  useEffect(() => {
    document.querySelectorAll('.tour-focus').forEach((element) => element.classList.remove('tour-focus'))
    if (!showHelp || !currentTourTarget) return
    let element: HTMLElement | null = null
    if (currentTourTarget === 'am-work') element = document.querySelector('.session-card:first-of-type select')
    if (currentTourTarget === 'am-hours') element = document.querySelector('.session-card:first-of-type .time-fields')
    if (currentTourTarget === 'am-bonus') element = document.querySelector('.session-card:first-of-type .session-grid > label:nth-of-type(2) select')
    if (currentTourTarget === 'am-total') element = document.querySelector('.session-card:first-of-type .session-total')
    if (currentTourTarget === 'total') element = document.querySelector('.total-panel')
    const pieceworkMatch = currentTourTarget.match(/^piecework-(\d+)-(name|price|quantity|amount)$/)
    if (pieceworkMatch) {
      const row = document.querySelectorAll<HTMLElement>('.piecework-row')[Number(pieceworkMatch[1])]
      const field = pieceworkMatch[2]
      element = field === 'name' ? row?.querySelector('label:nth-of-type(1) select, label:nth-of-type(1) input') ?? null : field === 'price' ? row?.querySelector('label:nth-of-type(2) input') ?? null : field === 'quantity' ? row?.querySelector('label:nth-of-type(3) input') ?? null : row?.querySelector('output') ?? null
    }
    if (element) {
      element.classList.add('tour-focus')
      if (element.tagName === 'OUTPUT' || element.classList.contains('total-panel') || element.classList.contains('time-fields')) element.tabIndex = -1
      element.focus()
      const rect = element.getBoundingClientRect()
      const below = rect.top < 155
      setTourBubble({ top: below ? rect.bottom + 16 : rect.top - 140, left: Math.min(Math.max(rect.left + rect.width / 2, 130), window.innerWidth - 130), below })
    }
  }, [showHelp, currentTourTarget])

  useEffect(() => {
    document.querySelectorAll('.name-help-focus').forEach((element) => element.classList.remove('name-help-focus'))
    if (!nameHelp) return
    const row = document.querySelectorAll<HTMLElement>('.piecework-row')[nameHelp.index]
    const element = nameHelp.step === 1 ? row?.querySelector<HTMLElement>('.name-mode-button') : row?.querySelector<HTMLElement>('.piecework-name-input, select')
    if (!element) return
    element.classList.add('name-help-focus')
    element.focus()
    const rect = element.getBoundingClientRect()
    const below = rect.top < 155
    setNameHelpBubble({ top: below ? rect.bottom + 16 : rect.top - 140, left: Math.min(Math.max(rect.left + rect.width / 2, 130), window.innerWidth - 130), below })
  }, [nameHelp, pieceworkNameMode])

  const updateSession = (key: SessionKey, patch: Partial<WageSession>) => setSessions((current) => ({ ...current, [key]: { ...current[key], ...patch } }))
  const selectWork = (key: SessionKey, name: string) => {
    const selected = WORK_ITEMS.find((workItem) => workItem.id === name)
    setWorkNames((current) => ({ ...current, [key]: name }))
    updateSession(key, { hourlyRate: selected?.rate ?? 0 })
  }
  const updatePiecework = (index: number, patch: Partial<Piecework>) => setPieceworks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  const reset = () => { setSessions({ am: emptySession(), pm: emptySession() }); setWorkNames({ am: '', pm: '' }); setPieceworks([emptyPiecework()]); setPieceworkNameMode('select') }

  return (
    <main className="app-shell">
      <header className="app-header"><div><p className="brand-mark">🌱</p><h1>{easyDisplay ? 'こうちんシミュレーター' : '工賃シミュレーター'}</h1><p>{easyDisplay ? 'きょうの がんばりを かたちに' : '今日のがんばりを かたちに'}</p></div><div className="header-actions"><div className="mode-selector" aria-label="表示モード"><span>{easyDisplay ? 'かんじ' : '漢字'}</span><button type="button" className={!easyDisplay ? 'mode-option active' : 'mode-option'} aria-pressed={!easyDisplay} onClick={() => setEasyDisplay(false)}>あり</button><button type="button" className={easyDisplay ? 'mode-option active' : 'mode-option'} aria-pressed={easyDisplay} onClick={() => setEasyDisplay(true)}>なし</button></div><button className="help-button" type="button" onClick={() => { setTourStep(0); setShowHelp(true) }}>？ つかいかた</button></div></header>
      {showHelp && <div className="tour-backdrop" role="presentation" onClick={() => tourStep + 1 < tourTargets.length ? setTourStep((step) => step + 1) : setShowHelp(false)}><p className={tourBubble.below ? 'tour-bubble below' : 'tour-bubble'} style={{ top: tourBubble.top, left: tourBubble.left }}>{tourMessage}</p><button className="tour-close" type="button" onClick={(event) => { event.stopPropagation(); setShowHelp(false) }}>{easyDisplay ? 'とじる' : '閉じる'}</button></div>}
      {nameHelp && <div className="tour-backdrop name-help-backdrop" role="presentation" onClick={() => nameHelp.step === 0 ? setNameHelp((current) => current ? { ...current, step: 1 } : current) : nameHelp.step === 2 ? setNameHelp(null) : undefined}><p className={nameHelpBubble.below ? 'tour-bubble below' : 'tour-bubble'} style={{ top: nameHelpBubble.top, left: nameHelpBubble.left }}>{nameHelp.step === 0 ? 'ここに今日おこなった仕事がないとき' : nameHelp.step === 1 ? 'ここをクリック' : 'ここに仕事の名前を入力'}</p><button className="tour-close" type="button" onClick={(event) => { event.stopPropagation(); setNameHelp(null) }}>{easyDisplay ? 'とじる' : '閉じる'}</button></div>}
      <SessionCard title={easyDisplay ? 'ごぜん' : '午前'} id="am" session={sessions.am} workName={workNames.am} easyDisplay={easyDisplay} onWorkChange={(value) => selectWork('am', value)} onChange={(patch) => updateSession('am', patch)} result={result.am} />
      <SessionCard title={easyDisplay ? 'ごご' : '午後'} id="pm" session={sessions.pm} workName={workNames.pm} easyDisplay={easyDisplay} onWorkChange={(value) => selectWork('pm', value)} onChange={(patch) => updateSession('pm', patch)} result={result.pm} />
      <section className="card piecework-card" aria-labelledby="piecework-heading"><div className="section-heading"><span className="section-number">3</span><h2 id="piecework-heading">{easyDisplay ? 'できだか' : '出来高'}</h2><span>{easyDisplay ? 'つくった かずに おうじてもらえる きんがくです。' : '作った数におうじてもらえる金額です。'}</span></div>
        {pieceworks.map((piecework, index) => <div className="piecework-row" key={index}><strong>{easyDisplay ? 'できだか' : '出来高'} {index + 1}</strong><PieceworkNameField index={index} piecework={piecework} easyDisplay={easyDisplay} mode={pieceworkNameMode} onChange={(patch) => updatePiecework(index, patch)} onToggle={() => { if (nameHelp?.index === index && nameHelp.step === 1) { setPieceworkNameMode('text'); setNameHelp((current) => current ? { ...current, step: 2 } : current) } else setPieceworkNameMode((mode) => mode === 'select' ? 'text' : 'select') }} onHelp={() => { setShowHelp(false); setNameHelp({ index, step: 0 }) }} /> <label>{easyDisplay ? '1この ねだん' : '1つあたりの金額'}<span className="unit-price-control"><input aria-label={`${easyDisplay ? 'できだか' : '出来高'}${index + 1}の単価`} type="number" min="0" value={piecework.unitPrice || ''} onChange={(event) => updatePiecework(index, { unitPrice: Number(event.target.value) })} /><span>{easyDisplay ? 'えん' : '円'}</span></span></label><label>{easyDisplay ? 'すうりょう' : '数量'}<input aria-label={`${easyDisplay ? 'できだか' : '出来高'}${index + 1}の数量`} type="number" min="0" value={piecework.quantity || ''} onChange={(event) => updatePiecework(index, { quantity: Number(event.target.value) })} /></label><output><strong>{piecework.unitPrice * piecework.quantity}{easyDisplay ? 'えん' : '円'}</strong></output><button type="button" aria-label={`${easyDisplay ? 'できだか' : '出来高'}${index + 1}を削除`} onClick={() => setPieceworks((current) => current.filter((_, itemIndex) => itemIndex !== index))}>🗑 {easyDisplay ? 'けす' : '削除'}</button></div>)}
        <button className="add-button" type="button" onClick={() => setPieceworks((current) => [...current, emptyPiecework()])}>＋ {easyDisplay ? 'できだかを ついかする' : '出来高を追加する'}</button>
      </section>
      <section className="total-panel" aria-label="今日の工賃合計" role="status"><div><span className="calculator-icon">▣</span><h2>{easyDisplay ? 'きょうの こうちん' : '今日の工賃'}</h2></div><strong>{easyDisplay ? 'ごうけい' : '合計'} {result.total.toLocaleString('ja-JP')}{easyDisplay ? 'えん' : '円'}</strong><div className="breakdown"><span>{easyDisplay ? 'ごぜんの こうちん' : '午前の工賃'} {result.am}{easyDisplay ? 'えん' : '円'}</span><span>{easyDisplay ? 'ごごの こうちん' : '午後の工賃'} {result.pm}{easyDisplay ? 'えん' : '円'}</span><span>{easyDisplay ? 'できだかの ごうけい' : '出来高の合計'} {result.piecework}{easyDisplay ? 'えん' : '円'}</span></div></section>
      <button className="reset-button" type="button" onClick={reset}>↻ {easyDisplay ? 'おわる（にゅうりょくを りせっとする）' : 'おわる（入力をリセットする）'}</button>
    </main>
  )
}

function useSpeechInput(onText: (text: string) => void) {
  const onTextRef = useRef(onText)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [error, setError] = useState('')

  onTextRef.current = onText

  useEffect(() => {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Recognition) return
    const recognition = new Recognition()
    recognition.lang = 'ja-JP'
    recognition.interimResults = true
    recognition.continuous = false
    recognition.maxAlternatives = 1
    recognition.onstart = () => { setListening(true); setError(''); setInterimText('') }
    recognition.onresult = (event) => {
      let finalText = ''
      let currentText = ''
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index]
        if (result.isFinal) finalText += result[0].transcript
        else currentText += result[0].transcript
      }
      setInterimText(currentText)
      if (finalText.trim()) onTextRef.current(finalText.trim())
    }
    recognition.onerror = (event) => {
      console.error('[speech-input] recognition error:', event.error)
      setListening(false)
      setInterimText('')
      const errorMessage = event.error === 'not-allowed' ? 'マイクの使用が許可されていません' : event.error === 'service-not-allowed' || event.error === 'network' ? '音声認識サービスを利用できません' : event.error === 'audio-capture' ? 'マイクを取得できません' : event.error === 'no-speech' ? '音声が検出されませんでした' : `音声認識エラー（${event.error}）`
      setError(errorMessage)
    }
    recognition.onend = () => { setListening(false); setInterimText('') }
    recognitionRef.current = recognition
    setSupported(true)
    return () => { recognition.abort(); recognitionRef.current = null }
  }, [])

  const toggle = () => {
    if (!recognitionRef.current) return
    if (listening) recognitionRef.current.stop()
    else {
      setError('')
      try { recognitionRef.current.start() } catch { setError('音声入力を開始できませんでした') }
    }
  }

  return { supported, listening, interimText, error, toggle }
}

function PieceworkNameField({ index, piecework, easyDisplay, mode, onChange, onToggle, onHelp }: { index: number; piecework: Piecework; easyDisplay: boolean; mode: 'select' | 'text'; onChange: (patch: Partial<Piecework>) => void; onToggle: () => void; onHelp: () => void }) {
  const label = `${easyDisplay ? 'できだか' : '出来高'}${index + 1}の名前`
  const nameLabel = easyDisplay ? 'しごとの なまえ' : '仕事の名前'
  const placeholder = easyDisplay ? 'しごとの なまえを にゅうりょく' : '仕事の名前を入力'
  const speech = useSpeechInput((text) => onChange({ name: `${piecework.name ?? ''}${piecework.name ? ' ' : ''}${text}` }))
  return <div className="piecework-name-field"><div className="piecework-name-heading"><span>{nameLabel}</span><span className="name-mode-actions"><button type="button" aria-label="出来高の名前入力ヘルプ" className="name-help-button" onClick={onHelp}><FiHelpCircle aria-hidden="true" /></button><button type="button" aria-label="出来高の名前入力方式を切り替える" className="name-mode-button" onClick={onToggle}>{mode === 'select' ? (easyDisplay ? 'そのた' : 'その他') : (easyDisplay ? 'しごとを えらぶ' : '仕事を選ぶ')}</button></span></div>{mode === 'select' ? <label><select aria-label={label} value={piecework.name ?? ''} onChange={(event) => onChange({ name: event.target.value })}><option value="">{easyDisplay ? 'しごとを えらぶ' : '仕事を選ぶ'}</option>{WORK_ITEMS.map((workItem) => <option key={workItem.id} value={workItem.id}>{easyDisplay ? workItem.easyName : workItem.name}</option>)}</select></label> : <><label className="piecework-input-control"><input className="piecework-name-input" aria-label={label} value={piecework.name ?? ''} placeholder={placeholder} onChange={(event) => onChange({ name: event.target.value })} />{speech.supported && <button type="button" className={speech.listening ? 'voice-input-button listening' : 'voice-input-button'} aria-label={speech.listening ? '音声入力を停止' : '音声入力を開始'} aria-pressed={speech.listening} onClick={speech.toggle}><FiMic aria-hidden="true" /></button>}</label>{speech.listening && <span className="voice-input-status">{speech.interimText || '話してください'}</span>}{speech.error && <span className="voice-input-error" role="alert">{speech.error}</span>}</>}</div>
}

function SessionCard({ title, id, session, workName, easyDisplay, onWorkChange, onChange, result }: { title: string; id: SessionKey; session: WageSession; workName: string; easyDisplay: boolean; onWorkChange: (value: string) => void; onChange: (patch: Partial<WageSession>) => void; result: number }) {
  return <section className="card session-card" aria-labelledby={`${id}-heading`}><div className="section-heading"><span className="section-number">{id === 'am' ? '1' : '2'}</span><h2 id={`${id}-heading`}>{title}</h2></div><div className="session-grid"><label>{easyDisplay ? 'しごとを えらぶ' : '仕事を選ぶ'}<select aria-label={`${title}のしごと`} value={workName} onChange={(event) => onWorkChange(event.target.value)}><option value="">作業なし</option>{WORK_ITEMS.map((workItem) => <option key={workItem.id} value={workItem.id}>{easyDisplay ? workItem.easyName : workItem.name}</option>)}</select><span className="rate">{easyDisplay ? '1じかん あたり' : '1時間あたり'} {session.hourlyRate}{easyDisplay ? 'えん' : '円'}</span></label><div><span className="field-label">{easyDisplay ? 'はたらいた じかん' : '働いた時間'}</span><div className="time-fields"><label><input aria-label={`${title}の時間`} type="number" min="0" value={session.hours} onChange={(event) => onChange({ hours: Number(event.target.value) })} /> {easyDisplay ? 'じかん' : '時間'}</label><label><input aria-label={`${title}の分`} type="number" min="0" max="59" value={session.minutes} onChange={(event) => onChange({ minutes: Number(event.target.value) })} /> {easyDisplay ? 'ふん' : '分'}</label></div></div><label>{easyDisplay ? 'かてん' : '能力の加点'}<select aria-label={`${title}の能力加点`} value={session.bonus} onChange={(event) => onChange({ bonus: Number(event.target.value) })}>{BONUSES.map((bonus) => <option key={bonus} value={bonus}>{bonus === 0 ? 'なし' : `${bonus}${easyDisplay ? 'えん' : '円'}`}</option>)}</select></label><output className="session-total">{title}{easyDisplay ? 'の こうちん' : 'の工賃'}<strong>{result}{easyDisplay ? 'えん' : '円'}</strong></output></div></section>
}

export default App
