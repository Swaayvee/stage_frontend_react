"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function validCoords(value) {
  return Number.isFinite(value?.lat) && Number.isFinite(value?.lng);
}

export default function DeliveryMap({ courierMode, courierCoords, merchantCoords, clientCoords, merchantName, clientAddress, target = "merchant" }) {
  const [routeData, setRouteData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const destination = target === "client" ? clientCoords : merchantCoords;
  const canCalculate = validCoords(courierCoords) && validCoords(destination);
  const center = useMemo(() => canCalculate ? [courierCoords.lat, courierCoords.lng] : [45.755, 4.839], [canCalculate, courierCoords]);

  useEffect(() => {
    setRouteData(null);
    if (!canCalculate) return;
    setIsLoading(true);
    const profile = courierMode?.toLowerCase().includes("vélo") ? "bike" : "driving";
    const points = `${courierCoords.lng},${courierCoords.lat};${destination.lng},${destination.lat}`;
    fetch(`https://router.project-osrm.org/route/v1/${profile}/${points}?overview=full&geometries=geojson`)
      .then((response) => response.json())
      .then((data) => {
        const route = data.routes?.[0];
        if (!route) return;
        setRouteData({
          path: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
          distance: (route.distance / 1000).toFixed(1),
          duration: Math.max(1, Math.round(route.duration / 60)),
        });
      })
      .catch(() => setRouteData(null))
      .finally(() => setIsLoading(false));
  }, [canCalculate, courierCoords?.lat, courierCoords?.lng, destination?.lat, destination?.lng, courierMode]);

  if (!canCalculate) {
    return <div className="flex h-full min-h-[260px] items-center justify-center rounded-xl border border-white/10 bg-slate-950/60 p-6 text-center"><div><p className="m-0 font-bold text-white">Temps d’arrivée indisponible</p><p className="mt-2 max-w-md text-sm text-slate-400">La position du livreur doit être partagée et l’adresse de destination doit être géolocalisée. Aucune position fictive n’est utilisée.</p></div></div>;
  }

  return <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-white/10">
    <div className="relative z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-[#0f172a] p-3">
      <div><p className="m-0 text-[0.65rem] font-bold uppercase text-slate-400">Vers {target === "client" ? "le client" : "le commerce"}</p><p className="m-0 text-sm font-semibold text-white">{isLoading ? "Calcul en cours…" : routeData ? `${routeData.duration} min · ${routeData.distance} km` : "Itinéraire indisponible"}</p></div>
      <span className="text-xs text-emerald-300">Position GPS partagée</span>
    </div>
    <div className="relative min-h-[220px] flex-1 bg-slate-900"><MapContainer center={center} zoom={14} style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} zoomControl={false}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap contributors &copy; CARTO" />
      <Marker position={[courierCoords.lat, courierCoords.lng]}><Popup>Votre position partagée</Popup></Marker>
      <Marker position={[destination.lat, destination.lng]}><Popup>{target === "client" ? `Client : ${clientAddress}` : `Commerce : ${merchantName}`}</Popup></Marker>
      {routeData?.path && <Polyline positions={routeData.path} color="#818cf8" weight={5} opacity={0.8} />}
    </MapContainer></div>
  </div>;
}
