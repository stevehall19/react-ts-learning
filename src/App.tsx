import { Routes, Route, Outlet, Link } from 'react-router'
import HomePage from './pages/HomePage'
import { CountersProvider } from './CountersProvider'
import CounterPage from './pages/CounterPage'
import NotFound from './pages/NotFound'
import { useCountersContext } from './CountersContext'

function Layout() {
  const { status, error } = useCountersContext()
  return (
    <div>
      <nav>
        <Link to="/">Counters</Link>
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
    <CountersProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="counters/:id" element={<CounterPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </CountersProvider>
  )
}

export default App
