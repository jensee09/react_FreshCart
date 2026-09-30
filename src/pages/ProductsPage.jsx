import { useProducts } from '../context/ProductContext'
import ProductCard from '../components/ProductCard'
import { FiFilter, FiRotateCcw } from 'react-icons/fi'

export default function ProductsPage() {
  const {
    categories,
    products,
    filteredProducts,
    selectedCategory,
    setSelectedCategory,
    priceRange,
    setPriceRange,
    maxProductPrice,
    onlyOrganic,
    setOnlyOrganic,
    onlyInStock,
    setOnlyInStock,
    sortBy,
    setSortBy,
    resetFilters,
  } = useProducts()

  return (
    <div className="fresh-container page-wrapper">
      <div className="products-page-layout">
        {/* Sidebar Filters */}
        <aside className="filter-sidebar">
          <div className="sidebar-header">
            <h3>
              <FiFilter /> Filters
            </h3>
            <button type="button" className="clear-btn" onClick={resetFilters}>
              <FiRotateCcw /> Reset All
            </button>
          </div>

          {/* Categories */}
          <div className="filter-group">
            <h4>Categories</h4>
            <div className="category-filter-list">
              <div
                role="button"
                tabIndex={0}
                className={`cat-filter-item ${
                  selectedCategory === 'all' ? 'active' : ''
                }`}
                onClick={() => setSelectedCategory('all')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedCategory('all')
                }}
              >
                <span>All Categories</span>
              </div>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  role="button"
                  tabIndex={0}
                  className={`cat-filter-item ${
                    selectedCategory === cat.id || selectedCategory === cat.slug
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => setSelectedCategory(cat.slug || cat.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedCategory(cat.slug || cat.id)
                    }
                  }}
                >
                  <span>
                    {cat.icon} {cat.name}
                  </span>
                  <span className="item-cnt">
                    {products.filter((product) =>
                      [cat.id, cat.slug].filter(Boolean).includes(String(product.category))
                    ).length}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="filter-group">
            <h4>Max Price: ${priceRange[1]}</h4>
            <div className="price-slider-wrapper">
              <input
                type="range"
                min="0"
                max={maxProductPrice}
                step="0.5"
                value={Math.min(priceRange[1], maxProductPrice)}
                onChange={(e) =>
                  setPriceRange([0, parseFloat(e.target.value)])
                }
              />
              <div className="price-range-labels">
                <span>$0</span>
                <span>${maxProductPrice}</span>
              </div>
            </div>
          </div>

          {/* Checkbox Filters */}
          <div className="filter-group">
            <h4>Preferences</h4>
            <label
              className="custom-checkbox"
              style={{ marginBottom: '0.6rem' }}
            >
              <input
                type="checkbox"
                checked={onlyOrganic}
                onChange={(e) => setOnlyOrganic(e.target.checked)}
              />
              🌱 100% Organic Only
            </label>

            <label className="custom-checkbox">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
              />
              📦 In Stock Only
            </label>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="products-content-area">
          {/* Toolbar */}
          <div className="products-toolbar">
            <div className="results-count">
              Showing <strong>{filteredProducts.length}</strong> items
            </div>

            <div className="toolbar-actions">
              <div className="sort-dropdown">
                <label>Sort By:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="featured">Featured Produce</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div
              style={{
                background: '#fff',
                padding: '4rem 2rem',
                borderRadius: '16px',
                textAlign: 'center',
                border: '1px solid #eee',
              }}
            >
              <span style={{ fontSize: '3rem' }}>🥬</span>
              <h3 style={{ marginTop: '1rem', fontWeight: 700 }}>
                No items match your selected filters
              </h3>
              <p style={{ color: '#777', margin: '0.5rem 0 1.5rem 0' }}>
                Try resetting your search query or price slider.
              </p>
              <button
                type="button"
                className="fc-btn fc-btn-primary"
                onClick={resetFilters}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
