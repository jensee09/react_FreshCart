import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  FiSearch,
  FiHeart,
  FiShoppingBag,
  FiUser,
  FiGrid,
  FiHome,
  FiMenu,
  FiX,
  FiShoppingCart,
  FiClock,
  FiPhoneCall,
  FiCheckCircle,
  FiSettings,
  FiLogOut,
} from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useProducts } from '../context/ProductContext'

export default function Navbar() {
  const { user, isLoggedIn, isAdmin, logout, openLoginModal } = useAuth()
  const { cartCount, setIsCartDrawerOpen } = useCart()
  const { wishlistCount } = useWishlist()
  const {
    categories,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    products,
    setQuickViewProduct,
  } = useProducts()

  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const searchRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const selectedCategoryOption = categories.find(
    (category) => category.id === selectedCategory || category.slug === selectedCategory
  )

  // Filter live search suggestions (up to 5)
  const suggestions = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : []

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setShowSuggestions(false)
    navigate('/products')
  }

  const handleSelectSuggestion = (prod) => {
    setShowSuggestions(false)
    setQuickViewProduct(prod)
  }

  return (
    <>
      {/* Top Bar */}
      <div className="fc-top-bar">
        <div className="fresh-container top-bar-content">
          <div className="announcement">
            <FiClock /> Express 30-Minute Delivery
          </div>

          <div className="top-links">
            <span>
              <FiPhoneCall /> Support: {isAdmin && user?.phone ? user.phone : '+1 (800) 555-FRESH'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="fc-header">
        <div className="fresh-container header-main">
          {/* Logo */}
          <Link to="/" className="brand-logo">
            <div className="logo-icon">🌿</div>
            <span className="brand-name">
              Fresh<span>Cart</span>
            </span>
          </Link>

          <nav
            className={`header-navigation ${showMobileMenu ? 'is-open' : ''}`}
            aria-label="Main navigation"
          >
            <button
              type="button"
              className="mobile-menu-toggle"
              aria-label={showMobileMenu ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={showMobileMenu}
              aria-controls="primary-navigation-links"
              onClick={() => setShowMobileMenu((open) => !open)}
            >
              {showMobileMenu ? <FiX /> : <FiMenu />}
            </button>

            <div className="mobile-navigation-panel">
              <div className="nav-links" id="primary-navigation-links">
                <Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={() => setShowMobileMenu(false)}>
                  <FiHome /> <span>Home</span>
                </Link>
                <Link to="/products" className={location.pathname === '/products' ? 'active' : ''} onClick={() => setShowMobileMenu(false)}>
                  <FiGrid /> <span>Shop All Produce</span>
                </Link>
                <Link to="/cart" className={location.pathname === '/cart' ? 'active' : ''} onClick={() => setShowMobileMenu(false)}>
                  <FiShoppingCart /> <span>Shopping Cart</span>
                </Link>
                <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''} onClick={() => setShowMobileMenu(false)}>
                  <FiUser /> <span>My Account</span>
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    style={{ color: '#2e7d32', fontWeight: 800 }}
                    className={location.pathname === '/admin' ? 'active' : ''}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <FiSettings /> <span>Admin Panel</span>
                  </Link>
                )}
              </div>

              {/* Header Actions */}
              <div className="header-actions">
            {/* Wishlist */}
            <Link to="/profile?tab=wishlist" className="action-item">
              <div className="icon-wrapper">
                <FiHeart />
                {wishlistCount > 0 && (
                  <span className="badge-counter">{wishlistCount}</span>
                )}
              </div>
              <div className="action-label">
                <span className="small-txt">Saved</span>
                <span className="main-txt">Wishlist</span>
              </div>
            </Link>

            {/* Cart Drawer Toggle */}
            <div
              className="action-item"
              onClick={() => setIsCartDrawerOpen(true)}
            >
              <div className="icon-wrapper">
                <FiShoppingBag />
                {cartCount > 0 && (
                  <span className="badge-counter">{cartCount}</span>
                )}
              </div>
              <div className="action-label">
                <span className="small-txt">My Cart</span>
                <span className="main-txt">
                  {cartCount} {cartCount === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>

            {/* User Account Dropdown */}
            <div className="action-item" style={{ position: 'relative' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                onClick={() =>
                  isLoggedIn
                    ? setShowUserDropdown((prev) => !prev)
                    : openLoginModal()
                }
              >
                {isLoggedIn && user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #2e7d32',
                    }}
                  />
                ) : (
                  <div className="icon-wrapper">
                    <FiUser />
                  </div>
                )}
                <div className="action-label">
                  <span className="small-txt">
                    {isLoggedIn ? `Hello, ${user?.name?.split(' ')[0]}` : 'Account'}
                  </span>
                  <span className="main-txt">
                    {isLoggedIn ? 'Dashboard' : 'Sign In'}
                  </span>
                </div>
              </div>

              {/* User Dropdown */}
              {showUserDropdown && isLoggedIn && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: '200px',
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    border: '1px solid #eee',
                    zIndex: 1000,
                    overflow: 'hidden',
                  }}
                  onMouseLeave={() => setShowUserDropdown(false)}
                >
                  <Link
                    to="/profile"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.8rem 1rem',
                      color: '#333',
                      fontSize: '0.88rem',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                    onClick={() => setShowUserDropdown(false)}
                  >
                    <FiUser /> My Profile
                  </Link>
                  <Link
                    to="/profile?tab=orders"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.8rem 1rem',
                      color: '#333',
                      fontSize: '0.88rem',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                    onClick={() => setShowUserDropdown(false)}
                  >
                    <FiCheckCircle /> My Orders
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.8rem 1rem',
                        color: '#2e7d32',
                        fontWeight: '700',
                        fontSize: '0.88rem',
                        borderBottom: '1px solid #f0f0f0',
                        background: '#f1f8e9',
                      }}
                      onClick={() => setShowUserDropdown(false)}
                    >
                      <FiSettings /> Admin Panel
                    </Link>
                  )}
                  <button
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.8rem 1rem',
                      color: '#d32f2f',
                      width: '100%',
                      fontSize: '0.88rem',
                      textAlign: 'left',
                    }}
                    onClick={() => {
                      logout()
                      setShowUserDropdown(false)
                    }}
                  >
                    <FiLogOut /> Sign Out
                  </button>
                </div>
              )}
            </div>
            </div>
            </div>
          </nav>
        </div>

        <div className="fresh-container header-search-row">
          
          <div className="search-box-wrapper" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="search-input-group">
              <select
                className="category-select-mini"
                value={selectedCategory === 'all' ? 'all' : selectedCategoryOption?.slug || selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  navigate('/products')
                }}
                aria-label="Search within category"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug || cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Search fresh vegetables, organic fruits, milk, bread..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                aria-label="Search products"
              />

              <button type="submit" className="search-btn" aria-label="Search">
                <FiSearch />
              </button>
            </form>

            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions">
                {suggestions.map((prod) => (
                  <div
                    key={prod.id}
                    className="suggestion-item"
                    onClick={() => handleSelectSuggestion(prod)}
                  >
                    <img src={prod.image} alt={prod.name} />
                    <div className="sug-info">
                      <div className="sug-name">{prod.name}</div>
                      <div className="sug-cat">{prod.categoryName}</div>
                    </div>
                    <div className="sug-price">${prod.price}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
{/* <button
            type="button"
            className="categories-dropdown-btn"
            onClick={() => {
              setSelectedCategory('all')
              navigate('/products')
            }}
          >
            <FiGrid /> All Categories
          </button> */}

        </div>
      </header>

      {/* Location Modal */}
    </>
  )
}
