
from flask import Flask, jsonify, request
from flask_cors import CORS
from database import get_db_connection, init_db

app = Flask(__name__)
CORS(app)


@app.get("/")
def home():
    return jsonify({"message": "nRp Kart API is running"})


@app.get("/api/categories")
def get_categories():
    connection = get_db_connection()
    categories = connection.execute(
        "SELECT * FROM categories WHERE is_active = 1 ORDER BY name"
    ).fetchall()
    connection.close()
    return jsonify([dict(row) for row in categories])


@app.post("/api/categories")
def create_category():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()

    if not name:
        return jsonify({"error": "Category name is required"}), 400

    connection = get_db_connection()
    try:
        cursor = connection.execute(
            "INSERT INTO categories (name, description) VALUES (?, ?)",
            (name, data.get("description", "").strip())
        )
        connection.commit()
        category = connection.execute(
            "SELECT * FROM categories WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
        return jsonify(dict(category)), 201
    except Exception as error:
        connection.rollback()
        return jsonify({"error": "Could not create category. Name may already exist."}), 400
    finally:
        connection.close()


@app.patch("/api/categories/<int:category_id>")
def update_category(category_id):
    data = request.get_json(silent=True) or {}
    allowed = {"name", "description", "is_active"}

    if not data or not set(data).issubset(allowed):
        return jsonify({"error": "Provide name, description, or is_active"}), 400

    connection = get_db_connection()
    category = connection.execute(
        "SELECT * FROM categories WHERE id = ?", (category_id,)
    ).fetchone()

    if category is None:
        connection.close()
        return jsonify({"error": "Category not found"}), 404

    name = data.get("name", category["name"])
    if not isinstance(name, str) or not name.strip():
        connection.close()
        return jsonify({"error": "Category name cannot be empty"}), 400

    connection.execute(
        """UPDATE categories
           SET name = ?, description = ?, is_active = ?
           WHERE id = ?""",
        (
            name.strip(),
            data.get("description", category["description"]),
            data.get("is_active", category["is_active"]),
            category_id
        )
    )
    connection.commit()
    updated = connection.execute(
        "SELECT * FROM categories WHERE id = ?", (category_id,)
    ).fetchone()
    connection.close()
    return jsonify(dict(updated))


@app.delete("/api/categories/<int:category_id>")
def deactivate_category(category_id):
    connection = get_db_connection()
    category = connection.execute(
        "SELECT id FROM categories WHERE id = ?", (category_id,)
    ).fetchone()

    if category is None:
        connection.close()
        return jsonify({"error": "Category not found"}), 404

    connection.execute(
        "UPDATE categories SET is_active = 0 WHERE id = ?", (category_id,)
    )
    connection.commit()
    connection.close()
    return jsonify({"message": "Category deactivated"})


@app.get("/api/products")
def get_products():
    connection = get_db_connection()

    query = """
        SELECT p.*, c.name AS category
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE p.is_active = 1 AND c.is_active = 1
    """
    parameters = []

    search = request.args.get("search", "").strip()
    if search:
        query += " AND p.name LIKE ?"
        parameters.append(f"%{search}%")

    category_id = request.args.get("category_id")
    if category_id:
        query += " AND p.category_id = ?"
        parameters.append(category_id)

    min_price = request.args.get("min_price")
    max_price = request.args.get("max_price")

    try:
        if min_price is not None:
            query += " AND p.price >= ?"
            parameters.append(float(min_price))
        if max_price is not None:
            query += " AND p.price <= ?"
            parameters.append(float(max_price))
    except ValueError:
        connection.close()
        return jsonify({"error": "Price filters must be numbers"}), 400

    if request.args.get("in_stock") == "true":
        query += " AND p.stock > 0"

    sort = request.args.get("sort", "featured")
    sort_options = {
        "featured": "p.is_featured DESC, p.name ASC",
        "price_asc": "p.price ASC",
        "price_desc": "p.price DESC",
        "name": "p.name ASC"
    }

    if sort not in sort_options:
        connection.close()
        return jsonify({"error": "Invalid sort option"}), 400

    query += " ORDER BY " + sort_options[sort]
    products = connection.execute(query, parameters).fetchall()
    connection.close()

    return jsonify([dict(row) for row in products])


@app.post("/api/products")
def create_product():
    data = request.get_json(silent=True) or {}

    required = ("name", "category_id", "price", "mrp", "stock")
    if any(key not in data for key in required):
        return jsonify({"error": "Name, category_id, price, mrp, and stock are required"}), 400

    try:
        name = data["name"].strip()
        category_id = int(data["category_id"])
        price = float(data["price"])
        mrp = float(data["mrp"])
        stock = int(data["stock"])
        featured = int(data.get("is_featured", 0))
    except (ValueError, TypeError, AttributeError):
        return jsonify({"error": "Invalid product field values"}), 400

    if not name or price < 0 or mrp < price or stock < 0 or featured not in (0, 1):
        return jsonify({"error": "Check name, price, MRP, stock, and featured status"}), 400

    connection = get_db_connection()
    category = connection.execute(
        "SELECT id FROM categories WHERE id = ? AND is_active = 1",
        (category_id,)
    ).fetchone()

    if category is None:
        connection.close()
        return jsonify({"error": "Active category not found"}), 400

    try:
        cursor = connection.execute(
            """INSERT INTO products
               (name, image, category_id, price, mrp, stock, is_featured)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                name, data.get("image", ""), category_id,
                price, mrp, stock, featured
            )
        )
        connection.commit()
        product = connection.execute(
            """SELECT p.*, c.name AS category FROM products p
               JOIN categories c ON c.id = p.category_id
               WHERE p.id = ?""",
            (cursor.lastrowid,)
        ).fetchone()
        return jsonify(dict(product)), 201
    except Exception:
        connection.rollback()
        return jsonify({"error": "Could not create product"}), 400
    finally:
        connection.close()


@app.patch("/api/products/<int:product_id>")
def update_product(product_id):
    data = request.get_json(silent=True) or {}
    allowed = {
        "name", "image", "category_id", "price",
        "mrp", "stock", "is_featured", "is_active"
    }

    if not data or not set(data).issubset(allowed):
        return jsonify({"error": "Provide valid product fields"}), 400

    connection = get_db_connection()
    product = connection.execute(
        "SELECT * FROM products WHERE id = ?", (product_id,)
    ).fetchone()

    if product is None:
        connection.close()
        return jsonify({"error": "Product not found"}), 404

    values = dict(product)
    values.update(data)

    try:
        if not str(values["name"]).strip():
            raise ValueError()
        values["category_id"] = int(values["category_id"])
        values["price"] = float(values["price"])
        values["mrp"] = float(values["mrp"])
        values["stock"] = int(values["stock"])
        values["is_featured"] = int(values["is_featured"])
        values["is_active"] = int(values["is_active"])

        if (values["price"] < 0 or values["mrp"] < values["price"]
                or values["stock"] < 0
                or values["is_featured"] not in (0, 1)
                or values["is_active"] not in (0, 1)):
            raise ValueError()

        category = connection.execute(
            "SELECT id FROM categories WHERE id = ? AND is_active = 1",
            (values["category_id"],)
        ).fetchone()
        if category is None:
            raise ValueError()
    except (ValueError, TypeError, KeyError):
        connection.close()
        return jsonify({"error": "Invalid product field values or category"}), 400

    connection.execute(
        """UPDATE products SET
           name = ?, image = ?, category_id = ?, price = ?, mrp = ?,
           stock = ?, is_featured = ?, is_active = ?,
           updated_at = CURRENT_TIMESTAMP
           WHERE id = ?""",
        (
            str(values["name"]).strip(), values["image"],
            values["category_id"], values["price"], values["mrp"],
            values["stock"], values["is_featured"],
            values["is_active"], product_id
        )
    )
    connection.commit()
    updated = connection.execute(
        """SELECT p.*, c.name AS category FROM products p
           JOIN categories c ON c.id = p.category_id
           WHERE p.id = ?""",
        (product_id,)
    ).fetchone()
    connection.close()
    return jsonify(dict(updated))


@app.delete("/api/products/<int:product_id>")
def deactivate_product(product_id):
    connection = get_db_connection()
    cursor = connection.execute(
        """UPDATE products SET is_active = 0,
           updated_at = CURRENT_TIMESTAMP WHERE id = ?""",
        (product_id,)
    )
    connection.commit()
    connection.close()

    if cursor.rowcount == 0:
        return jsonify({"error": "Product not found"}), 404

    return jsonify({"message": "Product deactivated"})


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
