import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FiTrash2,
  FiPlus,
  FiMinus,
  FiArrowRight,
  FiShoppingBag,
  FiCheckCircle,
  FiTag,
} from 'react-icons/fi'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { formatCurrency } from '../utils/formatters'

export default function CartPage() {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    shippingFee,
    couponDiscount,
    finalTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart()

  const { isLoggedIn, openLoginModal } = useAuth()
  const { notifySuccess, notifyError } = useNotification()
  const [couponCodeInput, setCouponCodeInput] = useState('')
  const navigate = useNavigate()

  const handleApplyCoupon = (e) => {
    e.preventDefault()
    if (!couponCodeInput.trim()) return
    const res = applyCoupon(couponCodeInput)
    if (res.success) {
      notifySuccess(res.message)
      setCouponCodeInput('')
    } else {
      notifyError(res.message)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="fresh-container page-wrapper" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ background: '#fff', padding: '3rem', borderRadius: '24px', maxWidth: '500px', margin: '0 auto', border: '1px solid #eee' }}>
          <FiShoppingBag style={{ fontSize: '4rem', color: '#ccc', marginBottom: '1rem' }} />
          <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>
            {isLoggedIn ? 'Your Cart is Empty' : 'Sign In to Use Your Cart'}
          </h2>
          <p style={{ color: '#777', marginBottom: '1.5rem' }}>
            {isLoggedIn
              ? "Looks like you haven't added any fresh groceries to your cart yet."
              : 'Sign in to save your cart to your account in MySQL.'}
          </p>
          {isLoggedIn ? (
            <Link to="/products" className="fc-btn fc-btn-primary fc-btn-lg">
              Shop Organic Produce Now
            </Link>
          ) : (
            <button
              type="button"
              className="fc-btn fc-btn-primary fc-btn-lg"
              onClick={openLoginModal}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fresh-container page-wrapper">
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '1.5rem' }}>
        Shopping Cart ({cartItems.length} items)
      </h1>

      <div className="cart-page-layout">
        {/* Table Card */}
        <div className="cart-table-card">
          <div className="cart-header">
            <h2>Item Details</h2>
            <button
              type="button"
              style={{ color: '#d32f2f', fontWeight: 600, fontSize: '0.85rem' }}
              onClick={() => {
                clearCart()
                notifySuccess('Cart cleared')
              }}
            >
              Clear Cart
            </button>
          </div>

          <table className="cart-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => (
                <tr key={item.cartId}>
                  <td>
                    <div className="item-cell">
                      <img src={item.image} alt={item.name} />
                      <div>
                        <div className="item-name">{item.name}</div>
                        <div className="item-sub">Pack: {item.selectedWeight}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(item.price)}</td>
                  <td>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        type="button"
                        style={{ padding: '0.3rem 0.6rem' }}
                        onClick={() =>
                          updateQuantity(item.cartId, item.quantity - 1)
                        }
                      >
                        <FiMinus />
                      </button>
                      <span style={{ padding: '0 0.6rem', fontWeight: 700 }}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        style={{ padding: '0.3rem 0.6rem' }}
                        onClick={() =>
                          updateQuantity(item.cartId, item.quantity + 1)
                        }
                      >
                        <FiPlus />
                      </button>
                    </div>
                  </td>
                  <td style={{ fontWeight: 800, color: '#2e7d32' }}>
                    {formatCurrency(item.price * item.quantity)}
                  </td>
                  <td>
                    <button
                      type="button"
                      style={{ color: '#bbb' }}
                      onClick={() => removeFromCart(item.cartId)}
                      title="Remove"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Summary */}
        <div className="order-summary-card">
          <h3>Order Summary</h3>

          {/* Coupon Input */}
          <div className="coupon-box">
            <form onSubmit={handleApplyCoupon} className="coupon-input-group">
              <input
                type="text"
                placeholder="PROMO CODE (e.g. FRESH20)"
                value={couponCodeInput}
                onChange={(e) => setCouponCodeInput(e.target.value)}
              />
              <button type="submit" className="fc-btn fc-btn-secondary">
                Apply
              </button>
            </form>

            {appliedCoupon && (
              <div className="applied-coupon-tag">
                <span>
                  <FiTag /> {appliedCoupon.code} ({appliedCoupon.description})
                </span>
                <span className="remove-cpn" onClick={removeCoupon}>
                  Remove
                </span>
              </div>
            )}
          </div>

          <div className="summary-rows">
            <div className="s-row">
              <span>Items Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            {couponDiscount > 0 && (
              <div className="s-row text-success">
                <span>Discount Applied</span>
                <span>-{formatCurrency(couponDiscount)}</span>
              </div>
            )}

            <div className="s-row">
              <span>Estimated Shipping</span>
              <span>
                {shippingFee === 0 ? (
                  <strong className="text-success">FREE</strong>
                ) : (
                  formatCurrency(shippingFee)
                )}
              </span>
            </div>

            <div className="s-row total-row">
              <span>Order Total</span>
              <span className="total-price">{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          <button
            type="button"
            className="fc-btn fc-btn-primary fc-btn-lg"
            style={{ width: '100%', marginTop: '1.5rem' }}
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout <FiArrowRight />
          </button>
        </div>
      </div>
    </div>
  )
}
