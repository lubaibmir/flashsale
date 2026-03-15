const { Worker } = require('bullmq');
const redis = require('../redis');
const { query } = require('../db');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const connection = { url: process.env.REDIS_URL };

const INVENTORY_KEY = (productId) => `inventory:${productId}`;

const LUA_DECR = `
  local stock = tonumber(redis.call('GET', KEYS[1]))
  if stock == nil or stock <= 0 then
    return -1
  end
  return redis.call('DECR', KEYS[1])
`;

const worker = new Worker('checkout', async (job) => {
  const { userId, productId, size } = job.data;

  const productResult = await query('SELECT * FROM products WHERE id = $1', [productId]);
  const product = productResult.rows[0];

  if (!product) return { status: 'error', message: 'Product not found.' };

  if (new Date() < new Date(product.drop_time)) {
    return { status: 'too_early', message: 'Sale has not started yet.' };
  }

  let remaining;
  try {
    remaining = await redis.eval(LUA_DECR, {
      keys: [INVENTORY_KEY(productId)],
      arguments: [],
    });
  } catch (err) {
    console.error('Redis error in worker:', err);
    throw new Error('Redis failed');
  }

  if (remaining === -1) {
    return { status: 'sold_out', message: 'Sorry, this item is sold out.' };
  }

  const orderId = uuidv4();
  await query(
    `INSERT INTO orders (id, user_id, product_id, size, status, created_at)
     VALUES ($1, $2, $3, $4, 'confirmed', NOW())`,
    [orderId, userId, productId, size]
  );

  await query(
    'UPDATE products SET remaining_inventory = remaining_inventory - 1 WHERE id = $1',
    [productId]
  );

  return { status: 'success', orderId, remaining };

}, { connection, concurrency: 5 });

worker.on('completed', (job, result) => {
  console.log(`Job ${job.id} done — ${result.status}`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed — ${err.message}`);
});

console.log('Checkout worker running...');

module.exports = worker;
