import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { BrowserRouter } from 'react-router'
import { userManager } from './auth'
import { AuthProvider } from 'react-oidc-context'
import { apiEnabled } from './common'

if (apiEnabled) {
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {userManager ? (
        <AuthProvider userManager={userManager}>
          <App />
        </AuthProvider>
      ) : (
        <App />
      )}
    </BrowserRouter>
  </StrictMode>,
)
