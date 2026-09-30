import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { getUserData, saveUserData } from '../services/userData'

const WishlistContext = createContext()

const readWishlistItems = (key) => {
  const saved = localStorage.getItem(key)
  return saved ? JSON.parse(saved) : []
}

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth()
  const storageKey = `freshcart_wishlist_${user?.id || 'guest'}`
  const [wishlistByUser, setWishlistByUser] = useState(() => ({
    [storageKey]: readWishlistItems(storageKey),
  }))
  const [loadedWishlistKeys, setLoadedWishlistKeys] = useState({})
  const wishlistItems = wishlistByUser[storageKey] ?? readWishlistItems(storageKey)
  const setWishlistItems = (update) => {
    setWishlistByUser((previous) => {
      const currentItems = previous[storageKey] ?? readWishlistItems(storageKey)
      const nextItems =
        typeof update === 'function' ? update(currentItems) : update
      return { ...previous, [storageKey]: nextItems }
    })
  }

  useEffect(() => {
    if (!user?.id) return
    if (loadedWishlistKeys[user.id]) return

    let active = true
    getUserData(user.id, 'wishlist')
      .then(async (items) => {
        if (!active) return
        const previousItems = readWishlistItems(storageKey)
        const data = items.length === 0 && previousItems.length > 0
          ? previousItems
          : items
        if (data !== items) await saveUserData(user.id, 'wishlist', data)
        setWishlistByUser((previous) => ({ ...previous, [storageKey]: data }))
        setLoadedWishlistKeys((previous) => ({ ...previous, [user.id]: true }))
      })
      .catch((error) => {
        console.error('Unable to load wishlist from the database:', error)
        if (active) setLoadedWishlistKeys((previous) => ({ ...previous, [user.id]: true }))
      })
    return () => {
      active = false
    }
  }, [loadedWishlistKeys, storageKey, user?.id])

  useEffect(() => {
    if (!user?.id) localStorage.setItem(storageKey, JSON.stringify(wishlistItems))
  }, [storageKey, user?.id, wishlistItems])

  useEffect(() => {
    if (!user?.id || !loadedWishlistKeys[user.id]) return
    const timeoutId = setTimeout(() => {
      saveUserData(user.id, 'wishlist', wishlistItems).catch((error) => {
        console.error('Unable to save wishlist to the database:', error)
      })
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [loadedWishlistKeys, storageKey, user?.id, wishlistItems])

  const toggleWishlist = (product) => {
    setWishlistItems((prev) => {
      const exists = prev.some((item) => item.id === product.id)
      if (exists) {
        return prev.filter((item) => item.id !== product.id)
      } else {
        return [...prev, product]
      }
    })
  }

  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item.id === productId)
  }

  const clearWishlist = () => {
    setWishlistItems([])
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount: wishlistItems.length,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
