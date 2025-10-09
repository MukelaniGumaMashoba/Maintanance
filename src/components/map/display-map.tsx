'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

type MapViewProps = {
  center?: [number, number]
  zoom?: number
}

export default function MapView({ center = [28.0473, -26.2041], zoom = 12 }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: center,
      zoom: zoom,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

    // new mapboxgl.Marker()
    //   .setLngLat(center)
    //   .addTo(map.current)

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [center, zoom])

  return (
    <div
      ref={mapContainer}
      className="w-full h-[500px] rounded-lg"
    />
  )
}
