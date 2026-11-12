import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/saira-condensed/500.css'
import '@fontsource/saira-condensed/700.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
