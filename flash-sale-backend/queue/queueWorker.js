
const { v4: uuidv4 } = require('uuid');
const redis = require('../redis');
const mockDb = require('../mockDb');

const INVENTORY_KEY = (productId) => `inventory:${productId}`;

/**
 * THE ORDER PROCESSOR
 * This worker processes jobs that have ALREADY passed the gate.
 * The spot is secured, now we just handle payment simulation and DB recording.
 */
const processCheckout = async (job, io) => {
  const { userId, productId, size } = job.data;
  const INVENTORY_KEY_STR = INVENTORY_KEY(productId);

  try {
    // 1. Create Order Record in mockDb
    const orderId = uuidv4();
    mockDb.orders.push({
        id: orderId,
        user_id: userId,
        product_id: productId,
        size,
        status: 'pending',
        created_at: new Date().toISOString()
    });

    // 2. Simulate Payment (3 seconds delay to feel "real")
    await new Promise(resolve => setTimeout(resolve, 3000));
    const paymentSuccess = Math.random() > 0.1; // 10% failure rate for demo

    if (paymentSuccess) {
      // Update Order Status
      const order = mockDb.orders.find(o => o.id === orderId);
      if (order) order.status = 'confirmed';

      // Notify User via Socket.io
      if (io) {
        io.to(userId).emit('checkout_result', { 
          status: 'success', 
          orderId, 
          message: 'Order confirmed! Welcome to the elite.' 
        });
      }
      
      console.log(`🎊 Order ${orderId} confirmed for user ${userId}`);
      return { status: 'success', orderId };
    } else {
      // PAYMENT FAILED: Return the spot to the gate
      await redis.incr(INVENTORY_KEY_STR);
      
      const order = mockDb.orders.find(o => o.id === orderId);
      if (order) order.status = 'failed';

      if (io) {
        io.to(userId).emit('checkout_result', { 
          status: 'error', 
          message: 'Payment declined. Your spot has been released.' 
        });
      }
      
      console.log(`❌ Order ${orderId} failed (payment). Spot released.`);
      return { status: 'payment_failed' };
    }

  } catch (err) {
    console.error('Worker Error:', err);
    if (io) io.to(userId).emit('checkout_result', { status: 'error', message: 'The processing center failed.' });
  }
};

const initWorker = (io) => {
  console.log('👷 High-Speed Worker initialized');
  // In our mock, we just trigger it immediately with a slight delay
  global.mockWorker = (job) => processCheckout(job, io);
  return { 
    close: () => Promise.resolve(),
    on: () => {} 
  };
};

module.exports = { initWorker };
