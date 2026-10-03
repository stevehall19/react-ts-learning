import { Routes, Route, Outlet, Link } from 'react-router'
import HomePage from './pages/HomePage'
import { CountersProvider } from './CountersProvider'
import CounterPage from './pages/CounterPage'
import NotFound from './pages/NotFound'

function Layout() {
  return (
    <div>
      <nav>
        <Link to="/">Counters</Link>
      </nav>
      <Outlet />
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
