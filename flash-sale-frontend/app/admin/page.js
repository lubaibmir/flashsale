'use client'
import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../lib/useStore'
import {
  runSimulation, stopSimulation, seedInventory, triggerDropNow,
  resetAll, setDropTime, initDrop, isSimRunning
} from '../../lib/store'

export default function AdminPage() {
  const state = useStore()
  const [simConfig, setSimConfig] = useState({
    userCount: 100,
    concurrency: 15,
    burstDelay: 20,
    paymentFailureRate: 0.05,
    withDuplicates: true,
    duplicateRate: 0.08,
  })
  const [simProgress, setSimProgress] = useState({ running: false, done: 0, total: 0 })
  const [invInput, setInvInput] = useState('50')
  const [dropMinInput, setDropMinInput] = useState('2')
  const feedRef = useRef(null)

  // Auto-scroll feed
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0
  }, [state.events?.length])

  async function startSim() {
    if (simProgress.running) return
    setSimProgress({ running: true, done: 0, total: simConfig.userCount })
    await runSimulation(simConfig, (done, total) => {
      setSimProgress({ running: true, done, total })
    })
    setSimProgress(p => ({ ...p, running: false }))
  }

  function stopSim() {
    stopSimulation()
    setSimProgress(p => ({ ...p, running: false }))
  }

  function handleSeedInventory() {
    const val = parseInt(invInput)
    if (!isNaN(val) && val >= 0) seedInventory(val)
  }

  function handleSetDropTime() {
    const mins = parseFloat(dropMinInput)
    if (!isNaN(mins) && mins >= 0) {
      const t = Date.now() + mins * 60 * 1000
      setDropTime(t)
      if (typeof window !== 'undefined') sessionStorage.setItem('slime_drop_time', t)
    }
  }

  const inv = state.inventory ?? 50
  const total = state.totalInventory ?? 50
  const invPct = Math.round(Math.max(0, (inv / total) * 100))
  const reqPerMin = (state.requestLog || []).filter(t => Date.now() - t < 60000).length
  const simRunning = simProgress.running
  const simPct = simProgress.total > 0 ? Math.round((simProgress.done / simProgress.total) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '2.5rem 3rem 2rem', borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--red)', letterSpacing: '0.18em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="animate-pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }} />
            COMMAND CENTER
          </div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: '3rem', letterSpacing: '0.04em' }}>ADMIN DASHBOARD</h1>
          <p style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.1em', marginTop: '0.4rem' }}>
            SLIME DROP 001 — SIMULATION & MONITORING
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <DangerBtn onClick={resetAll} label="RESET ALL" />
        </div>
      </div>

      {/* Stat cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1px', margin: '1px 0' }}>
        {[
          { label: 'Requests / Min', val: reqPerMin, color: 'val-accent' },
          { label: 'Confirmed', val: state.confirmedCount ?? 0, color: 'val-green' },
          { label: 'Queue Depth', val: state.queueDepth ?? 0, color: 'val-blue' },
          { label: 'Sold Out / Failed', val: (state.soldOutCount ?? 0) + (state.failedCount ?? 0), color: 'val-red' },
          { label: 'Remaining Stock', val: inv, color: invPct < 20 ? 'val-red' : invPct < 50 ? 'val-accent' : 'val-green' },
        ].map(({ label, val, color }) => (
          <StatCard key={label} label={label} val={val} color={color} />
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', padding: '1px' }}>

        {/* LEFT COL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>

          {/* ── SIMULATION CONTROL ── */}
          <Panel title="🔥 FIRE REQUESTS — SIMULATION CONTROL">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.25rem' }}>
              <ConfigField label="Users (total requests)" type="number" min={1} max={5000}
                value={simConfig.userCount}
                onChange={v => setSimConfig(c => ({ ...c, userCount: parseInt(v) || 1 }))} />
              <ConfigField label="Concurrency" type="number" min={1} max={100}
                value={simConfig.concurrency}
                onChange={v => setSimConfig(c => ({ ...c, concurrency: parseInt(v) || 1 }))} />
              <ConfigField label="Burst Delay (ms)" type="number" min={0} max={2000}
                value={simConfig.burstDelay}
                onChange={v => setSimConfig(c => ({ ...c, burstDelay: parseInt(v) || 0 }))} />
              <ConfigField label="Payment Failure Rate" type="number" min={0} max={1} step={0.01}
                value={simConfig.paymentFailureRate}
                onChange={v => setSimConfig(c => ({ ...c, paymentFailureRate: parseFloat(v) || 0 }))} />
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <Toggle
                label="Inject duplicates"
                value={simConfig.withDuplicates}
                onChange={v => setSimConfig(c => ({ ...c, withDuplicates: v }))}
              />
              {simConfig.withDuplicates && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'var(--muted)', letterSpacing: '0.08em' }}>Dup rate</span>
                  <input type="number" min={0} max={1} step={0.01}
                    value={simConfig.duplicateRate}
                    onChange={e => setSimConfig(c => ({ ...c, duplicateRate: parseFloat(e.target.value) || 0 }))}
                    style={{ width: '64px', background: 'var(--bg3)', border: '0.5px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '0.7rem', padding: '5px 8px', outline: 'none' }}
                  />
                </div>
              )}
            </div>

            {/* Progress bar */}
            {simRunning && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'var(--blue)', letterSpacing: '0.08em' }}>
                    FIRING — {simProgress.done}/{simProgress.total}
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'var(--muted)' }}>{simPct}%</span>
                </div>
                <div style={{ height: '3px', background: 'var(--bg3)' }}>
                  <div style={{ height: '100%', background: 'var(--blue)', width: simPct + '%', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {!simRunning ? (
                <button onClick={startSim} disabled={!state.isLive}
                  style={{
                    flex: 1, padding: '12px', background: state.isLive ? 'var(--accent)' : 'var(--bg4)',
                    color: state.isLive ? '#000' : 'var(--muted2)',
                    border: 'none', fontFamily: 'var(--display)', fontSize: '1.2rem',
                    letterSpacing: '0.08em', cursor: state.isLive ? 'pointer' : 'not-allowed',
                  }}>
                  FIRE {simConfig.userCount} REQUESTS
                </button>
              ) : (
                <button onClick={stopSim} style={{
                  flex: 1, padding: '12px', background: 'var(--red)', color: '#fff',
                  border: 'none', fontFamily: 'var(--display)', fontSize: '1.2rem',
                  letterSpacing: '0.08em', cursor: 'pointer',
                }}>
                  ⬛ STOP SIMULATION
                </button>
              )}
            </div>
            {!state.isLive && (
              <p style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', color: 'var(--muted2)', marginTop: '8px', letterSpacing: '0.08em', textAlign: 'center' }}>
                Start the drop first to enable simulation
              </p>
            )}
          </Panel>

          {/* ── DROP CONTROL ── */}
          <Panel title="DROP CONTROL">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button onClick={triggerDropNow} style={{
                flex: 1, padding: '10px', background: 'none',
                border: '0.5px solid var(--accent)', color: 'var(--accent)',
                fontFamily: 'var(--mono)', fontSize: '0.65rem', letterSpacing: '0.1em',
                cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.15s',
              }}
              onMouseOver={e => { e.target.style.background = 'var(--accent)'; e.target.style.color = '#000' }}
              onMouseOut={e => { e.target.style.background = 'none'; e.target.style.color = 'var(--accent)' }}>
                GO LIVE NOW
              </button>
              <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                <input type="number" min={0} max={60} step={0.5}
                  value={dropMinInput}
                  onChange={e => setDropMinInput(e.target.value)}
                  placeholder="Minutes"
                  style={{ flex: 1, background: 'var(--bg3)', border: '0.5px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '0.7rem', padding: '8px 10px', outline: 'none' }}
                />
                <button onClick={handleSetDropTime} style={{
                  padding: '8px 12px', background: 'none',
                  border: '0.5px solid var(--border)', color: 'var(--muted)',
                  fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.08em',
                  cursor: 'pointer',
                }}>SET TIMER</button>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.08em' }}>
              Status: <span style={{ color: state.isLive ? 'var(--green)' : 'var(--blue)' }}>
                {state.isDropOver ? '⬛ SOLD OUT' : state.isLive ? '● LIVE' : '○ WAITING'}
              </span>
            </div>
          </Panel>

          {/* ── INVENTORY CONTROL ── */}
          <Panel title="INVENTORY CONTROL">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="number" value={invInput}
                onChange={e => setInvInput(e.target.value)}
                min={0} max={9999}
                placeholder="Quantity"
                style={{ flex: 1, background: 'var(--bg3)', border: '0.5px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '0.75rem', padding: '9px 12px', outline: 'none' }}
              />
              <button onClick={handleSeedInventory} style={{
                padding: '9px 18px', background: 'none',
                border: '0.5px solid var(--accent)', color: 'var(--accent)',
                fontFamily: 'var(--mono)', fontSize: '0.65rem', letterSpacing: '0.1em',
                cursor: 'pointer', textTransform: 'uppercase',
              }}>SET</button>
            </div>
            {/* Inventory bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.1em' }}>REMAINING</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', color: invPct < 20 ? 'var(--red)' : 'var(--accent)' }}>
                {inv} / {total} ({invPct}%)
              </span>
            </div>
            <div style={{ height: '6px', background: 'var(--bg3)' }}>
              <div style={{
                height: '100%',
                background: invPct < 20 ? 'var(--red)' : invPct < 50 ? 'var(--orange)' : 'var(--accent)',
                width: invPct + '%', transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
              {[10, 25, 50, 100, 200].map(n => (
                <button key={n} onClick={() => { setInvInput(String(n)); seedInventory(n) }} style={{
                  padding: '4px 10px', background: 'none',
                  border: '0.5px solid var(--border)', color: 'var(--muted)',
                  fontFamily: 'var(--mono)', fontSize: '0.55rem', letterSpacing: '0.08em',
                  cursor: 'pointer',
                }}>{n}</button>
              ))}
            </div>
          </Panel>

          {/* ── THROUGHPUT CHART ── */}
          <Panel title="THROUGHPUT (15s buckets)">
            <ThroughputChart data={state.throughput || new Array(20).fill(0)} />
          </Panel>
        </div>

        {/* RIGHT COL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>

          {/* ── LIVE EVENT FEED ── */}
          <Panel title="LIVE EVENT FEED" style={{ flex: '1 1 auto' }}>
            <div ref={feedRef} style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {(state.events || []).length === 0 ? (
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--muted2)', padding: '2rem 0', textAlign: 'center', letterSpacing: '0.1em' }}>
                  NO EVENTS YET
                </div>
              ) : (state.events || []).map(ev => (
                <FeedItem key={ev.id} event={ev} />
              ))}
            </div>
          </Panel>

          {/* ── QUEUE VISUALIZER ── */}
          <Panel title={`QUEUE SLOT HISTORY (last ${(state.queueSlots || []).length})`}>
            <QueueViz slots={state.queueSlots || []} />
            <div style={{ display: 'flex', gap: '1rem', marginTop: '12px', flexWrap: 'wrap' }}>
              {[
                ['success', 'var(--green)', 'Confirmed'],
                ['sold_out', 'var(--muted)', 'Sold Out'],
                ['failed', 'var(--red)', 'Pay Failed'],
              ].map(([key, color, label]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', background: color, opacity: 0.7, display: 'inline-block' }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.08em' }}>{label}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* ── ALL ORDERS TABLE ── */}
          <Panel title={`ALL ORDERS (${(state.orders || []).length})`}>
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Order ID', 'User', 'Size', 'Status', 'Time'].map(h => (
                      <th key={h} style={{ fontFamily: 'var(--mono)', fontSize: '0.5rem', color: 'var(--muted)', letterSpacing: '0.1em', textAlign: 'left', padding: '6px 8px', borderBottom: '0.5px solid var(--border)', fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(state.orders || []).slice(0, 50).map(o => {
                    const color = { confirmed: 'var(--green)', failed: 'var(--red)', pending: 'var(--blue)' }[o.status] || 'var(--muted)'
                    return (
                      <tr key={o.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'var(--muted)', padding: '7px 8px', letterSpacing: '0.04em' }}>{o.id}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--text)', padding: '7px 8px' }}>{o.userName}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--muted)', padding: '7px 8px' }}>UK {o.size}</td>
                        <td style={{ padding: '7px 8px' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.5rem', color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{o.status}</span>
                        </td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: '0.5rem', color: 'var(--muted2)', padding: '7px 8px' }}>
                          {new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {(state.orders || []).length === 0 && (
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--muted2)', padding: '2rem', textAlign: 'center', letterSpacing: '0.1em' }}>NO ORDERS YET</div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────

function Panel({ title, children, style = {} }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', padding: '1.5rem', ...style }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '0.5px solid var(--border)' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function StatCard({ label, val, color }) {
  return (
    <div style={{ background: 'var(--bg2)', padding: '1.25rem 1.5rem', border: '0.5px solid var(--border)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{label}</div>
      <div className={color} style={{ fontFamily: 'var(--display)', fontSize: '2.8rem', letterSpacing: '0.04em', lineHeight: 1 }}>{val}</div>
    </div>
  )
}

function ConfigField({ label, value, onChange, type = 'text', min, max, step }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: '6px', textTransform: 'uppercase' }}>{label}</div>
      <input
        type={type} value={value} min={min} max={max} step={step}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', background: 'var(--bg3)', border: '0.5px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '0.8rem', padding: '8px 10px', outline: 'none' }}
      />
    </div>
  )
}

function Toggle({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => onChange(!value)}>
      <div style={{
        width: '32px', height: '18px', background: value ? 'var(--accent)' : 'var(--bg4)',
        borderRadius: '9px', position: 'relative', transition: 'background 0.2s',
        border: '0.5px solid var(--border)',
      }}>
        <div style={{
          position: 'absolute', top: '2px',
          left: value ? '15px' : '2px',
          width: '12px', height: '12px',
          background: value ? '#000' : 'var(--muted)',
          borderRadius: '50%', transition: 'left 0.2s',
        }} />
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'var(--muted)', letterSpacing: '0.08em' }}>{label}</span>
    </div>
  )
}

function FeedItem({ event }) {
  const colors = {
    success: 'var(--green)',
    failed: 'var(--red)',
    sold_out: 'var(--muted)',
    live: 'var(--accent)',
    info: 'var(--blue)',
    admin: 'var(--orange)',
  }
  const color = colors[event.variant] || 'var(--muted)'
  const time = new Date(event.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

  return (
    <div className="animate-slide-left" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '0.5px solid var(--border)' }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: color, flexShrink: 0, boxShadow: event.variant === 'success' ? `0 0 6px ${color}` : 'none' }} />
      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--muted)', flex: 1, letterSpacing: '0.04em' }}>
        <span style={{ color }}>{event.message}</span>
      </span>
      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.5rem', color: 'var(--muted2)', flexShrink: 0 }}>{time}</span>
    </div>
  )
}

function QueueViz({ slots }) {
  const colorMap = { success: 'var(--green)', failed: 'var(--red)', sold_out: 'var(--muted)' }
  const display = new Array(80).fill(null)
  slots.slice(-80).forEach((s, i) => { display[i] = s })

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
      {display.map((s, i) => (
        <div key={i} style={{
          width: '13px', height: '13px',
          background: s ? colorMap[s] || 'var(--bg4)' : 'var(--bg3)',
          border: `0.5px solid ${s ? 'transparent' : 'var(--border)'}`,
          opacity: s ? (s === 'success' ? 0.85 : 0.5) : 0.3,
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  )
}

function ThroughputChart({ data }) {
  const max = Math.max(...data, 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '72px' }}>
      {data.map((val, i) => {
        const pct = Math.max(2, (val / max) * 100)
        const isLatest = i === data.length - 1
        return (
          <div key={i} title={`${val} req`} style={{
            flex: 1, height: pct + '%',
            background: isLatest ? 'var(--blue)' : 'var(--bg4)',
            borderTop: `1px solid ${isLatest ? 'var(--blue)' : 'var(--border)'}`,
            transition: 'height 0.4s ease',
            minHeight: '2px',
          }} />
        )
      })}
    </div>
  )
}

function DangerBtn({ onClick, label }) {
  return (
    <button onClick={() => { if (confirm('Reset all data?')) onClick() }}
      style={{ padding: '8px 16px', background: 'none', border: '0.5px solid var(--red)', color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.1em', cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.15s' }}
      onMouseOver={e => { e.target.style.background = 'var(--red)'; e.target.style.color = '#fff' }}
      onMouseOut={e => { e.target.style.background = 'none'; e.target.style.color = 'var(--red)' }}>
      {label}
    </button>
  )
}