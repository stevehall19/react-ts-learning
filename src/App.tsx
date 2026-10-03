import { Routes, Route, Outlet, Link } from 'react-router'
import HomePage from './HomePage'
import { CountersProvider } from './CountersContext.tsx'
import CounterPage from './CounterPage.tsx'
import NotFound from './NotFound.tsx'

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
