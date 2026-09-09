"use client"

import { useEffect } from "react"
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet"
import type { LatLngExpression } from "leaflet"

export type MapTerritory = {
  code: string
  name: string
  pdv: number
  delivered: number
  leads: number
  latitude: number
  longitude: number
  stock: string
  pending: number
  campaign: string
  seller: string
  signal: string
}

function MapViewport({ territory }: { territory: MapTerritory | null }) {
  const map = useMap()

  useEffect(() => {
    if (territory) {
      map.flyTo([territory.latitude, territory.longitude], 7, { duration: 0.8 })
    }
  }, [map, territory])

  return null
}

export function VenezuelaMap({ territories, selectedCode, onSelect }: { territories: MapTerritory[]; selectedCode: string | null; onSelect: (territory: MapTerritory) => void }) {
  return <MapContainer center={[7.1, -66.2] as LatLngExpression} zoom={5.2} minZoom={4.5} maxZoom={11} scrollWheelZoom className="h-full w-full" style={{ background: "#071A3B" }}>
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
    <MapViewport territory={territories.find((item) => item.code === selectedCode) ?? null} />
    {territories.map((territory) => {
      const selected = territory.code === selectedCode
      return <CircleMarker key={territory.code} center={[territory.latitude, territory.longitude]} radius={selected ? 17 : 12} pathOptions={{ color: "#F4C542", weight: selected ? 4 : 2, fillColor: "#00338D", fillOpacity: 0.96 }} eventHandlers={{ click: () => onSelect(territory) }}>
        <Tooltip direction="top" offset={[0, -12]} opacity={1}>
          <div className="min-w-[150px] font-sans">
            <p className="font-bold">{territory.name}</p>
            <p>{territory.pdv} PDV · {territory.delivered}% cobertura</p>
            <p>{territory.leads} leads atribuidos</p>
          </div>
        </Tooltip>
      </CircleMarker>
    })}
  </MapContainer>
}
