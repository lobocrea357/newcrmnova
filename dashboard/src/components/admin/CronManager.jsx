"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Activity,
  Loader2,
  Save,
  RefreshCw
} from "lucide-react";

export default function CronManager() {
  const [cronStatus, setCronStatus] = useState(null);
  const [configuration, setConfiguration] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [lastAnalysisResult, setLastAnalysisResult] = useState(null);
  const [configEditing, setConfigEditing] = useState(false);
  const [tempConfig, setTempConfig] = useState({});

  // Cargar estado inicial
  useEffect(() => {
    loadCronStatus();
    loadConfiguration();
  }, []);

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadCronStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadCronStatus = async () => {
    try {
      const response = await fetch('/api/cron/daily-analysis');
      if (response.ok) {
        const data = await response.json();
        setCronStatus(data.status);
        if (data.status.last_analysis_result) {
          setLastAnalysisResult(data.status.last_analysis_result);
        }
      }
    } catch (error) {
      console.error('Error loading cron status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/cron/configure');
      if (response.ok) {
        const data = await response.json();
        setConfiguration(data.configuration);
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  const executeAction = async (action) => {
    setActionLoading(action);
    try {
      const response = await fetch('/api/cron/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        await loadCronStatus();
        // Mostrar mensaje de éxito
        alert(`Acción "${action}" ejecutada correctamente`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error(`Error ejecutando ${action}:`, error);
      alert(`Error ejecutando ${action}: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const triggerManualAnalysis = async () => {
    setActionLoading('manual_analysis');
    try {
      const response = await fetch('/api/cron/daily-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      if (result.success) {
        setLastAnalysisResult({
          ...result.data,
          completed_at: result.executed_at
        });
        alert(`Análisis completado: ${result.data.exitosos}/${result.data.total_asesores} asesores procesados`);
      } else {
        alert(`Error en análisis: ${result.error}`);
      }
    } catch (error) {
      console.error('Error en análisis manual:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const saveConfiguration = async () => {
    setActionLoading('save_config');
    try {
      const response = await fetch('/api/cron/configure', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tempConfig),
      });

      if (response.ok) {
        setConfiguration(prev => ({...prev, ...tempConfig}));
        setConfigEditing(false);
        setTempConfig({});
        alert('Configuración guardada correctamente');
        await loadCronStatus();
      } else {
        const error = await response.json();
        alert(`Error guardando configuración: ${error.error}`);
      }
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const startConfigEditing = () => {
    setConfigEditing(true);
    setTempConfig({
      cron_settings: configuration.find(c => c.config_key === 'cron_settings')?.config_value || {}
    });
  };

  const getStatusColor = () => {
    if (!cronStatus) return 'bg-gray-500';
    if (cronStatus.is_analysis_running) return 'bg-yellow-500';
    if (cronStatus.is_running && cronStatus.is_initialized) return 'bg-green-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (!cronStatus) return 'Desconocido';
    if (cronStatus.is_analysis_running) return 'Ejecutando análisis';
    if (cronStatus.is_running && cronStatus.is_initialized) return 'Activo';
    if (cronStatus.is_initialized) return 'Inicializado pero pausado';
    return 'Detenido';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Cargando estado del sistema...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${getStatusColor()}`} />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Sistema de Análisis Diario
                </h2>
                <p className="text-sm text-gray-600">Estado: {getStatusText()}</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => loadCronStatus()}
              disabled={actionLoading === 'refresh'}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de Control */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600" />
              Panel de Control
            </h3>
          </div>

          <div className="p-6 space-y-4">
            {/* Botones de control */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => executeAction('start')}
                disabled={actionLoading === 'start' || (cronStatus?.is_running && cronStatus?.is_initialized)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === 'start' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Iniciar
              </button>

              <button
                onClick={() => executeAction('stop')}
                disabled={actionLoading === 'stop' || !cronStatus?.is_initialized}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === 'stop' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
                Detener
              </button>

              <button
                onClick={() => executeAction('restart')}
                disabled={actionLoading === 'restart'}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === 'restart' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Reiniciar
              </button>

              <button
                onClick={triggerManualAnalysis}
                disabled={actionLoading === 'manual_analysis' || cronStatus?.is_analysis_running}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === 'manual_analysis' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Activity className="h-4 w-4" />
                )}
                Análisis Manual
              </button>
            </div>

            {/* Información del sistema */}
            {cronStatus && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-gray-900">Información del Sistema</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Inicializado:</span>
                    <span className={`ml-2 ${cronStatus.is_initialized ? 'text-green-600' : 'text-red-600'}`}>
                      {cronStatus.is_initialized ? '✓' : '✗'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">En ejecución:</span>
                    <span className={`ml-2 ${cronStatus.is_running ? 'text-green-600' : 'text-red-600'}`}>
                      {cronStatus.is_running ? '✓' : '✗'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Análisis activo:</span>
                    <span className={`ml-2 ${cronStatus.is_analysis_running ? 'text-yellow-600' : 'text-gray-600'}`}>
                      {cronStatus.is_analysis_running ? 'Sí' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Máx. conversaciones:</span>
                    <span className="ml-2 text-gray-900">
                      {cronStatus.configuration?.max_conversations_per_advisor || 20}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Configuración */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                Configuración
              </h3>
              {!configEditing && (
                <button
                  onClick={startConfigEditing}
                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                >
                  Editar
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {configuration.length > 0 && (
              <div className="space-y-4">
                {configuration.map((config) => {
                  if (config.config_key === 'cron_settings') {
                    const settings = configEditing ? tempConfig.cron_settings : config.config_value;

                    return (
                      <div key={config.config_key} className="space-y-3">
                        <h4 className="font-medium text-gray-900">Configuración de Horarios</h4>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Hora de Ejecución
                            </label>
                            {configEditing ? (
                              <input
                                type="time"
                                value={settings.daily_analysis_time || '00:00'}
                                onChange={(e) => setTempConfig(prev => ({
                                  ...prev,
                                  cron_settings: {
                                    ...prev.cron_settings,
                                    daily_analysis_time: e.target.value
                                  }
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            ) : (
                              <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                {settings.daily_analysis_time || '00:00'}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Zona Horaria
                            </label>
                            {configEditing ? (
                              <select
                                value={settings.timezone || 'America/Bogota'}
                                onChange={(e) => setTempConfig(prev => ({
                                  ...prev,
                                  cron_settings: {
                                    ...prev.cron_settings,
                                    timezone: e.target.value
                                  }
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="America/Bogota">Bogotá</option>
                                <option value="America/Mexico_City">Ciudad de México</option>
                                <option value="America/New_York">Nueva York</option>
                                <option value="Europe/Madrid">Madrid</option>
                                <option value="UTC">UTC</option>
                              </select>
                            ) : (
                              <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                {settings.timezone || 'America/Bogota'}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Sistema Habilitado
                            </label>
                            {configEditing ? (
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={settings.enabled || false}
                                  onChange={(e) => setTempConfig(prev => ({
                                    ...prev,
                                    cron_settings: {
                                      ...prev.cron_settings,
                                      enabled: e.target.checked
                                    }
                                  }))}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-900">
                                  {settings.enabled ? 'Habilitado' : 'Deshabilitado'}
                                </span>
                              </label>
                            ) : (
                              <p className={`text-sm px-3 py-2 rounded-md ${
                                settings.enabled
                                  ? 'text-green-900 bg-green-50'
                                  : 'text-red-900 bg-red-50'
                              }`}>
                                {settings.enabled ? '✓ Habilitado' : '✗ Deshabilitado'}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Conversaciones por Asesor
                            </label>
                            {configEditing ? (
                              <input
                                type="number"
                                min="5"
                                max="50"
                                value={settings.max_conversations_per_advisor || 20}
                                onChange={(e) => setTempConfig(prev => ({
                                  ...prev,
                                  cron_settings: {
                                    ...prev.cron_settings,
                                    max_conversations_per_advisor: parseInt(e.target.value)
                                  }
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            ) : (
                              <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                {settings.max_conversations_per_advisor || 20}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}

                {configEditing && (
                  <div className="flex space-x-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={saveConfiguration}
                      disabled={actionLoading === 'save_config'}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === 'save_config' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setConfigEditing(false);
                        setTempConfig({});
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Último resultado de análisis */}
      {lastAnalysisResult && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              Último Análisis Ejecutado
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(lastAnalysisResult.completed_at).toLocaleString('es-ES')}
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Procesados</span>
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {lastAnalysisResult.procesados || lastAnalysisResult.exitosos || 0}
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Ventas</span>
                </div>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {lastAnalysisResult.ventas_totales || 0}
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-purple-600 text-lg">💰</span>
                  <span className="text-sm font-medium text-purple-700">Valor Total</span>
                </div>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  ${(lastAnalysisResult.valor_total || 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  {lastAnalysisResult.errores > 0 ? (
                    <XCircle className="h-5 w-5 text-orange-600" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-orange-600" />
                  )}
                  <span className="text-sm font-medium text-orange-700">Errores</span>
                </div>
                <p className="text-2xl font-bold text-orange-900 mt-1">
                  {lastAnalysisResult.errores || 0}
                </p>
              </div>
            </div>

            {lastAnalysisResult.execution_time_ms && (
              <div className="mt-4 text-sm text-gray-600">
                ⏱️ Tiempo de ejecución: {Math.round(lastAnalysisResult.execution_time_ms / 1000)} segundos
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
