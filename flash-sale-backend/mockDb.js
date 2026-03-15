
const products = [
  {
    id: 'prod_1',
    name: 'Antigravity Hoodie V1',
    description: 'Limited edition hyper-reflective fabric with integrated neural-link fibers.',
    price: 199.99,
    image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000&auto=format&fit=crop',
    drop_time: new Date(Date.now() + 9999999).toISOString(), // Wait for manual start
    remaining_inventory: 10,
    total_inventory: 10
  }
];

const orders = [];
const users = [
  { id: 'user_guest', name: 'Guest User', email: 'guest@example.com', password_hash: '' }
];

module.exports = {
  products,
  orders,
  users,
  query: async (sql, params) => {
    // Basic mock query router
    if (sql.includes('SELECT * FROM products WHERE id = $1')) {
      return { rows: products.filter(p => p.id === params[0]) };
    }
    if (sql.includes('SELECT id FROM orders WHERE user_id = $1')) {
      return { rows: orders.filter(o => o.user_id === params[0] && o.product_id === params[1]) };
    }
    if (sql.includes('UPDATE products SET remaining_inventory = $1')) {
      const p = products.find(p => p.id === params[1]);
      if (p) p.remaining_inventory = params[0];
      return { rowCount: 1 };
    }
    if (sql.includes('INSERT INTO orders')) {
      orders.push({ 
        id: params[0], 
        user_id: params[1], 
        product_id: params[2], 
        status: params[3] 
      });
      return { rowCount: 1 };
    }
    if (sql.includes('SELECT * FROM users WHERE email = $1')) {
        return { rows: users.filter(u => u.email === params[0]) };
    }
    return { rows: [] };
  }
};
