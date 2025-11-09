import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Pastikan Tailwind CSS diimpor
import { StoreProvider } from './context/StoreContext.jsx' // Impor Provider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Bungkus App dengan Provider */}
    <StoreProvider>
      <App />
    </StoreProvider>
  </React.StrictMode>,
)