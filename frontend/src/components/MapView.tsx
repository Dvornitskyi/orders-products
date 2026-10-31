'use client';
import 'leaflet/dist/leaflet.css';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { useI18n } from '@/i18n/I18nProvider';
import type { Order } from '@/types';

export default function MapView({ orders }: { orders: Order[] }) {
  const { t, productsWord } = useI18n();
  const located = orders.filter((o) => o.lat !== null && o.lng !== null);
  if (located.length === 0) return <p className="text-muted">{t('mapEmpty')}</p>;
  return (
    <>
      <p className="text-muted">{t('mapHint')}</p>
      <div className="map">
        <MapContainer center={[48.8, 31.2]} zoom={6} scrollWheelZoom className="map__canvas">
          <TileLayer attribution="&copy; OpenStreetMap" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {/* CircleMarker вместо стандартной иконки: не требует отдельных картинок маркера */}
          {located.map((o) => (
            <CircleMarker key={o.id} center={[o.lat as number, o.lng as number]} radius={11} pathOptions={{ color: '#5b8a2b', fillColor: '#7cb342', fillOpacity: 0.85 }}>
              <Popup><b>{o.title}</b><br />{o.products.length} {productsWord(o.products.length)}</Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </>
  );
}
