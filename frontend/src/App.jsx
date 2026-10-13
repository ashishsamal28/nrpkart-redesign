
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { getProducts, getCategories } from "./services/api";
import Admin from "./admin/Admin";

const categoryDetails = [
  { name: "Spiral Notebooks", number: "01", icon: "▤", description: "For everyday ideas" },
  { name: "A4 Size Notebooks", number: "02", icon: "▧", description: "Room to think bigger" },
  { name: "King Size", number: "03", icon: "▤", description: "Made for long notes" },
  { name: "Case Bound", number: "04", icon: "▥", description: "A sturdy companion" },
  { name: "Long Size", number: "05", icon: "▤", description: "For every subject" },
];

function Navbar({ search, setSearch }) {
  return (
    <header className="navbar">
      <a className="brand" href="#home" aria-label="nRp Kart home">
        <span className="brand-logo">nRp</span>
      </a>
      <nav className="nav-links">
        <a href="#home">Home</a>
        <a href="#categories">Shop</a>
        <a href="#products">Products</a>
        <a href="#contact">Contact</a>
        <a href="/admin">Admin</a>
      </nav>
      <div className="nav-actions">
        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Search products"
            placeholder="Search notebooks"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <a className="bag-link" href="#products">
          Shop <span>↗</span>
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-copy">
        <div className="eyebrow">
          <span className="eyebrow-dot" />
          QUALITY. AFFORDABILITY. SUSTAINABILITY.
        </div>
        <h1>
          Every Page We Make
          <br />
          Begins With a <em>Promise.</em>
        </h1>
        <p>
          Designed for those who write their own story. Discover notebooks
          made for learning, creating, and bringing your ideas to life.
        </p>
        <div className="hero-actions">
          <a className="button button-dark" href="#products">
            Shop Now <span>↗</span>
          </a>
          <span className="hero-note">Made for your everyday.</span>
        </div>
        <div className="hero-stats">
          <div><strong>Everyday</strong><span>Essentials</span></div>
          <div><strong>Simple</strong><span>Good design</span></div>
          <div><strong>Made for</strong><span>Your ideas</span></div>
        </div>
      </div>
      <div className="hero-visual">
        <img
          className="hero-image"
          src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=90"
          alt="A thoughtfully arranged writing desk"
        />
        <div className="hero-image-shade" />
        <div className="hero-image-label">
          <span>THE EVERYDAY EDIT</span>
          <strong>A little more inspired.</strong>
        </div>
        <div className="floating-note">
          <span className="note-star">✳</span>
          <span>
            <strong>Start somewhere.</strong>
            <small>Your next idea awaits.</small>
          </span>
        </div>
        <div className="image-index">01 / 03</div>
      </div>
    </section>
  );
}

function CategorySection({ activeCategory, setActiveCategory }) {
  return (
    <section className="section categories-section" id="categories">
      <div className="section-heading">
        <div>
          <span className="section-kicker">A PLACE FOR EVERYTHING</span>
          <h2>Find your <em>kind of paper.</em></h2>
        </div>
        <p>Little things that make a big difference.</p>
      </div>
      <div className="category-grid">
        {categoryDetails.map((category) => (
          <button
            key={category.name}
            className={`category-card category-${category.number} ${
              activeCategory === category.name ? "category-active" : ""
            }`}
            onClick={() =>
              setActiveCategory(
                activeCategory === category.name ? "All" : category.name
              )
            }
          >
            <span className="category-number">{category.number}</span>
            <span className="category-icon">{category.icon}</span>
            <span className="category-info">
              <strong>{category.name}</strong>
              <small>{category.description}</small>
            </span>
            <span className="category-arrow">↗</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ProductCard({ product }) {
  return (
    <article className="product-card">
      <div className="product-image">
        <img
          src={product.image || "https://placehold.co/600x600?text=nRp+Notebook"}
          alt={product.name}
          loading="lazy"
        />
        <span className="product-tag">
          {product.stock === 0
            ? "OUT OF STOCK"
            : product.is_featured
              ? "FEATURED"
              : "NOTEBOOK"}
        </span>
        <button
          className="product-arrow"
          aria-label={`View ${product.name}`}
          onClick={() =>
            document.getElementById("contact")?.scrollIntoView({
              behavior: "smooth",
            })
          }
        >
          ↗
        </button>
      </div>
      <div className="product-details">
        <span className="product-category">{product.category}</span>
        <h3>{product.name}</h3>
        <div className="product-price">
          <strong>₹{product.price}</strong>
          {product.mrp != null && <del>₹{product.mrp}</del>}
        </div>
        {product.stock === 0 && (
          <small className="stock-status">Currently unavailable</small>
        )}
      </div>
    </article>
  );
}

function ProductSection({
  products,
  categories,
  search,
  activeCategory,
  setActiveCategory,
  loading,
  apiError,
}) {
  const [sort, setSort] = useState("featured");
  const [priceFilter, setPriceFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const searchText = `${product.name} ${product.category}`.toLowerCase();
      const matchesSearch = searchText.includes(search.trim().toLowerCase());

      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;

      const matchesPrice =
        priceFilter === "all" ||
        (priceFilter === "under60" && product.price < 60) ||
        (priceFilter === "60to100" &&
          product.price >= 60 &&
          product.price <= 100) ||
        (priceFilter === "above100" && product.price > 100);

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "in-stock" && product.stock > 0) ||
        (availabilityFilter === "out-of-stock" && product.stock === 0);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPrice &&
        matchesAvailability
      );
    });

    if (sort === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === "price-high") {
      result.sort((a, b) => b.price - a.price);
    } else if (sort === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "featured") {
      result.sort(
        (a, b) => Number(b.is_featured) - Number(a.is_featured)
      );
    }

    return result;
  }, [products, search, activeCategory, sort, priceFilter, availabilityFilter]);

  function resetFilters() {
    setActiveCategory("All");
    setPriceFilter("all");
    setAvailabilityFilter("all");
    setSort("featured");
  }

  return (
    <section className="section products-section" id="products">
      <div className="section-heading">
        <div>
          <span className="section-kicker">THE GOOD STUFF</span>
          <h2>Desk favourites<span className="heading-period">.</span></h2>
        </div>
        <a className="text-link" href="#categories">
          Find your essentials <span>↗</span>
        </a>
      </div>

      <div
        className="product-toolbar"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: "18px",
        }}
      >
        <div className="filter-chips" aria-label="Filter by category">
          {["All", ...categories.map((category) => category.name)].map(
            (category) => (
              <button
                key={category}
                className={
                  activeCategory === category ? "chip chip-active" : "chip"
                }
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            )
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "12px 18px",
          }}
        >
          <label className="sort-control">
            Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </label>

          <label className="sort-control">
            Price
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
            >
              <option value="all">All prices</option>
              <option value="under60">Under ₹60</option>
              <option value="60to100">₹60–₹100</option>
              <option value="above100">Above ₹100</option>
            </select>
          </label>

          <label className="sort-control">
            Availability
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
            >
              <option value="all">All products</option>
              <option value="in-stock">In stock</option>
              <option value="out-of-stock">Out of stock</option>
            </select>
          </label>

          <button type="button" className="chip" onClick={resetFilters}>
            Clear filters
          </button>
        </div>
      </div>

      {loading && <p>Loading products...</p>}

      {apiError && (
        <p role="alert" className="stock-status">{apiError}</p>
      )}

      <p className="results-count">
        Showing {filteredProducts.length} of {products.length} products
      </p>

      {filteredProducts.length > 0 ? (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
      ) : (
        !loading && (
          <div className="empty-state">
            <span>⌕</span>
            <h3>No products found</h3>
            <p>Try changing your search or filters.</p>
            <button className="button button-dark" onClick={resetFilters}>
              Clear filters
            </button>
          </div>
        )
      )}

      <p className="demo-note">
        Preview collection · Sample products for the prototype
      </p>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer-top">
        <div>
          <a className="brand footer-brand" href="#home">
            nrp<span>kart.</span>
            <small>THOUGHTFULLY YOURS</small>
          </a>
          <p>For your lists, your plans, and everything you dream up.</p>
        </div>
        <a className="footer-back" href="#home">Back to the top ↑</a>
      </div>
      <div className="footer-bottom">
        <span>© 2026 NRP Kart · Prototype</span>
        <span>Made for the love of good ideas.</span>
      </div>
    </footer>
  );
}

function App() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const isAdminPage =
    window.location.pathname.replace(/\/+$/, "") === "/admin";

  useEffect(() => {
    if (isAdminPage) {
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        setApiError("");

        const [productData, categoryData] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);

        setProducts(productData);
        setCategories(categoryData);
      } catch (error) {
        console.error("Failed to load nRp Kart data:", error);
        setApiError("Unable to load products. Please check the backend.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isAdminPage]);

  if (isAdminPage) {
    return <Admin />;
  }

  return (
    <>
      <Navbar search={search} setSearch={setSearch} />
      <main>
        <Hero />
        <CategorySection
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
        <ProductSection
          products={products}
          categories={categories}
          search={search}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          loading={loading}
          apiError={apiError}
        />
      </main>
      <Footer />
    </>
  );
}

export default App;
