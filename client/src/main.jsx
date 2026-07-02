import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext.jsx'
import { ChatProvider } from '../context/ChatContext.jsx'

import { GoogleOAuthProvider } from '@react-oauth/google'

const GOOGLE_CLIENT_ID = "305811701965-jb4e6qmo0m3vs24llllv3455fm47b5q6.apps.googleusercontent.com"

createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <App />
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>,
)
