import { supabase } from './supabaseClient';

export interface Location {
  id: string;
  organization_id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  website_url?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  is_headquarters: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  plan: 'free' | 'pro' | 'enterprise';
  created_at: string;
}

// --- ORGANIZZAZIONI ---

export const getMyOrganization = async (): Promise<Organization | null> => {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .single();
  if (error) return null;
  return data as Organization;
};

export const updateOrganization = async (
  id: string,
  updates: Partial<Organization>
): Promise<Organization | null> => {
  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Organization;
};

// --- SEDI ---

export const getLocations = async (): Promise<Location[]> => {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('is_headquarters', { ascending: false })
    .order('name');
  if (error) throw error;
  return data as Location[];
};

export const getLocationById = async (id: string): Promise<Location | null> => {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as Location;
};

export const createLocation = async (
  loc: Omit<Location, 'id' | 'created_at' | 'updated_at'>
): Promise<Location> => {
  const { data, error } = await supabase
    .from('locations')
    .insert(loc)
    .select()
    .single();
  if (error) throw error;
  return data as Location;
};

export const updateLocation = async (
  id: string,
  updates: Partial<Location>
): Promise<Location> => {
  const { data, error } = await supabase
    .from('locations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Location;
};

export const deleteLocation = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// Geocoding: converte indirizzo in lat/lng usando OpenStreetMap (gratuito)
export const geocodeAddress = async (
  address: string
): Promise<{ lat: number; lng: number } | null> => {
  try {
    // Primo tentativo con indirizzo completo
    const encoded = encodeURIComponent(address);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`
    );
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }

    // Secondo tentativo: rimuovi dettagli extra (es. "Edificio C2", "Scala B", "Int. 3")
    const simplified = address
      .replace(/,?\s*(edificio|scala|piano|int\.?|interno|blocco|palazzina)\s*\w*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (simplified !== address) {
      const encoded2 = encodeURIComponent(simplified);
      const res2 = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encoded2}&format=json&limit=1`
      );
      const data2 = await res2.json();
      if (data2.length > 0) {
        return { lat: parseFloat(data2[0].lat), lng: parseFloat(data2[0].lon) };
      }
    }

    // Terzo tentativo: solo città e paese (ultimi due elementi)
    const parts = address.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      const cityCountry = parts.slice(-2).join(', ');
      const encoded3 = encodeURIComponent(cityCountry);
      const res3 = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encoded3}&format=json&limit=1`
      );
      const data3 = await res3.json();
      if (data3.length > 0) {
        return { lat: parseFloat(data3[0].lat), lng: parseFloat(data3[0].lon) };
      }
    }

    return null;
  } catch {
    return null;
  }
};