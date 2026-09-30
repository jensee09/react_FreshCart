import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  FiDollarSign,
  FiShoppingBag,
  FiBox,
  FiAlertTriangle,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiGrid,
  FiShield,
  FiLock,
} from 'react-icons/fi'
import { useProducts } from '../context/ProductContext'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { formatCurrency } from '../utils/formatters'
import ImageUploadField from '../components/ImageUploadField'

export default function AdminDashboardPage() {
  const { isAdmin, user, openLoginModal } = useAuth()
  const {
    products,
    categories,
    updateProductStock,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useProducts()

  const { notifySuccess, notifyError } = useNotification()

  // Navigation Tab inside Admin Dashboard: 'products' | 'categories'
  const [adminTab, setAdminTab] = useState('products')
  const [summary, setSummary] = useState({ revenue: 0, orderCount: 0 })

  useEffect(() => {
    if (!isAdmin) return
    axios.get('/api/admin/summary')
      .then(({ data }) => setSummary(data))
      .catch((error) => {
        notifyError(error.response?.data?.error || 'Could not load dashboard totals.')
      })
  }, [isAdmin, notifyError])

  // --- Product Modals State ---
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [prodName, setProdName] = useState('')
  const [prodCategory, setProdCategory] = useState(categories[0]?.slug || 'veg')
  const [prodPrice, setProdPrice] = useState('3.99')
  const [prodStock, setProdStock] = useState('50')
  const [prodImage, setProdImage] = useState('')
  const [prodDesc, setProdDesc] = useState('')

  const [editingProduct, setEditingProduct] = useState(null)
  const [editProdName, setEditProdName] = useState('')
  const [editProdCategory, setEditProdCategory] = useState('veg')
  const [editProdPrice, setEditProdPrice] = useState('')
  const [editProdStock, setEditProdStock] = useState('')
  const [editProdImage, setEditProdImage] = useState('')
  const [editProdDesc, setEditProdDesc] = useState('')

  const [deletingProduct, setDeletingProduct] = useState(null)

  // --- Category Modals State ---
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [catName, setCatName] = useState('')
  const [catIcon, setCatIcon] = useState('🌱')
  const [catImage, setCatImage] = useState('')

  const [editingCategory, setEditingCategory] = useState(null)
  const [editCatName, setEditCatName] = useState('')
  const [editCatIcon, setEditCatIcon] = useState('')
  const [editCatImage, setEditCatImage] = useState('')

  const [deletingCategory, setDeletingCategory] = useState(null)

  // Access Control Guard
  if (!isAdmin) {
    return (
      <div className="fresh-container page-wrapper" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto', background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid #ffebee' }}>
          <FiLock style={{ fontSize: '3.5rem', color: '#d32f2f', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.6rem', color: '#333', marginBottom: '0.8rem' }}>Access Restricted (Admin Only)</h2>
          <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Only store administrators have authorization to add, edit, or delete products and categories in the MySQL database.
          </p>
          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
            <button type="button" className="fc-btn fc-btn-primary" onClick={openLoginModal}>
              Sign In as Admin
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- Product Submit Handlers ---
  const handleAddProductSubmit = async (e) => {
    e.preventDefault()
    if (!prodName || !prodPrice || !prodStock || !prodImage) {
      notifyError('Please complete all required fields and upload a product image.')
      return
    }

    const selectedCatObj = categories.find((c) => c.slug === prodCategory || c.id === prodCategory)
    const categoryName = selectedCatObj ? selectedCatObj.name : 'Fresh Produce'
    const categorySlug = selectedCatObj ? (selectedCatObj.slug || selectedCatObj.id) : prodCategory

    try {
      await addProduct({
        name: prodName,
        category: categorySlug,
        categoryName,
        price: parseFloat(prodPrice),
        originalPrice: parseFloat(prodPrice) * 1.25,
        weight: '500g',
        stockCount: parseInt(prodStock),
        image: prodImage,
        description: prodDesc || 'Fresh quality produce harvested daily.',
        isOrganic: true,
        isFeatured: true,
      })
      notifySuccess(`Product "${prodName}" added!`)
      setProdName('')
      setProdPrice('3.99')
      setProdStock('50')
      setProdDesc('')
      setProdImage('')
      setShowAddProductModal(false)
    } catch (err) {
      notifyError(err.message || 'Failed to add product.')
    }
  }

  const handleOpenEditProductModal = (product) => {
    setEditingProduct(product)
    setEditProdName(product.name || '')
    setEditProdCategory(product.category || (categories[0]?.slug || 'veg'))
    setEditProdPrice(product.price ? product.price.toString() : '0')
    setEditProdStock(product.stockCount !== undefined ? product.stockCount.toString() : '0')
    setEditProdImage(product.image || '')
    setEditProdDesc(product.description || '')
  }

  const handleEditProductSubmit = async (e) => {
    e.preventDefault()
    if (!editProdName || !editProdPrice || editProdStock === '') {
      notifyError('Please fill in all required fields')
      return
    }

    const selectedCatObj = categories.find((c) => c.slug === editProdCategory || c.id === editProdCategory)
    const categoryName = selectedCatObj ? selectedCatObj.name : 'Fresh Produce'

    try {
      await updateProduct(editingProduct.id, {
        name: editProdName,
        category: editProdCategory,
        categoryName,
        price: parseFloat(editProdPrice),
        originalPrice: parseFloat(editProdPrice) * 1.25,
        stockCount: parseInt(editProdStock),
        image: editProdImage,
        description: editProdDesc,
      })
      notifySuccess(`Product "${editProdName}" updated in MySQL database!`)
      setEditingProduct(null)
    } catch (err) {
      notifyError(err.message || 'Failed to update product.')
    }
  }

  const handleDeleteProductConfirm = async () => {
    if (!deletingProduct) return
    try {
      await deleteProduct(deletingProduct.id)
      notifySuccess(`Product "${deletingProduct.name}" deleted from MySQL database.`)
      setDeletingProduct(null)
    } catch (err) {
      notifyError(err.message || 'Failed to delete product.')
    }
  }

  // --- Category Submit Handlers ---
  const handleAddCategorySubmit = async (e) => {
    e.preventDefault()
    if (!catName || !catImage) {
      notifyError('Category name and an uploaded category image are required.')
      return
    }

    try {
      await addCategory({
        name: catName,
        icon: catIcon || '🌱',
        image: catImage,
      })
      notifySuccess(`Category "${catName}" added!`)
      setCatName('')
      setCatIcon('🌱')
      setCatImage('')
      setShowAddCategoryModal(false)
    } catch (err) {
      notifyError(err.message || 'Failed to add category.')
    }
  }

  const handleOpenEditCategoryModal = (cat) => {
    setEditingCategory(cat)
    setEditCatName(cat.name || '')
    setEditCatIcon(cat.icon || '🌱')
    setEditCatImage(cat.image || '')
  }

  const handleEditCategorySubmit = async (e) => {
    e.preventDefault()
    if (!editCatName) {
      notifyError('Category name is required.')
      return
    }

    try {
      await updateCategory(editingCategory.id, {
        name: editCatName,
        icon: editCatIcon,
        image: editCatImage,
      })
      notifySuccess(`Category "${editCatName}" updated in MySQL database!`)
      setEditingCategory(null)
    } catch (err) {
      notifyError(err.message || 'Failed to update category.')
    }
  }

  const handleDeleteCategoryConfirm = async () => {
    if (!deletingCategory) return
    try {
      await deleteCategory(deletingCategory.id)
      notifySuccess(`Category "${deletingCategory.name}" deleted from MySQL database.`)
      setDeletingCategory(null)
    } catch (err) {
      notifyError(err.message || 'Failed to delete category.')
    }
  }

  const lowStockProducts = products.filter((p) => p.stockCount <= 20)

  return (
    <div className="fresh-container page-wrapper admin-dashboard">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1b5e20', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            ⚡ Admin Control Panel
          </h1>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: '0.2rem 0 0' }}>
            Logged in as <strong>{user?.name}</strong> (Administrator)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          {adminTab === 'products' ? (
            <button
              type="button"
              className="fc-btn fc-btn-primary"
              onClick={() => setShowAddProductModal(true)}
            >
              <FiPlus /> Add New Product
            </button>
          ) : (
            <button
              type="button"
              className="fc-btn fc-btn-primary"
              onClick={() => setShowAddCategoryModal(true)}
            >
              <FiPlus /> Add New Category
            </button>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="admin-metrics-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="metric-card">
          <div className="metric-info">
            <span>Total Categories</span>
            <h3>{categories.length} Categories</h3>
          </div>
          <div className="metric-icon" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
            <FiGrid />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span>Active Products</span>
            <h3>{products.length} Products</h3>
          </div>
          <div className="metric-icon" style={{ background: '#fff3e0', color: '#e65100' }}>
            <FiBox />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span>Low Stock Alert</span>
            <h3>{lowStockProducts.length} Items</h3>
          </div>
          <div className="metric-icon" style={{ background: '#ffebee', color: '#d32f2f' }}>
            <FiAlertTriangle />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span>Total Revenue</span>
            <h3>{formatCurrency(summary.revenue)}</h3>
            <small>{summary.orderCount} orders</small>
          </div>
          <div className="metric-icon" style={{ background: '#e1f5fe', color: '#0288d1' }}>
            <FiDollarSign />
          </div>
        </div>
      </div>

      {/* Switch Admin Tab Bar */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #eee', marginBottom: '1.5rem' }}>
        <button
          type="button"
          style={{
            padding: '0.8rem 1.2rem',
            border: 'none',
            background: 'none',
            fontWeight: 700,
            fontSize: '1.05rem',
            cursor: 'pointer',
            borderBottom: adminTab === 'products' ? '3px solid #2e7d32' : '3px solid transparent',
            color: adminTab === 'products' ? '#2e7d32' : '#666',
          }}
          onClick={() => setAdminTab('products')}
        >
          📦 Product Management ({products.length})
        </button>
        <button
          type="button"
          style={{
            padding: '0.8rem 1.2rem',
            border: 'none',
            background: 'none',
            fontWeight: 700,
            fontSize: '1.05rem',
            cursor: 'pointer',
            borderBottom: adminTab === 'categories' ? '3px solid #2e7d32' : '3px solid transparent',
            color: adminTab === 'categories' ? '#2e7d32' : '#666',
          }}
          onClick={() => setAdminTab('categories')}
        >
          🌱 Category Management ({categories.length})
        </button>
      </div>

      {/* --- TAB 1: PRODUCT MANAGEMENT --- */}
      {adminTab === 'products' && (
        <div className="admin-table-card">
          <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Products Catalog</h3>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>Stored dynamically in `fresh_cart.products`</span>
          </div>

          <table className="cart-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock Status</th>
                <th>Update Stock</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="item-cell">
                      <img src={p.image} alt={p.name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                      <div className="item-name" style={{ fontWeight: 600 }}>{p.name}</div>
                    </div>
                  </td>
                  <td>
                    <span style={{ background: '#f5f5f5', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.82rem' }}>
                      {p.categoryName || p.category}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#2e7d32' }}>{formatCurrency(p.price)}</td>
                  <td>
                    <span
                      className={`order-status-pill ${
                        p.stockCount > 20
                          ? 'delivered'
                          : p.stockCount > 0
                          ? 'processing'
                          : 'shipped'
                      }`}
                    >
                      {p.stockCount} in stock
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="fc-btn fc-btn-outline-secondary fc-btn-sm"
                        onClick={async () => {
                          await updateProductStock(p.id, Math.max(0, p.stockCount - 10))
                          notifySuccess(`Decreased stock for ${p.name}`)
                        }}
                      >
                        -10
                      </button>
                      <button
                        type="button"
                        className="fc-btn fc-btn-primary fc-btn-sm"
                        onClick={async () => {
                          await updateProductStock(p.id, p.stockCount + 20)
                          notifySuccess(`Added +20 stock for ${p.name}`)
                        }}
                      >
                        +20
                      </button>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="fc-btn fc-btn-outline-primary fc-btn-sm"
                        onClick={() => handleOpenEditProductModal(p)}
                      >
                        <FiEdit /> Edit
                      </button>
                      <button
                        type="button"
                        className="fc-btn fc-btn-outline-danger fc-btn-sm"
                        onClick={() => setDeletingProduct(p)}
                      >
                        <FiTrash2 /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#888' }}>
                    No products found. Click "Add New Product" above to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- TAB 2: CATEGORY MANAGEMENT --- */}
      {adminTab === 'categories' && (
        <div className="admin-table-card">
          <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Categories Directory</h3>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>Stored dynamically in `fresh_cart.categories`</span>
          </div>

          <table className="cart-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Category Icon & Name</th>
                <th>Slug Identifier</th>
                <th>Cover Image</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{c.icon || '🌱'}</span>
                      <strong style={{ fontSize: '1rem', color: '#333' }}>{c.name}</strong>
                    </div>
                  </td>
                  <td>
                    <code style={{ background: '#f0f0f0', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                      {c.slug || c.id}
                    </code>
                  </td>
                  <td>
                    <img src={c.image} alt={c.name} style={{ width: '60px', height: '40px', padding: '2px',borderRadius: '6px', objectFit: 'cover' }} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="fc-btn fc-btn-outline-primary fc-btn-sm"
                        onClick={() => handleOpenEditCategoryModal(c)}
                      >
                        <FiEdit /> Edit
                      </button>
                      <button
                        type="button"
                        className="fc-btn fc-btn-outline-danger fc-btn-sm"
                        onClick={() => setDeletingCategory(c)}
                      >
                        <FiTrash2 /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2.5rem', color: '#888' }}>
                    No categories found. Click "Add New Category" above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- ADD PRODUCT MODAL --- */}
      {showAddProductModal && (
        <div className="modal-backdrop" onClick={() => setShowAddProductModal(false)}>
          <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h3>Add New Product</h3>
              <button type="button" className="close-modal-btn" onClick={() => setShowAddProductModal(false)}>✕</button>
            </div>
            <div className="modal-body-custom">
              <form onSubmit={handleAddProductSubmit}>
                <div className="form-group">
                  <label>Product Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Organic Strawberries"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Category (Loaded...)</label>
                    <select
                      className="form-control"
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug || c.id}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Initial Stock Units</label>
                  <input
                    type="number"
                    className="form-control"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    required
                  />
                </div>

                <ImageUploadField label="Product Image" value={prodImage} onChange={setProdImage} />

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    placeholder="Describe product details..."
                  />
                </div>

                <button type="submit" className="fc-btn fc-btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                  Publish Product
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT PRODUCT MODAL --- */}
      {editingProduct && (
        <div className="modal-backdrop" onClick={() => setEditingProduct(null)}>
          <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h3>Edit Product</h3>
              <button type="button" className="close-modal-btn" onClick={() => setEditingProduct(null)}>✕</button>
            </div>
            <div className="modal-body-custom">
              <form onSubmit={handleEditProductSubmit}>
                <div className="form-group">
                  <label>Product Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editProdName}
                    onChange={(e) => setEditProdName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      className="form-control"
                      value={editProdCategory}
                      onChange={(e) => setEditProdCategory(e.target.value)}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug || c.id}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={editProdPrice}
                      onChange={(e) => setEditProdPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Stock Count</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editProdStock}
                    onChange={(e) => setEditProdStock(e.target.value)}
                    required
                  />
                </div>

                <ImageUploadField label="Product Image" value={editProdImage} onChange={setEditProdImage} />

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={editProdDesc}
                    onChange={(e) => setEditProdDesc(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.2rem' }}>
                  <button type="button" className="fc-btn fc-btn-outline-secondary" style={{ flex: 1 }} onClick={() => setEditingProduct(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="fc-btn fc-btn-primary" style={{ flex: 1 }}>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE PRODUCT MODAL --- */}
      {deletingProduct && (
        <div className="modal-backdrop" onClick={() => setDeletingProduct(null)}>
          <div className="modal-content-custom" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h3 style={{ color: '#dc3545', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiTrash2 /> Delete Product
              </h3>
              <button type="button" className="close-modal-btn" onClick={() => setDeletingProduct(null)}>✕</button>
            </div>
            <div className="modal-body-custom">
              <p style={{ fontSize: '0.95rem', color: '#555', marginBottom: '1.5rem' }}>
                Are you sure you want to permanently delete <strong>"{deletingProduct.name}"</strong>
              </p>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button type="button" className="fc-btn fc-btn-outline-secondary" style={{ flex: 1 }} onClick={() => setDeletingProduct(null)}>
                  Cancel
                </button>
                <button type="button" className="fc-btn fc-btn-danger" style={{ flex: 1 }} onClick={handleDeleteProductConfirm}>
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD CATEGORY MODAL --- */}
      {showAddCategoryModal && (
        <div className="modal-backdrop" onClick={() => setShowAddCategoryModal(false)}>
          <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h3>Add New Category</h3>
              <button type="button" className="close-modal-btn" onClick={() => setShowAddCategoryModal(false)}>✕</button>
            </div>
            <div className="modal-body-custom">
              <form onSubmit={handleAddCategorySubmit}>
                <div className="form-group">
                  <label>Category Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Organic Beverages"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category Emoji / Icon</label>
                  <input
                    type="text"
                    className="form-control"
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value)}
                    placeholder="e.g. 🧃"
                  />
                </div>

                <ImageUploadField label="Category Cover Image" value={catImage} onChange={setCatImage} />

                <button type="submit" className="fc-btn fc-btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                  Save Category
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT CATEGORY MODAL --- */}
      {editingCategory && (
        <div className="modal-backdrop" onClick={() => setEditingCategory(null)}>
          <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h3>Edit Category</h3>
              <button type="button" className="close-modal-btn" onClick={() => setEditingCategory(null)}>✕</button>
            </div>
            <div className="modal-body-custom">
              <form onSubmit={handleEditCategorySubmit}>
                <div className="form-group">
                  <label>Category Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category Emoji / Icon</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editCatIcon}
                    onChange={(e) => setEditCatIcon(e.target.value)}
                  />
                </div>

                <ImageUploadField label="Category Cover Image" value={editCatImage} onChange={setEditCatImage} />

                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.2rem' }}>
                  <button type="button" className="fc-btn fc-btn-outline-secondary" style={{ flex: 1 }} onClick={() => setEditingCategory(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="fc-btn fc-btn-primary" style={{ flex: 1 }}>
                    Save Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CATEGORY MODAL --- */}
      {deletingCategory && (
        <div className="modal-backdrop" onClick={() => setDeletingCategory(null)}>
          <div className="modal-content-custom" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h3 style={{ color: '#dc3545', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiTrash2 /> Delete Category
              </h3>
              <button type="button" className="close-modal-btn" onClick={() => setDeletingCategory(null)}>✕</button>
            </div>
            <div className="modal-body-custom">
              <p style={{ fontSize: '0.95rem', color: '#555', marginBottom: '1.5rem' }}>
                Are you sure you want to permanently delete category <strong>"{deletingCategory.name}"</strong>
              </p>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button type="button" className="fc-btn fc-btn-outline-secondary" style={{ flex: 1 }} onClick={() => setDeletingCategory(null)}>
                  Cancel
                </button>
                <button type="button" className="fc-btn fc-btn-danger" style={{ flex: 1 }} onClick={handleDeleteCategoryConfirm}>
                  Delete Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
