import { pool } from "../config/database.js"
import type { IProduct, ICreateProductDTO} from "../modules/products/products.types.js";


export async function createProduct(product: ICreateProductDTO): Promise<void> {
  const sql = "INSERT INTO products (name, value, description) VALUES (?, ?, ?)";
  await pool.execute(sql, [product.name, product.value, product.description ?? ""]);
}

export async function getProducts(): Promise<IProduct[]> {
    const sql = "SELECT * FROM products";
    const [rows] = await pool.query(sql);
    return rows as IProduct[];
}

export async function getProductById(id: number): Promise<IProduct | null> {
  const sql = "SELECT id, name, value, description FROM products WHERE id = ?";
  const [rows] = await pool.query(sql, [id]);
  const products = rows as IProduct[];
  return products[0] ?? null;
}

export async function updateProduct(id: number, product: IProduct): Promise<void> {
  const sql = "UPDATE products SET name = ?, value = ?, description = ? WHERE id = ?";
  await pool.execute(sql, [product.name, product.value, product.description, id]);
}

export async function deleteProduct(id: number): Promise<void> {
  const sql = "DELETE FROM products WHERE id = ?";
  await pool.execute(sql, [id]);
}