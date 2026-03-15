// checkoutQueue.js — Mock version for running without Redis
require('dotenv').config();

// We mock the Queue behavior to avoid BullMQ connection errors
class MockQueue {
  constructor(name) {
    this.name = name;
    this.jobs = [];
    console.log(`🛠️  Mock Queue [${name}] initialized`);
  }

  async add(jobName, data) {
    const job = {
      id: Math.random().toString(36).substring(7),
      name: jobName,
      data,
    };
    console.log(`📥 Job added to Mock Queue: ${job.id}`);
    
    // Simulate async processing
    if (global.mockWorker) {
      setTimeout(() => global.mockWorker(job), 500);
    }
    
    return job;
  }

  async getWaitingCount() {
    return 0;
  }

  async close() { return Promise.resolve(); }
}

const checkoutQueue = new MockQueue('checkoutQueue');

module.exports = { checkoutQueue, connection: {} };