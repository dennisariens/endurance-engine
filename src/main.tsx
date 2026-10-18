import '@vitejs/plugin-react/preamble'
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { PersonalBeta } from './personal/PersonalBeta'

// Web production defaults to authenticated hosting. Packaged Mac remains local.
const hosted = import.meta.env.VITE_AERION_MODE === 'hosted' || (import.meta.env.PROD && location.protocol !== 'file:' && import.meta.env.VITE_AERION_MODE !== 'local')

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {hosted ? <PersonalBeta /> : <App />}
  </React.StrictMode>,
)
