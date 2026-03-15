// lib/store.js
// In-memory mock "backend" — simulates Redis + Postgres + BullMQ

const PRODUCT_ID = 'slime-drop-01'
const TOTAL_INVENTORY = 50
const SIZES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12]

// ── State ──────────────────────────────────────────────────────────
let state = {
  inventory: TOTAL_INVENTORY,
  totalInventory: TOTAL_INVENTORY,
  orders: [],
  dropTime: null,
  isLive: false,
  isDropOver: false,
  // Stats
  totalRequests: 0,
  confirmedCount: 0,
  failedCount: 0,
  soldOutCount: 0,
  queueDepth: 0,
  peakQueueDepth: 0,
  // Simulation
  requestLog: [],      // timestamps for req/min
  throughput: new Array(20).fill(0), // 15s rolling buckets
  events: [],          // live feed events
  queueSlots: [],      // last 60 job outcomes
  // Simulation settings
  simConfig: {
    concurrency: 10,
    burstSize: 50,
    delayMs: 50,
    paymentFailureRate: 0.05,
    duplicateRate: 0.1,
  }
}

// ── Subscribers (for reactive UI) ─────────────────────────────────
const subscribers = new Set()

export function subscribe(fn) {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

function notify() {
  subscribers.forEach(fn => fn({ ...state }))
}

// ── Getters ────────────────────────────────────────────────────────
export function getState() {
  return { ...state }
}

export function getProduct() {
  return {
    id: PRODUCT_ID,
    name: 'SLIME COURT V1',
    colorway: 'Radioactive / Ink',
    price: 24999,
    totalInventory: state.totalInventory,
    inventory: state.inventory,
    dropTime: state.dropTime,
    isLive: state.isLive,
    sizes: SIZES,
  }
}

// ── Drop Control ───────────────────────────────────────────────────
export function initDrop(minutesFromNow = 2) {
  state.dropTime = Date.now() + minutesFromNow * 60 * 1000
  state.isLive = false
  state.isDropOver = false
  notify()
}

export function triggerDropNow() {
  state.dropTime = Date.now() - 1000
  state.isLive = true
  pushEvent('system', 'DROP 003 IS LIVE — THE GATE IS OPEN', 'live')
  notify()
}

export function setDropTime(ms) {
  state.dropTime = ms
  state.isLive = false
  notify()
}

export function checkDropLive() {
  if (!state.isLive && state.dropTime && Date.now() >= state.dropTime) {
    state.isLive = true
    pushEvent('system', 'DROP 003 IS LIVE — THE GATE IS OPEN', 'live')
    notify()
    return true
  }
  return state.isLive
}

// ── Inventory ──────────────────────────────────────────────────────
export function seedInventory(quantity) {
  state.inventory = quantity
  state.totalInventory = quantity
  pushEvent('admin', `Inventory seeded: ${quantity} units`, 'info')
  notify()
}

// ── THE GATE: Atomic Decrement (simulates Redis Lua DECR script) ──
// This is the critical section — single-threaded JS ensures no race conditions
// In real system: Redis EVAL with Lua script prevents overselling
function atomicDecrement() {
  if (state.inventory <= 0) return -1
  state.inventory--
  return state.inventory
}

// ── Checkout (single user) ─────────────────────────────────────────
export async function checkout(userId, userName, size, opts = {}) {
  const { skipIdempotency = false } = opts

  // Log request
  state.totalRequests++
  state.requestLog.push(Date.now())
  const bucket = Math.floor(Date.now() / 15000) % 20
  state.throughput[bucket]++
  state.queueDepth++
  state.peakQueueDepth = Math.max(state.peakQueueDepth, state.queueDepth)

  try {
    // 1. Check drop is live
    if (!state.isLive) {
      return result('too_early', userId, userName, size, 'Drop not started')
    }

    // 2. Fast-fail: inventory check (Redis GET)
    if (state.inventory <= 0) {
      state.soldOutCount++
      pushEvent('soldout', `${userName} — SOLD OUT (fast-fail)`, 'sold_out')
      addSlot('sold_out')
      return result('sold_out', userId, userName, size, 'Sold out')
    }

    // 3. Idempotency check (DB SELECT)
    if (!skipIdempotency) {
      const existing = state.orders.find(
        o => o.userId === userId && o.productId === PRODUCT_ID && o.status !== 'failed'
      )
      if (existing) {
        return result('duplicate', userId, userName, size, 'Already ordered')
      }
    }

    // 4. Simulate queue processing delay
    const delay = 100 + Math.random() * 400
    await sleep(delay)

    // 5. THE GATE: atomic inventory decrement
    const remaining = atomicDecrement()
    if (remaining === -1) {
      state.soldOutCount++
      pushEvent('soldout', `${userName} — SOLD OUT (gate)`, 'sold_out')
      addSlot('sold_out')
      return result('sold_out', userId, userName, size, 'Sold out at gate')
    }

    // 6. Simulate payment (5% failure)
    const payFail = Math.random() < state.simConfig.paymentFailureRate
    if (payFail) {
      // Release inventory back
      state.inventory++
      state.failedCount++
      pushEvent('failed', `${userName} — PAYMENT FAILED (released)`, 'failed')
      addSlot('failed')
      return result('payment_failed', userId, userName, size, 'Payment failed — inventory released')
    }

    // 7. Insert order (DB INSERT)
    const orderId = 'ORD-' + Math.random().toString(36).substring(2, 9).toUpperCase()
    const order = {
      id: orderId,
      userId,
      userName,
      productId: PRODUCT_ID,
      productName: 'AXIOM LOW 003',
      size,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      remaining,
    }
    state.orders.unshift(order)
    state.confirmedCount++

    if (state.inventory === 0) {
      state.isDropOver = true
      pushEvent('system', 'ALL 50 PAIRS SOLD — DROP CLOSED', 'live')
    }

    pushEvent('success', `${userName} — UK ${size} SECURED (#${state.confirmedCount})`, 'success')
    addSlot('success')
    notify()
    return result('success', userId, userName, size, 'Order confirmed', { orderId, remaining })

  } finally {
    state.queueDepth = Math.max(0, state.queueDepth - 1)
    notify()
  }
}

// ── Simulation Engine ──────────────────────────────────────────────
let simRunning = false
let simAbort = false

export function isSimRunning() { return simRunning }

export async function runSimulation(config, onProgress) {
  if (simRunning) return
  simRunning = true
  simAbort = false

  const {
    userCount = 50,
    burstDelay = 30,
    paymentFailureRate = 0.05,
    duplicateRate = 0.1,
    withDuplicates = true,
    concurrency = 10,
  } = config

  state.simConfig.paymentFailureRate = paymentFailureRate

  pushEvent('admin', `🔥 SIMULATION START — ${userCount} users, ${concurrency} concurrent`, 'info')

  const users = Array.from({ length: userCount }, (_, i) => ({
    id: `sim_user_${i}`,
    name: `User_${String(i).padStart(3, '0')}`,
    size: SIZES[Math.floor(Math.random() * SIZES.length)],
    isDuplicate: withDuplicates && Math.random() < duplicateRate,
  }))

  // Build batches
  const batches = []
  for (let i = 0; i < users.length; i += concurrency) {
    batches.push(users.slice(i, i + concurrency))
  }

  let completed = 0
  for (const batch of batches) {
    if (simAbort) break
    await Promise.all(
      batch.map(u => checkout(u.id, u.name, u.size, { skipIdempotency: u.isDuplicate }))
    )
    completed += batch.length
    onProgress && onProgress(completed, userCount)
    await sleep(burstDelay)
  }

  simRunning = false
  simAbort = false
  pushEvent('admin', `✓ SIMULATION DONE — ${state.confirmedCount} confirmed, ${state.failedCount + state.soldOutCount} rejected`, 'info')
  notify()
}

export function stopSimulation() {
  simAbort = true
  simRunning = false
  pushEvent('admin', 'Simulation stopped by admin', 'info')
  notify()
}

// ── Reset ──────────────────────────────────────────────────────────
export function resetAll() {
  state = {
    inventory: TOTAL_INVENTORY,
    totalInventory: TOTAL_INVENTORY,
    orders: [],
    dropTime: Date.now() + 2 * 60 * 1000,
    isLive: false,
    isDropOver: false,
    totalRequests: 0,
    confirmedCount: 0,
    failedCount: 0,
    soldOutCount: 0,
    queueDepth: 0,
    peakQueueDepth: 0,
    requestLog: [],
    throughput: new Array(20).fill(0),
    events: [],
    queueSlots: [],
    simConfig: {
      concurrency: 10,
      burstSize: 50,
      delayMs: 50,
      paymentFailureRate: 0.05,
      duplicateRate: 0.1,
    }
  }
  notify()
}

// ── Helpers ────────────────────────────────────────────────────────
function result(status, userId, userName, size, message, extra = {}) {
  return { status, userId, userName, size, message, ...extra, ts: Date.now() }
}

function pushEvent(type, message, variant) {
  state.events.unshift({
    id: Math.random().toString(36).slice(2),
    type,
    message,
    variant,
    ts: Date.now(),
  })
  if (state.events.length > 100) state.events = state.events.slice(0, 100)
}

function addSlot(state_) {
  state.queueSlots.push(state_)
  if (state.queueSlots.length > 100) state.queueSlots = state.queueSlots.slice(-100)
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── Init ───────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  const saved = sessionStorage.getItem('slime_drop_time')
  if (saved && parseInt(saved) > Date.now()) {
    state.dropTime = parseInt(saved)
  } else {
    state.dropTime = Date.now() + 2 * 60 * 1000
    sessionStorage.setItem('slime_drop_time', state.dropTime)
  }
}