import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiPlus,
  FiShield,
} from 'react-icons/fi'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { formatCurrency } from '../utils/formatters'
import axios from 'axios'

export default function CheckoutPage() {
  const { cartItems, finalTotal, subtotal, shippingFee, clearCart } = useCart()
  const { user, addAddress, openLoginModal } = useAuth()
  const { notifySuccess, notifyError } = useNotification()
  const navigate = useNavigate()

  const [selectedAddrId, setSelectedAddrId] = useState(
    user?.addresses?.[0]?.id || (user?.address ? 'profile-address' : 'addr1')
  )
  // New address inline form state
  const [showAddAddr, setShowAddAddr] = useState(false)
  const [newTitle, setNewTitle] = useState('Home')
  const [newStreet, setNewStreet] = useState('')
  const [newCity, setNewCity] = useState('')
  const [newZip, setNewZip] = useState('')
  const addresses = user?.addresses?.length
    ? user.addresses
    : user?.address
      ? [{
          id: 'profile-address',
          title: 'Default',
          name: user.name,
          street: user.address,
          city: '',
          zip: '',
        }]
      : []

  const handleAddNewAddr = async (e) => {
    e.preventDefault()
    try {
      const savedAddress = await addAddress({
        title: newTitle,
        name: user?.name || 'Customer',
        street: newStreet,
        city: newCity,
        zip: newZip,
        isDefault: false,
      })
      notifySuccess('New address added!')
      setSelectedAddrId(savedAddress.id)
      setShowAddAddr(false)
    } catch (error) {
      notifyError(error.message || 'Could not save the address.')
    }
  }

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return
    if (!user) {
      openLoginModal()
      return
    }
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const order = {
      id: orderId,
      total: finalTotal,
      deliveryAddress:
        addresses.find((address) => address.id === selectedAddrId) || null,
      paymentMethod: 'cash-or-card-on-delivery',
      items: cartItems.map((item) => ({
        name: item.name,
        qty: item.quantity,
        price: item.price,
        image: item.image,
      })),
    }
    try {
      await axios.post('/api/orders', order)
    } catch (error) {
      notifyError(error.response?.data?.error || error.message || 'Could not save your order.')
      return
    }
    clearCart()
    notifySuccess('Order placed successfully! 🎉')
    navigate(`/order-success?orderId=${orderId}`)
  }

  if (cartItems.length === 0) {
    return (
      <div className="fresh-container page-wrapper" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <h2>No items in cart for checkout!</h2>
        <button
          type="button"
          className="fc-btn fc-btn-primary"
          style={{ marginTop: '1rem' }}
          onClick={() => navigate('/products')}
        >
          Return to Shop
        </button>
      </div>
    )
  }

  return (
    <div className="fresh-container page-wrapper">
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '1.5rem' }}>
        Checkout & Payment
      </h1>

      <div className="checkout-layout">
        <main>
          {/* Step 1: Address */}
          <div className="checkout-step-box">
            <div className="step-title">
              <span className="step-number">1</span>
              <span>Delivery Address</span>
            </div>

            <div className="address-cards-grid">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`address-card ${
                    selectedAddrId === addr.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedAddrId(addr.id)}
                >
                  <span className="addr-tag">{addr.title}</span>
                  <div className="addr-name">{addr.name}</div>
                  <div className="addr-text">
                    {addr.street}, {addr.city} {addr.zip}
                  </div>
                </div>
              ))}

              <div
                className="address-card"
                style={{
                  borderStyle: 'dashed',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2e7d32',
                }}
                onClick={() => setShowAddAddr((prev) => !prev)}
              >
                <FiPlus style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }} />
                <strong>Add New Address</strong>
              </div>
            </div>

            {showAddAddr && (
              <form
                onSubmit={handleAddNewAddr}
                style={{
                  marginTop: '1.2rem',
                  padding: '1rem',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label>Address Label</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Work, Home"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Street Address</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newStreet}
                      onChange={(e) => setNewStreet(e.target.value)}
                      placeholder="123 Main St"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Zip Code</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newZip}
                      onChange={(e) => setNewZip(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="fc-btn fc-btn-primary fc-btn-sm">
                  Save Address
                </button>
              </form>
            )}
          </div>

          {/* Step 2: Payment */}
          <div className="checkout-step-box">
            <div className="step-title">
              <span className="step-number">2</span>
              <span>Payment Options</span>
            </div>

            <div className="payment-options-grid">
              <div className="payment-option-card selected">
                <FiShield className="pay-icon" />
                <div className="pay-info">
                  <strong>Cash / Card on Delivery</strong>
                  <span>Pay when your fresh produce arrives at your doorstep</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Order Summary sidebar */}
        <aside className="order-summary-card">
          <h3>Order Overview</h3>

          <div
            style={{
              maxHeight: '200px',
              overflowY: 'auto',
              marginBottom: '1rem',
              paddingRight: '0.5rem',
            }}
          >
            {cartItems.map((item) => (
              <div
                key={item.cartId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  marginBottom: '0.5rem',
                }}
              >
                <span>
                  {item.quantity} x {item.name} ({item.selectedWeight})
                </span>
                <span style={{ fontWeight: 700 }}>
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="summary-rows">
            <div className="s-row">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="s-row">
              <span>Shipping Fee</span>
              <span>{shippingFee === 0 ? 'FREE' : formatCurrency(shippingFee)}</span>
            </div>
            <div className="s-row total-row">
              <span>Total Payable</span>
              <span className="total-price">{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          <button
            type="button"
            className="fc-btn fc-btn-primary fc-btn-lg"
            style={{ width: '100%', marginTop: '1.5rem' }}
            onClick={handlePlaceOrder}
          >
            Place Order ({formatCurrency(finalTotal)})
          </button>
        </aside>
      </div>
    </div>
  )
}
