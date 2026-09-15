import { useMemo, useState } from 'react'
import { calculateWage, type Piecework, type WageSession } from './domain/calculation'

const WORK_ITEMS = [
  ['Le Milieu_農園', 150], ['Le Milieu_フィナリー', 150], ['KIIYA', 150], ['ルート5', 150],
  ['東洋計器', 150], ['販売会準備・片付け', 100], ['手芸', 100], ['スリーピース', 100],
  ['PC', 100], ['就職準備', 100], ['その他内職', 100], ['販売会（平日）参加', 150], ['シルクスクリーン', 300],
] as const
const BONUSES = [0, 50, 100, 200, 300, 400, 500]
const emptySession = (): WageSession => ({ hourlyRate: 0, hours: 0, minutes: 0, bonus: 0 })
const emptyPiecework = (): Piecework => ({ unitPrice: 0, quantity: 0 })
type SessionKey = 'am' | 'pm'

function App() {
  const [sessions, setSessions] = useState<Record<SessionKey, WageSession>>({
    am: { hourlyRate: 150, hours: 2, minutes: 30, bonus: 100 },
    pm: { hourlyRate: 100, hours: 3, minutes: 0, bonus: 100 },
  })
  const [workNames, setWorkNames] = useState<Record<SessionKey, string>>({ am: 'KIIYA', pm: 'PC' })
  const [pieceworks, setPieceworks] = useState<Piecework[]>([{ unitPrice: 10, quantity: 20 }, { unitPrice: 5, quantity: 30 }])
  const result = useMemo(() => calculateWage({ ...sessions, pieceworks }), [sessions, pieceworks])

  const updateSession = (key: SessionKey, patch: Partial<WageSession>) => setSessions((current) => ({ ...current, [key]: { ...current[key], ...patch } }))
  const selectWork = (key: SessionKey, name: string) => {
    const selected = WORK_ITEMS.find(([workName]) => workName === name)
    setWorkNames((current) => ({ ...current, [key]: name }))
    updateSession(key, { hourlyRate: selected?.[1] ?? 0 })
  }
  const updatePiecework = (index: number, patch: Partial<Piecework>) => setPieceworks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  const reset = () => { setSessions({ am: emptySession(), pm: emptySession() }); setWorkNames({ am: '', pm: '' }); setPieceworks([emptyPiecework()]) }

  return (
    <main className="app-shell">
      <header className="app-header"><div><p className="brand-mark">🌱</p><h1>工賃シミュレーター</h1><p>今日のがんばりを かたちに</p></div><button className="help-button" type="button">？ つかいかた</button></header>
      <SessionCard title="午前" id="am" session={sessions.am} workName={workNames.am} onWorkChange={(value) => selectWork('am', value)} onChange={(patch) => updateSession('am', patch)} result={result.am} />
      <SessionCard title="午後" id="pm" session={sessions.pm} workName={workNames.pm} onWorkChange={(value) => selectWork('pm', value)} onChange={(patch) => updateSession('pm', patch)} result={result.pm} />
      <section className="card piecework-card" aria-labelledby="piecework-heading"><div className="section-heading"><span className="section-number">3</span><h2 id="piecework-heading">出来高</h2><span>作った数におうじてもらえる金額です。</span></div>
        {pieceworks.map((piecework, index) => <div className="piecework-row" key={index}><strong>出来高 {index + 1}</strong><label>なまえ<input aria-label={`出来高${index + 1}の名前`} placeholder="しごとの名前" /></label><label>1つあたりの金額<input aria-label={`出来高${index + 1}の単価`} type="number" min="0" value={piecework.unitPrice || ''} onChange={(event) => updatePiecework(index, { unitPrice: Number(event.target.value) })} /> 円</label><label>数量<input aria-label={`出来高${index + 1}の数量`} type="number" min="0" value={piecework.quantity || ''} onChange={(event) => updatePiecework(index, { quantity: Number(event.target.value) })} /></label><output>小計<strong>{piecework.unitPrice * piecework.quantity}円</strong></output><button type="button" aria-label={`出来高${index + 1}を削除`} onClick={() => setPieceworks((current) => current.filter((_, itemIndex) => itemIndex !== index))}>🗑 削除</button></div>)}
        <button className="add-button" type="button" onClick={() => setPieceworks((current) => [...current, emptyPiecework()])}>＋ 出来高を追加する</button>
      </section>
      <section className="total-panel" aria-label="今日の工賃合計" role="status"><div><span className="calculator-icon">▣</span><h2>今日の工賃</h2></div><strong>合計 {result.total.toLocaleString('ja-JP')}円</strong><div className="breakdown"><span>午前の工賃 {result.am}円</span><span>午後の工賃 {result.pm}円</span><span>出来高の合計 {result.piecework}円</span></div></section>
      <button className="reset-button" type="button" onClick={reset}>↻ おわる（入力をリセットする）</button>
    </main>
  )
}

function SessionCard({ title, id, session, workName, onWorkChange, onChange, result }: { title: string; id: SessionKey; session: WageSession; workName: string; onWorkChange: (value: string) => void; onChange: (patch: Partial<WageSession>) => void; result: number }) {
  return <section className="card session-card" aria-labelledby={`${id}-heading`}><div className="section-heading"><span className="section-number">{id === 'am' ? '1' : '2'}</span><h2 id={`${id}-heading`}>{title}</h2></div><div className="session-grid"><label>しごとを えらぶ<select aria-label={`${title}のしごと`} value={workName} onChange={(event) => onWorkChange(event.target.value)}><option value="">作業なし</option>{WORK_ITEMS.map(([name]) => <option key={name} value={name}>{name}</option>)}</select><span className="rate">1時間あたり {session.hourlyRate}円</span></label><div><span className="field-label">はたらいた時間</span><div className="time-fields"><label><input aria-label={`${title}の時間`} type="number" min="0" value={session.hours || ''} onChange={(event) => onChange({ hours: Number(event.target.value) })} /> 時間</label><label><input aria-label={`${title}の分`} type="number" min="0" max="59" value={session.minutes || ''} onChange={(event) => onChange({ minutes: Number(event.target.value) })} /> 分</label></div></div><label>能力の加点<select aria-label={`${title}の能力加点`} value={session.bonus} onChange={(event) => onChange({ bonus: Number(event.target.value) })}>{BONUSES.map((bonus) => <option key={bonus} value={bonus}>{bonus === 0 ? 'なし' : `${bonus}円`}</option>)}</select></label><output className="session-total">{title}の工賃<strong>{result}円</strong></output></div></section>
}

export default App
