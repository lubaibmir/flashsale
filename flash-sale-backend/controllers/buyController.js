
const { v4: uuidv4 } = require('uuid');
const redis = require('../redis');
const mockDb = require('../mockDb');
const { checkoutQueue } = require('../queue/checkoutQueue');

const INVENTORY_KEY = (productId) => `inventory:${productId}`;

/**
 * THE GATEKEEPER
 */
exports.checkout = async (req, res) => {
  const { productId, size, userId: manualUserId } = req.body;
  // Use manually provided ID or fallback to standard logic
  const userId = manualUserId || (req.user ? req.user.id : (req.headers['x-user-id'] || 'guest_' + Math.random().toString(36).substr(2, 9)));

  if (!productId) {
    return res.status(400).json({ status: 'error', message: 'Missing productId.' });
  }

  try {
    const product = mockDb.products.find(p => p.id === productId);
    if (!product) return res.status(404).json({ status: 'error', message: 'Product not found.' });

    // Ensure sale has started
    if (new Date() < new Date(product.drop_time)) {
        return res.status(400).json({ status: 'error', message: 'Sale has not started yet.' });
    }

    // 1. ATOMIC GATE CHECK
    const remainingStock = await redis.eval('', { keys: [INVENTORY_KEY(productId)] });

    if (remainingStock === -1) {
      console.log(`🚫 Rejecting user ${userId}: SOLD OUT`);
      return res.status(200).json({ 
        status: 'sold_out', 
        message: 'Too slow! The item is already gone.' 
      });
    }

    console.log(`✅ User ${userId} passed the gate. Stock remaining: ${remainingStock}`);

    // 2. Add to Queue for "Processing" (e.g. creating the actual order record)
    const job = await checkoutQueue.add('checkout', {
      userId,
      productId,
      size,
    });

    const waitingCount = await checkoutQueue.getWaitingCount();

    // Notify admin dashboard if possible
    if (req.io) {
      req.io.emit('admin_update', { 
        type: 'new_request', 
        waitingCount,
        stockRemaining: remainingStock
      });
    }

    // 3. Success (Queued)
    return res.status(202).json({
      status: 'queued',
      message: 'Spot secured! Processing your order...',
      jobId: job.id,
      position: waitingCount
    });

  } catch (err) {
    console.error('Gatekeeper error:', err);
    return res.status(500).json({ status: 'error', message: 'The gate malfunctioned.' });
  }
};

exports.seedInventory = async (req, res) => {
  const { productId, quantity } = req.body;
  await redis.set(INVENTORY_KEY(productId), String(quantity));
  
  const product = mockDb.products.find(p => p.id === productId);
  if (product) {
      product.remaining_inventory = quantity;
      product.total_inventory = quantity;
      product.drop_time = new Date(Date.now() + 9999999).toISOString(); // Push back to future
  }
  
  if (req.io) req.io.emit('admin_update', { type: 'system_reset', productId, stockRemaining: quantity });
  
  return res.status(200).json({ message: `Inventory set: ${quantity} units for ${productId}` });
};

exports.getInventory = async (req, res) => {
  const { productId } = req.params;
  const stock = await redis.get(INVENTORY_KEY(productId));
  return res.status(200).json({ productId, stock: parseInt(stock) || 0 });
};

exports.getProducts = async (req, res) => {
    return res.json(mockDb.products);
};

exports.startSale = async (req, res) => {
    const { productId } = req.body;
    const product = mockDb.products.find(p => p.id === productId);
    if (product) {
        // Set drop time to 15 seconds from now to match frontend countdown
        product.drop_time = new Date(Date.now() + 15000).toISOString();
        if (req.io) req.io.emit('admin_update', { type: 'sale_started', productId });
        return res.json({ success: true, drop_time: product.drop_time });
    }
    res.status(404).json({ error: 'Product not found' });
};