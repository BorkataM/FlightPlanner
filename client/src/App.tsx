import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LocaleProvider } from './context/LocaleContext'
import LandingPage from './pages/LandingPage'
import SearchResultsPage from './pages/SearchResultsPage'

function App() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/"       element={<LandingPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LocaleProvider>
  )
}

export default App
