import { useEffect, useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '@/api/admin';
import { useToast } from '@/components/ui/Toast';
import {
  Loader2, Search, Map, List, Eye, QrCode,
  Compass, HelpCircle, ArrowUpDown,
} from 'lucide-react';
import { MapContainer, TileLayer, useMap as useLeafletMap, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { TILE_LAYERS, TILE_ATTRIBUTIONS, DEFAULT_CENTER, DEFAULT_ZOOM } from '@/utils/constants';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Types ───────────────────────────────────────────────
// Backend returns PascalCase; we map to camelCase for frontend
interface VisitLogRaw {
  Id: number;
  POIId: number;
  PoiName: string;
  Latitude: number;
  Longitude: number;
  SessionId: string;
  TriggerType: string;
  LanguageCode: string;
  VisitedAt: string;
}

interface VisitLogItem {
  id: number;
  poiId: number;
  poiName: string;
  latitude: number;
  longitude: number;
  sessionId: string;
  triggerType: string;
  languageCode: string;
  visitedAt: string;
}

function mapVisitLog(raw: VisitLogRaw): VisitLogItem {
  return {
    id: raw.Id,
    poiId: raw.POIId,
    poiName: raw.PoiName,
    latitude: raw.Latitude,
    longitude: raw.Longitude,
    sessionId: raw.SessionId,
    triggerType: raw.TriggerType,
    languageCode: raw.LanguageCode,
    visitedAt: raw.VisitedAt,
  };
}

interface HeatPoint { lat: number; lng: number; weight: number; name: string; }

// ─── Heatmap Layer (Leaflet) ──────────────────────────────
function VisitHeatmapLayer({ points }: { points: HeatPoint[] }) {
  const leafletMap = useLeafletMap();
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!leafletMap || points.length === 0) return;

    if (heatLayerRef.current) {
      leafletMap.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (typeof (L as any).heatLayer !== 'function') return;

    const heatData = points.map(p => [p.lat, p.lng, Math.min(p.weight / 10, 1)] as [number, number, number]);

    const heatLayer = (L as any).heatLayer(heatData, {
      radius: 35,
      blur: 20,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.0: 'rgba(33,102,172,0)',
        0.2: 'rgba(45,212,191,0.6)',
        0.4: 'rgba(34,197,94,0.75)',
        0.6: 'rgba(234,179,8,0.85)',
        0.8: 'rgba(249,115,22,0.92)',
        1.0: 'rgba(239,68,68,1)',
      },
    });

    heatLayer.addTo(leafletMap);
    heatLayerRef.current = heatLayer;

    try {
      const latlngs = points.map(p => [p.lat, p.lng] as L.LatLngExpression);
      leafletMap.fitBounds(L.latLngBounds(latlngs as L.LatLng[]), { padding: [50, 50], maxZoom: 16 });
    } catch { /* ignore */ }

    return () => {
      if (heatLayerRef.current && leafletMap) {
        try { leafletMap.removeLayer(heatLayerRef.current); } catch { /* ignore */ }
        heatLayerRef.current = null;
      }
    };
  }, [leafletMap, points]);

  return (
    <>
      {points.map((point) => {
        const intensity = Math.min(point.weight, 12);
        const radius = 8 + intensity * 2.5;
        const opacity = Math.min(0.18 + intensity * 0.04, 0.85);

        return (
          <CircleMarker
            key={`${point.lat}-${point.lng}-${point.name}`}
            center={[point.lat, point.lng]}
            radius={radius}
            pathOptions={{
              color: '#f97316',
              weight: 1,
              fillColor: intensity > 8 ? '#ef4444' : intensity > 4 ? '#f59e0b' : '#14b8a6',
              fillOpacity: opacity,
            }}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-bold text-sm text-text-primary">{point.name}</div>
                <div className="text-xs text-text-secondary">{point.weight} lượt ghé thăm</div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

// ─── Heatmap Map wrapper (standalone MapContainer) ────────
function HeatmapMap({ points }: { points: HeatPoint[] }) {
  const { theme } = useTheme();
  const tileUrl  = theme === 'dark' ? TILE_LAYERS.dark  : TILE_LAYERS.light;
  const tileAttr = theme === 'dark' ? TILE_ATTRIBUTIONS.dark : TILE_ATTRIBUTIONS.light;

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      zoomControl={true}
      className="w-full h-full"
      style={{ zIndex: 0 }}
    >
      <TileLayer url={tileUrl} attribution={tileAttr} key={tileUrl} />
      <VisitHeatmapLayer points={points} />
    </MapContainer>
  );
}

// ─── Badge helper ─────────────────────────────────────────
function TriggerBadge({ type }: { type: string }) {
  switch (type.toLowerCase()) {
    case 'qr':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 text-teal-600 dark:text-teal-400 font-semibold text-[10px]">
          <QrCode size={11} /> Quét QR
        </span>
      );
    case 'geofence':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-primary font-semibold text-[10px]">
          <Compass size={11} /> Định vị
        </span>
      );
    case 'manual':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-surface-alt border border-border text-text-secondary font-semibold text-[10px]">
          <Eye size={11} /> Bấm chọn
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-surface-alt border border-border text-text-muted font-semibold text-[10px]">
          <HelpCircle size={11} /> {type}
        </span>
      );
  }
}

// ─── Main Page ────────────────────────────────────────────
export default function TripLogsPage() {
  const { t } = useTranslation();
  const { error: toastError } = useToast();
  const [logs, setLogs] = useState<VisitLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'heatmap'>('list');
  const [search, setSearch] = useState('');
  const [triggerFilter, setTriggerFilter] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortAsc, setSortAsc] = useState(false);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await adminApi.getVisitLogs();
        if (active) setLogs(data);
      } catch {
        toastError(t('admin.triplogs.loadError', 'Không thể tải nhật ký chuyến đi.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [t, toastError]);

  const stats = useMemo(() => {
    const uniqueSessions = new Set(logs.map(l => l.sessionId)).size;
    const counts: Record<string, number> = {};
    logs.forEach(l => { counts[l.poiName] = (counts[l.poiName] || 0) + 1; });
    let topSpot = 'N/A', topCount = 0;
    Object.entries(counts).forEach(([name, c]) => { if (c > topCount) { topSpot = name; topCount = c; } });
    return { total: logs.length, uniqueSessions, topSpot, topCount };
  }, [logs]);

  // Heatmap points: group by coordinate
  const heatmapPoints = useMemo<HeatPoint[]>(() => {
    const map: Record<string, HeatPoint> = {};
    logs.forEach(l => {
      if (!l.latitude || !l.longitude) return;
      const key = `${l.latitude}_${l.longitude}`;
      if (!map[key]) map[key] = { lat: l.latitude, lng: l.longitude, weight: 0, name: l.poiName };
      map[key].weight += 1;
    });
    return Object.values(map);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    let result = [...logs];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l => l.poiName.toLowerCase().includes(q) || l.sessionId.toLowerCase().includes(q));
    }
    if (triggerFilter) result = result.filter(l => l.triggerType === triggerFilter);
    if (langFilter) result = result.filter(l => l.languageCode === langFilter);
    result.sort((a, b) => {
      const diff = new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime();
      return sortAsc ? diff : -diff;
    });
    return result;
  }, [logs, search, triggerFilter, langFilter, sortAsc]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <span className="text-xs font-semibold">Đang tải nhật ký...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
            🗺️ Nhật Ký Chuyến Đi
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Theo dõi mật độ và lịch sử hoạt động khám phá phố ẩm thực của du khách
          </p>
        </div>
        {/* Tab toggle */}
        <div className="flex items-center bg-card border border-border rounded-xl p-1 shrink-0 self-start">
          {(['list', 'heatmap'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all outline-none cursor-pointer ${
                activeTab === tab ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab === 'list' ? <List size={14} /> : <Map size={14} />}
              <span>{tab === 'list' ? 'Danh sách' : 'Bản đồ mật độ'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-2xl">
          <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Tổng lượt truy cập</p>
          <p className="text-2xl font-display font-extrabold text-text-primary mt-1">{stats.total}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl">
          <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Thiết bị duy nhất</p>
          <p className="text-2xl font-display font-extrabold text-text-primary mt-1">{stats.uniqueSessions}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl col-span-2">
          <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Địa điểm ghé nhiều nhất</p>
          <p className="text-sm font-semibold text-text-primary mt-1 truncate">
            {stats.topSpot}
            {stats.topCount > 0 && <span className="text-text-muted font-normal text-xs ml-1.5">({stats.topCount} lượt)</span>}
          </p>
        </div>
      </div>

      {activeTab === 'heatmap' ? (
        /* ── HEATMAP VIEW ── */
        <div className="bg-card border border-border rounded-2xl shadow-md overflow-hidden relative">
          <div className="h-[60vh] min-h-[450px]">
            <HeatmapMap points={heatmapPoints} />
          </div>
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur border border-border/80 p-3 rounded-xl shadow-lg z-[1000] text-[10px] text-text-secondary max-w-[200px] flex flex-col gap-1.5 pointer-events-none">
            <span className="font-bold text-text-primary">Mật độ ghé thăm:</span>
            <div className="h-2.5 w-full rounded-sm bg-gradient-to-r from-teal-400 via-green-400 via-yellow-400 via-orange-400 to-red-500" />
            <div className="flex justify-between text-[9px] font-semibold">
              <span>Thấp</span><span>Trung bình</span><span>Cao</span>
            </div>
          </div>
        </div>
      ) : (
        /* ── LIST VIEW ── */
        <div className="bg-card border border-border rounded-2xl shadow-md p-5 sm:p-6 flex flex-col gap-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex items-center flex-1">
              <Search size={15} className="absolute left-3 text-text-muted pointer-events-none" />
              <input type="text" placeholder="Tìm theo tên cửa hàng hoặc Session ID..."
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-xs focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <select value={triggerFilter} onChange={e => { setTriggerFilter(e.target.value); setCurrentPage(1); }}
              className="h-10 px-3 rounded-xl border border-border bg-card text-xs focus:border-primary focus:outline-none font-medium text-text-secondary">
              <option value="">Tất cả phương thức</option>
              <option value="qr">Quét mã QR</option>
              <option value="geofence">Định vị GPS</option>
              <option value="manual">Bấm chọn bản đồ</option>
            </select>
            <select value={langFilter} onChange={e => { setLangFilter(e.target.value); setCurrentPage(1); }}
              className="h-10 px-3 rounded-xl border border-border bg-card text-xs focus:border-primary focus:outline-none font-medium text-text-secondary">
              <option value="">Tất cả ngôn ngữ</option>
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
              <option value="zh">中文</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-alt/60">
                <tr className="border-b border-border/60 text-text-muted font-bold">
                  <th className="py-2.5 px-3 cursor-pointer hover:text-primary transition-colors select-none"
                    onClick={() => setSortAsc(p => !p)}>
                    <div className="flex items-center gap-1">
                      <span>Thời gian</span><ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th className="py-2.5 px-3">Cửa hàng</th>
                  <th className="py-2.5 px-3">Session ID</th>
                  <th className="py-2.5 px-3">Phương thức</th>
                  <th className="py-2.5 px-3 text-center">Ngôn ngữ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {paginatedLogs.length > 0 ? paginatedLogs.map(log => (
                  <tr key={log.id} className="hover:bg-surface-alt/50 transition-colors">
                    <td className="py-3 px-3 text-text-secondary font-medium">
                      {new Date(log.visitedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-3 font-semibold text-text-primary">{log.poiName}</td>
                    <td className="py-3 px-3 font-mono text-[10px] text-text-muted truncate max-w-[120px]">
                      {log.sessionId || '—'}
                    </td>
                    <td className="py-3 px-3"><TriggerBadge type={log.triggerType} /></td>
                    <td className="py-3 px-3 text-center uppercase font-bold text-primary text-[11px]">
                      {log.languageCode}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-text-muted">
                      Không tìm thấy bản ghi nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-border/50 gap-3">
              <span className="text-[10px] text-text-muted">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)} / {filteredLogs.length} bản ghi
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-border text-[10px] font-semibold bg-card disabled:opacity-40 cursor-pointer outline-none hover:bg-surface-alt transition-colors">
                  ← Trước
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let page = i + 1;
                  if (totalPages > 7) {
                    const start = Math.max(1, currentPage - 3);
                    page = start + i;
                    if (page > totalPages) return null;
                  }
                  return (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`w-8 py-1.5 rounded-lg border text-[10px] font-semibold outline-none cursor-pointer transition-colors ${
                        currentPage === page
                          ? 'bg-primary border-primary text-white'
                          : 'bg-card border-border text-text-secondary hover:bg-surface-alt'
                      }`}>
                      {page}
                    </button>
                  );
                })}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-border text-[10px] font-semibold bg-card disabled:opacity-40 cursor-pointer outline-none hover:bg-surface-alt transition-colors">
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}