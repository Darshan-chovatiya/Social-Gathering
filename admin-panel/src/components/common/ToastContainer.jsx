import { create } from 'zustand'
import Toast from './Toast'

const useToastStore = create((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Date.now() + Math.random()
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))
    return id
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }))
  },
}))

export const useToast = () => {
  const addToast = useToastStore((state) => state.addToast)
  
  return {
    toast: {
      success: (message, title = 'Success') =>
        addToast({ type: 'success', message, title, autoClose: true }),
      error: (message, title = 'Error') =>
        addToast({ type: 'error', message, title, autoClose: true }),
      warning: (message, title = 'Warning') =>
        addToast({ type: 'warning', message, title, autoClose: true }),
      info: (message, title = 'Info') =>
        addToast({ type: 'info', message, title, autoClose: true }),
    },
  }
}

const ToastContainer = () => {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

export default ToastContainer

