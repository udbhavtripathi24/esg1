import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const rootElement = document.getElementById('root')

if (!rootElement) {
  console.error('Root element not found!')
} else {
  console.log('Root element found, starting React app...')
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StrictMode>,
    )
    console.log('React app rendered successfully')
  } catch (error) {
    console.error('Error rendering React app:', error)
    rootElement.innerHTML = `<div style="padding: 20px; color: red;">Error: ${error.message}</div>`
  }
}
