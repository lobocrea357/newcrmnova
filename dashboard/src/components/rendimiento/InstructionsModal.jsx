"use client";

import React from "react";
import {
    Lightbulb,
    CheckCircle2,
    ArrowRight,
    FileText,
    Sparkles,
    BarChart3,
    X,
} from "lucide-react";

export default function InstructionsModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const steps = [
        {
            number: 1,
            title: "Selecciona un Asesor",
            description:
                "Elige el asesor que deseas analizar desde el dropdown de 'Asesor'",
            icon: CheckCircle2,
            color: "blue",
        },
        {
            number: 2,
            title: "Carga las Conversaciones",
            description:
                "Click en 'Cargar Conversaciones' para obtener los chats del asesor. Puedes filtrar por fecha.",
            icon: FileText,
            color: "green",
        },
        {
            number: 3,
            title: "Analiza con IA",
            description:
                "Click en 'Analizar con IA' para que el sistema evalúe automáticamente las conversaciones según 7 parámetros de rendimiento.",
            icon: Sparkles,
            color: "purple",
        },
        {
            number: 4,
            title: "Revisa y Ajusta",
            description:
                "Revisa las evaluaciones generadas. Puedes editar manualmente cualquier parámetro si es necesario.",
            icon: CheckCircle2,
            color: "orange",
        },
        {
            number: 5,
            title: "Guarda el Análisis",
            description:
                "Click en 'Guardar Análisis' para crear el reporte. El sistema generará automáticamente un informe detallado.",
            icon: BarChart3,
            color: "indigo",
        },
    ];

    const getColorClasses = (color) => {
        const colors = {
            blue: "bg-blue-100 text-blue-600",
            green: "bg-green-100 text-green-600",
            purple: "bg-purple-100 text-purple-600",
            orange: "bg-orange-100 text-orange-600",
            indigo: "bg-indigo-100 text-indigo-600",
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Lightbulb className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">
                                    Cómo Usar el Sistema de Análisis
                                </h2>
                                <p className="text-indigo-100 text-sm mt-1">
                                    Guía paso a paso para analizar el rendimiento de tus asesores
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Steps */}
                    <div className="space-y-4">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <div
                                    key={step.number}
                                    className="flex gap-4 p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
                                >
                                    {/* Number Badge */}
                                    <div className="flex-shrink-0">
                                        <div
                                            className={`w-12 h-12 rounded-full ${getColorClasses(step.color)} flex items-center justify-center font-bold text-lg`}
                                        >
                                            {step.number}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Icon className="h-5 w-5 text-gray-600" />
                                            <h3 className="font-bold text-gray-900 text-lg">
                                                {step.title}
                                            </h3>
                                        </div>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>

                                    {/* Arrow */}
                                    {index < steps.length - 1 && (
                                        <div className="flex-shrink-0 flex items-center">
                                            <ArrowRight className="h-5 w-5 text-gray-300" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Tips Section */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <Lightbulb className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-amber-900 mb-2">
                                    💡 Consejos Importantes
                                </h4>
                                <ul className="space-y-1 text-sm text-amber-800">
                                    <li>
                                        • El análisis con IA evalúa 7 parámetros: tiempo de
                                        contacto, tiempo de respuesta, tiempo de cotización, cierre
                                        con intención, ofreció Scalapay, más de 2 opciones y
                                        seguimiento.
                                    </li>
                                    <li>
                                        • Puedes editar manualmente cualquier evaluación haciendo
                                        click en el ícono de expandir (▼) en cada conversación.
                                    </li>
                                    <li>
                                        • Los reportes se guardan automáticamente y puedes verlos
                                        en la sección "Reportes".
                                    </li>
                                    <li>
                                        • Para análisis masivo de todos los asesores, usa el botón
                                        "Análisis Masivo" en la parte superior.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <CheckCircle2 className="h-5 w-5" />
                            Entendido, Comenzar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
