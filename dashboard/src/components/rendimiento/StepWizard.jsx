"use client";

import React from "react";
import { Check } from "lucide-react";

export default function StepWizard({ currentStep, totalSteps = 4 }) {
    const steps = [
        { number: 1, label: "Seleccionar Asesor" },
        { number: 2, label: "Cargar Conversaciones" },
        { number: 3, label: "Analizar" },
        { number: 4, label: "Guardar" },
    ];

    return (
        <div className="w-full max-w-3xl mx-auto mb-8">
            {/* Progress Bar */}
            <div className="relative">
                {/* Background Line */}
                <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full" />

                {/* Progress Line */}
                <div
                    className="absolute top-5 left-0 h-1 bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                />

                {/* Steps */}
                <div className="relative flex justify-between">
                    {steps.map((step) => {
                        const isCompleted = step.number < currentStep;
                        const isCurrent = step.number === currentStep;
                        const isPending = step.number > currentStep;

                        return (
                            <div key={step.number} className="flex flex-col items-center">
                                {/* Circle */}
                                <div
                                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                    transition-all duration-300 border-2
                    ${isCompleted
                                            ? "bg-blue-600 border-blue-600 text-white"
                                            : isCurrent
                                                ? "bg-white border-blue-600 text-blue-600 ring-4 ring-blue-100"
                                                : "bg-white border-gray-300 text-gray-400"
                                        }
                  `}
                                >
                                    {isCompleted ? (
                                        <Check className="h-5 w-5" />
                                    ) : (
                                        step.number
                                    )}
                                </div>

                                {/* Label */}
                                <div
                                    className={`
                    mt-2 text-xs font-medium text-center
                    ${isCurrent
                                            ? "text-blue-600"
                                            : isCompleted
                                                ? "text-gray-700"
                                                : "text-gray-400"
                                        }
                  `}
                                >
                                    {step.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step Counter */}
            <div className="text-center mt-6">
                <p className="text-sm text-gray-600">
                    Paso <span className="font-bold text-blue-600">{currentStep}</span> de{" "}
                    {totalSteps}
                </p>
            </div>
        </div>
    );
}
