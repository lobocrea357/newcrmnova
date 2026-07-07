import { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Clock, Filter, RefreshCw } from 'lucide-react';
import { POC_API } from '@/config/apiConfig';
import { LEAD_STATUS, getStatusMetadata } from '@/lib/poc/eventTypes';
import StatusBadge from './StatusBadge';

/**
 * LeadsDashboard - Dashboard de estadísticas de leads
 * Muestra métricas, distribución por estado y lista filtrable de leads
 */
export default function LeadsDashboard() {
  const [stats, setStats] = useState(null);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    limit: 50
  });

  useEffect(() => {
    fetchStats();
    fetchThreads();
  }, [filters]);

  const fetchStats = async () => {
    try {
      const response = await fetch(POC_API.statusStats);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('[LeadsDashboard] Error fetching stats:', err);
    }
  };

  const fetchThreads = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.limit) params.append('limit', filters.limit);

      const response = await fetch(`${POC_API.threads(filters.limit)}?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Error cargando leads');
      }

      // Filtrar por estado si se selecciona
      let filteredThreads = data.data;
      if (filters.status) {
        filteredThreads = filteredThreads.filter(
          thread => thread.status?.[0]?.current_status === filters.status
        );
      }

      setThreads(filteredThreads);
    } catch (err) {
      console.error('[LeadsDashboard] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('700', '100')}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  const StatusDistribution = () => {
    if (!stats || !stats.by_status) return null;

    const statusEntries = Object.entries(stats.by_status).sort((a, b) => b[1] - a[1]);
    const total = statusEntries.reduce((sum, [_, count]) => sum + count, 0);

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Estado</h3>
        
        <div className="space-y-3">
          {statusEntries.map(([status, count]) => {
            const metadata = getStatusMetadata(status);
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
            
            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{metadata.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{metadata.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                    <span className="text-xs text-gray-500">{percentage}%</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${metadata.bgColor.replace('bg-', 'bg-').replace('100', '500')} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const FilterBar = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtros:</span>
        </div>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Todos los estados</option>
          {Object.values(LEAD_STATUS).map(status => {
            const metadata = getStatusMetadata(status);
            return (
              <option key={status} value={status}>
                {metadata.icon} {metadata.label}
              </option>
            );
          })}
        </select>

        <select
          value={filters.limit}
          onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="25">25 leads</option>
          <option value="50">50 leads</option>
          <option value="100">100 leads</option>
          <option value="200">200 leads</option>
        </select>

        <button
          onClick={() => {
            setFilters({ status: '', limit: 50 });
            fetchStats();
            fetchThreads();
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Limpiar
        </button>
      </div>
    </div>
  );

  const ThreadsList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-sm text-gray-500">Cargando leads...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">Error: {error}</p>
        </div>
      );
    }

    if (threads.length === 0) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No se encontraron leads con los filtros actuales</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ventas
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Monto Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Última Actividad
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {threads.map((thread) => {
                const status = thread.status?.[0];
                const metrics = thread.metrics?.[0];
                
                return (
                  <tr key={thread.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {thread.customer_name || 'Sin nombre'}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {thread.customer_phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {status && status.current_status && (
                        <StatusBadge status={status.current_status} size="sm" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {status?.total_sales || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        ${status?.total_sales_amount ? parseFloat(status.total_sales_amount).toLocaleString('es-VE') : '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-500">
                        {status?.last_activity_at 
                          ? new Date(status.last_activity_at).toLocaleDateString('es-ES')
                          : '-'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => window.location.href = `/conversaciones-poc/${thread.id}/timeline`}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Ver Timeline
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Leads</h1>
          <p className="text-sm text-gray-500 mt-1">Estadísticas y gestión de leads POC</p>
        </div>
        <button
          onClick={() => {
            fetchStats();
            fetchThreads();
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Leads"
            value={stats.total}
            icon={Users}
            color="text-indigo-600"
            subtitle="Leads en el sistema"
          />
          <StatCard
            title="Tasa de Conversión"
            value={`${stats.conversion_rate}%`}
            icon={TrendingUp}
            color="text-green-600"
            subtitle="Leads con ventas"
          />
          <StatCard
            title="Ventas Totales"
            value={stats.total_sales}
            icon={DollarSign}
            color="text-amber-600"
            subtitle="Número de ventas"
          />
          <StatCard
            title="Monto Total"
            value={`$${stats.total_sales_amount ? parseFloat(stats.total_sales_amount).toLocaleString('es-VE') : '0'}`}
            icon={DollarSign}
            color="text-purple-600"
            subtitle="Suma de todas las ventas"
          />
        </div>
      )}

      {/* Status Distribution */}
      <StatusDistribution />

      {/* Filters */}
      <FilterBar />

      {/* Threads List */}
      <ThreadsList />
    </div>
  );
}
