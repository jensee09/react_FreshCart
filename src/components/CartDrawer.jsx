import { useNavigate } from 'react-router-dom'
import {
  FiX,
  FiShoppingBag,
  FiTrash2,
  FiPlus,
  FiMinus,
  FiTruck,
  FiArrowRight,
} from 'react-icons/fi'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatCurrency } from '../utils/formatters'

export default function CartDrawer() {
  const {
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    cartItems,
    updateQuantity,
    removeFromCart,
    subtotal,
    shippingFee,
    couponDiscount,
    finalTotal,
    freeShippingProgress,
    amountForFreeShipping,
  } = useCart()
  const { isLoggedIn, openLoginModal } = useAuth()

  const navigate = useNavigate()

  if (!isCartDrawerOpen) return null

  const handleCheckoutClick = () => {
    setIsCartDrawerOpen(false)
    navigate('/checkout')
  }

  const handleViewCartClick = () => {
    setIsCartDrawerOpen(false)
    navigate('/cart')
  }

  return (
    <>
      <div
        className="cart-drawer-backdrop"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      <div className="cart-drawer">
        {/* Header */}
        <div className="drawer-header">
          <h3>
            <FiShoppingBag /> Your Cart ({cartItems.length})
          </h3>
          <button
            type="button"
            className="close-drawer"
            onClick={() => setIsCartDrawerOpen(false)}
          >
            <FiX />
          </button>
        </div>

        {/* Free Shipping Bar */}
        <div className="free-shipping-bar">
          <div className="fs-text">
            <FiTruck />
            {amountForFreeShipping === 0
              ? '🎉 You got FREE Express Shipping!'
              : `Add ${formatCurrency(amountForFreeShipping)} more for FREE Shipping`}
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {cartItems.length === 0 ? (
            <div className="empty-cart-state">
              <FiShoppingBag className="empty-icon" />
              <h4>{isLoggedIn ? 'Your cart is empty' : 'Sign in to use your cart'}</h4>
              <p>
                {isLoggedIn
                  ? 'Add some fresh organic produce to get started!'
                  : 'Your cart is saved to your account in MySQL after you sign in.'}
              </p>
              <button
                type="button"
                className="fc-btn fc-btn-primary"
                onClick={() => {
                  setIsCartDrawerOpen(false)
                  if (!isLoggedIn) openLoginModal()
                }}
              >
                {isLoggedIn ? 'Start Shopping' : 'Sign In'}
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.cartId} className="cart-item-row">
                <img src={item.image} alt={item.name} />
                <div className="item-details">
                  <h4 className="item-title">{item.name}</h4>
                  <p className="item-weight">Pack: {item.selectedWeight}</p>
                  <div className="item-row-footer">
                    <span className="price">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                    <div className="qty-btn-group">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.cartId, item.quantity - 1)
                        }
                      >
                        <FiMinus />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.cartId, item.quantity + 1)
                        }
                      >
                        <FiPlus />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="remove-item-btn"
                  onClick={() => removeFromCart(item.cartId)}
                  title="Remove item"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="drawer-footer">
            <div className="summary-line">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="summary-line text-success">
                <span>Coupon Discount</span>
                <span>-{formatCurrency(couponDiscount)}</span>
              </div>
            )}
            <div className="summary-line">
              <span>Estimated Shipping</span>
              <span>
                {shippingFee === 0 ? (
                  <strong className="text-success">FREE</strong>
                ) : (
                  formatCurrency(shippingFee)
                )}
              </span>
            </div>
            <div className="summary-line total-line">
              <span>Total</span>
              <span className="total-val">{formatCurrency(finalTotal)}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="fc-btn fc-btn-outline-secondary"
                style={{ flex: 1 }}
                onClick={handleViewCartClick}
              >
                View Cart
              </button>
              <button
                type="button"
                className="fc-btn fc-btn-primary checkout-btn"
                style={{ flex: 1 }}
                onClick={handleCheckoutClick}
              >
                Checkout <FiArrowRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
