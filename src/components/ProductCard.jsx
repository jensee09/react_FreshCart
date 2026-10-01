import { useState } from 'react'
import {
  FiHeart,
  FiShoppingBag,
  FiEye,
  FiPlus,
  FiMinus,
  FiCheck,
  FiStar,
} from 'react-icons/fi'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useProducts } from '../context/ProductContext'
import { useNotification } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'
import { formatCurrency } from '../utils/formatters'

export default function ProductCard({ product }) {
  const { addToCart, cartItems, updateQuantity } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { setQuickViewProduct } = useProducts()
  const { notifySuccess, notifyError } = useNotification()
  const { isLoggedIn } = useAuth()

  const [selectedWeight, setSelectedWeight] = useState(
    product.weightOptions ? product.weightOptions[0] : product.weight
  )

  const isLiked = isInWishlist(product.id)

  // Find item in cart
  const cartItem = cartItems.find(
    (item) => item.id === product.id && item.selectedWeight === selectedWeight
  )
  const qtyInCart = cartItem ? cartItem.quantity : 0

  const handleAddToCart = (e) => {
    e.stopPropagation()
    const added = addToCart(product, 1, selectedWeight)
    if (!added) {
      if (isLoggedIn) notifyError('Your cart is still loading from MySQL. Please try again.')
      return
    }
    notifySuccess(`Added ${product.name} (${selectedWeight}) to cart!`)
  }

  const handleWishlistToggle = (e) => {
    e.stopPropagation()
    const changed = toggleWishlist(product)
    if (!changed) {
      if (isLoggedIn) notifyError('Your wishlist is still loading from MySQL. Please try again.')
      return
    }
    notifySuccess(
      isLiked
        ? `Removed ${product.name} from Wishlist`
        : `Added ${product.name} to Wishlist`
    )
  }

  return (
    <div className="product-card">
      {/* Badges */}
      <div className="card-badges">
        {product.badge && (
          <span className="badge-tag badge-discount">{product.badge}</span>
        )}
        {product.isOrganic && (
          <span className="badge-tag badge-organic">🌱 Organic</span>
        )}
      </div>

      {/* Wishlist button */}
      <button
        type="button"
        className={`wishlist-btn ${isLiked ? 'active' : ''}`}
        onClick={handleWishlistToggle}
        title={isLiked ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <FiHeart fill={isLiked ? '#d32f2f' : 'none'} />
      </button>

      {/* Image & Quick View trigger */}
      <div
        className="card-img-wrapper"
        onClick={() => setQuickViewProduct(product)}
      >
        <img src={product.image} alt={product.name} loading="lazy" />
        <div className="quick-view-overlay">
          <span className="qv-btn">
            <FiEye style={{ marginRight: '4px' }} /> Quick View
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="card-info">
        <span className="category-label">{product.categoryName}</span>
        <h4
          className="product-title"
          onClick={() => setQuickViewProduct(product)}
          style={{ cursor: 'pointer' }}
        >
          {product.name}
        </h4>

        {/* Weight Selector */}
        {product.weightOptions && product.weightOptions.length > 0 && (
          <div className="weight-selector-mini">
            <select
              value={selectedWeight}
              onChange={(e) => setSelectedWeight(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            >
              {product.weightOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Footer Action */}
      <div className="card-footer-action">
        <div className="price-block">
          <span className="current-price">
            {formatCurrency(product.price)}
          </span>
          {product.originalPrice > product.price && (
            <span className="old-price">
              {formatCurrency(product.originalPrice)}
            </span>
          )}
        </div>

        {qtyInCart > 0 ? (
          <div className="quantity-controller">
            <button
              type="button"
              onClick={() => updateQuantity(cartItem.cartId, qtyInCart - 1)}
            >
              <FiMinus />
            </button>
            <span>{qtyInCart}</span>
            <button
              type="button"
              onClick={() => updateQuantity(cartItem.cartId, qtyInCart + 1)}
            >
              <FiPlus />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="fc-btn fc-btn-outline-primary fc-btn-sm"
            onClick={handleAddToCart}
          >
            <FiShoppingBag /> Add
          </button>
        )}
      </div>
    </div>
  )
}
