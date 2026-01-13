import FileManager from './components/FileManager'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <FileManager token="public" onLogout={() => {}} />
    </div>
  )
}

export default App
