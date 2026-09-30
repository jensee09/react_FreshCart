import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react'
import axios from 'axios'
import { PRODUCTS, CATEGORIES } from '../services/mockData'

const ProductContext = createContext()

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch Products & Categories from MySQL Database
  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/products')
      if (Array.isArray(res.data)) {
        setProducts(res.data)
      }
    } catch (err) {
      console.warn('Failed to load products from MySQL. Falling back to mock data:', err)
      setProducts(PRODUCTS)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories')
      if (Array.isArray(res.data)) {
        setCategories(res.data)
      }
    } catch (err) {
      console.warn('Failed to load categories from MySQL. Falling back to mock data:', err)
      setCategories(CATEGORIES)
    }
  }

  useEffect(() => {
    setIsLoading(true)
    Promise.all([fetchProducts(), fetchCategories()]).finally(() => setIsLoading(false))
  }, [])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceRange, setPriceRange] = useState([0, 50])
  const [onlyOrganic, setOnlyOrganic] = useState(false)
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [sortBy, setSortBy] = useState('featured') // 'featured' | 'price-low' | 'price-high' | 'rating'

  // Quick View Modal product
  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const maxProductPrice = Math.max(
    1,
    Math.ceil(Math.max(0, ...products.map((product) => Number(product.price) || 0)))
  )
  const previousMaxPrice = useRef(maxProductPrice)

  useEffect(() => {
    if (isLoading) return
    if (
      (priceRange[1] === previousMaxPrice.current || priceRange[1] === 50) &&
      priceRange[1] !== maxProductPrice
    ) {
      setPriceRange([priceRange[0], maxProductPrice])
    }
    previousMaxPrice.current = maxProductPrice
  }, [isLoading, maxProductPrice, priceRange])

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const selectedCategoryRecord = categories.find(
          (category) => category.id === selectedCategory || category.slug === selectedCategory
        )
        const productCategory = String(product.category || '').toLowerCase()
        const selectedCategoryValues = [
          selectedCategory,
          selectedCategoryRecord?.id,
          selectedCategoryRecord?.slug,
        ]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase())
        const matchesCategory =
          selectedCategory === 'all' ||
          selectedCategoryValues.includes(productCategory)

        const matchesSearch =
          (product.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.categoryName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.description || '').toLowerCase().includes(searchQuery.toLowerCase())

        const matchesPrice =
          product.price >= priceRange[0] && product.price <= priceRange[1]

        const matchesOrganic = !onlyOrganic || product.isOrganic

        const matchesStock = !onlyInStock || product.inStock

        return (
          matchesCategory &&
          matchesSearch &&
          matchesPrice &&
          matchesOrganic &&
          matchesStock
        )
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price
        if (sortBy === 'price-high') return b.price - a.price
        if (sortBy === 'rating') return b.rating - a.rating
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)
      })
  }, [
    products,
    categories,
    selectedCategory,
    searchQuery,
    priceRange,
    onlyOrganic,
    onlyInStock,
    sortBy,
  ])

  const resetFilters = () => {
    setSelectedCategory('all')
    setSearchQuery('')
    setPriceRange([0, maxProductPrice])
    setOnlyOrganic(false)
    setOnlyInStock(false)
    setSortBy('featured')
  }

  // --- Category CRUD Operations (MySQL) ---
  const addCategory = async (catData) => {
    try {
      const res = await axios.post('/api/categories', catData)
      await fetchCategories()
      return res.data
    } catch (err) {
      console.error('Error adding category to MySQL:', err)
      throw new Error(err.response?.data?.error || 'Failed to add category to MySQL database.')
    }
  }

  const updateCategory = async (id, catData) => {
    try {
      const res = await axios.put(`/api/categories/${id}`, catData)
      await fetchCategories()
      return res.data
    } catch (err) {
      console.error('Error updating category in MySQL:', err)
      throw new Error(err.response?.data?.error || 'Failed to update category in MySQL database.')
    }
  }

  const deleteCategory = async (id) => {
    try {
      const res = await axios.delete(`/api/categories/${id}`)
      await fetchCategories()
      return res.data
    } catch (err) {
      console.error('Error deleting category from MySQL:', err)
      throw new Error(err.response?.data?.error || 'Failed to delete category from MySQL database.')
    }
  }

  // --- Product CRUD Operations (MySQL) ---
  const addProduct = async (newProduct) => {
    try {
      const res = await axios.post('/api/products', newProduct)
      await fetchProducts()
      return res.data
    } catch (err) {
      console.error('Error adding product to MySQL:', err)
      throw new Error(err.response?.data?.error || 'Failed to add product to MySQL database.')
    }
  }

  const updateProductStock = async (id, newStock) => {
    try {
      await axios.put(`/api/products/${id}/stock`, { stockCount: newStock })
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, stockCount: newStock, inStock: newStock > 0 } : p
        )
      )
    } catch (err) {
      console.error('Error updating stock in MySQL:', err)
      throw new Error(err.response?.data?.error || 'Failed to update stock in MySQL database.')
    }
  }

  const updateProduct = async (id, updatedProduct) => {
    try {
      const res = await axios.put(`/api/products/${id}`, updatedProduct)
      await fetchProducts()
      return res.data
    } catch (err) {
      console.error('Error updating product in MySQL:', err)
      throw new Error(err.response?.data?.error || 'Failed to update product in MySQL database.')
    }
  }

  const deleteProduct = async (id) => {
    try {
      const res = await axios.delete(`/api/products/${id}`)
      await fetchProducts()
      return res.data
    } catch (err) {
      console.error('Error deleting product from MySQL:', err)
      throw new Error(err.response?.data?.error || 'Failed to delete product from MySQL database.')
    }
  }

  return (
    <ProductContext.Provider
      value={{
        products,
        categories,
        isLoading,
        filteredProducts,
        searchQuery,
        setSearchQuery,
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
        quickViewProduct,
        setQuickViewProduct,
        // Categories CRUD
        addCategory,
        updateCategory,
        deleteCategory,
        fetchCategories,
        // Products CRUD
        addProduct,
        updateProductStock,
        updateProduct,
        deleteProduct,
        fetchProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  )
}

export const useProducts = () => {
  const context = useContext(ProductContext)
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider')
  }
  return context
}
