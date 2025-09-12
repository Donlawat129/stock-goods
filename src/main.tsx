import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter as Router } from 'react-router-dom'  // 👈 เพิ่มบรรทัดนี้
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>   {/* 👈 ห่อ App ด้วย Router */}
      <App />
    </Router>
  </StrictMode>,
)
