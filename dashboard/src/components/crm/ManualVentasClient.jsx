'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { BookOpen, Download, AlertTriangle, CheckCircle, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ManualVentasClient() {
    const [manualData, setManualData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    useEffect(() => {
        const fetchManual = async () => {
            try {
                const res = await fetch('/api/manual-ventas');
                const json = await res.json();
                
                if (res.ok && json.data) {
                    setManualData(json.data);
                } else {
                    setError('No hay manual generado aún.');
                }
            } catch (err) {
                console.error(err);
                setError('Error al cargar el manual.');
            } finally {
                setLoading(false);
            }
        };

        fetchManual();
    }, []);

    const generatePDF = () => {
        if (!manualData) return;
        setGeneratingPdf(true);

        try {
            const doc = new jsPDF();
            const { content, created_at } = manualData;
            
            // Header
            doc.setFillColor(31, 41, 55); // dark grey
            doc.rect(0, 0, 210, 30, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text('Manual de Ventas - Inteligencia Artificial', 14, 20);
            
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            const dateStr = format(new Date(created_at), "dd 'de' MMMM 'de' yyyy, h:mm a", { locale: es });
            doc.text(`Última actualización: ${dateStr}`, 14, 40);

            let currentY = 50;

            // Resumen Ejecutivo
            doc.setFontSize(14);
            doc.setTextColor(59, 130, 246); // blue
            doc.text('Resumen Ejecutivo', 14, currentY);
            currentY += 8;
            doc.setFontSize(10);
            doc.setTextColor(50, 50, 50);
            const splitResumen = doc.splitTextToSize(content.resumen_ejecutivo, 180);
            doc.text(splitResumen, 14, currentY);
            currentY += (splitResumen.length * 5) + 10;

            // Top Objeciones
            if (content.top_objeciones && content.top_objeciones.length > 0) {
                doc.setFontSize(14);
                doc.setTextColor(239, 68, 68); // red
                doc.text('Top Objeciones y Mejores Respuestas', 14, currentY);
                currentY += 5;

                const tableBody = content.top_objeciones.map(obj => [
                    obj.objecion,
                    obj.frecuencia,
                    obj.mejor_respuesta
                ]);

                doc.autoTable({
                    startY: currentY,
                    head: [['Objeción', 'Frecuencia', 'Mejor Respuesta (Generada por IA)']],
                    body: tableBody,
                    theme: 'grid',
                    headStyles: { fillColor: [239, 68, 68] },
                    styles: { fontSize: 9 },
                    columnStyles: {
                        0: { cellWidth: 50 },
                        1: { cellWidth: 25 },
                        2: { cellWidth: 'auto' }
                    }
                });
                currentY = doc.lastAutoTable.finalY + 15;
            }

            // Salón de la Fama
            if (currentY > 250) { doc.addPage(); currentY = 20; }
            if (content.salon_de_la_fama && content.salon_de_la_fama.length > 0) {
                doc.setFontSize(14);
                doc.setTextColor(16, 185, 129); // green
                doc.text('Salón de la Fama (Casos de Éxito)', 14, currentY);
                currentY += 5;

                const tableBody = content.salon_de_la_fama.map(item => [
                    item.situacion,
                    item.tecnica_usada,
                    item.por_que_funciono
                ]);

                doc.autoTable({
                    startY: currentY,
                    head: [['Situación', 'Técnica Usada', 'Por qué funcionó']],
                    body: tableBody,
                    theme: 'grid',
                    headStyles: { fillColor: [16, 185, 129] },
                    styles: { fontSize: 9 }
                });
                currentY = doc.lastAutoTable.finalY + 15;
            }

            // Errores Comunes
            if (currentY > 250) { doc.addPage(); currentY = 20; }
            if (content.errores_comunes && content.errores_comunes.length > 0) {
                doc.setFontSize(14);
                doc.setTextColor(245, 158, 11); // amber
                doc.text('Errores Comunes a Evitar', 14, currentY);
                currentY += 5;

                const tableBody = content.errores_comunes.map(item => [
                    item.error,
                    item.consecuencia,
                    item.como_evitarlo
                ]);

                doc.autoTable({
                    startY: currentY,
                    head: [['Error Detectado', 'Consecuencia', 'Cómo Evitarlo']],
                    body: tableBody,
                    theme: 'grid',
                    headStyles: { fillColor: [245, 158, 11] },
                    styles: { fontSize: 9 }
                });
                currentY = doc.lastAutoTable.finalY + 15;
            }

            // Guía Scalapay
            if (currentY > 230) { doc.addPage(); currentY = 20; }
            if (content.guia_scalapay) {
                doc.setFontSize(14);
                doc.setTextColor(139, 92, 246); // purple
                doc.text('Estrategia Scalapay', 14, currentY);
                currentY += 10;
                
                doc.setFontSize(11);
                doc.setTextColor(50, 50, 50);
                doc.text('Mejores momentos para ofrecer:', 14, currentY);
                currentY += 6;
                doc.setFontSize(10);
                content.guia_scalapay.mejores_momentos_para_ofrecer.forEach(momento => {
                    const txt = doc.splitTextToSize(`• ${momento}`, 180);
                    doc.text(txt, 14, currentY);
                    currentY += (txt.length * 5);
                });

                currentY += 5;
                doc.setFontSize(11);
                doc.text('Argumentos de venta ganadores:', 14, currentY);
                currentY += 6;
                doc.setFontSize(10);
                content.guia_scalapay.argumentos_de_venta.forEach(arg => {
                    const txt = doc.splitTextToSize(`• ${arg}`, 180);
                    doc.text(txt, 14, currentY);
                    currentY += (txt.length * 5);
                });
            }

            doc.save(`Manual_Ventas_IA_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        } catch (err) {
            console.error('Error generando PDF:', err);
            alert('Ocurrió un error al generar el PDF.');
        } finally {
            setGeneratingPdf(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                <span className="ml-4 text-gray-500 font-medium">Sintetizando inteligencia colectiva...</span>
            </div>
        );
    }

    if (error || !manualData) {
        return (
            <div className="flex flex-col justify-center items-center h-[70vh] text-center">
                <BookOpen className="h-16 w-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-700">Manual en preparación</h2>
                <p className="text-gray-500 mt-2 max-w-md">El motor de IA está procesando las conversaciones. El primer manual se generará próximamente.</p>
            </div>
        );
    }

    const { content, created_at } = manualData;
    const dateStr = format(new Date(created_at), "dd MMM yyyy, h:mm a", { locale: es });

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/60 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 flex items-center gap-3">
                        <BookOpen className="h-8 w-8 text-blue-600" />
                        Manual de Ventas Dinámico IA
                    </h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        Actualizado automáticamente: {dateStr}
                    </p>
                </div>
                <button
                    onClick={generatePDF}
                    disabled={generatingPdf}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-70"
                >
                    {generatingPdf ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                    {generatingPdf ? 'Generando Documento...' : 'Descargar PDF (Listo para imprimir)'}
                </button>
            </div>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
                {/* Resumen Ejecutivo (Toma 2 columnas en pantallas grandes) */}
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-6 rounded-3xl border border-blue-100/50 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-10 -top-10 bg-blue-500/10 h-32 w-32 rounded-full blur-3xl transition-transform group-hover:scale-150"></div>
                    <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2 mb-4">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                        Resumen Estratégico
                    </h2>
                    <p className="text-gray-700 leading-relaxed relative z-10 text-lg font-medium">
                        {content.resumen_ejecutivo}
                    </p>
                </motion.div>

                {/* Estrategia Scalapay (1 columna) */}
                <motion.div variants={itemVariants} className="bg-gradient-to-br from-purple-50 to-pink-50/50 p-6 rounded-3xl border border-purple-100/50 shadow-sm relative overflow-hidden group">
                     <div className="absolute -right-10 -top-10 bg-purple-500/10 h-32 w-32 rounded-full blur-3xl transition-transform group-hover:scale-150"></div>
                     <h2 className="text-xl font-bold text-purple-900 flex items-center gap-2 mb-4">
                        <DollarSign className="h-6 w-6 text-purple-600" />
                        Dominando Scalapay
                    </h2>
                    
                    <div className="space-y-4 relative z-10">
                        <div>
                            <h3 className="text-sm font-semibold text-purple-800 uppercase tracking-wider mb-2">Cuándo ofrecer:</h3>
                            <ul className="space-y-2">
                                {content.guia_scalapay?.mejores_momentos_para_ofrecer?.map((m, i) => (
                                    <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                                        <div className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0"></div>
                                        {m}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="pt-2 border-t border-purple-200/50">
                            <h3 className="text-sm font-semibold text-purple-800 uppercase tracking-wider mb-2">Argumentos Estrella:</h3>
                            <ul className="space-y-2">
                                {content.guia_scalapay?.argumentos_de_venta?.map((m, i) => (
                                    <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                                        <div className="h-1.5 w-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0"></div>
                                        {m}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </motion.div>

                {/* Salón de la Fama */}
                <motion.div variants={itemVariants} className="lg:col-span-3 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h2 className="text-xl font-bold text-emerald-900 flex items-center gap-2 mb-6">
                        <CheckCircle className="h-6 w-6 text-emerald-500" />
                        Salón de la Fama (Prácticas Ganadoras)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {content.salon_de_la_fama?.map((item, idx) => (
                            <div key={idx} className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 hover:shadow-md transition-shadow">
                                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full mb-3">
                                    Caso de Éxito #{idx+1}
                                </span>
                                <p className="text-sm text-gray-600 mb-3"><strong className="text-gray-800">Situación:</strong> {item.situacion}</p>
                                <p className="text-sm text-gray-600 mb-3"><strong className="text-gray-800">Técnica:</strong> {item.tecnica_usada}</p>
                                <div className="bg-white p-3 rounded-xl text-sm text-emerald-700 border border-emerald-50">
                                    <strong className="block mb-1 text-xs uppercase tracking-wider text-emerald-600">¿Por qué funcionó?</strong>
                                    {item.por_que_funciono}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Objeciones */}
                <motion.div variants={itemVariants} className="lg:col-span-3 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h2 className="text-xl font-bold text-red-900 flex items-center gap-2 mb-6">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                        Superando Objeciones
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {content.top_objeciones?.map((item, idx) => (
                            <div key={idx} className="bg-red-50/30 p-5 rounded-2xl border border-red-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute right-0 top-0 bg-red-100 px-3 py-1 rounded-bl-xl text-xs font-bold text-red-700">
                                    {item.frecuencia}
                                </div>
                                <h3 className="font-bold text-gray-800 mb-3 pr-16">{item.objecion}</h3>
                                <div className="bg-white p-4 rounded-xl text-sm text-gray-700 border border-red-50 shadow-sm relative z-10">
                                    <strong className="block mb-2 text-xs uppercase tracking-wider text-red-600">La Mejor Respuesta (IA):</strong>
                                    <p className="italic">&quot;{item.mejor_respuesta}&quot;</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Errores a evitar */}
                <motion.div variants={itemVariants} className="lg:col-span-3 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2 mb-6">
                        <AlertTriangle className="h-6 w-6 text-amber-500" />
                        Errores Críticos a Evitar
                    </h2>
                    <div className="space-y-4">
                        {content.errores_comunes?.map((item, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl border border-amber-100 bg-amber-50/20 items-start md:items-center">
                                <div className="bg-amber-100 text-amber-600 font-bold h-10 w-10 flex items-center justify-center rounded-xl flex-shrink-0">
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800">{item.error}</h3>
                                    <p className="text-sm text-gray-600 mt-1"><strong>Consecuencia:</strong> {item.consecuencia}</p>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-amber-100 w-full md:w-1/3 shadow-sm">
                                    <strong className="block mb-1 text-xs uppercase tracking-wider text-amber-600">Corrección:</strong>
                                    <span className="text-sm text-gray-700">{item.como_evitarlo}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

            </motion.div>
        </div>
    );
}
