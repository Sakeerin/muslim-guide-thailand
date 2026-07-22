'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import 'maplibre-gl/dist/maplibre-gl.css';

// OpenFreeMap: free vector tiles, no key, no billing (has no SLA — see runbook).
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

const HALAL_COLORS: Record<string, string> = {
  cicot_certified: '#047857',
  muslim_owned: '#10b981',
  muslim_friendly: '#f59e0b',
  unverified: '#9ca3af',
};

interface PlaceMapProps {
  locale: string;
  type?: string;
  center?: [number, number];
  zoom?: number;
  /** navigate on marker click; receives the place slug */
  onSelect?: (slug: string) => void;
}

export function PlaceMap({ locale, type, center = [100.5018, 13.7563], zoom = 6, onSelect }: PlaceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const t = useTranslations('errors');

  useEffect(() => {
    if (!containerRef.current) return;
    let map: import('maplibre-gl').Map | undefined;
    let cancelled = false;

    (async () => {
      try {
        const maplibregl = (await import('maplibre-gl')).default;
        if (cancelled || !containerRef.current) return;

        map = new maplibregl.Map({
          container: containerRef.current,
          style: STYLE_URL,
          center,
          zoom,
          attributionControl: { compact: true },
        });
        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        map.addControl(new maplibregl.GeolocateControl({ trackUserLocation: false }), 'top-right');

        map.on('error', (e) => {
          // style/tile load failures shouldn't blank the page
          if (e?.error && String(e.error).includes('style')) setFailed(true);
        });

        map.on('load', async () => {
          if (!map) return;
          const params = new URLSearchParams({ locale });
          if (type) params.set('type', type);
          const res = await fetch(`/api/v1/places/geojson?${params}`);
          const data = await res.json();

          map.addSource('places', {
            type: 'geojson',
            data,
            cluster: true,
            clusterMaxZoom: 13,
            clusterRadius: 50,
          });

          map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'places',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': '#0f766e',
              'circle-opacity': 0.85,
              'circle-radius': ['step', ['get', 'point_count'], 16, 10, 22, 50, 30],
            },
          });
          map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'places',
            filter: ['has', 'point_count'],
            layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12 },
            paint: { 'text-color': '#ffffff' },
          });
          map.addLayer({
            id: 'unclustered',
            type: 'circle',
            source: 'places',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-radius': 7,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-color': [
                'match',
                ['get', 'halalStatus'],
                'cicot_certified', HALAL_COLORS.cicot_certified,
                'muslim_owned', HALAL_COLORS.muslim_owned,
                'muslim_friendly', HALAL_COLORS.muslim_friendly,
                HALAL_COLORS.unverified,
              ],
            },
          });

          // zoom into a cluster on click
          map.on('click', 'clusters', async (e) => {
            const features = map!.queryRenderedFeatures(e.point, { layers: ['clusters'] });
            const clusterId = features[0].properties?.cluster_id;
            const source = map!.getSource('places') as import('maplibre-gl').GeoJSONSource;
            const z = await source.getClusterExpansionZoom(clusterId);
            map!.easeTo({ center: (features[0].geometry as { coordinates: [number, number] }).coordinates, zoom: z });
          });

          // popup + select on marker click
          map.on('click', 'unclustered', (e) => {
            const f = e.features?.[0];
            if (!f) return;
            const props = f.properties as { slug: string; name: string; halalStatus: string };
            const coords = (f.geometry as { coordinates: [number, number] }).coordinates;
            new maplibregl.Popup()
              .setLngLat(coords)
              .setHTML(
                `<strong>${escapeHtml(props.name)}</strong><br/><a href="/${locale}/place/${props.slug}" style="color:#0f766e;text-decoration:underline">${locale === 'th' ? 'ดูรายละเอียด' : 'View details'}</a>`,
              )
              .addTo(map!);
            onSelect?.(props.slug);
          });

          const setPointer = (v: boolean) => (map!.getCanvas().style.cursor = v ? 'pointer' : '');
          for (const layer of ['clusters', 'unclustered']) {
            map.on('mouseenter', layer, () => setPointer(true));
            map.on('mouseleave', layer, () => setPointer(false));
          }
        });
      } catch {
        setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [locale, type, center, zoom, onSelect]);

  if (failed) {
    return (
      <div className="flex h-full min-h-80 items-center justify-center rounded-xl border bg-foreground/5 p-6 text-center text-sm opacity-70">
        {t('mapUnavailable')}
      </div>
    );
  }

  return <div ref={containerRef} className="h-full min-h-80 w-full rounded-xl" />;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
