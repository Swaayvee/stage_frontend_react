"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix pour les icônes Leaflet par défaut dans Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const customIcons = {
  courier: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41], iconAnchor: [12, 41]
  }),
  merchant: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41], iconAnchor: [12, 41]
  }),
  client: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41], iconAnchor: [12, 41]
  })
};

export default function DeliveryMap({ courierMode, merchantName, clientAddress }) {
  const [routeData, setRouteData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Coordonnées fictives dans Lyon pour la démo
  const coords = {
    courier: { lat: 45.748, lng: 4.846 },
    merchant: { lat: 45.755, lng: 4.839 },
    client: { lat: 45.760, lng: 4.830 }
  };

  useEffect(() => {
    // Déterminer le profil OSRM selon le véhicule choisi par le livreur
    // car (voiture, scooter) ou bike (vélo)
    const profile = (courierMode && courierMode.toLowerCase().includes("vélo")) ? "bike" : "driving";

    // OSRM attend les coordonnées au format lng,lat
    const coordString = `${coords.courier.lng},${coords.courier.lat};${coords.merchant.lng},${coords.merchant.lat};${coords.client.lng},${coords.client.lat}`;
    
    fetch(`https://router.project-osrm.org/route/v1/${profile}/${coordString}?overview=full&geometries=geojson`)
      .then(res => res.json())
      .then(data => {
        if (data.routes && data.routes[0]) {
          const route = data.routes[0];
          // GeoJSON renvoie [lng, lat], Leaflet Polyline attend [lat, lng]
          const path = route.geometry.coordinates.map(c => [c[1], c[0]]);
          
          setRouteData({
            path,
            distance: (route.distance / 1000).toFixed(1), // en km
            duration: Math.round(route.duration / 60), // en minutes
            // Segment 1 (Livreur -> Commerçant)
            durationToMerchant: Math.round(route.legs[0].duration / 60),
            // Segment 2 (Commerçant -> Client)
            durationToClient: Math.round(route.legs[1].duration / 60)
          });
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("OSRM Fetch Error", err);
        setIsLoading(false);
      });
  }, [courierMode]);

  return (
    <div className="w-full h-full flex flex-col rounded-xl overflow-hidden border border-white/10">
      {/* Panneau d'informations ETA */}
      <div className="bg-[#0f172a] border-b border-white/10 p-3 flex flex-wrap gap-4 items-center justify-between z-10 relative">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚴</span>
          <div>
            <p className="text-[0.65rem] uppercase font-bold text-slate-400 m-0 leading-tight">Véhicule</p>
            <p className="text-sm font-semibold text-white m-0 leading-tight">{courierMode || "Vélo électrique"}</p>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-sm text-indigo-300 font-bold animate-pulse">Calcul de l'itinéraire en cours...</div>
        ) : routeData ? (
          <>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
              <div>
                <p className="text-[0.65rem] uppercase font-bold text-slate-400 m-0 leading-tight">Vers Commerçant</p>
                <p className="text-sm font-semibold text-blue-300 m-0 leading-tight">{routeData.durationToMerchant} min</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
              <div>
                <p className="text-[0.65rem] uppercase font-bold text-slate-400 m-0 leading-tight">Vers Client</p>
                <p className="text-sm font-semibold text-green-300 m-0 leading-tight">{routeData.durationToClient} min</p>
              </div>
            </div>
            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
              <div>
                <p className="text-[0.65rem] uppercase font-bold text-slate-400 m-0 leading-tight">Total estimé</p>
                <p className="text-sm font-black text-emerald-400 m-0 leading-tight">{routeData.duration} min <span className="text-xs font-medium text-slate-400">({routeData.distance} km)</span></p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-red-400 font-bold">Impossible de calculer l'itinéraire.</div>
        )}
      </div>

      {/* Carte Interactive */}
      <div className="flex-1 bg-slate-900 relative min-h-[300px]">
        <MapContainer 
          center={[45.755, 4.839]} 
          zoom={14} 
          style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
          zoomControl={false}
        >
          {/* Tuiles gratuites OpenStreetMap Sombre (CartoDB Dark Matter) pour coller au design premium */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          
          <Marker position={[coords.courier.lat, coords.courier.lng]} icon={customIcons.courier}>
            <Popup>Votre position actuelle</Popup>
          </Marker>
          <Marker position={[coords.merchant.lat, coords.merchant.lng]} icon={customIcons.merchant}>
            <Popup>Commerçant : {merchantName}</Popup>
          </Marker>
          <Marker position={[coords.client.lat, coords.client.lng]} icon={customIcons.client}>
            <Popup>Client : {clientAddress}</Popup>
          </Marker>

          {routeData && routeData.path && (
            <Polyline positions={routeData.path} color="#818cf8" weight={5} opacity={0.8} />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
