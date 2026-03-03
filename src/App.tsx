import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from '@/components/shared'
import { PhoneFrame } from '@/components/shared'
import { BottomNav } from '@/components/shared'

const customerNavItems = [
  { to: '/', label: 'الرئيسية' },
  { to: '/cars', label: 'السيارات' },
  { to: '/appointments', label: 'المواعيد' },
  { to: '/notifications', label: 'الإشعارات' },
  { to: '/profile', label: 'الملف' },
]

function HomePage() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Dasm Inspection</h1>
      <p className="text-gray-600">مرحباً بك في نظام فحص السيارات</p>
    </div>
  )
}

function AppLayout() {
  return (
    <PhoneFrame role="customer" topBar={<span className="text-white font-bold">DASM</span>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cars" element={<div>السيارات</div>} />
        <Route path="/appointments" element={<div>المواعيد</div>} />
        <Route path="/notifications" element={<div>الإشعارات</div>} />
        <Route path="/profile" element={<div>الملف الشخصي</div>} />
      </Routes>
      <BottomNav role="customer" items={customerNavItems} />
    </PhoneFrame>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
