
import React, { useEffect, useRef, useState } from 'react';
import { Asset } from '@/types';
import { useData } from '@/hooks/useData';

const AssetMap: React.FC<{ assets?: Asset[] }> = ({ assets: propAssets }) => {
    const { assets: contextAssets } = useData();
    const assets = propAssets || contextAssets;
    
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markersRef = useRef<Map<string, any>>(new Map());
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

    // Filter assets that actually have coordinates
    const mappedAssets = assets.filter(a => a.latitude && a.longitude);
    
    // Define colors for status
    const getMarkerColor = (status: string) => {
        switch(status) {
            case 'In Use': return '#10b981'; // Green
            case 'Ready to Deploy': return '#3b82f6'; // Blue
            case 'Broken - Not Fixable': return '#ef4444'; // Red
            case 'Out for Repair': return '#f59e0b'; // Orange
            default: return '#64748b'; // Gray
        }
    };

    useEffect(() => {
        if (mapRef.current && !mapInstance.current && (window as any).L) {
            // Init Map
            const map = (window as any).L.map(mapRef.current).setView([0, 0], 2);
            
            (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
            
            mapInstance.current = map;
        }
    }, []);

    useEffect(() => {
        if (!mapInstance.current || !(window as any).L) return;

        // Clear existing markers
        markersRef.current.forEach(marker => mapInstance.current.removeLayer(marker));
        markersRef.current.clear();

        const bounds = (window as any).L.latLngBounds([]);
        
        mappedAssets.forEach(asset => {
            if (asset.latitude && asset.longitude) {
                const color = getMarkerColor(asset.status);
                
                // Create custom circle marker
                const marker = (window as any).L.circleMarker([asset.latitude, asset.longitude], {
                    radius: 8,
                    fillColor: color,
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                })
                .addTo(mapInstance.current)
                .bindPopup(`
                    <div class="text-sm font-sans">
                        <strong class="block text-base mb-1">${asset.name}</strong>
                        <div class="text-gray-600 mb-1">${asset.model || asset.type}</div>
                        <span class="px-2 py-0.5 rounded text-xs text-white" style="background-color: ${color}">${asset.status}</span>
                        <div class="mt-2 text-xs text-gray-500">${asset.location || 'No Address'}</div>
                        <a href="#/assets/${asset.id}" class="block mt-2 text-blue-600 hover:underline">View Details</a>
                    </div>
                `);
                
                markersRef.current.set(asset.id, marker);
                bounds.extend([asset.latitude, asset.longitude]);
            }
        });

        if (mappedAssets.length > 0) {
            mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [mappedAssets]);

    const handleAssetClick = (id: string, lat: number, lng: number) => {
        setSelectedAssetId(id);
        if (mapInstance.current) {
            mapInstance.current.flyTo([lat, lng], 16, {
                animate: true,
                duration: 1.5
            });
            const marker = markersRef.current.get(id);
            if (marker) marker.openPopup();
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] bg-white dark:bg-neutral-800 rounded-2xl shadow-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
            {/* Sidebar List */}
            <div className="w-full lg:w-1/4 border-b lg:border-b-0 lg:border-r border-neutral-200 dark:border-neutral-700 flex flex-col bg-neutral-50 dark:bg-neutral-900/50">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                    <h2 className="text-lg font-bold text-neutral-800 dark:text-white mb-1">Mapped Assets</h2>
                    <p className="text-xs text-neutral-500">Showing {mappedAssets.length} assets with location data.</p>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {mappedAssets.map(asset => (
                        <div 
                            key={asset.id}
                            onClick={() => handleAssetClick(asset.id, asset.latitude!, asset.longitude!)}
                            className={`p-3 rounded-xl cursor-pointer transition-all ${selectedAssetId === asset.id ? 'bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500' : 'bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-sm text-neutral-900 dark:text-white truncate">{asset.name}</span>
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getMarkerColor(asset.status) }}></span>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{asset.model}</p>
                            <p className="text-xs text-neutral-400 mt-1 truncate">{asset.location || 'GPS Coords Only'}</p>
                        </div>
                    ))}
                    {mappedAssets.length === 0 && (
                        <div className="p-8 text-center text-neutral-400 text-sm">
                            No assets with location data found matching your filters.
                        </div>
                    )}
                </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative z-0">
                <div ref={mapRef} className="h-full w-full"></div>
                {!(window as any).L && <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-500">Loading Map Resources...</div>}
            </div>
        </div>
    );
};

export default AssetMap;
