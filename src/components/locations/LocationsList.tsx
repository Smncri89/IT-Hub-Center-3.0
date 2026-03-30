import React, { useState, useEffect, useRef } from 'react';
import {
  getLocations, createLocation, updateLocation,
  deleteLocation, geocodeAddress, getMyOrganization, Location
} from '@/services/locationsService';

const LocationsList: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [form, setForm] = useState({
    name: '', address: '', city: '', country: 'IT',
    website_url: '', phone: '', email: '',
    is_headquarters: false, notes: '',
    latitude: '', longitude: ''
  });
  const [geocoding, setGeocoding] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  const mapElRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    load();
    fetchOrganizationId();
  }, []);

  const fetchOrganizationId = async () => {
    const org = await getMyOrganization();
    if (org?.id) {
      setOrganizationId(org.id);
    }
  };

  useEffect(() => {
    if (!locations.length || !mapElRef.current) return;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    const L = (window as any).L;
    if (!L) return;
    const map = L.map(mapElRef.current, { zoomControl: true });
    mapRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const bounds: [number, number][] = [];
    locations.forEach(loc => {
      if (!loc.latitude || !loc.longitude) return;
      bounds.push([loc.latitude, loc.longitude]);
      const icon = L.divIcon({
        html: '<div style="background:' + (loc.is_headquarters ? '#6366f1' : '#64748b') + ';width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>',
        className: '', iconAnchor: [7, 7]
      });
      L.marker([loc.latitude, loc.longitude], { icon })
        .addTo(map)
        .bindPopup('<b>' + loc.name + '</b><br>' + (loc.address || '') + '<br>' + (loc.city || ''));
    });
    if (bounds.length) map.fitBounds(bounds, { padding: [40, 40] });
    else map.setView([41.9, 12.5], 5);

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [locations]);

  const load = async () => {
    setLoading(true);
    const data = await getLocations();
    setLocations(data);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', address: '', city: '', country: 'IT', website_url: '', phone: '', email: '', is_headquarters: false, notes: '', latitude: '', longitude: '' });
    setShowForm(true);
  };

  const openEdit = (loc: Location) => {
    setEditing(loc);
    setForm({
      name: loc.name, address: loc.address || '', city: loc.city || '',
      country: loc.country || 'IT', website_url: loc.website_url || '',
      phone: loc.phone || '', email: loc.email || '',
      is_headquarters: loc.is_headquarters, notes: loc.notes || '',
      latitude: loc.latitude?.toString() || '', longitude: loc.longitude?.toString() || ''
    });
    setShowForm(true);
  };

  const handleGeocode = async () => {
    const q = [form.address, form.city, form.country].filter(Boolean).join(', ');
    if (!q) return;
    setGeocoding(true);
    try {
      const res = await geocodeAddress(q);
      if (res) {
        setForm(f => ({ ...f, latitude: res.lat.toString(), longitude: res.lng.toString() }));
      } else {
        alert('Indirizzo non trovato nemmeno con ricerca approssimativa. Inserisci le coordinate manualmente.');
      }
    } catch (err) {
      console.error('Errore geocoding:', err);
      alert('Errore durante il geocoding. Controlla la console.');
    }
    setGeocoding(false);
  };

  const handleSave = async () => {
    let lat = form.latitude ? parseFloat(form.latitude) : null;
    let lng = form.longitude ? parseFloat(form.longitude) : null;

    // Geocoding automatico se mancano le coordinate ma c'è un indirizzo
    if ((!lat || !lng) && (form.address || form.city)) {
      const q = [form.address, form.city, form.country].filter(Boolean).join(', ');
      const res = await geocodeAddress(q);
      if (res) {
        lat = res.lat;
        lng = res.lng;
      }
    }

    const payload: any = {
      name: form.name, address: form.address, city: form.city,
      country: form.country, website_url: form.website_url,
      phone: form.phone, email: form.email,
      is_headquarters: form.is_headquarters, notes: form.notes,
      latitude: lat,
      longitude: lng,
    };

    // Aggiungi organization_id solo per nuove sedi
    if (!editing && organizationId) {
      payload.organization_id = organizationId;
    }

    if (editing) await updateLocation(editing.id, payload);
    else await createLocation(payload);
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questa sede?')) return;
    await deleteLocation(id);
    load();
  };

  if (loading) return <div className="p-8 text-center text-neutral-500">Caricamento sedi...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Sedi Aziendali</h1>
        <button onClick={openNew} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
          + Aggiungi sede
        </button>
      </div>

      {/* Mappa */}
      <div ref={mapElRef} className="w-full h-72 rounded-xl border dark:border-neutral-700 z-0" style={{ minHeight: 280 }} />

      {/* Lista sedi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map(loc => (
          <div key={loc.id} className="bg-white dark:bg-neutral-800 rounded-xl border dark:border-neutral-700 p-4 space-y-2 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{loc.name}</h3>
                  {loc.is_headquarters && (
                    <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">HQ</span>
                  )}
                </div>
                {loc.address && <p className="text-sm text-neutral-500">{loc.address}</p>}
                {loc.city && <p className="text-sm text-neutral-500">{loc.city}, {loc.country}</p>}
              </div>
            </div>
            {loc.website_url && (
              <a href={loc.website_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary-600 hover:underline block truncate">
                🌐 {loc.website_url}
              </a>
            )}
            {loc.phone && <p className="text-xs text-neutral-400">📞 {loc.phone}</p>}
            {loc.email && <p className="text-xs text-neutral-400">✉️ {loc.email}</p>}
            {loc.latitude && loc.longitude && (
              <p className="text-xs text-neutral-400">📍 {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</p>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={() => openEdit(loc)} className="text-xs px-3 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200">Modifica</button>
              <button onClick={() => handleDelete(loc.id)} className="text-xs px-3 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">Elimina</button>
            </div>
          </div>
        ))}
        {locations.length === 0 && (
          <p className="col-span-3 text-center text-neutral-400 py-8">Nessuna sede aggiunta. Clicca &quot;+ Aggiungi sede&quot; per iniziare.</p>
        )}
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-semibold">{editing ? 'Modifica sede' : 'Nuova sede'}</h2>

            {[
              { label: 'Nome sede *', key: 'name', placeholder: 'es. Sede Milano' },
              { label: 'Indirizzo', key: 'address', placeholder: 'Via Roma 1' },
              { label: 'Città', key: 'city', placeholder: 'Milano' },
              { label: 'Paese', key: 'country', placeholder: 'IT' },
              { label: 'Sito web', key: 'website_url', placeholder: 'https://...' },
              { label: 'Telefono', key: 'phone', placeholder: '+39 02...' },
              { label: 'Email', key: 'email', placeholder: 'sede@azienda.com' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{f.label}</label>
                <input
                  value={(form as any)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="mt-1 w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            ))}

            {/* Geocoding */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Latitudine</label>
                <input value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}
                  placeholder="45.4654" className="mt-1 w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Longitudine</label>
                <input value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))}
                  placeholder="9.1859" className="mt-1 w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <button onClick={handleGeocode} disabled={geocoding}
                className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-sm hover:bg-neutral-200 whitespace-nowrap">
                {geocoding ? '...' : '📍 Rileva'}
              </button>
            </div>
            <p className="text-xs text-neutral-400">Clicca &quot;Rileva&quot; per ottenere automaticamente le coordinate dall&apos;indirizzo.</p>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_headquarters}
                onChange={e => setForm(f => ({ ...f, is_headquarters: e.target.checked }))} />
              Sede principale (HQ)
            </label>

            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Note</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} className="mt-1 w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleSave}
                className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
                {editing ? 'Salva modifiche' : 'Crea sede'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2 border dark:border-neutral-600 rounded-lg text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700">
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationsList;