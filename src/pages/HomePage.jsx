import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FiArrowRight,
  FiAward,
  FiHeart,
  FiMapPin,
  FiTruck,
  FiZap,
} from 'react-icons/fi'
import HeroSlider from '../components/HeroSlider'
import ProductCard from '../components/ProductCard'
import { useProducts } from '../context/ProductContext'

export default function HomePage() {
  const { products, categories, setSelectedCategory } = useProducts()
  const navigate = useNavigate()

  // Countdown timer for Flash Deal
  const [timeLeft, setTimeLeft] = useState({
    hours: 11,
    minutes: 45,
    seconds: 20,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
        if (prev.minutes > 0)
          return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 }
        if (prev.hours > 0)
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        return prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleCategoryClick = (catId) => {
    setSelectedCategory(catId)
    navigate('/products')
  }

  const featuredProducts = products.filter((p) => p.isFeatured)

  return (
    <div className="fresh-container page-wrapper">
      {/* Hero Banner Slider */}
      <HeroSlider />

      <section className="home-trust-strip" aria-label="FreshCart benefits">
        <div className="home-trust-item">
          <span className="home-trust-icon"><FiAward /></span>
          <span><strong>Quality you can trust</strong><small>Carefully selected freshness</small></span>
        </div>
        <div className="home-trust-item">
          <span className="home-trust-icon"><FiTruck /></span>
          <span><strong>Convenient delivery</strong><small>Groceries brought to your door</small></span>
        </div>
        <div className="home-trust-item">
          <span className="home-trust-icon"><FiMapPin /></span>
          <span><strong>Fresh, every day</strong><small>Great choices for your table</small></span>
        </div>
      </section>

      {/* Top Categories */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div className="home-section-header">
          <h2 className="section-title">Shop by Category</h2>
          <Link to="/products" className="view-all-link">
            See All Categories <FiArrowRight />
          </Link>
        </div>

        <div className="categories-grid">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="category-card"
              onClick={() => handleCategoryClick(cat.id)}
            >
              <div
                className="cat-icon-bg"
                style={{ background: cat.color, color: cat.textColor }}
              >
                {cat.icon}
              </div>
              <h3 className="cat-name">{cat.name}</h3>
              <span className="cat-count">{cat.itemCount}</span>
            </div>
          ))}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="home-category-showcase" aria-label="Explore grocery collections">
          <div className="home-showcase-heading">
            <span className="home-eyebrow"><FiHeart /> FRESH PICKS FOR YOUR TABLE</span>
            <h2>Good food starts with great ingredients.</h2>
            <p>Explore the collections our customers love and find something fresh for every meal.</p>
          </div>
          <div className="home-showcase-grid">
            {categories.slice(0, 3).map((category, index) => (
              <button
                type="button"
                key={category.id}
                className={`home-showcase-card home-showcase-card-${index + 1}`}
                style={{ backgroundImage: category.image ? `url("${category.image}")` : undefined }}
                onClick={() => handleCategoryClick(category.id)}
              >
                <span className="home-showcase-shade" />
                <span className="home-showcase-content">
                  <span className="home-showcase-label">FRESH COLLECTION</span>
                  <strong>{category.name}</strong>
                  <span className="home-showcase-link">Explore collection <FiArrowRight /></span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="home-why-section">
        <div className="home-why-copy">
          <span className="home-eyebrow">THE FRESHCART DIFFERENCE</span>
          <h2>Freshness you can feel good about.</h2>
          <p>From choosing your groceries to their arrival, we make everyday shopping simple and enjoyable.</p>
          <div className="home-why-points">
            <div><FiAward /><span><strong>Thoughtfully selected</strong><small>Quality picks for your kitchen.</small></span></div>
            <div><FiMapPin /><span><strong>Made for your neighborhood</strong><small>Everyday essentials, close to home.</small></span></div>
            <div><FiTruck /><span><strong>Easy doorstep delivery</strong><small>A convenient way to shop fresh.</small></span></div>
          </div>
          <Link to="/products" className="fc-btn fc-btn-primary">
            Shop FreshCart <FiArrowRight />
          </Link>
        </div>
        <div className="home-why-visual">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=85"
            alt="A colorful selection of fresh produce"
            loading="lazy"
          />
          <div className="home-why-note"><FiHeart /><span><strong>Goodness in every basket</strong><small>Fresh choices for every day</small></span></div>
        </div>
      </section>

      {/* Flash Deal of the Day Banner */}
      <section>
        <div className="deal-banner">
          <div className="deal-info">
            <span className="deal-tag">
              <FiZap /> Limited Time Flash Sale
            </span>
            <h2>Fresh Hass Avocados & Wild Salmon Combo</h2>
            <p>
              Get maximum savings today on our superfood nutrient bundle.
              Organic certified and handpicked.
            </p>
            
          
            <button
              type="button"
              className="fc-btn fc-btn-primary fc-btn-lg"
              onClick={() => {
                setSelectedCategory('fruits')
                navigate('/products')
              }}
            >
              Grab Deal Now →
            </button>
          </div>

          <img
            className="deal-image"
            src="https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80"
            alt="Flash deal"
          />
        </div>
      </section>

      {/* Featured Organic Section */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div className="home-section-header">
          <h2 className="section-title">
            🌱 Featured Organic Produce
          </h2>
          <Link to="/products" className="view-all-link">
            Explore All <FiArrowRight />
          </Link>
        </div>

        <div className="products-grid">
          {featuredProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

    </div>
  )
}
