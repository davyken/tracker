// src/components/MapPanel.jsx
import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default icon paths broken by Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored icon factory
const makeIcon = (color, emoji) => L.divIcon({
  className: '',
  html: `<div style="
    width:36px;height:36px;border-radius:50%;
    background:${color};border:3px solid #fff;
    box-shadow:0 0 16px ${color};
    display:flex;align-items:center;justify-content:center;
    font-size:16px;
  ">${emoji}</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const homeIcon  = makeIcon('#00d4ff', '🏠');
const thiefIcon = makeIcon('#ff3c5a', '🎯');
const baitIcon  = makeIcon('#00ff88', '📍');

// Auto-fit map to all markers
function AutoFit({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [positions, map]);
  return null;
}

// HOME position: Yaoundé city center
const HOME = [3.8667, 11.5167];

export default function MapPanel({ latest, captures, session }) {
  const [thiefPos,  setThiefPos]  = useState(null);
  const [routePoints, setRoutePoints] = useState([HOME]);

  useEffect(() => {
    if (latest) {
      const pos = [latest.lat, latest.lng];
      setThiefPos(pos);
      setRoutePoints(prev => [...prev, pos]);
    }
  }, [latest]);

  const allPositions = [HOME, ...(thiefPos ? [thiefPos] : [])];

  return (
    <div className="relative flex-1 min-h-[500px]">
      <MapContainer
        center={HOME}
        zoom={14}
        style={{ width: '100%', height: '100%', minHeight: 500 }}
        zoomControl={true}
      >
        {/* Dark tile layer — OpenStreetMap (free, no key) */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {/* Auto-fit when new points arrive */}
        <AutoFit positions={allPositions} />

        {/* Home marker */}
        <Marker position={HOME} icon={homeIcon}>
          <Popup>
            <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
              <strong>🏠 HOME / Last known location</strong><br />
              Yaoundé, Cameroun<br />
              {HOME[0]}, {HOME[1]}
            </div>
          </Popup>
        </Marker>

        {/* Route line */}
        {routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            pathOptions={{ color: '#ffaa00', weight: 3, dashArray: '8 6', opacity: 0.8 }}
          />
        )}

        {/* Thief marker + accuracy circle */}
        {thiefPos && (
          <>
            <Circle
              center={thiefPos}
              radius={latest?.accuracy || 50}
              pathOptions={{ color: '#ff3c5a', fillColor: '#ff3c5a', fillOpacity: 0.08, weight: 1 }}
            />
            <Marker position={thiefPos} icon={thiefIcon}>
              <Popup>
                <div style={{ fontFamily: 'monospace', fontSize: 12, minWidth: 180 }}>
                  <strong style={{ color: '#ff3c5a' }}>🎯 THIEF LAST SEEN</strong><br /><br />
                  <b>Coords:</b> {latest?.lat?.toFixed(6)}, {latest?.lng?.toFixed(6)}<br />
                  <b>Accuracy:</b> ±{latest?.accuracy}m<br />
                  <b>GPS:</b> {latest?.realGPS ? '🛰 Real GPS' : '📡 Network Est.'}<br />
                  <b>Device:</b> {latest?.device}<br />
                  <b>IP:</b> {latest?.ip}<br />
                  {latest?.ipCity && <><b>Location:</b> {latest.ipCity}, {latest.ipRegion}<br /></>}
                  <b>Time:</b> {latest?.timestamp ? new Date(latest.timestamp).toLocaleTimeString() : '—'}
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Each capture as a smaller green dot */}
        {captures.slice(1).map((c, i) => (
          <Marker key={i} position={[c.lat, c.lng]} icon={baitIcon}>
            <Popup>
              <div style={{ fontFamily: 'monospace', fontSize: 11 }}>
                Capture #{captures.length - i - 1}<br />
                {c.lat?.toFixed(5)}, {c.lng?.toFixed(5)}<br />
                {new Date(c.timestamp).toLocaleTimeString()}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* HUD Overlays */}
      <div className="absolute top-3 left-3 z-[1000] bg-panel/90 border border-border rounded-md px-3 py-2 font-mono text-xs backdrop-blur-sm pointer-events-none">
        <div className="text-text-dim">LAT: <span className="text-accent">{latest?.lat?.toFixed(5) || HOME[0]}</span></div>
        <div className="text-text-dim">LNG: <span className="text-accent">{latest?.lng?.toFixed(5) || HOME[1]}</span></div>
        <div className="text-text-dim">ACC: <span className="text-success">±{latest?.accuracy || '--'}m</span></div>
        <div className="mt-1 text-danger font-bold">
          {latest ? '🎯 TARGET LOCKED' : '⏳ AWAITING BAIT'}
        </div>
      </div>

      <div className="absolute top-3 right-3 z-[1000] bg-panel/90 border border-border rounded-md px-3 py-2 font-mono text-xs backdrop-blur-sm pointer-events-none text-right">
        <div className="text-text-dim">GPS: <span className={latest?.realGPS ? 'text-success' : 'text-warn'}>{latest?.realGPS ? '🛰 REAL' : '📡 EST.'}</span></div>
        <div className="text-text-dim">PINGS: <span className="text-accent">{captures.length}</span></div>
        <div className="text-text-dim">SESSION: <span className="text-accent">{session?.sessionId || '--'}</span></div>
      </div>

      <div className="absolute bottom-3 right-3 z-[1000] bg-panel/90 border border-border rounded-md px-3 py-2 font-mono text-xs backdrop-blur-sm pointer-events-none">
        <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-accent" style={{boxShadow:'0 0 8px #00d4ff'}}></div><span className="text-text-dim">Home</span></div>
        <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-danger" style={{boxShadow:'0 0 8px #ff3c5a'}}></div><span className="text-text-dim">Thief</span></div>
        <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-warn"   style={{boxShadow:'0 0 8px #ffaa00'}}></div><span className="text-text-dim">Route</span></div>
        <div className="flex items-center gap-2">   <div className="w-2 h-2 rounded-full bg-success" style={{boxShadow:'0 0 8px #00ff88'}}></div><span className="text-text-dim">Bait click</span></div>
      </div>
    </div>
  );
}
