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

    await user.click(screen.getByRole('checkbox', { name: 'やさしい表示' }))

    expect(screen.getAllByRole('option', { name: 'きいや' })).toHaveLength(2)
    expect(screen.queryByRole('option', { name: 'KIIYA' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('ごぜんのしごと')).toHaveDisplayValue('きいや')
    expect(screen.getByRole('heading', { name: 'ごぜん' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'できだか' })).toBeInTheDocument()
    expect(screen.getByLabelText('できだか1の単価')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '＋ できだかを ついかする' })).toBeInTheDocument()
    expect(screen.queryByText('しょうけい')).not.toBeInTheDocument()
    expect(screen.getAllByRole('option', { name: 'るみりゅー わいなりー' })).toHaveLength(2)
    expect(screen.getAllByRole('option', { name: 'るーと ふぁいぶ' })).toHaveLength(2)
    expect(screen.getAllByRole('option', { name: 'はんばいかい さんか' })).toHaveLength(2)
  })
})
