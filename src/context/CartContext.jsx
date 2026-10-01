import { createContext, useContext, useState, useEffect } from 'react'
import { COUPONS } from '../services/mockData'
import { getUserData, saveUserData } from '../services/userData'
import { useAuth } from './AuthContext'

const CartContext = createContext()
const EMPTY_CART = []

export const CartProvider = ({ children }) => {
  const { user, openLoginModal } = useAuth()
  const [cartByUser, setCartByUser] = useState({})
  const [loadedCartKeys, setLoadedCartKeys] = useState({})
  const cartItems = user?.id ? cartByUser[user.id] || EMPTY_CART : EMPTY_CART
  const cartLoaded = Boolean(user?.id && loadedCartKeys[user.id])
  const setCartItems = (update) => {
    if (!user?.id) return
    setCartByUser((previous) => {
      const currentItems = previous[user.id] || []
      const nextItems =
        typeof update === 'function' ? update(currentItems) : update
      return { ...previous, [user.id]: nextItems }
    })
  }

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [deliveryLocation, setDeliveryLocation] = useState({
    city: 'San Francisco',
    zip: '94107',
    address: '742 Evergreen Terrace',
  })
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('Express 30 Mins')

  useEffect(() => {
    if (!user?.id) return
    if (cartLoaded) return

    let active = true
    getUserData(user.id, 'cart')
      .then((items) => {
        if (!active) return
        setCartByUser((previous) => ({ ...previous, [user.id]: items }))
        setLoadedCartKeys((previous) => ({ ...previous, [user.id]: true }))
      })
      .catch((error) => {
        console.error('Unable to load cart from the database:', error)
      })
    return () => {
      active = false
    }
  }, [cartLoaded, user?.id])

  useEffect(() => {
    if (!user?.id || !cartLoaded) return
    const timeoutId = setTimeout(() => {
      saveUserData(user.id, 'cart', cartItems).catch((error) => {
        console.error('Unable to save cart to the database:', error)
      })
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [cartItems, cartLoaded, user?.id])

  const canChangeCart = () => {
    if (!user?.id) {
      openLoginModal()
      return false
    }
    return cartLoaded
  }

  const addToCart = (product, quantity = 1, selectedWeight = null) => {
    if (!canChangeCart()) return false
    const weightToUse = selectedWeight || product.weight || 'Default'
    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.id === product.id && item.selectedWeight === weightToUse
      )

      if (existingIndex > -1) {
        const updated = [...prevItems]
        updated[existingIndex].quantity += quantity
        return updated
      } else {
        return [
          ...prevItems,
          {
            ...product,
            quantity,
            selectedWeight: weightToUse,
            cartId: `${product.id}-${weightToUse}`,
          },
        ]
      }
    })
    return true
  }

  const removeFromCart = (cartId) => {
    if (!canChangeCart()) return false
    setCartItems((prev) => prev.filter((item) => item.cartId !== cartId))
    return true
  }

  const updateQuantity = (cartId, newQuantity) => {
    if (!canChangeCart()) return false
    if (newQuantity <= 0) {
      removeFromCart(cartId)
      return true
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartId === cartId ? { ...item, quantity: newQuantity } : item
      )
    )
    return true
  }

  const clearCart = () => {
    if (!canChangeCart()) return false
    setCartItems([])
    setAppliedCoupon(null)
    return true
  }

  const applyCoupon = (code) => {
    const coupon = COUPONS.find(
      (c) => c.code.toUpperCase() === code.trim().toUpperCase()
    )
    if (!coupon) {
      return { success: false, message: 'Invalid coupon code.' }
    }
    if (subtotal < coupon.minOrder) {
      return {
        success: false,
        message: `Minimum order amount for this coupon is $${coupon.minOrder}.`,
      }
    }
    setAppliedCoupon(coupon)
    return { success: true, message: `Coupon ${coupon.code} applied successfully!` }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
  }

  // Calculations
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  // Delivery fee logic: free above $25 or with FREESHIP coupon
  const baseShipping = subtotal > 0 ? (subtotal >= 25 ? 0 : 3.99) : 0
  const shippingFee =
    appliedCoupon?.discountType === 'shipping' ? 0 : baseShipping

  let couponDiscount = 0
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      couponDiscount = (subtotal * appliedCoupon.discountValue) / 100
    } else if (appliedCoupon.discountType === 'fixed') {
      couponDiscount = appliedCoupon.discountValue
    }
  }

  const finalTotal = Math.max(0, subtotal - couponDiscount + shippingFee)

  const freeShippingThreshold = 25
  const freeShippingProgress = Math.min(
    100,
    (subtotal / freeShippingThreshold) * 100
  )
  const amountForFreeShipping = Math.max(0, freeShippingThreshold - subtotal)

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        subtotal,
        shippingFee,
        couponDiscount,
        finalTotal,
        appliedCoupon,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        deliveryLocation,
        setDeliveryLocation,
        deliveryTimeSlot,
        setDeliveryTimeSlot,
        freeShippingProgress,
        amountForFreeShipping,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
