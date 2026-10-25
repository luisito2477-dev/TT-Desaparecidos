import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Extraccion from './pages/Extraccion'
import Formulario from './pages/Formulario'
import Busqueda from './pages/Busqueda'
import Mapa from './pages/Mapa'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Extraccion />} />
        <Route path="formulario" element={<Formulario />} />
        <Route path="busqueda" element={<Busqueda />} />
        <Route path="mapa" element={<Mapa />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
