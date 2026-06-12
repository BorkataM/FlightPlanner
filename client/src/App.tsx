import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LocaleProvider } from './context/LocaleContext'
import { ThemeProvider } from './context/ThemeContext'
import { ChatProvider } from './features/ai-copilot/ChatContext'
import ChatWidget from './features/ai-copilot/ChatWidget'
import LandingPage from './pages/LandingPage'
import SearchResultsPage from './pages/SearchResultsPage'
import BookingPage from './pages/BookingPage'
import MyBookingsPage from './pages/MyBookingsPage'
import BoardingPassPage from './pages/BoardingPassPage'
import TravelersPage from './pages/TravelersPage'

function App() {
  return (
    <ThemeProvider>
    <LocaleProvider>
      <AuthProvider>
        <BrowserRouter>
          <ChatProvider>
            <Routes>
              <Route path="/"              element={<LandingPage />} />
              <Route path="/search"        element={<SearchResultsPage />} />
              <Route path="/booking"       element={<BookingPage />} />
              <Route path="/my-bookings"   element={<MyBookingsPage />} />
              <Route path="/boarding-pass" element={<BoardingPassPage />} />
              <Route path="/travelers"     element={<TravelersPage />} />
            </Routes>
            <ChatWidget />
          </ChatProvider>
        </BrowserRouter>
      </AuthProvider>
    </LocaleProvider>
    </ThemeProvider>
  )
}

export default App
