
const axios = require('axios');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runSimulation() {
    console.log('🚀 Starting Background Simulation (100 concurrent requests on Port 3003)...');
    
    // 1. Reset System
    try {
        await axios.post('http://localhost:3003/api/seed-inventory', { productId: 'prod_1', quantity: 10 });
        console.log('✅ System Reset Complete.');
    } catch (e) {
        console.error('❌ Reset failed. Server might be down.');
        return;
    }

    // 2. Start Sale
    try {
        await axios.post('http://localhost:3003/api/start-sale', { productId: 'prod_1' });
        console.log('✅ Sale Started (15s countdown initiated).');
    } catch (e) {
        console.error('❌ Failed to start sale.');
        return;
    }

    console.log('⏳ Waiting for 16 seconds for sale to technically unlock...');
    await sleep(16000);

    console.log('🔥 FIRING REQUESTS...');
    const requests = [];
    for (let i = 0; i < 100; i++) {
        requests.push(
            axios.post('http://localhost:3003/api/checkout', {
                productId: 'prod_1',
                size: 'L',
                userId: `stress_test_${i}`
            }).then(res => {
                console.log(`User ${i}: ${res.data.status} - ${res.data.message}`);
            }).catch(e => {
                console.log(`User ${i}: FAILED - ${e.response?.data?.message || e.message}`);
            })
        );
    }

    await Promise.all(requests);
    console.log('🏁 Simulation Complete. Check Admin Dashboard for final tally.');
}

runSimulation();
