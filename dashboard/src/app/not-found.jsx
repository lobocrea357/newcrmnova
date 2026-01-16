'use client'

import Link from 'next/link'
import { Home, ArrowLeft, Search, FileQuestion } from 'lucide-react'
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const NotFound = () => {

    const router = useRouter();
    const [canGoBack, setCanGoBack] = useState(false)

    useEffect(() => {
        if (typeof document !== 'undefined') {
            const referrer = document.referrer

            // Cambia esto por tu dominio real
            const isInternalReferrer =
                referrer && referrer.startsWith(window.location.origin)

            setCanGoBack(isInternalReferrer)
        }
    }, [])

    const handleBack = () => {
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push('/');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
            <div className="max-w-2xl w-full text-center">
                {/* Icono animado */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 opacity-20 blur-3xl rounded-full animate-pulse"></div>
                        <div className="relative bg-white rounded-full p-8 shadow-2xl">
                            <FileQuestion className="h-24 w-24 text-blue-600" />
                        </div>
                    </div>
                </div>

                {/* Código de error */}
                <h1 className="text-9xl font-bold text-gray-800 mb-4 tracking-tight">
                    404
                </h1>

                {/* Mensaje principal */}
                <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                    Página no encontrada
                </h2>

                <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                    Lo sentimos, la página que buscas no existe o ha sido movida.
                    Verifica la URL o regresa al dashboard.
                </p>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl font-medium"
                    >
                        <Home className="h-5 w-5" />
                        Ir al Dashboard
                    </Link>
                    {canGoBack && (
                        <button
                            onClick={handleBack}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors border border-gray-300 shadow-md font-medium"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            Volver atrás
                        </button>
                    )}
                </div>

                {/* Enlaces rápidos */}
                {/* <div className="mt-12 pt-8 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-4">Enlaces rápidos:</p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm">
                        <Link href="/conversaciones" className="text-blue-600 hover:text-blue-700 hover:underline">
                            Conversaciones
                        </Link>
                        <Link href="/inteligencia-artificial" className="text-blue-600 hover:text-blue-700 hover:underline">
                            IA
                        </Link>
                        <Link href="/desempenio" className="text-blue-600 hover:text-blue-700 hover:underline">
                            Desempeño
                        </Link>
                        <Link href="/reportes" className="text-blue-600 hover:text-blue-700 hover:underline">
                            Reportes
                        </Link>
                        <Link href="/configuracion" className="text-blue-600 hover:text-blue-700 hover:underline">
                            Configuración
                        </Link>
                    </div>
                </div> */}
            </div>
        </div>
    )
}

export default NotFound