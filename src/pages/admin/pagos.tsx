'use client';

// Imports
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import PageHero from '@/components/PageHero';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DollarSign, CreditCard, Layers } from 'lucide-react';

export default function AdminPagosPage() {
  // Auth & routing
  const { user, isAdmin, isAuthLoaded } = useAuth();
  const router = useRouter();

  // Local state
  const [pagos, setPagos] = useState<any[]>([]);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros de fecha (YYYY-MM-DD)
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Agrupación: servicio o profesional
  const [groupBy, setGroupBy] = useState<'servicio' | 'profesional'>('servicio');

  // --- Fetch datos iniciales ---
  useEffect(() => {
    if (!isAuthLoaded || !user || !isAdmin) return;

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('No se encontró token de autenticación');
      router.replace('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const pagosPromise = fetch(`${process.env.NEXT_PUBLIC_API_PAYMENT}?token=${token}`, {
          cache: 'no-store',
        });
        const turnosPromise = fetch(`${process.env.NEXT_PUBLIC_API_TURNO}?token=${token}`, {
          cache: 'no-store',
        });

        const [pagosRes, turnosRes] = await Promise.all([pagosPromise, turnosPromise]);

        const pagosJson = await pagosRes.json();
        let turnosJson = await turnosRes.json();

        // Enriquecer profesionales si vienen como ID
        const idsSinPop = turnosJson
          .filter((t: any) => typeof t.profesional === 'string')
          .map((t: any) => t.profesional);

        if (idsSinPop.length) {
          try {
            const resUsers = await fetch(`${process.env.NEXT_PUBLIC_API_USER}`);
            if (resUsers.ok) {
              const usuarios = await resUsers.json();
              const map: Record<string, any> = {};
              usuarios.forEach((u: any) => (map[u._id] = u));
              turnosJson = turnosJson.map((t: any) => {
                if (typeof t.profesional === 'string' && map[t.profesional]) {
                  return { ...t, profesional: map[t.profesional] };
                }
                return t;
              });
            }
          } catch (err) {
            console.error('Error enriqueciendo profesionales', err);
          }
        }

        if (!pagosRes.ok) throw new Error(pagosJson.message || 'Error al obtener pagos');
        if (!turnosRes.ok) throw new Error(turnosJson.message || 'Error al obtener turnos');

        setPagos(pagosJson);
        setTurnos(turnosJson);
      } catch (e: any) {
        console.error(e);
        setError(e.message || 'Error al cargar datos');
        toast.error(e.message || 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthLoaded, user, isAdmin, router]);

  // --- Cálculo de totales ---
  const resultados = useMemo(() => {
    if (!pagos.length || !turnos.length) return [] as any[];

    // Construir mapa de turnos por ID para acceso rápido
    const mapTurnos: Record<string, any> = {};
    turnos.forEach((t: any) => {
      mapTurnos[t._id] = t;
    });

    // Rango de fecha
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

    const totales: Record<string, { count: number; total: number }> = {};

    pagos.forEach((pago) => {
      const created = new Date(pago.createdAt);
      if (from && created < from) return;
      if (to && created > to) return;

      (pago.turnos || []).forEach((turnoRef: any) => {
        const turnoId = typeof turnoRef === 'string' ? turnoRef : turnoRef._id;
        const turno = mapTurnos[turnoId];
        if (!turno || !turno.servicio) return;

        const claveAgrupar = groupBy === 'servicio'
          ? (turno.servicio?.nombre || 'Servicio')
          : ((turno.profesional?.first_name || '') + ' ' + (turno.profesional?.last_name || '')).trim() || 'Profesional';

        const precio = turno.servicio?.precio ?? 0;

        if (!totales[claveAgrupar]) {
          totales[claveAgrupar] = { count: 0, total: 0 };
        }

        totales[claveAgrupar].count += 1;
        totales[claveAgrupar].total += precio;
      });
    });

    return Object.entries(totales).map(([servicio, val]) => ({
      servicio,
      ...val,
    }));
  }, [pagos, turnos, dateFrom, dateTo, groupBy]);

  const nf = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0 });
  const cf = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

  const totalGeneral = resultados.reduce((acc, r) => acc + r.total, 0);
  const totalTurnos = turnos.length;

  return (
    <>
      <PageHero
        title="Pagos"
        description="Listado y reporte de pagos registrados"
      />

      <section className="max-w-5xl mx-auto px-4 py-10">
        {/* Resumen métricas */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {/* Total Facturado */}
            <div className="bg-white shadow-sm border rounded-lg p-6 flex gap-4 items-center">
              <div className="p-3 rounded-lg bg-accent/30 text-primary">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-soft2">Total Facturado</p>
                <p className="text-2xl font-bold text-primary leading-snug">{cf.format(totalGeneral)}</p>
                <p className="text-sm text-gray-500">{pagos.length} pagos registrados</p>
              </div>
            </div>

            {/* Pagos realizados */}
            <div className="bg-white shadow-sm border rounded-lg p-6 flex gap-4 items-center">
              <div className="p-3 rounded-lg bg-accent/30 text-primary">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-soft2">Pagos Realizados</p>
                <p className="text-2xl font-bold text-primary leading-snug">{nf.format(pagos.length)}</p>
                <p className="text-sm text-gray-500">{nf.format(totalTurnos)} turnos asociados</p>
              </div>
            </div>

            {/* Agrupaciones distintas */}
            <div className="bg-white shadow-sm border rounded-lg p-6 flex gap-4 items-center">
              <div className="p-3 rounded-lg bg-accent/30 text-primary">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-soft2">{groupBy === 'servicio' ? 'Servicios Distintos' : 'Profesionales Distintos'}</p>
                <p className="text-2xl font-bold text-primary leading-snug">{nf.format(resultados.length)}</p>
                <p className="text-sm text-gray-500">Agrupados por {groupBy}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 items-end mb-8">
          <div>
            <label htmlFor="date-from" className="block text-sm mb-1">Desde</label>
            <input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
              placeholder="Selecciona fecha inicial"
            />
          </div>
          <div>
            <label htmlFor="date-to" className="block text-sm mb-1">Hasta</label>
            <input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
              placeholder="Selecciona fecha final"
            />
          </div>
          <div>
            <label htmlFor="group-by" className="block text-sm mb-1">Agrupar por</label>
            <select
              id="group-by"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="border rounded-lg px-3 py-2 w-full"
            >
              <option value="servicio">Servicio</option>
              <option value="profesional">Profesional</option>
            </select>
          </div>
        </div>

        {/* Estado de carga / error */}
        {loading && (
          <p className="text-center text-gray-600">Cargando datos...</p>
        )}
        {error && (
          <p className="text-center text-red-600 mb-4">{error}</p>
        )}

        {/* Tabla de resultados */}
        {!loading && !error && (
          resultados.length ? (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full" id="pagos-table">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {groupBy === 'servicio' ? 'Servicio' : 'Profesional'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turnos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total $</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {resultados.map((row) => (
                      <tr key={row.servicio || row.profesional || row.nombre} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">{row.servicio || row.prof || row.clave || row.nombre || row.profesional}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{row.count}</td>
                        <td className="px-6 py-4 whitespace-nowrap">${row.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-6 py-3">TOTAL</td>
                      <td className="px-6 py-3"></td>
                      <td className="px-6 py-3">${totalGeneral.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-600">No se registran pagos en este período.</p>
          )
        )}
      </section>
    </>
  );
}
