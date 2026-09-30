import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiX, FiArrowRight, FiUser, FiShield } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'

export default function AuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    register,
  } = useAuth()

  const { notifySuccess, notifyError } = useNotification()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('user')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setName('')
    setRole('user')
  }

  const closeModal = () => {
    setIsAuthModalOpen(false)
    resetForm()
  }

  if (!isAuthModalOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (authModalMode === 'login') {
        if (!email || !password) {
          notifyError('Please enter both email and password')
          setIsSubmitting(false)
          return
        }
        const loggedUser = await login(email, password, role)
        notifySuccess(`Welcome back, ${loggedUser.name}! (${loggedUser.role.toUpperCase()})`)
        if (loggedUser.role === 'admin') navigate('/admin')
        resetForm()
      } else {
        if (!name || !email || !password) {
          notifyError('Please fill in all required fields')
          setIsSubmitting(false)
          return
        }
        const newUser = await register(name, email, password)
        notifySuccess(`Account created successfully! Logged in as ${newUser.name}`)
        resetForm()
      }
    } catch (err) {
      notifyError(err.message || 'Authentication failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={closeModal}
    >
      <div
        className="modal-content-custom"
        style={{ maxWidth: '440px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-custom">
          <h3>
            {authModalMode === 'login'
              ? `${role === 'admin' ? 'Admin' : 'User'} Sign In to FreshCart`
              : 'Create Account'}
          </h3>
          <button
            type="button"
            className="close-modal-btn"
            onClick={closeModal}
          >
            <FiX />
          </button>
        </div>

        <div className="modal-body-custom">
          {authModalMode === 'login' && (
            <div className="auth-role-buttons" role="group" aria-label="Choose account type">
              <button
                type="button"
                className={`auth-role-button ${role === 'user' ? 'active' : ''}`}
                aria-pressed={role === 'user'}
                onClick={() => setRole('user')}
              >
                <FiUser /> User Login
              </button>
              <button
                type="button"
                className={`auth-role-button ${role === 'admin' ? 'active' : ''}`}
                aria-pressed={role === 'admin'}
                onClick={() => setRole('admin')}
              >
                <FiShield /> Admin Login
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {authModalMode === 'register' && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Alex Johnson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="fc-btn fc-btn-primary"
              disabled={isSubmitting}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              {isSubmitting
                ? 'Processing...'
                : authModalMode === 'login'
                ? `Sign In as ${role === 'admin' ? 'Admin' : 'User'}`
                : 'Create Account'}{' '}
              <FiArrowRight />
            </button>
          </form>

          <div
            style={{
              marginTop: '1.5rem',
              textAlign: 'center',
              fontSize: '0.88rem',
              color: '#666',
            }}
          >
            {authModalMode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  style={{ color: '#2e7d32', fontWeight: 700 }}
                  onClick={() => {
                    resetForm()
                    setAuthModalMode('register')
                  }}
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  style={{ color: '#2e7d32', fontWeight: 700 }}
                  onClick={() => {
                    resetForm()
                    setAuthModalMode('login')
                  }}
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
