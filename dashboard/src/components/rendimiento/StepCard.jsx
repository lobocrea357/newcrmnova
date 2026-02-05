"use client";

import React from "react";

export default function StepCard({
    title,
    description,
    children,
    icon: Icon
}) {
    return (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                {Icon && (
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <Icon className="h-8 w-8 text-blue-600" />
                    </div>
                )}
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
                {description && (
                    <p className="text-gray-600">{description}</p>
                )}
            </div>

            {/* Content */}
            <div className="space-y-6">
                {children}
            </div>
        </div>
    );
}
