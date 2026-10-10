
import { useMemo, useState } from "react";
import "./App.css";

const categories = [
  { name: "Notebooks", number: "01", icon: "▤", description: "Ideas start here" },
  { name: "Writing", number: "02", icon: "✳", description: "Make every mark count" },
  { name: "Paper & Files", number: "03", icon: "▧", description: "Keep it organised" },
];

const products = [
  {
    id: 1,
    name: "Classic Hardcover Journal",
    category: "Notebooks",
    price: 249,
    mrp: 299,
    tag: "BESTSELLER",
    image:
      "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=700&q=85",
    color: "sand",
  },
  {
    id: 2,
    name: "Everyday Writing Set",
    category: "Writing",
    price: 149,
    mrp: 199,
    tag: "EVERYDAY ESSENTIAL",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=700&q=85",
    color: "sage",
  },
  {
    id: 3,
    name: "Minimal Study Notebook",
    category: "Notebooks",
    price: 129,
    mrp: 159,
    tag: "STUDENT PICK",
    image:
      "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=700&q=85",
    color: "rose",
  },
  {
    id: 4,
    name: "Creative Desk Essentials",
    category: "Paper & Files",
    price: 199,
    mrp: 249,
    tag: "STAFF FAVOURITE",
    image:
      "https://images.unsplash.com/photo-1453738773917-9c3eff1db985?auto=format&fit=crop&w=700&q=85",
    color: "blue",
  },
];

function Navbar({ search, setSearch }) {
  return (
    <header className="navbar">
      <a className="brand" href="#home" aria-label="NRP Kart home">
        nrp<span>kart.</span>
        <small>THOUGHTFULLY YOURS</small>
      </a>

      <nav className="nav-links">
        <a href="#home">Home</a>
        <a href="#categories">Categories</a>
        <a href="#products">Shop all</a>
      </nav>

      <div className="nav-actions">
        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Search products"
            placeholder="Find your essentials"
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
          YOUR DESK, YOUR WORLD
        </div>

        <h1>
          Make room
          <br />
          for <em>good ideas.</em>
        </h1>

        <p>
          Thoughtful stationery for big plans, little notes,
          and everything in between.
        </p>

        <div className="hero-actions">
          <a className="button button-dark" href="#products">
            Explore the collection <span>↗</span>
          </a>
          <span className="hero-note">Made for your everyday.</span>
        </div>

        <div className="hero-stats">
          <div>
            <strong>Everyday</strong>
            <span>Essentials</span>
          </div>
          <div>
            <strong>Simple</strong>
            <span>Good design</span>
          </div>
          <div>
            <strong>Made for</strong>
            <span>Your ideas</span>
          </div>
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
        {categories.map((category) => (
          <button
            className={`category-card category-${category.number} ${
              activeCategory === category.name ? "category-active" : ""
            }`}
            key={category.name}
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
      <div className={`product-image product-${product.color}`}>
        <img src={product.image} alt={product.name} loading="lazy" />
        <span className="product-tag">{product.tag}</span>
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
          <del>₹{product.mrp}</del>
        </div>
      </div>
    </article>
  );
}

function ProductSection({ search, activeCategory, setActiveCategory }) {
  const [sort, setSort] = useState("featured");

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const matchesSearch = `${product.name} ${product.category}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;

      return matchesSearch && matchesCategory;
    });

    if (sort === "low") result.sort((a, b) => a.price - b.price);
    if (sort === "high") result.sort((a, b) => b.price - a.price);
    if (sort === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [search, activeCategory, sort]);

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

      <div className="product-toolbar">
        <div className="filter-chips" aria-label="Filter by category">
          {["All", "Notebooks", "Writing", "Paper & Files"].map((category) => (
            <button
              key={category}
              className={activeCategory === category ? "chip chip-active" : "chip"}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <label className="sort-control">
          Sort by
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="featured">Featured</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
            <option value="name">Name: A to Z</option>
          </select>
        </label>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span>⌕</span>
          <h3>No products found</h3>
          <p>Try another search or browse the full collection.</p>
          <button
            className="button button-dark"
            onClick={() => {
              setActiveCategory("All");
              document.querySelector(".search-box input")?.focus();
            }}
          >
            Clear category filter
          </button>
        </div>
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
        <a className="footer-back" href="#home">
          Back to the top ↑
        </a>
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
          search={search}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
      </main>
      <Footer />
    </>
  );
}

export default App;
