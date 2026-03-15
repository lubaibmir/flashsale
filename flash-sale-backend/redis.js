
require('dotenv').config();

class RedisMock {
  constructor() {
    this.storage = new Map();
    this.isReady = false;
    console.log('🛠️  Initializing Atomic Gate (Mock Redis)');
  }

  async connect() {
    this.isReady = true;
    console.log('✅ Atomic Gate connected');
    return Promise.resolve();
  }

  on(event, cb) {
    if (event === 'ready' || event === 'connect') {
      setTimeout(() => cb(), 100);
    }
  }

  async get(key) {
    return this.storage.get(key) || null;
  }

  async set(key, val) {
    this.storage.set(key, String(val));
    return 'OK';
  }

  async del(key) {
    this.storage.delete(key);
    return 1;
  }

  async incr(key) {
    let val = parseInt(this.storage.get(key) || 0);
    val++;
    this.storage.set(key, String(val));
    return val;
  }

  async decr(key) {
    let val = parseInt(this.storage.get(key) || 0);
    val--;
    this.storage.set(key, String(val));
    return val;
  }

  /**
   * ATOMIC GATE: Check if stock > 0 and decrement in one tick.
   * This is the LUA script equivalent that prevents overselling.
   */
  async eval(script, options) {
    const { keys } = options;
    const key = keys[0];
    
    let stock = parseInt(this.storage.get(key));
    
    // If stock is not set or <= 0, the gate is closed.
    if (isNaN(stock) || stock <= 0) {
      return -1; 
    }
    
    // Atomic decrement
    stock--;
    this.storage.set(key, String(stock));
    return stock;
  }

  async quit() { return 'OK'; }
  async ping() { return 'PONG'; }
}

const client = new RedisMock();
client.connect();

// Seed initial inventory for the demo product
client.set('inventory:prod_1', '10');

module.exports = client;