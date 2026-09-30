import { useState } from 'react'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export default function ImageUploadField({
  label,
  value,
  onChange,
  circular = false,
}) {
  const [error, setError] = useState('')

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.')
      event.target.value = ''
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image must be 5 MB or smaller.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result)
        setError('')
      } else {
        setError('Could not read the selected image.')
      }
    }
    reader.onerror = () => setError('Could not read the selected image.')
    reader.readAsDataURL(file)
  }

  return (
    <div className="form-group">
      <label>{label}</label>
      {value && (
        <img
          src={value}
          alt="Selected upload preview"
          style={{
            width: circular ? '88px' : '180px',
            height: circular ? '88px' : '110px',
            objectFit: 'cover',
            borderRadius: circular ? '50%' : '8px',
            display: 'block',
            marginBottom: '0.65rem',
          }}
        />
      )}
      <input
        type="file"
        className="form-control"
        accept="image/*"
        onChange={handleFileChange}
      />
      <small className="form-text">Select an image up to 5 MB.</small>
      {error && <small className="image-upload-error">{error}</small>}
    </div>
  )
}
