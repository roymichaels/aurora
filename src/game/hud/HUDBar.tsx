import CharacterPanel from './CharacterPanel'
import StatBars from './StatBars'
import QuickSlot from './QuickSlot'
import { quickSlots } from './hud.data'
import { useHUDActions } from './useHUDActions'
import { useEffect, useState, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useUIStore } from '@/state/ui'
import { ChevronDown } from 'lucide-react'

export default function HUDBar() {
  const { run } = useHUDActions()
  const openModal = useUIStore.getState().openModal
  const [expanded, setExpanded] = useState(true)

  const toggle = () => setExpanded(e => !e)
  const onKeyToggle = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle()
    }
  }

  // Desktop hotkeys 1..6
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.closest('input, textarea, [contenteditable="true"]'))) return
      const n = Number(e.key)
      if (n >= 1 && n <= quickSlots.length) run(quickSlots[n-1].action)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [run])

  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-[var(--z-hud)]">
      {/* HUD shelf with divider line */}
      <div className="relative w-full" style={{ height: 'var(--hud-h)' }}>
        <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 translate-x-full z-10">
          <button
            type="button"
            aria-label="Toggle HUD"
            aria-expanded={expanded}
            onClick={toggle}
            onKeyDown={onKeyToggle}
            className="hud-toggle absolute-center pointer-events-auto p-2 rounded-full bg-gray-800 focus-visible:ring transition duration-200"
          >
            <ChevronDown className={`transition-transform duration-200 ${expanded ? '' : 'rotate-180'}`} />
          </button>
        </div>
        <div className="absolute top-0 left-0 right-0 h-px bg-border/80" role="separator" aria-hidden />
        <div className={`absolute inset-x-0 bottom-2 flex justify-center pb-safe transition-transform duration-200 ${expanded ? 'translate-y-0' : 'translate-y-full'}`}
        >
          <div className="hud-shell max-w-[1200px] w-[96%]">
            {/* Flex that wraps to 2 lines when tight */}
            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
              {/* Left: Character */}
              <div className="shrink-0"><CharacterPanel/></div>

              {/* Middle: Bars grow, wrap keeps them on line 1 */}
              <div className="grow min-w-[260px]"><StatBars/></div>

              {/* Right: System icons always at far right */}
              <div className="ml-auto flex items-center order-3 sm:order-none">
                <button
                  type="button"
                  className="hud-icon settings hover-scale smooth hover:brightness-110 active:scale-95"
                  aria-label="Settings"
                  title="Settings"
                  onClick={() => openModal('settings')}
                >
                  <span className="sr-only">Settings</span>
                </button>
              </div>

              {/* Quick Slots: full width on small (second line), inline on large */}
              <div data-testid="quick-slots" className="flex items-center gap-3 basis-full sm:basis-auto order-4 sm:order-none">
                {quickSlots.map(s => (
                  <QuickSlot key={s.id} hotkey={s.key} label={s.label} icon={s.icon} onClick={() => run(s.action)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

