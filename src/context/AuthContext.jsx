import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { getUserData, saveUserData } from '../services/userData'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      if (!localStorage.getItem('freshcart_token')) return null
      const saved = localStorage.getItem('freshcart_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState('login') // 'login' | 'register'
  const withSavedAddresses = async (account) => {
    try {
      const databaseAddresses = await getUserData(account.id, 'addresses')
      const cachedAddresses = localStorage.getItem(`freshcart_addresses_${account.id}`)
      const legacyAddresses = cachedAddresses ? JSON.parse(cachedAddresses) : []
      const savedAddresses = databaseAddresses.length
        ? databaseAddresses
        : legacyAddresses.length
          ? legacyAddresses
          : account.addresses || []
      if (!databaseAddresses.length && savedAddresses.length) {
        await saveUserData(account.id, 'addresses', savedAddresses)
      }
      return { ...account, addresses: savedAddresses }
    } catch (error) {
      console.error('Unable to load saved addresses after sign-in:', error)
      return { ...account, addresses: account.addresses || [] }
    }
  }

  const addAddress = async (address) => {
    if (!user?.id) throw new Error('Please sign in before saving an address.')
    const savedAddress = { ...address, id: `addr-${Date.now()}` }
    const addresses = [
      ...(user.addresses || []),
      savedAddress,
    ]
    await saveUserData(user.id, 'addresses', addresses)
    const updatedUser = { ...user, addresses }
    setUser(updatedUser)
    return savedAddress
  }

  useEffect(() => {
    if (user) {
      const cachedUser = {
        ...user,
        avatar: user.avatar?.startsWith('data:') ? null : user.avatar,
      }
      localStorage.setItem('freshcart_user', JSON.stringify(cachedUser))
    } else {
      localStorage.removeItem('freshcart_user')
    }
  }, [user])

  useEffect(() => {
    if (!user?.id) return
    let active = true
    axios.get('/api/auth/profile')
      .then(({ data }) => {
        if (active && data.user?.id === user.id) {
          setUser((current) =>
            current?.id === user.id
              ? { ...data.user, addresses: current.addresses || [] }
              : current
          )
        }
      })
      .catch((error) => {
        console.error('Unable to refresh account profile from the database:', error)
        if (error.response?.status === 401) {
          localStorage.removeItem('freshcart_token')
          localStorage.removeItem('freshcart_user')
          setUser(null)
        }
      })
    return () => {
      active = false
    }
  }, [user?.id])

  // Real MySQL Login
  const login = async (email, password, role) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password, role })
      if (res.data && res.data.user) {
        if (!res.data.token) throw new Error('Login response did not include a session.')
        localStorage.setItem('freshcart_token', res.data.token)
        const account = await withSavedAddresses(res.data.user)
        setUser(account)
        setIsAuthModalOpen(false)
        return account
      }
      throw new Error('Login response did not include an account.')
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Invalid credentials or server error.'
      throw new Error(msg)
    }
  }

  // Real MySQL Registration
  const register = async (name, email, password) => {
    try {
      const res = await axios.post('/api/auth/register', { name, email, password })
      if (res.data && res.data.user) {
        if (!res.data.token) throw new Error('Registration response did not include a session.')
        localStorage.setItem('freshcart_token', res.data.token)
        const account = await withSavedAddresses(res.data.user)
        setUser(account)
        setIsAuthModalOpen(false)
        return account
      }
      throw new Error('Registration response did not include an account.')
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Registration failed. Check server connection.'
      throw new Error(msg)
    }
  }

  // Update Profile (Avatar picture, Name, Phone, Address) in MySQL
  const updateProfile = async (profileData) => {
    try {
      const res = await axios.put('/api/auth/profile', {
        name: profileData.name !== undefined ? profileData.name : user?.name,
        phone: profileData.phone !== undefined ? profileData.phone : user?.phone,
        avatar: profileData.avatar !== undefined ? profileData.avatar : user?.avatar,
        address: profileData.address !== undefined ? profileData.address : user?.address,
      })
      if (res.data && res.data.user) {
        const updatedUser = { ...res.data.user, addresses: user?.addresses || [] }
        setUser(updatedUser)
        return updatedUser
      }
      throw new Error('Profile update response did not include the updated account.')
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to update profile in database.'
      throw new Error(msg)
    }
  }

  const logout = () => {
    const token = localStorage.getItem('freshcart_token')
    if (token) {
      axios.delete('/api/auth/session', {
        headers: { Authorization: `Bearer ${token}` },
      }).catch((error) => {
        console.error('Unable to invalidate account session:', error)
      })
    }
    setUser(null)
    localStorage.removeItem('freshcart_token')
    localStorage.removeItem('freshcart_user')
  }

  const openLoginModal = () => {
    setAuthModalMode('login')
    setIsAuthModalOpen(true)
  }

  const openRegisterModal = () => {
    setAuthModalMode('register')
    setIsAuthModalOpen(true)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAdmin: user?.role === 'admin',
        isUser: user?.role === 'user' || user?.role === 'customer',
        login,
        register,
        updateProfile,
        addAddress,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openLoginModal,
        openRegisterModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
