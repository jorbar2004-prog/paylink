import { ScanLine, History, BarChart3 } from 'lucide-react'
import { View } from '../types'

interface Props {
  current: View
  onChange: (v: View) => void
}

const items: { view: View; label: string; icon: typeof ScanLine }[] = [
  { view: 'scan', label: 'Escanear', icon: ScanLine },
  { view: 'history', label: 'Historial', icon: History },
  { view: 'stats', label: 'Estadísticas', icon: BarChart3 },
]

export default function Navbar({ current, onChange }: Props) {
  return (
    <nav className="bg-white border-t border-neutral-200 safe-bottom">
      <div className="flex justify-around items-center h-16">
        {items.map(({ view, label, icon: Icon }) => (
          <button
            key={view}
            onClick={() => onChange(view)}
            className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
              current === view ? 'text-neutral-900' : 'text-neutral-400'
            }`}
          >
            <Icon size={22} strokeWidth={current === view ? 2.5 : 2} />
            <span className="text-[11px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
