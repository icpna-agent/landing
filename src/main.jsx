import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // <-- Debe estar aquí 
import App from './App.jsx'

globalThis.__ICPNA_BACKEND_URL__ = import.meta.env.VITE_BACKEND_URL

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
