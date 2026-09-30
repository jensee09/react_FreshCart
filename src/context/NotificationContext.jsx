import { createContext, useContext, useCallback } from 'react'
import toast from 'react-hot-toast'

const NotificationContext = createContext()

export const NotificationProvider = ({ children }) => {
  const notifySuccess = useCallback((message) => {
    toast.success(message, {
      style: {
        borderRadius: '10px',
        background: '#2e7d32',
        color: '#fff',
        fontWeight: '500',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#2e7d32',
      },
    })
  }, [])

  const notifyError = useCallback((message) => {
    toast.error(message, {
      style: {
        borderRadius: '10px',
        background: '#d32f2f',
        color: '#fff',
        fontWeight: '500',
      },
    })
  }, [])

  const notifyInfo = useCallback((message) => {
    toast(message, {
      icon: 'ℹ️',
      style: {
        borderRadius: '10px',
        background: '#0288d1',
        color: '#fff',
        fontWeight: '500',
      },
    })
  }, [])

  return (
    <NotificationContext.Provider
      value={{ notifySuccess, notifyError, notifyInfo }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    )
  }
  return context
}
