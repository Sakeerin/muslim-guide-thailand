import { useRef } from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  type CameraRef,
  type GeoJSONSourceRef,
} from '@maplibre/maplibre-react-native';
import type {
  ExpressionSpecification,
  FilterSpecification,
} from '@maplibre/maplibre-gl-style-spec';
import type { PlaceFeatureCollection } from '@/lib/api/geojson';
import { colors } from '@/lib/theme';

// OpenFreeMap: free, keyless vector tiles (same style the web map uses).
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
// Thailand centre.
const INITIAL_CENTER: [number, number] = [100.5018, 13.7563];

// Halal-status colours — mirror src/components/place-map.tsx.
const HALAL_COLOR: ExpressionSpecification = [
  'match',
  ['get', 'halalStatus'],
  'cicot_certified',
  '#047857',
  'muslim_owned',
  '#10b981',
  'muslim_friendly',
  '#f59e0b',
  '#9ca3af',
];

const CLUSTER_RADIUS: ExpressionSpecification = [
  'step',
  ['get', 'point_count'],
  16,
  10,
  22,
  50,
  30,
];

const HAS_COUNT: FilterSpecification = ['has', 'point_count'];
const NO_COUNT: FilterSpecification = ['!', ['has', 'point_count']];

interface PressLike {
  nativeEvent: { features: GeoJSON.Feature[] };
}

export function PlacesMap({ data }: { data: PlaceFeatureCollection }) {
  const cameraRef = useRef<CameraRef>(null);
  const sourceRef = useRef<GeoJSONSourceRef>(null);

  async function onFeaturePress(e: PressLike) {
    const feature = e.nativeEvent.features?.[0];
    if (!feature) return;
    const props = feature.properties ?? {};

    // cluster → zoom in
    if (props.cluster) {
      const zoom = await sourceRef.current?.getClusterExpansionZoom(Number(props.cluster_id));
      const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
      if (typeof zoom === 'number') {
        cameraRef.current?.easeTo({ center: coords, zoom, duration: 400 });
      }
      return;
    }
    // place → open detail
    if (typeof props.slug === 'string') {
      router.push(`/place/${props.slug}`);
    }
  }

  return (
    <Map style={styles.map} mapStyle={STYLE_URL} logo={false} attribution compass>
      <Camera ref={cameraRef} initialViewState={{ center: INITIAL_CENTER, zoom: 5 }} />
      <GeoJSONSource
        ref={sourceRef}
        id="places"
        data={data}
        cluster
        clusterRadius={50}
        clusterMaxZoom={13}
        onPress={onFeaturePress}
      >
        <Layer
          id="clusters"
          type="circle"
          filter={HAS_COUNT}
          paint={{ 'circle-color': colors.brand, 'circle-opacity': 0.85, 'circle-radius': CLUSTER_RADIUS }}
        />
        <Layer
          id="cluster-count"
          type="symbol"
          filter={HAS_COUNT}
          layout={{ 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12 }}
          paint={{ 'text-color': '#ffffff' }}
        />
        <Layer
          id="unclustered"
          type="circle"
          filter={NO_COUNT}
          paint={{
            'circle-radius': 7,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-color': HALAL_COLOR,
          }}
        />
      </GeoJSONSource>
    </Map>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
