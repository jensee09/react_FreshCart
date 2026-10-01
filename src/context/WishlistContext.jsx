import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { getUserData, saveUserData } from '../services/userData'

const WishlistContext = createContext()
const EMPTY_WISHLIST = []

export const WishlistProvider = ({ children }) => {
  const { user, openLoginModal } = useAuth()
  const [wishlistByUser, setWishlistByUser] = useState({})
  const [loadedWishlistKeys, setLoadedWishlistKeys] = useState({})
  const wishlistItems = user?.id
    ? wishlistByUser[user.id] || EMPTY_WISHLIST
    : EMPTY_WISHLIST
  const wishlistLoaded = Boolean(user?.id && loadedWishlistKeys[user.id])
  const setWishlistItems = (update) => {
    if (!user?.id) return
    setWishlistByUser((previous) => {
      const currentItems = previous[user.id] || []
      const nextItems =
        typeof update === 'function' ? update(currentItems) : update
      return { ...previous, [user.id]: nextItems }
    })
  }

  useEffect(() => {
    if (!user?.id) return
    if (wishlistLoaded) return

    let active = true
    getUserData(user.id, 'wishlist')
      .then((items) => {
        if (!active) return
        setWishlistByUser((previous) => ({ ...previous, [user.id]: items }))
        setLoadedWishlistKeys((previous) => ({ ...previous, [user.id]: true }))
      })
      .catch((error) => {
        console.error('Unable to load wishlist from the database:', error)
      })
    return () => {
      active = false
    }
  }, [wishlistLoaded, user?.id])

  useEffect(() => {
    if (!user?.id || !wishlistLoaded) return
    const timeoutId = setTimeout(() => {
      saveUserData(user.id, 'wishlist', wishlistItems).catch((error) => {
        console.error('Unable to save wishlist to the database:', error)
      })
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [user?.id, wishlistLoaded, wishlistItems])

  const canChangeWishlist = () => {
    if (!user?.id) {
      openLoginModal()
      return false
    }
    return wishlistLoaded
  }

  const toggleWishlist = (product) => {
    if (!canChangeWishlist()) return false
    setWishlistItems((prev) => {
      const exists = prev.some((item) => item.id === product.id)
      if (exists) {
        return prev.filter((item) => item.id !== product.id)
      } else {
        return [...prev, product]
      }
    })
    return true
  }

  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item.id === productId)
  }

  const clearWishlist = () => {
    if (!canChangeWishlist()) return false
    setWishlistItems([])
    return true
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
