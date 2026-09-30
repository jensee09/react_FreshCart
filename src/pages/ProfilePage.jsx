import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import {
  FiUser,
  FiShoppingBag,
  FiHeart,
  FiSave,
} from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
import { useNotification } from '../context/NotificationContext'
import ProductCard from '../components/ProductCard'
import ImageUploadField from '../components/ImageUploadField'
import { formatCurrency, formatDate } from '../utils/formatters'

export default function ProfilePage() {
  const [searchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab') || 'info'
  const [activeTab, setActiveTab] = useState(tabFromUrl)

  const { user, updateProfile, isLoggedIn, openLoginModal } = useAuth()
  const { wishlistItems, clearWishlist } = useWishlist()
  const { notifySuccess, notifyError } = useNotification()

  // Form states initialized with user profile
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState(user?.address || '')
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [isSaving, setIsSaving] = useState(false)
  const [orders, setOrders] = useState([])

  useEffect(() => {
    if (tabFromUrl) setActiveTab(tabFromUrl)
  }, [tabFromUrl])

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setPhone(user.phone || '')
      setAddress(user.address || '')
      setAvatar(user.avatar || '')
      axios.get(user.role === 'admin' ? '/api/admin/orders' : '/api/orders')
        .then(({ data }) => setOrders(data))
        .catch((error) => {
          notifyError(error.response?.data?.error || error.message || 'Could not load your order history.')
          setOrders([])
        })
    }
  }, [notifyError, user])

  if (!isLoggedIn) {
    return (
      <div className="fresh-container page-wrapper" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Sign In Required</h2>
        <p style={{ color: '#666', margin: '1rem 0' }}>Please log in to view and edit your profile, order history, and saved addresses.</p>
        <button type="button" className="fc-btn fc-btn-primary" onClick={openLoginModal}>
          Sign In Now
        </button>
      </div>
    )
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updateProfile({
        name,
        phone,
        address,
        avatar,
      })
      notifySuccess('Profile saved successfully!')
    } catch (err) {
      notifyError(err.message || 'Failed to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fresh-container page-wrapper">
      <div className="profile-layout">
        {/* Sidebar */}
        <aside className="profile-sidebar">
          <div className="user-badge-header" style={{ textAlign: 'center' }}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 0.8rem', border: '3px solid #2e7d32' }}
              />
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 0.8rem', background: '#e8f5e9', color: '#2e7d32', fontSize: '1.8rem', fontWeight: 700 }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <h4 style={{ margin: 0 }}>{user?.name}</h4>
            <p style={{ margin: '0.2rem 0', color: '#666', fontSize: '0.85rem' }}>{user?.email}</p>
            {user?.phone && (
              <p style={{ margin: '0.2rem 0', color: '#666', fontSize: '0.85rem' }}>
                {user.phone}
              </p>
            )}
            <span style={{ display: 'inline-block', background: user?.role === 'admin' ? '#e8f5e9' : '#f0f0f0', color: user?.role === 'admin' ? '#2e7d32' : '#555', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', marginTop: '0.4rem' }}>
              {user?.role === 'admin' ? '👑 Store Administrator' : '👤 Customer Account'}
            </span>
          </div>

          <div className="profile-nav" style={{ marginTop: '1.5rem' }}>
            <button
              type="button"
              className={activeTab === 'info' ? 'active' : ''}
              onClick={() => setActiveTab('info')}
            >
              <FiUser /> Personal Info (Edit Profile)
            </button>

            <button
              type="button"
              className={activeTab === 'orders' ? 'active' : ''}
              onClick={() => setActiveTab('orders')}
            >
              <FiShoppingBag /> {user?.role === 'admin' ? 'All Orders' : 'Order History'} ({orders.length})
            </button>

            <button
              type="button"
              className={activeTab === 'wishlist' ? 'active' : ''}
              onClick={() => setActiveTab('wishlist')}
            >
              <FiHeart /> Wishlist ({wishlistItems.length})
            </button>
          </div>
        </aside>

        {/* Main Profile Form */}
        <main className="profile-content-card">
          {activeTab === 'info' && (
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: '#2e7d32' }}>
                ✏️ Edit Profile Details
              </h3>

              <form onSubmit={handleSaveProfile}>
                <ImageUploadField
                  label="Profile Picture"
                  value={avatar}
                  onChange={setAvatar}
                  circular
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                  <div className="form-group">
                    <label style={{ fontWeight: 600 }}>Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: 600 }}>Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={user?.email || ''}
                      disabled
                      title="Email address cannot be modified"
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: 600 }}>Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: 600 }}>Account Access Role</label>
                    <input
                      type="text"
                      className="form-control"
                      value={user?.role === 'admin' ? '👑 Admin (Full Access)' : '👤 Customer (View & Purchase)'}
                      disabled
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1.2rem' }}>
                  <label style={{ fontWeight: 600 }}>Delivery Address</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your default shipping address..."
                  />
                </div>

                <button
                  type="submit"
                  className="fc-btn fc-btn-primary"
                  disabled={isSaving}
                  style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <FiSave /> {isSaving ? 'Saving to Database...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h3>{user?.role === 'admin' ? 'All Customer Orders' : 'My Order History'}</h3>
              {orders.length === 0 ? (
                <p style={{ color: '#777', padding: '1.5rem 0' }}>
                  {user?.role === 'admin' ? 'No customer orders have been placed yet.' : 'You have not placed any orders yet.'}
                </p>
              ) : orders.map((order) => (
                <div key={order.id} className="order-history-card">
                  <div className="order-card-header">
                    <div className="meta-group">
                      <div>
                        <strong>Order #{order.id}</strong>
                        <div style={{ color: '#777', fontSize: '0.78rem' }}>
                          Placed on {formatDate(order.date)}
                        </div>
                        {user?.role === 'admin' && order.user && (
                          <div style={{ color: '#555', fontSize: '0.82rem', marginTop: '0.25rem' }}>
                            Customer: {order.user.name} ({order.user.email})
                          </div>
                        )}
                      </div>
                      <div>
                        <strong>Total: {formatCurrency(order.total)}</strong>
                      </div>
                    </div>

                    <span className={`order-status-pill ${order.status}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="order-card-body">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="order-item-mini">
                        <img src={item.image} alt={item.name} />
                        <div className="item-info">
                          <div>{item.name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#777' }}>
                            Qty: {item.qty}
                          </div>
                        </div>
                        <div className="item-price">
                          {formatCurrency(item.price * item.qty)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>My Wishlist ({wishlistItems.length})</h3>
                {wishlistItems.length > 0 && (
                  <button
                    type="button"
                    style={{ color: '#d32f2f', fontWeight: 600, fontSize: '0.85rem' }}
                    onClick={() => {
                      clearWishlist()
                      notifySuccess('Wishlist cleared')
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {wishlistItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#777' }}>
                  <FiHeart style={{ fontSize: '3rem', color: '#ccc', marginBottom: '1rem' }} />
                  <h4>No items saved in wishlist yet</h4>
                  <p>Browse products and click the heart icon to save items for later!</p>
                </div>
              ) : (
                <div className="products-grid">
                  {wishlistItems.map((prod) => (
                    <ProductCard key={prod.id} product={prod} />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
