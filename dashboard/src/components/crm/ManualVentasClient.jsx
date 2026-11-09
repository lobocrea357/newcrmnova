'use client';

import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { BookOpen, Download, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Panel, Badge, Button, EmptyState, Skeleton } from '@/components/ui/kit';
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
            <div className="space-y-4">
                <Skeleton className="h-24 rounded-xl" />
                <div className="grid gap-4 lg:grid-cols-2">
                    <Skeleton className="h-64 rounded-xl" />
                    <Skeleton className="h-64 rounded-xl" />
                </div>
            </div>
        );
    }

    if (error || !manualData) {
        return (
            <Panel>
                <EmptyState
                    icon={BookOpen}
                    title="El manual todavía no está listo"
                    description="La IA lo redacta cada noche a la 1:00 (hora de Venezuela) a partir de las conversaciones evaluadas. Aparecerá aquí cuando haya suficientes evaluaciones."
                />
            </Panel>
        );
    }

    const { content, created_at } = manualData;
    const dateStr = format(new Date(created_at), "d 'de' MMMM, h:mm a", { locale: es });
    const scalapay = content.guia_scalapay || {};

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="max-w-3xl">
                    <h2 className="text-lg font-semibold text-tinta">Cómo vendemos mejor, según nuestras conversaciones</h2>
                    <p className="mt-1 text-sm text-gray-500">Actualizado el {dateStr}. Se reescribe cada noche con las evaluaciones nuevas.</p>
                </div>
                <Button variant="primary" onClick={generatePDF} disabled={generatingPdf}>
                    {generatingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {generatingPdf ? 'Generando PDF…' : 'Descargar PDF'}
                </Button>
            </div>

            {content.resumen_ejecutivo && (
                <Panel title="Resumen">
                    <p className="max-w-[75ch] text-[15px] leading-relaxed text-gray-700">{content.resumen_ejecutivo}</p>
                </Panel>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                {content.top_objeciones?.length > 0 && (
                    <Panel title="Objeciones frecuentes" description="Lo que más frena al cliente y la respuesta que mejor ha funcionado">
                        <ul className="space-y-4">
                            {content.top_objeciones.map((item, idx) => (
                                <li key={idx}>
                                    <div className="flex items-baseline justify-between gap-3">
                                        <p className="text-sm font-medium text-tinta">{item.objecion}</p>
                                        {item.frecuencia && <Badge tone="danger">{item.frecuencia}</Badge>}
                                    </div>
                                    {item.mejor_respuesta && (
                                        <p className="mt-1.5 border-l-2 border-nova-300 pl-3 text-sm text-gray-700">{item.mejor_respuesta}</p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </Panel>
                )}

                {content.errores_comunes?.length > 0 && (
                    <Panel title="Errores que cuestan ventas">
                        <ul className="space-y-4">
                            {content.errores_comunes.map((item, idx) => (
                                <li key={idx} className="flex gap-3">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                                    <div>
                                        <p className="text-sm font-medium text-tinta">{item.error}</p>
                                        {item.consecuencia && <p className="mt-0.5 text-sm text-gray-600">{item.consecuencia}</p>}
                                        {item.como_evitarlo && <p className="mt-1 text-sm text-green-800"><span className="font-medium">Cómo evitarlo:</span> {item.como_evitarlo}</p>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </Panel>
                )}

                {content.salon_de_la_fama?.length > 0 && (
                    <Panel title="Técnicas que cerraron ventas" description="Situaciones reales donde el asesor acertó">
                        <ul className="space-y-4">
                            {content.salon_de_la_fama.map((item, idx) => (
                                <li key={idx} className="flex gap-3">
                                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                                    <div className="space-y-1 text-sm">
                                        {item.situacion && <p className="text-gray-600"><span className="font-medium text-gray-800">Situación:</span> {item.situacion}</p>}
                                        {item.tecnica_usada && <p className="text-gray-600"><span className="font-medium text-gray-800">Técnica:</span> {item.tecnica_usada}</p>}
                                        {item.por_que_funciono && <p className="text-gray-700">{item.por_que_funciono}</p>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </Panel>
                )}

                {(scalapay.mejores_momentos_para_ofrecer?.length > 0 || scalapay.argumentos_de_venta?.length > 0) && (
                    <Panel title="Cuándo y cómo ofrecer Scalapay">
                        <div className="grid gap-5 sm:grid-cols-2">
                            {scalapay.mejores_momentos_para_ofrecer?.length > 0 && (
                                <div>
                                    <p className="mb-2 text-sm font-medium text-tinta">Momentos para ofrecerlo</p>
                                    <ul className="space-y-1.5">
                                        {scalapay.mejores_momentos_para_ofrecer.map((m, i) => (
                                            <li key={i} className="flex gap-2 text-sm text-gray-700"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nova-500" />{m}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {scalapay.argumentos_de_venta?.length > 0 && (
                                <div>
                                    <p className="mb-2 text-sm font-medium text-tinta">Argumentos que convencen</p>
                                    <ul className="space-y-1.5">
                                        {scalapay.argumentos_de_venta.map((m, i) => (
                                            <li key={i} className="flex gap-2 text-sm text-gray-700"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nova-500" />{m}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </Panel>
                )}
            </div>
        </div>
    );
}
