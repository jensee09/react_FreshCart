import { useState } from 'react'
import { FiX, FiMapPin, FiNavigation } from 'react-icons/fi'
import { useCart } from '../context/CartContext'
import { useNotification } from '../context/NotificationContext'

export default function LocationModal({ isOpen, onClose }) {
  const { deliveryLocation, setDeliveryLocation } = useCart()
  const { notifySuccess } = useNotification()

  const [city, setCity] = useState(deliveryLocation.city)
  const [zip, setZip] = useState(deliveryLocation.zip)
  const [address, setAddress] = useState(deliveryLocation.address)

  if (!isOpen) return null

  const handleSave = (e) => {
    e.preventDefault()
    setDeliveryLocation({ city, zip, address })
    notifySuccess(`Delivery location updated to ${city} (${zip})!`)
    onClose()
  }

  const handleDetectLocation = () => {
    setCity('San Francisco')
    setZip('94107')
    setAddress('Detecting current GPS location...')
    notifySuccess('GPS Location updated successfully!')
    setTimeout(() => {
      setAddress('742 Evergreen Terrace')
    }, 500)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content-custom"
        style={{ maxWidth: '440px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-custom">
          <h3>
            <FiMapPin style={{ color: '#2e7d32' }} /> Choose Delivery Location
          </h3>
          <button type="button" className="close-modal-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body-custom">
          <button
            type="button"
            className="fc-btn fc-btn-outline-primary"
            style={{ width: '100%', marginBottom: '1.2rem' }}
            onClick={handleDetectLocation}
          >
            <FiNavigation /> Detect My Current Location (GPS)
          </button>

          <div
            style={{
              textAlign: 'center',
              color: '#888',
              fontSize: '0.8rem',
              margin: '0.8rem 0',
              position: 'relative',
            }}
          >
            <span>OR ENTER MANUALLY</span>
          </div>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                className="form-control"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Zip Code / Pincode</label>
              <input
                type="text"
                className="form-control"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Street Address</label>
              <input
                type="text"
                className="form-control"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="fc-btn fc-btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
            >
              Update Location
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
