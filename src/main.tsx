import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: '#141414',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
          fontSize: '13px',
        },
      }}
    />
  </StrictMode>,
)
