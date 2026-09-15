import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('工賃シミュレーター', () => {
  it('午前・午後・出来高の入力から合計を表示する', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('heading', { name: '今日の工賃' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '午前' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '午後' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '出来高' })).toBeInTheDocument()
    expect(screen.getAllByText('仕事を選ぶ')).toHaveLength(4)
    expect(screen.getByRole('status', { name: '今日の工賃合計' })).toHaveTextContent('1,225円')

    await user.selectOptions(screen.getByLabelText('午前のしごと'), 'PC')
    expect(screen.getByRole('status', { name: '今日の工賃合計' })).toHaveTextContent('1,100円')
  })

  it('出来高を追加して削除できる', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '＋ 出来高を追加する' }))
    expect(screen.getByLabelText('出来高3の名前')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '出来高3を削除' }))
    expect(screen.queryByLabelText('出来高3の名前')).not.toBeInTheDocument()
  })

  it('おわるで入力内容を初期化する', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.selectOptions(screen.getByLabelText('午前のしごと'), 'PC')
    await user.click(screen.getByRole('button', { name: /おわる/ }))

    expect(screen.getByRole('status', { name: '今日の工賃合計' })).toHaveTextContent('0円')
    expect(screen.getByLabelText('午前のしごと')).toHaveValue('')
  })

  it('やさしい表示をONにすると業務名を平仮名で表示する', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('漢字')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'あり' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'なし' }))

    expect(screen.getByText('かんじ')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'なし' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('option', { name: 'きいや' })).toHaveLength(4)
    expect(screen.queryByRole('option', { name: 'KIIYA' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('ごぜんのしごと')).toHaveDisplayValue('きいや')
    expect(screen.getByRole('heading', { name: 'ごぜん' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'できだか' })).toBeInTheDocument()
    expect(screen.getByLabelText('できだか1の単価')).toBeInTheDocument()
    expect(screen.getAllByText('1この ねだん')).toHaveLength(2)
    expect(screen.getByRole('button', { name: '＋ できだかを ついかする' })).toBeInTheDocument()
    expect(screen.queryByText('しょうけい')).not.toBeInTheDocument()
    expect(screen.getByRole('status', { name: '今日の工賃合計' })).toHaveTextContent('えん')
    expect(screen.getByRole('status', { name: '今日の工賃合計' })).not.toHaveTextContent('円')
    expect(screen.getAllByRole('option', { name: 'るみりゅー わいなりー' })).toHaveLength(4)
    expect(screen.getAllByRole('option', { name: 'るーと ふぁいぶ' })).toHaveLength(4)
    expect(screen.getAllByRole('option', { name: 'はんばいかい さんか' })).toHaveLength(4)
  })

  it('時間と分は0を表示する', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'なし' }))
    await user.click(screen.getByRole('button', { name: /おわる/ }))

    expect(screen.getByLabelText('ごぜんの時間')).toHaveValue(0)
    expect(screen.getByLabelText('ごぜんの分')).toHaveValue(0)
  })

  it('つかいかたビューの文言を表示モードに合わせて切り替える', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '？ つかいかた' }))
    expect(screen.getByText('今日働いた仕事の内容を選びます')).toBeInTheDocument()
    expect(screen.getByLabelText('午前のしごと')).toHaveFocus()
    await user.click(screen.getByRole('button', { name: '閉じる' }))
    await user.click(screen.getByRole('button', { name: 'なし' }))
    await user.click(screen.getByRole('button', { name: '？ つかいかた' }))
    expect(screen.getByLabelText('ごぜんのしごと')).toHaveFocus()
    expect(screen.getByText('きょう はたらいた おしごとの ないようを えらびます')).toBeInTheDocument()
  })

  it('出来高の名前を選択式と自由入力で切り替えられる', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByLabelText('出来高1の名前')).toHaveRole('combobox')
    expect(screen.getAllByRole('button', { name: '出来高の名前入力方式を切り替える' })[0]).toHaveTextContent('その他')
    await user.click(screen.getAllByRole('button', { name: '出来高の名前入力方式を切り替える' })[0])
    expect(screen.getByLabelText('出来高1の名前')).toHaveRole('textbox')
    expect(screen.getAllByRole('button', { name: '出来高の名前入力方式を切り替える' })[0]).toHaveTextContent('仕事を選ぶ')
    await user.click(screen.getAllByRole('button', { name: '出来高の名前入力方式を切り替える' })[0])
    expect(screen.getByLabelText('出来高1の名前')).toHaveRole('combobox')
  })
})
