// Format currency in Indian Rupees or USD
export const formatCurrency = (amount, currency = 'USD') => {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount)
}

// Calculate discount percentage
export const calculateDiscount = (originalPrice, salePrice) => {
  if (!originalPrice || !salePrice || originalPrice <= salePrice) return 0
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100)
}

// Format date string
export const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

// Truncate text
export const truncateText = (text, maxLength = 60) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
