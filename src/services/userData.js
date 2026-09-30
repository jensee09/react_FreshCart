import axios from 'axios'

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('freshcart_token')
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

export const getUserData = async (userId, dataType) => {
  const { data } = await axios.get(`/api/users/${encodeURIComponent(userId)}/data/${dataType}`)
  if (!Array.isArray(data)) {
    throw new Error(`Invalid ${dataType} response from the server.`)
  }
  return data
}

export const saveUserData = async (userId, dataType, value) => {
  await axios.put(
    `/api/users/${encodeURIComponent(userId)}/data/${dataType}`,
    value
  )
}
