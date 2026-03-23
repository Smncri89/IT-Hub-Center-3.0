import React, { useState, useRef } from 'react';
import { UploadCloud, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useLocalization } from '@/hooks/useLocalization';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: any[]) => Promise<void>;
    title: string;
    expectedColumns: string[];
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport, title, expectedColumns }) => {
    const { t } = useLocalization();
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            processFile(droppedFile);
        }
    };

    const processFile = (file: File) => {
        setFile(file);
        setError(null);
        setSuccess(false);

        const fileExt = file.name.split('.').pop()?.toLowerCase();

        if (fileExt === 'csv') {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        setError(t('Error parsing CSV file'));
                        return;
                    }
                    setHeaders(results.meta.fields || []);
                    setPreviewData(results.data.slice(0, 5)); // Preview first 5 rows
                },
                error: (err) => {
                    setError(err.message);
                }
            });
        } else if (fileExt === 'xlsx' || fileExt === 'xls') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet);
                    
                    if (json.length > 0) {
                        setHeaders(Object.keys(json[0] as object));
                        setPreviewData(json.slice(0, 5));
                    } else {
                        setError(t('File is empty'));
                    }
                } catch (err: any) {
                    setError(t('Error reading Excel file') + ': ' + err.message);
                }
            };
            reader.readAsBinaryString(file);
        } else {
            setError(t('Unsupported file format. Please upload a CSV or Excel file.'));
        }
    };

    const handleImport = async () => {
        if (!file) return;
        setIsImporting(true);
        setError(null);

        try {
            const fileExt = file.name.split('.').pop()?.toLowerCase();
            let fullData: any[] = [];

            if (fileExt === 'csv') {
                const text = await file.text();
                const results = Papa.parse(text, { header: true, skipEmptyLines: true });
                fullData = results.data;
            } else {
                const buffer = await file.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                fullData = XLSX.utils.sheet_to_json(worksheet);
            }

            await onImport(fullData);
            setSuccess(true);
            setTimeout(() => {
                resetAndClose();
            }, 2000);
        } catch (err: any) {
            setError(err.message || t('An error occurred during import'));
        } finally {
            setIsImporting(false);
        }
    };

    const resetAndClose = () => {
        setFile(null);
        setPreviewData([]);
        setHeaders([]);
        setError(null);
        setSuccess(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{title}</h2>
                    <button onClick={resetAndClose} className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm font-medium">{t('Import successful!')}</p>
                        </div>
                    )}

                    {!file ? (
                        <div 
                            className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-12 text-center hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept=".csv,.xlsx,.xls" 
                                onChange={handleFileChange}
                            />
                            <UploadCloud className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                            <p className="text-neutral-900 dark:text-white font-medium mb-1">{t('Click to upload or drag and drop')}</p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">CSV, XLS, XLSX</p>
                            
                            <div className="mt-6 text-left bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl inline-block">
                                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">{t('Expected Columns')}:</p>
                                <div className="flex flex-wrap gap-2">
                                    {expectedColumns.map(col => (
                                        <span key={col} className="px-2 py-1 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded text-xs text-neutral-700 dark:text-neutral-300">
                                            {col}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
                                        <UploadCloud className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-neutral-900 dark:text-white">{file.name}</p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setFile(null)}
                                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                                >
                                    {t('Remove')}
                                </button>
                            </div>

                            {previewData.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-3">{t('Data Preview')}</h3>
                                    <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-700 rounded-xl">
                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                            <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400">
                                                <tr>
                                                    {headers.map((header, i) => (
                                                        <th key={i} className="px-4 py-3 font-medium">{header}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                                {previewData.map((row, i) => (
                                                    <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                                        {headers.map((header, j) => (
                                                            <td key={j} className="px-4 py-3 text-neutral-900 dark:text-neutral-300">
                                                                {row[header]?.toString() || ''}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-2">{t('Showing first 5 rows')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3 bg-neutral-50 dark:bg-neutral-800/50">
                    <button 
                        onClick={resetAndClose}
                        className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                    >
                        {t('Cancel')}
                    </button>
                    <button 
                        onClick={handleImport}
                        disabled={!file || isImporting || success}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                    >
                        {isImporting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {t('Importing...')}
                            </>
                        ) : (
                            t('Confirm Import')
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportModal;
