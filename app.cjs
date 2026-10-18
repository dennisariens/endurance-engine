// cPanel / Passenger startup file. Compiled backend only; never a Vite server.
import('./dist-server/start.mjs').catch(() => {
  console.error('Personal Sync startup refused; build the backend before launch.')
  process.exit(1)
})
