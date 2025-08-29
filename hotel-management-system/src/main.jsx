import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import AppStateProvider from './store/AppState.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AppStateProvider>
      <App />
    </AppStateProvider>
  </BrowserRouter>
)
