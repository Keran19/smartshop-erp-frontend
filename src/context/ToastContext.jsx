import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

let idCompteur = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const retirer = useCallback((id) => {
    setToasts((liste) => liste.filter((t) => t.id !== id))
  }, [])

  const notifier = useCallback(
    (message, type = 'succes') => {
      const id = ++idCompteur
      setToasts((liste) => [...liste, { id, message, type }])
      setTimeout(() => retirer(id), 4500)
    },
    [retirer]
  )

  return (
    <ToastContext.Provider value={{ notifier }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`card flex items-start gap-3 px-4 py-3 text-sm font-medium shadow-lg animate-[fadeIn_.2s_ease-out] ${
              t.type === 'erreur'
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-leaf-500/30 bg-leaf-400/10 text-forest-800'
            }`}
          >
            <span className="mt-0.5">{t.type === 'erreur' ? '⚠️' : '✅'}</span>
            <p className="flex-1">{t.message}</p>
            <button
              onClick={() => retirer(t.id)}
              className="text-ink/40 hover:text-ink"
              aria-label="Fermer la notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast doit etre utilise a l\'interieur de ToastProvider')
  return ctx
}
