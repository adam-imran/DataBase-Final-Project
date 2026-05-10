const BASE_URL = 'https://database-final-project-ntx0.onrender.com/api'

export async function apiFetch(path) {
  const response = await fetch(`${BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

export default apiFetch
