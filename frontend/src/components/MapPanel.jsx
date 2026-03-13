// src/components/MapPanel.jsx
import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
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
const userIcon  = makeIcon('#00d4ff', '🏠'); // Use home icon for current user
const infoIcon  = makeIcon('#f59e0b', '🔍');
const startIcon = makeIcon('#10b981', '🟢');
const endIcon   = makeIcon('#ef4444', '🏁');

// Auto-fit map to all markers
function AutoFit({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      const bounds = L.latLngBounds(positions.filter(p => p));
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [positions, map]);
  return null;
}

// Handle map clicks and reverse geocoding
function MapEvents({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

// Interactive Map HUD Controls
function MapControls({ onFindMe, onRoute, routeInfo, userPos, zoomLevel, setZoomLevel }) {
  const map = useMap();

  // Sync zoom changes to parent state
  useEffect(() => {
    const handleZoomEnd = () => {
      setZoomLevel(map.getZoom());
    };
    map.on('zoomend', handleZoomEnd);
    return () => map.off('zoomend', handleZoomEnd);
  }, [map, setZoomLevel]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Routing states
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [routing, setRouting] = useState(false);

  const handleSearch = async (e) => {
    if (e.key !== 'Enter' && e.type !== 'click') return;
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' Yaoundé')}&viewbox=11.3,4.0,11.7,3.7&bounded=1&limit=5`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const goToResult = (r) => {
    map.flyTo([parseFloat(r.lat), parseFloat(r.lon)], 16);
    setResults([]);
    setQuery(r.display_name.split(',')[0]);
  };

  const handleRoute = async () => {
    if (!start || !end) return;
    setRouting(true);
    try {
      let sCoord;
      if (start.toLowerCase() === 'my location' && userPos) {
        sCoord = userPos;
      } else {
        const sRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(start + ' Yaoundé')}&limit=1`);
        const sData = await sRes.json();
        if (sData[0]) sCoord = [sData[0].lat, sData[0].lon];
      }

      const eRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(end + ' Yaoundé')}&limit=1`);
      const eData = await eRes.json();
      
      if (sCoord && eData[0]) {
        const eCoord = [eData[0].lat, eData[0].lon];
        onRoute(sCoord, eCoord);
      }
    } catch (err) {
      console.error('Routing failed:', err);
    } finally {
      setRouting(false);
    }
  };

  return (
    <>
      {/* Search Bar (Top Center) */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1001] flex flex-col items-center">
        <div className="flex bg-panel/90 border border-border rounded-md backdrop-blur-sm overflow-hidden w-64 shadow-2xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="SEARCH QUARTER..."
            className="bg-transparent border-none outline-none px-3 py-1.5 font-mono text-[10px] text-text flex-1 uppercase tracking-widest placeholder:text-text-dim/50"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-3 border-l border-border hover:bg-accent/20 transition-colors text-accent text-xs"
          >
            {loading ? '⌛' : '🔍'}
          </button>
        </div>
        {results.length > 0 && (
          <div className="mt-1 w-64 bg-panel/95 border border-border rounded-md backdrop-blur-md overflow-hidden shadow-2xl">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => goToResult(r)}
                className="w-full text-left px-3 py-2 font-mono text-[9px] text-text-dim hover:bg-accent/20 hover:text-accent border-b border-border/30 last:border-0 uppercase truncate"
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Routing Panel (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-[1001] bg-panel/90 border border-border rounded-md p-3 backdrop-blur-sm w-56 shadow-2xl">
        <div className="font-mono text-[10px] text-accent mb-2 tracking-widest">// ROUTE PLANNER</div>
        <div className="relative">
          <input
            type="text"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            placeholder="START POINT..."
            className="w-full bg-black/40 border border-border/50 rounded px-2 py-1 font-mono text-[9px] text-text mb-2 outline-none focus:border-accent"
          />
          {userPos && (
            <button 
              onClick={() => setStart('My Location')}
              className="absolute right-1 top-1 text-[8px] text-accent/60 hover:text-accent bg-accent/10 px-1 rounded border border-accent/20"
            >
              GPS
            </button>
          )}
        </div>
        <input
          type="text"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          placeholder="END POINT..."
          className="w-full bg-black/40 border border-border/50 rounded px-2 py-1 font-mono text-[9px] text-text mb-2 outline-none focus:border-accent"
        />
        <button
          onClick={handleRoute}
          disabled={routing}
          className="w-full bg-accent/20 border border-accent/50 rounded py-1.5 font-mono text-[9px] text-accent hover:bg-accent/40 transition-all uppercase tracking-wider"
        >
          {routing ? 'CALCULATING...' : 'GET DIRECTIONS'}
        </button>
        {routeInfo && (
          <div className="mt-2 pt-2 border-t border-border/30 font-mono text-[9px]">
            <div className="flex justify-between text-text-dim"><span>DIST:</span> <span className="text-success">{routeInfo.distance} km</span></div>
            <div className="flex justify-between text-text-dim"><span>TIME:</span> <span className="text-warn">{routeInfo.duration} min</span></div>
          </div>
        )}
      </div>

      {/* Geolocation & Zoom (Top Right) - Fixed overlap */}
      <div className="absolute top-24 right-4 z-[1001] flex flex-col items-end gap-2 shadow-2xl">
        <button
          onClick={onFindMe}
          className="bg-panel/90 border border-border rounded-md px-3 py-2 font-mono text-[10px] tracking-[0.15em] backdrop-blur-sm hover:bg-accent/20 hover:border-accent transition-all text-accent flex items-center gap-2 shadow-glow-blue"
        >
          <span className="text-xs">📍</span> MY POSITION
        </button>
        
        <div className="flex flex-col bg-panel/90 border border-border rounded-md backdrop-blur-sm overflow-hidden shadow-2xl">
          <button 
          onClick={() => { map.zoomIn(); }}
            className="p-2 hover:bg-accent/20 text-accent font-bold border-b border-border/50"
          >
            +
          </button>
          <button 
            onClick={() => { map.zoomOut(); }}
            className="p-2 hover:bg-accent/20 text-accent font-bold"
          >
            -
          </button>
        </div>
      </div>
    </>
  );
}

// HOME position: Yaoundé city center
const HOME_COORDS = [3.8667, 11.5167];

export default function MapPanel({ latest, captures, session }) {
  const [thiefPos,  setThiefPos]  = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(14);
  
  // New States
  const [userPos, setUserPos] = useState(null);
  const [clickPos, setClickPos] = useState(null);
  const [clickInfo, setClickInfo] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [startAddr, setStartAddr] = useState(null);
  const [endAddr, setEndAddr] = useState(null);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);

  // Real-time tracking for user
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const p = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(p);
      },
      (err) => console.error('GPS Watch failed:', err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (latest) {
      const pos = [latest.lat, latest.lng];
      setThiefPos(pos);
      setRoutePoints(prev => [...prev, pos]);
    }
  }, [latest]);

  const allPositions = [thiefPos, userPos, clickPos, startPoint, endPoint].filter(p => p);

  const handleFindMe = () => {
    if (userPos) {
      const map = L.DomUtil.get('map')?._leaflet_map;
      if (map) {
        map.flyTo(userPos, 17);
        setZoomLevel(17); // Sync state
      }
    } else {
      navigator.geolocation.getCurrentPosition((pos) => {
        const p = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(p);
      });
    }
  };

  const handleMapClick = async (latlng) => {
    setClickPos([latlng.lat, latlng.lng]);
    setClickInfo('Loading info...');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
      const data = await res.json();
      setClickInfo(data.display_name);
    } catch (err) {
      setClickInfo('Info unavailable');
    }
  };

  const handleUserClick = async () => {
    if (!userPos) return;
    setClickPos(userPos);
    setClickInfo('Loading your location info...');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userPos[0]}&lon=${userPos[1]}`);
      const data = await res.json();
      setClickInfo(data.display_name);
    } catch (err) {
      setClickInfo('Info unavailable');
    }
  };

  const handleRoute = async (start, end) => {
    setStartPoint(start);
    setEndPoint(end);
    // Reverse geocode start/end
    const reverseGeocode = async (latlng) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng[0]}&lon=${latlng[1]}&addressdetails=1`);
        const data = await res.json();
        return data.display_name || 'Unknown quarter';
      } catch {
        return 'Loading...';
      }
    };
    setStartAddr(await reverseGeocode(start));
    setEndAddr(await reverseGeocode(end));
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        setRouteGeometry(route.geometry.coordinates.map(c => [c[1], c[0]]));
        setRouteInfo({
          distance: (route.distance / 1000).toFixed(2),
          duration: Math.round(route.duration / 60)
        });
      }
    } catch (err) {
      console.error('OSRM Route failed:', err);
    }
  };

  return (
    <div className="relative flex-1 min-h-[500px]">
<MapContainer
        center={HOME_COORDS}
        zoom={zoomLevel}
        id="map"
        style={{ width: '100%', height: '100%', minHeight: 500 }}
        zoomControl={false} // Disable default zoom control for custom HUD buttons
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        <AutoFit positions={allPositions} />
        <MapEvents onClick={handleMapClick} />
        
<MapControls 
          onFindMe={handleFindMe} 
          onRoute={handleRoute} 
          routeInfo={routeInfo}
          userPos={userPos}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
        />

        {/* User Marker (Home Icon) */}
        {userPos && (
          <Marker 
            position={userPos} 
            icon={userIcon}
            eventHandlers={{ click: handleUserClick }}
          >
            <Popup>
              <div className="font-mono text-[10px]">
                <strong className="text-accent">YOU ARE HERE (HOME)</strong><br/>
                Click again to see quarter info.
              </div>
            </Popup>
          </Marker>
        )}

        {/* Start & End Markers for Routing */}
        {startPoint && startAddr && (
          <Marker position={startPoint} icon={startIcon}>
            <Popup>
              <div className="font-mono text-[10px] min-w-[220px]">
                <strong className="text-success block mb-1">🟢 START</strong>
                <div className="text-text-dim mb-1 truncate">{startAddr}</div>
                {routeInfo && (
                  <>
                    <div className="text-success">📏 {routeInfo.distance} km</div>
                    <div className="text-warn">⏱ {routeInfo.duration} min</div>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        )}
        {endPoint && endAddr && (
          <Marker position={endPoint} icon={endIcon}>
            <Popup>
              <div className="font-mono text-[10px] min-w-[220px]">
                <strong className="text-danger block mb-1">🏁 FINISH</strong>
                <div className="text-text-dim mb-1 truncate">{endAddr}</div>
                {routeInfo && (
                  <>
                    <div className="text-success">📏 {routeInfo.distance} km</div>
                    <div className="text-warn">⏱ {routeInfo.duration} min</div>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Click Info Marker */}
        {clickPos && (
          <Marker position={clickPos} icon={infoIcon}>
            <Popup>
              <div className="font-mono text-[10px] max-w-[200px]">
                <strong className="text-accent">LOCATION INFO</strong><br/>
                {clickInfo}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Routing Geometry */}
        {routeGeometry && (
          <Polyline 
            positions={routeGeometry} 
            pathOptions={{ color: '#a855f7', weight: 5, opacity: 0.7 }} 
          />
        )}

        {/* Thief movement line */}
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
        <div className="text-text-dim">LAT: <span className="text-accent">{latest?.lat?.toFixed(5) || HOME_COORDS[0]}</span></div>
        <div className="text-text-dim">LNG: <span className="text-accent">{latest?.lng?.toFixed(5) || HOME_COORDS[1]}</span></div>
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
        <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-success" style={{boxShadow:'0 0 8px #00ff88'}}></div><span className="text-text-dim">Bait click</span></div>
        <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-[#a855f7]" style={{boxShadow:'0 0 8px #a855f7'}}></div><span className="text-text-dim">You</span></div>
        <div className="flex items-center gap-2">   <div className="w-2 h-2 rounded-full bg-[#f59e0b]" style={{boxShadow:'0 0 8px #f59e0b'}}></div><span className="text-text-dim">Info</span></div>
      </div>
    </div>
  );
}
