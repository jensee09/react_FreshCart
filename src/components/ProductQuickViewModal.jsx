import { useState } from 'react'
import {
  FiX,
  FiStar,
  FiShoppingBag,
  FiHeart,
  FiCheckCircle,
  FiTruck,
  FiShield,
} from 'react-icons/fi'
import { useProducts } from '../context/ProductContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useNotification } from '../context/NotificationContext'
import { formatCurrency } from '../utils/formatters'

export default function ProductQuickViewModal() {
  const { quickViewProduct, setQuickViewProduct } = useProducts()
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { notifySuccess } = useNotification()

  const [quantity, setQuantity] = useState(1)
  const [selectedWeight, setSelectedWeight] = useState('')

  if (!quickViewProduct) return null

  const product = quickViewProduct
  const weightToUse =
    selectedWeight ||
    (product.weightOptions ? product.weightOptions[0] : product.weight)
  const isLiked = isInWishlist(product.id)

  const handleAdd = () => {
    addToCart(product, quantity, weightToUse)
    notifySuccess(
      `Added ${quantity} x ${product.name} (${weightToUse}) to cart!`
    )
    setQuickViewProduct(null)
  }

  const handleWishlist = () => {
    toggleWishlist(product)
    notifySuccess(
      isLiked ? 'Removed from Wishlist' : 'Added to Wishlist!'
    )
  }

  return (
    <div
      className="modal-backdrop"
      onClick={() => setQuickViewProduct(null)}
    >
      <div
        className="modal-content-custom"
        style={{ maxWidth: '800px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-custom">
          <h3>Product Quick View</h3>
          <button
            type="button"
            className="close-modal-btn"
            onClick={() => setQuickViewProduct(null)}
          >
            <FiX />
          </button>
        </div>

        <div className="modal-body-custom">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
            }}
          >
            {/* Gallery */}
            <div>
              <div
                style={{
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  padding: '1rem',
                  textAlign: 'center',
                  marginBottom: '1rem',
                }}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  style={{
                    maxHeight: '280px',
                    margin: '0 auto',
                    objectFit: 'contain',
                  }}
                />
              </div>
            </div>

            {/* Info */}
            <div>
              <span
                style={{
                  fontSize: '0.8rem',
                  color: '#777',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                {product.categoryName}
              </span>
              <h2
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  margin: '0.4rem 0',
                }}
              >
                {product.name}
              </h2>

        
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.8rem',
                  marginBottom: '1.2rem',
                }}
              >
                <span
                  style={{
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    color: '#2e7d32',
                  }}
                >
                  {formatCurrency(product.price)}
                </span>
                {product.originalPrice > product.price && (
                  <span
                    style={{
                      fontSize: '1rem',
                      color: '#999',
                      textDecoration: 'line-through',
                    }}
                  >
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>

              <p
                style={{
                  fontSize: '0.9rem',
                  color: '#555',
                  lineHeight: '1.5',
                  marginBottom: '1.5rem',
                }}
              >
                {product.description}
              </p>

              {/* Weight Selector */}
              {product.weightOptions && (
                <div style={{ marginBottom: '1.2rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Select Option / Pack Size:
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {product.weightOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSelectedWeight(opt)}
                        className={`fc-btn fc-btn-sm ${
                          weightToUse === opt
                            ? 'fc-btn-primary'
                            : 'fc-btn-outline-secondary'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity & Add button */}
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    style={{ padding: '0.5rem 0.8rem', fontWeight: 700 }}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    -
                  </button>
                  <span
                    style={{
                      padding: '0 0.8rem',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    style={{ padding: '0.5rem 0.8rem', fontWeight: 700 }}
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="fc-btn fc-btn-primary"
                  onClick={handleAdd}
                  style={{ flex: 1 }}
                >
                  <FiShoppingBag /> Add to Cart
                </button>

                <button
                  type="button"
                  className={`fc-btn fc-btn-icon-only ${
                    isLiked ? 'fc-btn-danger' : 'fc-btn-outline-secondary'
                  }`}
                  onClick={handleWishlist}
                  title="Wishlist"
                >
                  <FiHeart fill={isLiked ? '#fff' : 'none'} />
                </button>
              </div>

              {/* Guarantees */}
              <div
                style={{
                  borderTop: '1px solid #eee',
                  paddingTop: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  fontSize: '0.82rem',
                  color: '#666',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiTruck style={{ color: '#2e7d32' }} /> Express 30-minute delivery available
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiShield style={{ color: '#2e7d32' }} /> 100% Quality & Freshness Guarantee
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
