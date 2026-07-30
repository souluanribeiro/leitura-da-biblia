import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

export interface ToastData {
  id: string
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
}

let listeners: ((toast: ToastData) => void)[] = []

export function showToast(message: string, type: ToastData['type'] = 'success', duration = 2500) {
  const toast: ToastData = { id: crypto.randomUUID(), message, type, duration }
  listeners.forEach(fn => fn(toast))
}

const icons = {
  success: <CheckCircle size={18} className="text-green-400 shrink-0" />,
  error: <AlertCircle size={18} className="text-red-400 shrink-0" />,
  info: <Info size={18} className="text-accent shrink-0" />,
}

const bgColors = {
  success: 'bg-green-500/15 border-green-500/30',
  error: 'bg-red-500/15 border-red-500/30',
  info: 'bg-accent/15 border-accent/30',
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  useEffect(() => {
    const handler = (toast: ToastData) => {
      setToasts(prev => [...prev, toast])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, toast.duration || 2500)
    }
    listeners.push(handler)
    return () => { listeners = listeners.filter(fn => fn !== handler) }
  }, [])

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none w-[calc(100%-2rem)] max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg toast-slide-in ${bgColors[toast.type || 'success']}`}
        >
          {icons[toast.type || 'success']}
          <span className="text-sm text-text-primary flex-1">{toast.message}</span>
          <button
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            className="text-text-muted hover:text-text-primary shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
