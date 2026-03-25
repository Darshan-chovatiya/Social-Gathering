import { X, AlertTriangle } from 'lucide-react'

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  showCloseButton = true
}) => {
  if (!isOpen) return null

  const variants = {
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-md hover:shadow-lg dark:bg-red-600 dark:hover:bg-red-700',
    warning: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-md hover:shadow-lg dark:bg-amber-700 dark:hover:bg-amber-600',
    primary: 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 shadow-md hover:shadow-lg dark:bg-primary-500 dark:hover:bg-primary-600',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in border border-gray-200/60 dark:border-gray-700/60">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
            variant === 'danger' ? 'bg-red-50 dark:bg-red-900/30' : variant === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-primary-100 dark:bg-primary-900/30'
          }`}>
            <AlertTriangle className={`w-6 h-6 ${
              variant === 'danger' ? 'text-red-600 dark:text-red-300' : variant === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-primary-600 dark:text-primary-400'
            }`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">{message}</div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 active:bg-gray-100 dark:active:bg-gray-500 transition-all duration-150 active:scale-95 shadow-sm hover:shadow"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 active:scale-95 ${variant === 'primary' ? 'text-gray-900' : 'text-white'} ${variants[variant]}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-all duration-150 active:scale-95"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog

