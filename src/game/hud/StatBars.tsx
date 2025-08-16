import { motion } from 'framer-motion'
import { useProgressStore } from '@/state/progress'

const Bar = ({label,hue,value}:{label:string; hue:string; value:number}) => (
  <div className="w-full">
    <div className="text-[10px] uppercase tracking-wide opacity-70">{label}</div>
    <div className="h-3 rounded-full bg-white/6 overflow-hidden hud-bar">
      <motion.div
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, hsl(${hue} / .9), hsl(${hue}))` }}
        animate={{ width: `${value}%` }}
        transition={{ type: 'spring', stiffness: 160, damping: 20 }}
      />
    </div>
  </div>
)

export default function StatBars() {
  const { hp, mp, xp } = useProgressStore(s => ({ hp: s.hp, mp: s.mp, xp: s.xp % 100 }))
  return (
    <div className="space-y-2 min-w-[260px] w-[min(480px,50vw)]">
      <Bar label="HP" hue="0 80% 60%" value={hp}/>
      <Bar label="MP" hue="210 90% 65%" value={mp}/>
      <Bar label="XP" hue="200 90% 55%" value={xp}/>
    </div>
  )
}
