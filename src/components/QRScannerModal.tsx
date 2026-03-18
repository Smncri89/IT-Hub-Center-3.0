
import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { useNavigate } from 'react-router-dom';
import { useAnimatedModal } from '@/hooks/useAnimatedModal';
import { useLocalization } from '@/hooks/useLocalization';
import { updateAsset } from '@/services/api';
import Spinner from './Spinner';

const QRScannerModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { isRendered, isAnimating } = useAnimatedModal(isOpen);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isProcessingLocation, setIsProcessingLocation] = useState(false);
    const navigate = useNavigate();
    const { t } = useLocalization();
    const requestRef = useRef<number | null>(null);

    const scanFrame = useCallback(() => {
        if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'dontInvert',
                });

                if (code) {
                    setScanResult(code.data);
                    // Stop scanning once found
                    return; 
                }
            }
        }
        requestRef.current = requestAnimationFrame(scanFrame);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setScanResult(null);
            setCameraError(null);
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        // scanFrame loop starts when video plays
                    }
                })
                .catch(err => {
                    console.error("Camera error:", err);
                    setCameraError("Could not access camera. Ensure permissions are granted and you are using HTTPS.");
                });
        } else {
            // Cleanup
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        }
    }, [isOpen, scanFrame]);

    const handleAssetFound = async (url: string) => {
        // Parse Asset ID from URL structure like /assets/:id
        const match = url.match(/\/assets\/([a-zA-Z0-9-]+)/);
        if (match && match[1]) {
            const assetId = match[1];
            
            // Ask to update location
            if (window.confirm("Asset found! Do you want to update its location to your current GPS position?")) {
                setIsProcessingLocation(true);
                if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(async (position) => {
                        try {
                            await updateAsset(assetId, {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude
                            });
                            alert("Location updated!");
                        } catch (e) {
                            console.error(e);
                            alert("Failed to update location.");
                        } finally {
                            setIsProcessingLocation(false);
                            onClose();
                            navigate(`/assets/${assetId}`);
                        }
                    }, (err) => {
                        alert("Could not get location.");
                        setIsProcessingLocation(false);
                        onClose();
                        navigate(`/assets/${assetId}`);
                    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
                } else {
                    alert("Geolocation not supported.");
                    onClose();
                    navigate(`/assets/${assetId}`);
                }
            } else {
                onClose();
                navigate(`/assets/${assetId}`);
            }
        } else {
            alert(`Scanned code: ${url}. This does not look like a valid Asset URL.`);
            setScanResult(null); // Resume scanning
            requestRef.current = requestAnimationFrame(scanFrame);
        }
    };

    useEffect(() => {
        if (scanResult) {
            handleAssetFound(scanResult);
        }
    }, [scanResult]);

    if (!isRendered) return null;

    return (
        <div className={`fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute top-4 right-4 z-10">
                <button onClick={onClose} className="text-white bg-neutral-800/50 rounded-full p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            <h2 className="text-white font-bold text-xl mb-4">Scan Asset QR</h2>
            
            {cameraError ? (
                <div className="text-red-500 bg-white p-4 rounded">{cameraError}</div>
            ) : isProcessingLocation ? (
                <div className="text-white text-center"><Spinner /> <p>Updating Location...</p></div>
            ) : (
                <div className="relative w-full max-w-md aspect-square bg-black overflow-hidden rounded-xl border-2 border-white/20">
                     <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay onPlay={() => requestRef.current = requestAnimationFrame(scanFrame)}></video>
                     <canvas ref={canvasRef} className="hidden"></canvas>
                     <div className="absolute inset-0 border-2 border-primary-500 opacity-50 animate-pulse pointer-events-none" style={{ margin: '20%' }}></div>
                </div>
            )}
            
            <p className="text-neutral-400 mt-4 text-sm">Point your camera at an Asset Tag</p>
        </div>
    );
};

export default QRScannerModal;
