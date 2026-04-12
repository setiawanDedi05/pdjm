import { Op } from 'sequelize';
import { Product } from '@/models';

export async function getAllProducts(search?: string, page = 1, pageSize = 10) {
  const where: Record<string, unknown> = {};
  if (search) {
    where[Op.or as unknown as string] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { serial_number: { [Op.iLike]: `%${search}%` } },
    ];
  }
  const offset = (page - 1) * pageSize;
  const { rows, count } = await Product.findAndCountAll({
    where,
    order: [['name', 'ASC']],
    offset,
    limit: pageSize,
  });
  return {
    items: rows,
    total: count,
    totalPages: Math.ceil(count / pageSize),
    page,
    pageSize,
  };
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
  description?: string | null;
  stock: number;
  price_buy: number;
  price_sell: number;
  buy_date?: string | null;
  suplier?: string | null;
  alias_supplier?: string | null;
}) {
  const existing = await Product.findOne({ where: { serial_number: data.serial_number, name: data.name } });
  if (existing) throw new Error('Serial number sudah digunakan');
  return Product.create(data);
}

export async function updateProduct(
  id: number,
  data: Partial<{
    serial_number: string;
    name: string;
    description?: string | null;
    stock: number;
    price_buy: number;
    price_sell: number;
    buy_date: string | null;
    suplier: string | null;
    alias_supplier: string | null;
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

