
const API_BASE_URL = "http://127.0.0.1:5000/api";

async function request(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export function getProducts() {
  return request("/products");
}

export function getCategories() {
  return request("/categories");
}
