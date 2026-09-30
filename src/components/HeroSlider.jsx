import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { HERO_SLIDES } from '../services/mockData'
import { useProducts } from '../context/ProductContext'

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const { setSelectedCategory } = useProducts()
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const slide = HERO_SLIDES[currentSlide]

  const handleCtaClick = (category) => {
    if (category) {
      setSelectedCategory(category)
    }
    navigate('/products')
  }

  return (
    <div className="hero-slider-section">
      <div
        className="hero-slide"
        style={{ background: slide.bgGradient }}
      >
        <div className="slide-content">
          <span className="hero-badge">{slide.badge}</span>
          <h1>{slide.title}</h1>
          <p>{slide.subtitle}</p>
          <button
            type="button"
            className="fc-btn fc-btn-secondary fc-btn-lg"
            onClick={() => handleCtaClick(slide.linkCategory)}
          >
            {slide.ctaText} →
          </button>
        </div>

        <img
          className="slide-img-bg"
          src={slide.image}
          alt={slide.title}
        />

        <div className="slider-controls">
          {HERO_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              className={`dot-btn ${currentSlide === idx ? 'active' : ''}`}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
