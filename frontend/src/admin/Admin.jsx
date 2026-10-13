
import { useState } from "react";

const API = "http://127.0.0.1:5000/api";

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f6fa",
    color: "#202333",
    fontFamily: "Arial, sans-serif",
    padding: "24px",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  panel: {
    background: "#fff",
    padding: "24px",
    borderRadius: "14px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    marginBottom: "22px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #d8dbe5",
    borderRadius: "8px",
    margin: "7px 0 14px",
    fontSize: "15px",
  },
  button: {
    padding: "11px 16px",
    border: "none",
    borderRadius: "8px",
    background: "#222438",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    margin: "4px",
  },
  secondaryButton: {
    padding: "10px 14px",
    border: "1px solid #d8dbe5",
    borderRadius: "8px",
    background: "#fff",
    color: "#222438",
    cursor: "pointer",
    margin: "4px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  cell: {
    padding: "12px 8px",
    borderBottom: "1px solid #eceef3",
    verticalAlign: "top",
  },
};

async function apiRequest(endpoint, token, options = {}) {
  const response = await fetch(`${API}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Admin-Token": token } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}

function Admin() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("products");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const emptyProduct = {
    name: "",
    category_id: "",
    price: "",
    mrp: "",
    stock: "",
    image: "",
    is_featured: false,
    is_active: true,
  };

  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState(null);

  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  async function loadData(adminToken = token) {
    setLoading(true);
    setError("");

    try {
      const [productData, categoryData] = await Promise.all([
        apiRequest("/products", adminToken),
        apiRequest("/categories", adminToken),
      ]);

      setProducts(Array.isArray(productData) ? productData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function login(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      // This endpoint must be added to backend/app.py.
      await apiRequest("/admin/verify", token);
      setAuthenticated(true);
      setMessage("Admin login successful.");
      await loadData(token);
    } catch (err) {
      setAuthenticated(false);
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend. Make sure Flask is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setAuthenticated(false);
    setToken("");
    setProducts([]);
    setCategories([]);
    setMessage("");
    setError("");
  }

  async function saveProduct(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const payload = {
      ...productForm,
      category_id: Number(productForm.category_id),
      price: Number(productForm.price),
      mrp: productForm.mrp === "" ? null : Number(productForm.mrp),
      stock: Number(productForm.stock),
      is_featured: Boolean(productForm.is_featured),
      is_active: Boolean(productForm.is_active),
    };

    try {
      const editing = editingProductId !== null;

      await apiRequest(
        editing ? `/products/${editingProductId}` : "/products",
        token,
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setProductForm(emptyProduct);
      setEditingProductId(null);
      setMessage(editing ? "Product updated." : "Product created.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function editProduct(product) {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name || "",
      category_id: String(product.category_id || ""),
      price: String(product.price ?? ""),
      mrp: product.mrp == null ? "" : String(product.mrp),
      stock: String(product.stock ?? 0),
      image: product.image || "",
      is_featured: Boolean(product.is_featured),
      is_active: product.is_active === undefined
        ? true
        : Boolean(product.is_active),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deactivateProduct(product) {
    if (!window.confirm(`Deactivate "${product.name}"?`)) return;

    try {
      await apiRequest(`/products/${product.id}`, token, {
        method: "DELETE",
      });
      setMessage("Product deactivated.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveCategory(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const editing = editingCategoryId !== null;
      const endpoint = editing
        ? `/categories/${editingCategoryId}`
        : "/categories";

      await apiRequest(endpoint, token, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({
          name: categoryName.trim(),
          is_active: true,
        }),
      });

      setCategoryName("");
      setEditingCategoryId(null);
      setMessage(editing ? "Category updated." : "Category created.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deactivateCategory(category) {
    if (
      !window.confirm(
        `Deactivate "${category.name}"? This may affect products in this category.`
      )
    ) {
      return;
    }

    try {
      await apiRequest(`/categories/${category.id}`, token, {
        method: "DELETE",
      });
      setMessage("Category deactivated.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!authenticated) {
    return (
      <main style={styles.page}>
        <section
          style={{
            ...styles.panel,
            maxWidth: "420px",
            margin: "70px auto",
          }}
        >
          <a href="/" style={{ color: "#555", textDecoration: "none" }}>
            ← Back to storefront
          </a>

          <h1 style={{ marginTop: "28px" }}>nRp Kart Admin</h1>
          <p>Sign in to manage products and categories.</p>

          <form onSubmit={login}>
            <label htmlFor="admin-token">Admin token</label>
            <input
              id="admin-token"
              type="password"
              autoComplete="current-password"
              required
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Enter your admin token"
              style={styles.input}
            />

            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.button, width: "100%", margin: 0 }}
            >
              {loading ? "Checking..." : "Sign in"}
            </button>
          </form>

          {error && (
            <p role="alert" style={{ color: "#c62828" }}>
              {error}
            </p>
          )}

          <p style={{ color: "#777", fontSize: "13px", marginTop: "20px" }}>
            Use the ADMIN_TOKEN value from your backend/.env file.
            Never share or commit this token.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <div>
            <a href="/" style={{ color: "#555", textDecoration: "none" }}>
              ← View storefront
            </a>
            <h1>Admin Dashboard</h1>
            <p>Manage your nRp Kart catalogue.</p>
          </div>
          <button style={styles.secondaryButton} onClick={logout}>
            Log out
          </button>
        </header>

        {message && <p style={{ color: "#187044" }}>{message}</p>}
        {error && <p role="alert" style={{ color: "#c62828" }}>{error}</p>}

        <div style={{ marginBottom: "20px" }}>
          <button
            style={tab === "products" ? styles.button : styles.secondaryButton}
            onClick={() => setTab("products")}
          >
            Products
          </button>
          <button
            style={tab === "categories" ? styles.button : styles.secondaryButton}
            onClick={() => setTab("categories")}
          >
            Categories
          </button>
          <button
            style={styles.secondaryButton}
            onClick={() => loadData()}
            disabled={loading}
          >
            Refresh data
          </button>
        </div>

        {loading && <p>Loading catalogue...</p>}

        {tab === "products" && (
          <>
            <section style={styles.panel}>
              <h2>{editingProductId ? "Edit product" : "Add a product"}</h2>

              <form onSubmit={saveProduct}>
                <label>Product name *</label>
                <input
                  required
                  style={styles.input}
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                />

                <label>Category *</label>
                <select
                  required
                  style={styles.input}
                  value={productForm.category_id}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      category_id: e.target.value,
                    })
                  }
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <label>Price (₹) *</label>
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  style={styles.input}
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm({ ...productForm, price: e.target.value })
                  }
                />

                <label>MRP (₹)</label>
                <input
                  min="0"
                  step="0.01"
                  type="number"
                  style={styles.input}
                  value={productForm.mrp}
                  onChange={(e) =>
                    setProductForm({ ...productForm, mrp: e.target.value })
                  }
                />

                <label>Stock quantity *</label>
                <input
                  required
                  min="0"
                  type="number"
                  style={styles.input}
                  value={productForm.stock}
                  onChange={(e) =>
                    setProductForm({ ...productForm, stock: e.target.value })
                  }
                />

                <label>Image URL</label>
                <input
                  type="url"
                  style={styles.input}
                  value={productForm.image}
                  onChange={(e) =>
                    setProductForm({ ...productForm, image: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                />

                <label style={{ display: "block", marginBottom: "12px" }}>
                  <input
                    type="checkbox"
                    checked={productForm.is_featured}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        is_featured: e.target.checked,
                      })
                    }
                  />{" "}
                  Featured product
                </label>

                <button type="submit" style={styles.button}>
                  {editingProductId ? "Save changes" : "Create product"}
                </button>

                {editingProductId && (
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() => {
                      setEditingProductId(null);
                      setProductForm(emptyProduct);
                    }}
                  >
                    Cancel edit
                  </button>
                )}
              </form>
            </section>

            <section style={styles.panel}>
              <h2>Products ({products.length})</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.cell}>Product</th>
                      <th style={styles.cell}>Category</th>
                      <th style={styles.cell}>Price</th>
                      <th style={styles.cell}>Stock</th>
                      <th style={styles.cell}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td style={styles.cell}>{product.name}</td>
                        <td style={styles.cell}>{product.category}</td>
                        <td style={styles.cell}>₹{product.price}</td>
                        <td style={styles.cell}>{product.stock}</td>
                        <td style={styles.cell}>
                          <button
                            style={styles.secondaryButton}
                            onClick={() => editProduct(product)}
                          >
                            Edit
                          </button>
                          <button
                            style={styles.secondaryButton}
                            onClick={() => deactivateProduct(product)}
                          >
                            Deactivate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {tab === "categories" && (
          <>
            <section style={styles.panel}>
              <h2>{editingCategoryId ? "Edit category" : "Add a category"}</h2>
              <form onSubmit={saveCategory}>
                <label>Category name *</label>
                <input
                  required
                  style={styles.input}
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Spiral Notebooks"
                />
                <button type="submit" style={styles.button}>
                  {editingCategoryId ? "Save category" : "Create category"}
                </button>
                {editingCategoryId && (
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() => {
                      setEditingCategoryId(null);
                      setCategoryName("");
                    }}
                  >
                    Cancel
                  </button>
                )}
              </form>
            </section>

            <section style={styles.panel}>
              <h2>Categories ({categories.length})</h2>
              {categories.map((category) => (
                <div
                  key={category.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                    padding: "12px 0",
                    borderBottom: "1px solid #eceef3",
                  }}
                >
                  <span>{category.name}</span>
                  <div>
                    <button
                      style={styles.secondaryButton}
                      onClick={() => {
                        setEditingCategoryId(category.id);
                        setCategoryName(category.name);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      style={styles.secondaryButton}
                      onClick={() => deactivateCategory(category)}
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default Admin;
