import { Op } from 'sequelize';
import { Product } from '@/models';

export async function getAllProducts(search?: string, category?: string) {
  const where: Record<string, unknown> = {};

  if (search) {
    where[Op.or as unknown as string] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { serial_number: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (category) {
    where.category = category;
  }

  return Product.findAll({
    where,
    order: [['name', 'ASC']],
  });
}

export async function getProductBySerial(serial_number: string) {
  const product = await Product.findOne({ where: { serial_number } });
  if (!product) throw new Error(`Produk dengan serial ${serial_number} tidak ditemukan`);
  return product;
}

export async function getProductById(id: number) {
  const product = await Product.findByPk(id);
  if (!product) throw new Error(`Produk tidak ditemukan`);
  return product;
}

export async function createProduct(data: {
  serial_number: string;
  name: string;
  stock: number;
  price_buy: number;
  price_sell: number;
  category: string;
  buy_date?: string | null;
  buy_from?: string | null;
}) {
  const existing = await Product.findOne({ where: { serial_number: data.serial_number } });
  if (existing) throw new Error('Serial number sudah digunakan');
  return Product.create(data);
}

export async function updateProduct(
  id: number,
  data: Partial<{
    serial_number: string;
    name: string;
    stock: number;
    price_buy: number;
    price_sell: number;
    category: string;
    buy_date: string | null;
    buy_from: string | null;
  }>
) {
  const product = await getProductById(id);
  if (data.serial_number && data.serial_number !== product.serial_number) {
    const existing = await Product.findOne({ where: { serial_number: data.serial_number } });
    if (existing) throw new Error('Serial number sudah digunakan');
  }
  await product.update(data);
  return product;
}

export async function deleteProduct(id: number) {
  const product = await getProductById(id);
  await product.destroy();
  return { message: 'Produk berhasil dihapus' };
}

export async function getCategories() {
  const products = await Product.findAll({
    attributes: ['category'],
    group: ['category'],
    order: [['category', 'ASC']],
  });
  return [...new Set(products.map((p) => p.category))];
}

