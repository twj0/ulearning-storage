import { BrowserRouter, Routes, Route } from 'react-router-dom'
import FileManager from './components/FileManager'
import AdminPanel from './components/AdminPanel'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FileManager token="public" onLogout={() => {}} />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
