import { AuthProvider } from './context/AuthContext'
import { LocaleProvider } from './context/LocaleContext'
import LandingPage from './pages/LandingPage'

function App() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <LandingPage />
      </AuthProvider>
    </LocaleProvider>
  )
}

export default App
