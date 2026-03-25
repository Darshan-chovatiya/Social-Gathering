import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import FaviconSync from './components/common/FaviconSync.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <FaviconSync />
      <App />
    </HashRouter>
  </React.StrictMode>,
)
