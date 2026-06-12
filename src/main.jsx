import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CampHub from './CampHub.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CampHub />
  </StrictMode>,
)
