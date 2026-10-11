
from database import get_db_connection

products = [
    {
        "name": "Note Studio A4 Spiral Notebook",
        "image": "https://placehold.co/600x600?text=Note+Studio+A4",
        "category_id": 2,
        "price": 96,
        "mrp": 120,
        "stock": 35,
        "is_featured": 1,
    },
    {
        "name": "nRp oNe A4 Spiral Notebook",
        "image": "https://placehold.co/600x600?text=nRp+oNe+A4",
        "category_id": 2,
        "price": 75,
        "mrp": 90,
        "stock": 24,
        "is_featured": 1,
    },
    {
        "name": "A4 Ruled Notebook",
        "image": "https://placehold.co/600x600?text=A4+Ruled",
        "category_id": 2,
        "price": 85,
        "mrp": 100,
        "stock": 18,
        "is_featured": 0,
    },
    {
        "name": "A4 Premium Notebook",
        "image": "https://placehold.co/600x600?text=A4+Premium",
        "category_id": 2,
        "price": 110,
        "mrp": 140,
        "stock": 12,
        "is_featured": 0,
    },
    {
        "name": "nRp Youth Spiral B5 Notebook",
        "image": "https://placehold.co/600x600?text=nRp+Youth+B5",
        "category_id": 1,
        "price": 63,
        "mrp": 80,
        "stock": 40,
        "is_featured": 1,
    },
    {
        "name": "Classic Spiral Notebook",
        "image": "https://placehold.co/600x600?text=Classic+Spiral",
        "category_id": 1,
        "price": 55,
        "mrp": 70,
        "stock": 30,
        "is_featured": 0,
    },
    {
        "name": "Executive Spiral Notebook",
        "image": "https://placehold.co/600x600?text=Executive+Spiral",
        "category_id": 1,
        "price": 90,
        "mrp": 115,
        "stock": 15,
        "is_featured": 1,
    },
    {
        "name": "Compact Spiral Notebook",
        "image": "https://placehold.co/600x600?text=Compact+Spiral",
        "category_id": 1,
        "price": 45,
        "mrp": 60,
        "stock": 0,
        "is_featured": 0,
    },
    {
        "name": "nRp King Size Notebook",
        "image": "https://placehold.co/600x600?text=King+Size",
        "category_id": 3,
        "price": 70,
        "mrp": 85,
        "stock": 20,
        "is_featured": 1,
    },
    {
        "name": "King Size Long Notebook",
        "image": "https://placehold.co/600x600?text=King+Long",
        "category_id": 3,
        "price": 65,
        "mrp": 80,
        "stock": 16,
        "is_featured": 0,
    },
    {
        "name": "Case Bound Notebook",
        "image": "https://placehold.co/600x600?text=Case+Bound",
        "category_id": 4,
        "price": 125,
        "mrp": 150,
        "stock": 10,
        "is_featured": 1,
    },
    {
        "name": "Long Size Ruled Notebook",
        "image": "https://placehold.co/600x600?text=Long+Size",
        "category_id": 5,
        "price": 50,
        "mrp": 65,
        "stock": 22,
        "is_featured": 0,
    },
]

connection = get_db_connection()

try:
    for product in products:
        connection.execute(
            """
            INSERT INTO products
                (name, image, category_id, price, mrp, stock, is_featured)
            VALUES
                (:name, :image, :category_id, :price, :mrp, :stock, :is_featured)
            """,
            product,
        )

    connection.commit()
    print(f"Successfully inserted {len(products)} sample products.")

except Exception:
    connection.rollback()
    raise

finally:
    connection.close()
