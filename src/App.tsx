import { useMemo, useState } from 'react'
import { calculateWage, type Piecework, type WageSession } from './domain/calculation'

const WORK_ITEMS = [
  { id: 'Le Milieu_農園', name: 'Le Milieu_農園', easyName: 'るみりゅー のうえん', rate: 150 },
  { id: 'Le Milieu_フィナリー', name: 'Le Milieu_フィナリー', easyName: 'るみりゅー わいなりー', rate: 150 },
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
const emptyPiecework = (): Piecework => ({ unitPrice: 0, quantity: 0 })
type SessionKey = 'am' | 'pm'

function App() {
  const [sessions, setSessions] = useState<Record<SessionKey, WageSession>>({
    am: { hourlyRate: 150, hours: 2, minutes: 30, bonus: 100 },
    pm: { hourlyRate: 100, hours: 3, minutes: 0, bonus: 100 },
  })
  const [workNames, setWorkNames] = useState<Record<SessionKey, string>>({ am: 'KIIYA', pm: 'PC' })
  const [easyDisplay, setEasyDisplay] = useState(false)
  const [pieceworks, setPieceworks] = useState<Piecework[]>([{ unitPrice: 10, quantity: 20 }, { unitPrice: 5, quantity: 30 }])
  const result = useMemo(() => calculateWage({ ...sessions, pieceworks }), [sessions, pieceworks])

  const updateSession = (key: SessionKey, patch: Partial<WageSession>) => setSessions((current) => ({ ...current, [key]: { ...current[key], ...patch } }))
  const selectWork = (key: SessionKey, name: string) => {
    const selected = WORK_ITEMS.find((workItem) => workItem.id === name)
    setWorkNames((current) => ({ ...current, [key]: name }))
    updateSession(key, { hourlyRate: selected?.rate ?? 0 })
  }
  const updatePiecework = (index: number, patch: Partial<Piecework>) => setPieceworks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  const reset = () => { setSessions({ am: emptySession(), pm: emptySession() }); setWorkNames({ am: '', pm: '' }); setPieceworks([emptyPiecework()]) }

  return (
    <main className="app-shell">
      <header className="app-header"><div><p className="brand-mark">🌱</p><h1>{easyDisplay ? 'こうちんシミュレーター' : '工賃シミュレーター'}</h1><p>{easyDisplay ? 'きょうの がんばりを かたちに' : '今日のがんばりを かたちに'}</p></div><div className="header-actions"><button className="easy-toggle" type="button" aria-label="表示モード" aria-pressed={easyDisplay} onClick={() => setEasyDisplay((current) => !current)}><span>{easyDisplay ? 'かんじなし' : '漢字あり'}</span><span className="switch-track" aria-hidden="true"><span className="switch-thumb" /></span></button><button className="help-button" type="button">？ つかいかた</button></div></header>
      <SessionCard title={easyDisplay ? 'ごぜん' : '午前'} id="am" session={sessions.am} workName={workNames.am} easyDisplay={easyDisplay} onWorkChange={(value) => selectWork('am', value)} onChange={(patch) => updateSession('am', patch)} result={result.am} />
      <SessionCard title={easyDisplay ? 'ごご' : '午後'} id="pm" session={sessions.pm} workName={workNames.pm} easyDisplay={easyDisplay} onWorkChange={(value) => selectWork('pm', value)} onChange={(patch) => updateSession('pm', patch)} result={result.pm} />
      <section className="card piecework-card" aria-labelledby="piecework-heading"><div className="section-heading"><span className="section-number">3</span><h2 id="piecework-heading">{easyDisplay ? 'できだか' : '出来高'}</h2><span>{easyDisplay ? 'つくった かずに おうじてもらえる きんがくです。' : '作った数におうじてもらえる金額です。'}</span></div>
        {pieceworks.map((piecework, index) => <div className="piecework-row" key={index}><strong>{easyDisplay ? 'できだか' : '出来高'} {index + 1}</strong><label>{easyDisplay ? 'なまえ' : 'なまえ'}<input aria-label={`${easyDisplay ? 'できだか' : '出来高'}${index + 1}の名前`} placeholder={easyDisplay ? 'しごとの なまえ' : 'しごとの名前'} /></label><label>{easyDisplay ? '1この ねだん' : '1つあたりの金額'}<span className="unit-price-control"><input aria-label={`${easyDisplay ? 'できだか' : '出来高'}${index + 1}の単価`} type="number" min="0" value={piecework.unitPrice || ''} onChange={(event) => updatePiecework(index, { unitPrice: Number(event.target.value) })} /><span>{easyDisplay ? 'えん' : '円'}</span></span></label><label>{easyDisplay ? 'すうりょう' : '数量'}<input aria-label={`${easyDisplay ? 'できだか' : '出来高'}${index + 1}の数量`} type="number" min="0" value={piecework.quantity || ''} onChange={(event) => updatePiecework(index, { quantity: Number(event.target.value) })} /></label><output><strong>{piecework.unitPrice * piecework.quantity}{easyDisplay ? 'えん' : '円'}</strong></output><button type="button" aria-label={`${easyDisplay ? 'できだか' : '出来高'}${index + 1}を削除`} onClick={() => setPieceworks((current) => current.filter((_, itemIndex) => itemIndex !== index))}>🗑 {easyDisplay ? 'けす' : '削除'}</button></div>)}
        <button className="add-button" type="button" onClick={() => setPieceworks((current) => [...current, emptyPiecework()])}>＋ {easyDisplay ? 'できだかを ついかする' : '出来高を追加する'}</button>
      </section>
      <section className="total-panel" aria-label="今日の工賃合計" role="status"><div><span className="calculator-icon">▣</span><h2>{easyDisplay ? 'きょうの こうちん' : '今日の工賃'}</h2></div><strong>{easyDisplay ? 'ごうけい' : '合計'} {result.total.toLocaleString('ja-JP')}{easyDisplay ? 'えん' : '円'}</strong><div className="breakdown"><span>{easyDisplay ? 'ごぜんの こうちん' : '午前の工賃'} {result.am}{easyDisplay ? 'えん' : '円'}</span><span>{easyDisplay ? 'ごごの こうちん' : '午後の工賃'} {result.pm}{easyDisplay ? 'えん' : '円'}</span><span>{easyDisplay ? 'できだかの ごうけい' : '出来高の合計'} {result.piecework}{easyDisplay ? 'えん' : '円'}</span></div></section>
      <button className="reset-button" type="button" onClick={reset}>↻ {easyDisplay ? 'おわる（にゅうりょくを りせっとする）' : 'おわる（入力をリセットする）'}</button>
    </main>
  )
}

function SessionCard({ title, id, session, workName, easyDisplay, onWorkChange, onChange, result }: { title: string; id: SessionKey; session: WageSession; workName: string; easyDisplay: boolean; onWorkChange: (value: string) => void; onChange: (patch: Partial<WageSession>) => void; result: number }) {
  return <section className="card session-card" aria-labelledby={`${id}-heading`}><div className="section-heading"><span className="section-number">{id === 'am' ? '1' : '2'}</span><h2 id={`${id}-heading`}>{title}</h2></div><div className="session-grid"><label>{easyDisplay ? 'しごとを えらぶ' : '仕事を選ぶ'}<select aria-label={`${title}のしごと`} value={workName} onChange={(event) => onWorkChange(event.target.value)}><option value="">作業なし</option>{WORK_ITEMS.map((workItem) => <option key={workItem.id} value={workItem.id}>{easyDisplay ? workItem.easyName : workItem.name}</option>)}</select><span className="rate">{easyDisplay ? '1じかん あたり' : '1時間あたり'} {session.hourlyRate}{easyDisplay ? 'えん' : '円'}</span></label><div><span className="field-label">{easyDisplay ? 'はたらいた じかん' : 'はたらいた時間'}</span><div className="time-fields"><label><input aria-label={`${title}の時間`} type="number" min="0" value={session.hours} onChange={(event) => onChange({ hours: Number(event.target.value) })} /> {easyDisplay ? 'じかん' : '時間'}</label><label><input aria-label={`${title}の分`} type="number" min="0" max="59" value={session.minutes} onChange={(event) => onChange({ minutes: Number(event.target.value) })} /> {easyDisplay ? 'ふん' : '分'}</label></div></div><label>{easyDisplay ? 'かてん' : '能力の加点'}<select aria-label={`${title}の能力加点`} value={session.bonus} onChange={(event) => onChange({ bonus: Number(event.target.value) })}>{BONUSES.map((bonus) => <option key={bonus} value={bonus}>{bonus === 0 ? 'なし' : `${bonus}${easyDisplay ? 'えん' : '円'}`}</option>)}</select></label><output className="session-total">{title}{easyDisplay ? 'の こうちん' : 'の工賃'}<strong>{result}{easyDisplay ? 'えん' : '円'}</strong></output></div></section>
}

export default App
