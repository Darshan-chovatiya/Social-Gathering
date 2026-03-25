import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast.autoClose) {
      const timer = setTimeout(() => {
        onClose()
      }, toast.duration || 3000)
      return () => clearTimeout(timer)
    }
  }, [toast, onClose])

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const colors = {
    success: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
    error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    warning: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  }

  const Icon = icons[toast.type] || Info
  const colorClass = colors[toast.type] || colors.info

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border shadow-2xl min-w-[280px] w-full md:min-w-[300px] md:max-w-md md:w-auto backdrop-blur-sm ${colorClass} animate-slide-in transform hover:scale-[1.02] transition-transform duration-200`}
    >
      <div className="flex-shrink-0">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          toast.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-800' :
          toast.type === 'error' ? 'bg-red-100 dark:bg-red-800' :
          toast.type === 'warning' ? 'bg-amber-100 dark:bg-amber-800' :
          'bg-blue-100 dark:bg-blue-800'
        }`}>
          <Icon className={`w-5 h-5 ${
            toast.type === 'success' ? 'text-emerald-600 dark:text-emerald-300' :
            toast.type === 'error' ? 'text-red-600 dark:text-red-300' :
            toast.type === 'warning' ? 'text-amber-600 dark:text-amber-300' :
            'text-blue-600 dark:text-blue-300'
          }`} />
        </div>
      </div>
      <div className="flex-1">
        {toast.title && (
          <p className="font-semibold text-sm mb-0.5">{toast.title}</p>
        )}
        <p className="text-sm">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 active:bg-black/20 dark:active:bg-white/20 transition-all duration-150 active:scale-95"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default Toast

