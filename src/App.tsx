import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import CoursePortal from './components/CoursePortal'
import AdminPanel from './components/AdminPanel'
import CourseImgBed from './components/CourseImgBed'

/**
 * 应用程序主组件App
 * 使用React Router进行路由管理，包含多个页面路由
 */
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* 路由配置区域 */}
        <Routes>
          {/* 首页路由，指向FileManager组件，并传递token参数为"public" */}
          <Route path="/" element={<CoursePortal />} />
          {/* 管理员页面路由，指向AdminPanel组件 */}
          <Route path="/admin" element={<AdminPanel />} />
          {/* 图片床页面路由，指向ImgBed组件 */}
          <Route path="/imgbed" element={<CourseImgBed />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
