
const express = require('express');
const router = express.Router();
const { checkout, seedInventory, getInventory, getProducts, startSale } = require('../controllers/buyController');
const mockDb = require('../mockDb');

// OPTIONAL AUTH: For the hackathon, we can bypass if token isn't present
const flexibleAuth = (req, res, next) => {
    // If you want to force mock guest user
    if (!req.user) {
        req.user = { id: req.headers['x-user-id'] || 'guest_user' };
    }
    next();
};

// ─── CORE ROUTES ────────────────────────────────────
router.post('/checkout', flexibleAuth, checkout);

router.get('/products', getProducts);

router.get('/product/:productId', (req, res) => {
    const product = mockDb.products.find(p => p.id === req.params.productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
});

router.get('/my-orders', flexibleAuth, (req, res) => {
    const orders = mockDb.orders.filter(o => o.user_id === req.user.id);
    res.json({ orders });
});

router.get('/orders', (req, res) => {
    res.json({ orders: mockDb.orders });
});

router.post('/start-sale', startSale);
router.post('/seed-inventory', seedInventory);
router.get('/inventory/:productId', getInventory);

module.exports = router;