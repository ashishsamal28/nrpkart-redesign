
import os
from functools import wraps

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

from database import get_db_connection, init_db


# Load environment variables from backend/.env
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_PATH, override=True)

app = Flask(__name__)
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "").strip()

print("Environment file exists:", os.path.isfile(ENV_PATH))
print("Admin token loaded:", bool(ADMIN_TOKEN))

# Allow requests from the React frontend
CORS(app, allow_headers=["Content-Type", "X-Admin-Token"])


# -------------------- ADMIN AUTHENTICATION --------------------

def require_admin_token(view_function):
    @wraps(view_function)
    def wrapper(*args, **kwargs):
        if not ADMIN_TOKEN:
            return jsonify({
                "error": "Admin authentication is not configured"
            }), 500

        token = request.headers.get("X-Admin-Token")

        if not token or token != ADMIN_TOKEN:
            return jsonify({"error": "Unauthorized"}), 401

        return view_function(*args, **kwargs)

    return wrapper


@app.get("/api/admin/verify")
@require_admin_token
def verify_admin():
    return jsonify({"authenticated": True})

# -------------------- HOME --------------------

@app.get("/")
def home():
    return jsonify({"message": "nRp Kart API is running"})


# -------------------- PUBLIC CATEGORY API --------------------

@app.get("/api/categories")
def get_categories():
    connection = get_db_connection()

    try:
        categories = connection.execute(
            """
            SELECT *
            FROM categories
            WHERE is_active = 1
            ORDER BY name
            """
        ).fetchall()

        return jsonify([dict(row) for row in categories])
    finally:
        connection.close()


# -------------------- ADMIN CATEGORY APIs --------------------

@app.post("/api/categories")
@require_admin_token
def create_category():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "")
    description = data.get("description", "")

    if not isinstance(name, str) or not name.strip():
        return jsonify({"error": "Category name is required"}), 400

    if not isinstance(description, str):
        return jsonify({"error": "Description must be text"}), 400

    connection = get_db_connection()

    try:
        cursor = connection.execute(
            """
            INSERT INTO categories (name, description)
            VALUES (?, ?)
            """,
            (name.strip(), description.strip())
        )
        connection.commit()

        category = connection.execute(
            "SELECT * FROM categories WHERE id = ?",
            (cursor.lastrowid,)
        ).fetchone()

        return jsonify(dict(category)), 201

    except Exception:
        connection.rollback()
        return jsonify({
            "error": "Could not create category. The name may already exist."
        }), 400

    finally:
        connection.close()


@app.patch("/api/categories/<int:category_id>")
@require_admin_token
def update_category(category_id):
    data = request.get_json(silent=True) or {}
    allowed = {"name", "description", "is_active"}

    if not data or not set(data).issubset(allowed):
        return jsonify({
            "error": "Provide a valid name, description, or is_active"
        }), 400

    connection = get_db_connection()

    try:
        category = connection.execute(
            "SELECT * FROM categories WHERE id = ?",
            (category_id,)
        ).fetchone()

        if category is None:
            return jsonify({"error": "Category not found"}), 404

        name = data.get("name", category["name"])
        description = data.get("description", category["description"])
        is_active = data.get("is_active", category["is_active"])

        if not isinstance(name, str) or not name.strip():
            return jsonify({
                "error": "Category name cannot be empty"
            }), 400

        if not isinstance(description, str):
            return jsonify({
                "error": "Description must be text"
            }), 400

        if isinstance(is_active, bool):
            is_active = int(is_active)

        if is_active not in (0, 1):
            return jsonify({
                "error": "is_active must be 0 or 1"
            }), 400

        connection.execute(
            """
            UPDATE categories
            SET name = ?, description = ?, is_active = ?
            WHERE id = ?
            """,
            (name.strip(), description, is_active, category_id)
        )
        connection.commit()

        updated = connection.execute(
            "SELECT * FROM categories WHERE id = ?",
            (category_id,)
        ).fetchone()

        return jsonify(dict(updated))

    except Exception:
        connection.rollback()
        return jsonify({"error": "Could not update category"}), 400

    finally:
        connection.close()


@app.delete("/api/categories/<int:category_id>")
@require_admin_token
def deactivate_category(category_id):
    connection = get_db_connection()

    try:
        cursor = connection.execute(
            """
            UPDATE categories
            SET is_active = 0
            WHERE id = ? AND is_active = 1
            """,
            (category_id,)
        )
        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({
                "error": "Active category not found"
            }), 404

        return jsonify({"message": "Category deactivated"})

    finally:
        connection.close()


# -------------------- PUBLIC PRODUCT API --------------------

@app.get("/api/products")
def get_products():
    connection = get_db_connection()

    try:
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
            try:
                category_id = int(category_id)
                if category_id < 1:
                    raise ValueError
            except ValueError:
                return jsonify({"error": "Invalid category_id"}), 400

            query += " AND p.category_id = ?"
            parameters.append(category_id)

        min_price = request.args.get("min_price")
        max_price = request.args.get("max_price")

        try:
            if min_price is not None:
                min_price = float(min_price)
                if min_price < 0:
                    raise ValueError
                query += " AND p.price >= ?"
                parameters.append(min_price)

            if max_price is not None:
                max_price = float(max_price)
                if max_price < 0:
                    raise ValueError
                query += " AND p.price <= ?"
                parameters.append(max_price)

        except ValueError:
            return jsonify({
                "error": "Price filters must be non-negative numbers"
            }), 400

        in_stock = request.args.get("in_stock", "").lower()

        if in_stock == "true":
            query += " AND p.stock > 0"
        elif in_stock not in ("", "false"):
            return jsonify({
                "error": "in_stock must be true or false"
            }), 400

        sort = request.args.get("sort", "featured")

        sort_options = {
            "featured": "p.is_featured DESC, p.name ASC",
            "price_asc": "p.price ASC",
            "price_desc": "p.price DESC",
            "name": "p.name ASC"
        }

        if sort not in sort_options:
            return jsonify({"error": "Invalid sort option"}), 400

        query += " ORDER BY " + sort_options[sort]

        products = connection.execute(
            query, parameters
        ).fetchall()

        return jsonify([dict(row) for row in products])

    finally:
        connection.close()


# -------------------- ADMIN PRODUCT APIs --------------------

@app.post("/api/products")
@require_admin_token
def create_product():
    data = request.get_json(silent=True) or {}

    required = ("name", "category_id", "price", "mrp", "stock")

    if any(key not in data for key in required):
        return jsonify({
            "error": "Name, category_id, price, mrp, and stock are required"
        }), 400

    try:
        name = data["name"].strip()
        category_id = int(data["category_id"])
        price = float(data["price"])
        mrp = float(data["mrp"])
        stock = int(data["stock"])
        featured = data.get("is_featured", 0)

        if isinstance(featured, bool):
            featured = int(featured)
        else:
            featured = int(featured)

        if (
            not name
            or category_id < 1
            or price < 0
            or mrp < price
            or stock < 0
            or featured not in (0, 1)
        ):
            raise ValueError

    except (ValueError, TypeError, AttributeError, OverflowError):
        return jsonify({
            "error": "Invalid product field values"
        }), 400

    connection = get_db_connection()

    try:
        category = connection.execute(
            """
            SELECT id FROM categories
            WHERE id = ? AND is_active = 1
            """,
            (category_id,)
        ).fetchone()

        if category is None:
            return jsonify({
                "error": "Active category not found"
            }), 400

        cursor = connection.execute(
            """
            INSERT INTO products
                (name, image, category_id, price, mrp, stock, is_featured)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                name,
                data.get("image", ""),
                category_id,
                price,
                mrp,
                stock,
                featured
            )
        )
        connection.commit()

        product = connection.execute(
            """
            SELECT p.*, c.name AS category
            FROM products p
            JOIN categories c ON c.id = p.category_id
            WHERE p.id = ?
            """,
            (cursor.lastrowid,)
        ).fetchone()

        return jsonify(dict(product)), 201

    except Exception:
        connection.rollback()
        return jsonify({"error": "Could not create product"}), 400

    finally:
        connection.close()


@app.patch("/api/products/<int:product_id>")
@require_admin_token
def update_product(product_id):
    data = request.get_json(silent=True) or {}

    allowed = {
        "name", "image", "category_id", "price",
        "mrp", "stock", "is_featured", "is_active"
    }

    if not data or not set(data).issubset(allowed):
        return jsonify({
            "error": "Provide valid product fields"
        }), 400

    connection = get_db_connection()

    try:
        product = connection.execute(
            "SELECT * FROM products WHERE id = ?",
            (product_id,)
        ).fetchone()

        if product is None:
            return jsonify({"error": "Product not found"}), 404

        values = dict(product)
        values.update(data)

        try:
            name = values["name"]
            image_url = values["image"]

            if not isinstance(name, str) or not name.strip():
                raise ValueError

            if not isinstance(image_url, str):
                raise ValueError

            category_id = int(values["category_id"])
            price = float(values["price"])
            mrp = float(values["mrp"])
            stock = int(values["stock"])

            featured = values["is_featured"]
            active = values["is_active"]

            if isinstance(featured, bool):
                featured = int(featured)
            else:
                featured = int(featured)

            if isinstance(active, bool):
                active = int(active)
            else:
                active = int(active)

            if (
                category_id < 1
                or price < 0
                or mrp < price
                or stock < 0
                or featured not in (0, 1)
                or active not in (0, 1)
            ):
                raise ValueError

        except (ValueError, TypeError, KeyError, OverflowError):
            return jsonify({
                "error": "Invalid product field values"
            }), 400

        category = connection.execute(
            """
            SELECT id FROM categories
            WHERE id = ? AND is_active = 1
            """,
            (category_id,)
        ).fetchone()

        if category is None:
            return jsonify({
                "error": "Active category not found"
            }), 400

        connection.execute(
            """
            UPDATE products
            SET name = ?,
                image = ?,
                category_id = ?,
                price = ?,
                mrp = ?,
                stock = ?,
                is_featured = ?,
                is_active = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (
                name.strip(),
                image_url,
                category_id,
                price,
                mrp,
                stock,
                featured,
                active,
                product_id
            )
        )
        connection.commit()

        updated = connection.execute(
            """
            SELECT p.*, c.name AS category
            FROM products p
            JOIN categories c ON c.id = p.category_id
            WHERE p.id = ?
            """,
            (product_id,)
        ).fetchone()

        return jsonify(dict(updated))

    except Exception:
        connection.rollback()
        return jsonify({"error": "Could not update product"}), 400

    finally:
        connection.close()


@app.delete("/api/products/<int:product_id>")
@require_admin_token
def deactivate_product(product_id):
    connection = get_db_connection()

    try:
        cursor = connection.execute(
            """
            UPDATE products
            SET is_active = 0,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND is_active = 1
            """,
            (product_id,)
        )
        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({
                "error": "Active product not found"
            }), 404

        return jsonify({"message": "Product deactivated"})

    finally:
        connection.close()


# -------------------- START SERVER --------------------

if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
