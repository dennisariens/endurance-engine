import './styles.css'

export default function App() {
  return (
    <main className="app">
      <section className="hero">
        <p className="eyebrow">Working codename: AERION</p>
        <h1>Fixed-race endurance control</h1>
        <p>
          Race calendar first. Recovery consequences visible. Aerobic work protected.
        </p>
      </section>

      <section className="grid">
        <article className="card red">
          <span>Status</span>
          <strong>Pre-Race Damage Control</strong>
          <p>Race tomorrow. No extra intensity. Fuel, sleep, preserve freshness.</p>
        </article>
        <article className="card blue">
          <span>Next Race</span>
          <strong>Chasing Frankfurt</strong>
          <p>2026-05-01 · 45 km · 615 m · Class 2</p>
        </article>
        <article className="card yellow">
          <span>Latest Race Cost</span>
          <strong>82 / Extreme</strong>
          <p>Recovery optimization active. Strength and fasting blocked.</p>
        </article>
        <article className="card green">
          <span>Aerobic Engine</span>
          <strong>Z2 protected</strong>
          <p>Build between races. Lower cap when fatigue or HR drift rises.</p>
        </article>
      </section>
    </main>
  )
}
