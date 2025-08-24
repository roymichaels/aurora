/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

jest.mock('@/state/ui', () => ({
  useUIStore: {
    getState: () => ({ openModal: jest.fn() }),
  },
}))

jest.mock('@/utils/moments', () => ({
  startVoiceNote: jest.fn(),
}))

jest.mock('../CharacterPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="character-panel" />,
}))

jest.mock('../StatBars', () => ({
  __esModule: true,
  default: () => <div data-testid="stat-bars" />,
}))

import HUDBar from '../HUDBar'

describe('HUDBar', () => {
  it('toggles aria-expanded on click and keyboard', () => {
    render(<HUDBar />)
    const btn = screen.getByLabelText('Toggle HUD')
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    fireEvent.keyDown(btn, { key: 'Enter' })
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })

  it('anchors toggle button outside quick slots with transition', () => {
    render(<HUDBar />)
    const btn = screen.getByLabelText('Toggle HUD')
    expect(btn).toHaveClass('rounded-full')
    expect(btn).toHaveClass('duration-200')
    const slots = screen.getByTestId('quick-slots')
    expect(slots.contains(btn)).toBe(false)
  })
})
