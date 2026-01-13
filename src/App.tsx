import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import FileManager from './components/FileManager'
import AdminPanel from './components/AdminPanel'
import ImgBed from './components/ImgBed'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<FileManager token="public" onLogout={() => {}} />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/imgbed" element={<ImgBed />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
