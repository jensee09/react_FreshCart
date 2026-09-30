import { Link, useSearchParams } from 'react-router-dom'
import { FiCheckCircle, FiClock, FiTruck, FiHome } from 'react-icons/fi'

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId') || 'ORD-984210'

  return (
    <div
      className="fresh-container page-wrapper"
      style={{ paddingTop: '3rem', textAlign: 'center' }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '3.5rem 2rem',
          maxWidth: '560px',
          margin: '0 auto',
          border: '1px solid #eee',
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
        }}
      >
        <FiCheckCircle
          style={{ fontSize: '4.5rem', color: '#2e7d32', marginBottom: '1rem' }}
        />
        <h1 style={{ fontWeight: 800, fontSize: '2rem', color: '#1b5e20' }}>
          Order Confirmed!
        </h1>
        <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '1rem' }}>
          Thank you for choosing FreshCart. Your order has been placed successfully and is being packed.
        </p>

        <div
          style={{
            background: '#f1f8e9',
            borderRadius: '12px',
            padding: '1.2rem',
            margin: '1.8rem 0',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#555' }}>Order Number:</span>
            <strong style={{ color: '#2e7d32' }}>{orderId}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#555' }}>Estimated Delivery:</span>
            <strong>30 Mins (Express Cold Delivery)</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#555' }}>Payment Method:</span>
            <strong>Cash / Card on Delivery</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/profile?tab=orders" className="fc-btn fc-btn-primary">
            <FiTruck /> Track Order
          </Link>
          <Link to="/" className="fc-btn fc-btn-outline-secondary">
            <FiHome /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
