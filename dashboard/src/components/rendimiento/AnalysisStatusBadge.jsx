"use client";

import React from "react";
import {
    CheckCircle2,
    AlertCircle,
    Clock,
    XCircle,
    AlertTriangle,
} from "lucide-react";

export default function AnalysisStatusBadge({ analysis, evaluationsCount }) {
    // Determine status based on analysis data
    const getStatus = () => {
        if (!analysis) return "unknown";

        // Check if analysis has evaluations
        const hasEvaluations =
            evaluationsCount > 0 ||
            (analysis.total_conversations_analyzed > 0 && evaluationsCount !== 0);

        if (!hasEvaluations) {
            return "incomplete"; // Analysis without evaluations
        }

        if (analysis.status === "finalized") {
            return "complete";
        }

        if (analysis.status === "pending") {
            return "pending";
        }

        return "unknown";
    };

    const status = getStatus();

    const statusConfig = {
        complete: {
            icon: CheckCircle2,
            label: "Completado",
            bgColor: "bg-green-100",
            textColor: "text-green-700",
            borderColor: "border-green-300",
            iconColor: "text-green-600",
        },
        pending: {
            icon: Clock,
            label: "Pendiente",
            bgColor: "bg-orange-100",
            textColor: "text-orange-700",
            borderColor: "border-orange-300",
            iconColor: "text-orange-600",
        },
        incomplete: {
            icon: AlertTriangle,
            label: "Incompleto",
            bgColor: "bg-red-100",
            textColor: "text-red-700",
            borderColor: "border-red-300",
            iconColor: "text-red-600",
            tooltip: "Sin evaluaciones guardadas",
        },
        error: {
            icon: XCircle,
            label: "Error",
            bgColor: "bg-red-100",
            textColor: "text-red-700",
            borderColor: "border-red-300",
            iconColor: "text-red-600",
        },
        unknown: {
            icon: AlertCircle,
            label: "Desconocido",
            bgColor: "bg-gray-100",
            textColor: "text-gray-700",
            borderColor: "border-gray-300",
            iconColor: "text-gray-600",
        },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${config.bgColor} ${config.borderColor} ${config.textColor}`}
            title={config.tooltip || config.label}
        >
            <Icon className={`h-4 w-4 ${config.iconColor}`} />
            <span className="text-xs font-semibold">{config.label}</span>
            {status === "incomplete" && (
                <span className="text-xs">⚠️</span>
            )}
        </div>
    );
}
