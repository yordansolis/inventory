"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from './utils/auth'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir según el estado de autenticación
    if (isAuthenticated()) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [router])

  // Mostrar un indicador de carga mientras se realiza la redirección
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-gray-600">Redirigiendo...</p>
      </div>
    </div>
  )
}
