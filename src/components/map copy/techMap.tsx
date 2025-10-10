// components/TechMap.tsx
'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface TechMapProps {
    lat: number;
    lng: number;
    name: string;
}

export const TechMap = ({ lat, lng, name }: TechMapProps) => {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<mapboxgl.Map | null>(null);

    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [lng, lat],
            zoom: 12,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

        // new mapboxgl.Marker()
        //     .setLngLat([lng, lat])
        //     .setPopup(new mapboxgl.Popup().setText(name))
        //     .addTo(map.current);
    }, [lat, lng, name]);

    return <div ref={mapContainer} className="w-full h-[500px] rounded-lg" />;
};
