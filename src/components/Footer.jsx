import { Link } from 'react-router-dom'
import {
  FiTruck,
  FiShield,
  FiRotateCcw,
  FiHeadphones,
  FiSend,
} from 'react-icons/fi'

export default function Footer() {
  return (
    <footer className="fc-footer">
      <div className="fresh-container">
        {/* Features */}
        <div className="footer-features">
          <div className="feature-box">
            <FiTruck className="feat-icon" />
            <div className="feat-text">
              <h4>Fast 30-Min Delivery</h4>
              <p>Superfast door delivery in insulated cold bags.</p>
            </div>
          </div>
          <div className="feature-box">
            <FiShield className="feat-icon" />
            <div className="feat-text">
              <h4>100% Organic Quality</h4>
              <p>Handpicked daily from verified pesticide-free farms.</p>
            </div>
          </div>
          <div className="feature-box">
            <FiRotateCcw className="feat-icon" />
            <div className="feat-text">
              <h4>Easy Return & Replacement</h4>
              <p>Not happy with freshness? Instant refund guaranteed.</p>
            </div>
          </div>
          <div className="feature-box">
            <FiHeadphones className="feat-icon" />
            <div className="feat-text">
              <h4>24/7 Customer Care</h4>
              <p>Dedicated support for all your grocery orders.</p>
            </div>
          </div>
        </div>

        {/* Footer Grid */}
        <div className="footer-grid">
          <div className="footer-col">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '1.4rem',
                marginBottom: '1rem',
              }}
            >
              🌿 Fresh<span style={{ color: '#ff9800' }}>Cart</span>
            </div>
            <p>
              Your trusted daily online supermarket for farm-fresh vegetables,
              organic fruits, pure dairy, artisanal bakery, and pantry essentials.
            </p>
          </div>

          <div className="footer-col">
            <h5>Categories</h5>
            <ul>
              <li>
                <Link to="/products">Fresh Vegetables</Link>
              </li>
              <li>
                <Link to="/products">Organic Fruits</Link>
              </li>
              <li>
                <Link to="/products">Dairy & Eggs</Link>
              </li>
              <li>
                <Link to="/products">Artisanal Bakery</Link>
              </li>
              <li>
                <Link to="/products">Cold Juices & Drinks</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Customer Care</h5>
            <ul>
              <li>
                <Link to="/profile">My Account</Link>
              </li>
              <li>
                <Link to="/profile?tab=orders">Order Tracking</Link>
              </li>
              <li>
                <Link to="/cart">Shopping Cart</Link>
              </li>
              <li>
                <Link to="/profile?tab=addresses">Delivery Addresses</Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <div className="copy-text">
            © {new Date().getFullYear()} FreshCart E-Commerce. Built with React & Vite.
          </div>
        </div>
      </div>
    </footer>
  )
}
