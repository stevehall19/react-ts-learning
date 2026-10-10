import { Routes, Route, Outlet, Link } from 'react-router'
import HomePage from './pages/HomePage'
import { CountersProvider } from './CountersProvider'
import CounterPage from './pages/CounterPage'
import NotFound from './pages/NotFound'
import { useCountersContext } from './CountersContext'
import { apiEnabled } from './common'
import { useAuth, useAutoSignin } from 'react-oidc-context'
import { Button } from './Button'

// Signs the user in before anything below it renders: the counters only load once
// there is a user. useAutoSignin redirects to Keycloak from an effect, once.
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, error } = useAutoSignin()

  if (error) {
    return (
      <p className="px-4 py-8 text-red-600">
        Couldn't sign in: {error.message}
      </p>
    )
  }
  if (isLoading || !isAuthenticated) {
    return <p className="px-4 py-8">Signing in…</p>
  }
  return children
}

function NoGate({ children }: { children: React.ReactNode }) {
  return children
}

// Chosen once, like useCountersImpl: the Pages build has no AuthProvider to gate on.
const Gate = apiEnabled ? AuthGate : NoGate

// Ends Keycloak's session too, so the next visit shows the login form instead of
// bouncing straight back. Keycloak then returns to post_logout_redirect_uri.
function SignOutButton() {
  const auth = useAuth()
  return (
    <Button variant="ghost" onClick={() => void auth.signoutRedirect()}>
      Sign out
    </Button>
  )
}

function NoSignOutButton() {
  return null
}

const SignOut = apiEnabled ? SignOutButton : NoSignOutButton

function Layout() {
  const { status, error } = useCountersContext()

  return (
    <div>
      <nav className="flex items-center justify-between">
        <Link to="/">Counters</Link>
        <SignOut />
      </nav>
      {status === 'loading' && <p className="px-4 py-8">Loading counters…</p>}
      {status === 'error' && (
        <p className="px-4 py-8 text-red-600">
          Couldn't load counters: {error}
        </p>
      )}
      {status === 'ready' && <Outlet />}
    </div>
  )
}

function App() {
  return (
    <Gate>
      <CountersProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="counters/:id" element={<CounterPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </CountersProvider>
    </Gate>
  )
}

export default App
