
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'

// Pages
import Landing from './pages/Landing/Landing'
import Discover from './pages/Discover/Discover'
import Dashboard from './pages/Dashboard/Dashboard'
import Profile from './pages/Profile/Profile'
import Upload from './pages/Upload/Upload'
import Login from './pages/Login/Login'
import Signup from './pages/Signup/Signup'
import Collections from './pages/Collections/Collections'
import CollectionDetail from './pages/CollectionDetail/CollectionDetail'
import CreateCollection from './pages/CreateCollection/CreateCollection'
import EditCollection from './pages/EditCollection/EditCollection'
import EditProfile from './pages/EditProfile/EditProfile'
import Saved from './pages/Saved/Saved'
// Components
import Header from './components/Header/Header'
import Footer from './components/Footer/Footer'

// Styles
import './App.css'

function App() {
  return (
    <Router>
      <div className="App flex flex-col min-h-screen">
        {/* Catch Clerk verification redirect - redirect to email verification */}
        <Routes>
          
          <Route path="*" element={<AppRoutes />} />
        </Routes>
      </div>
    </Router>
  )
}

function AppRoutes() {
  return (
    <>
      {/* Signed In Users */}
      <SignedIn>
        <Header />
        <main className="flex-grow bg-black pt-16">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/collections/create" element={<CreateCollection />} />
            <Route path="/collections/:id" element={<CollectionDetail />} />
            <Route path="/collections/:id/edit" element={<EditCollection />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/saved" element={<Saved />} />
            {/* Fallback route for signed-in users */}
            <Route path="*" element={<Profile />} />
          </Routes>
        </main>
        <Footer />
      </SignedIn>
      
      {/* Signed Out Users */}
      <SignedOut>
        <div className='flex flex-col min-h-screen'>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup/*" element={<Signup />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/collections/create" element={<CreateCollection />} />
            <Route path="/collections/:id" element={<CollectionDetail />} />
            <Route path="/collections/:id/edit" element={<EditCollection />} />
            {/* Redirect all other routes to login for signed-out users */}
            <Route path="*" element={<Login />} />
          </Routes>
          <Footer />
        </div>
      </SignedOut>
    </>
  )
}

export default App