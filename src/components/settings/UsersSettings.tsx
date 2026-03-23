
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocalization } from '@/hooks/useLocalization';
import { User, Role } from '@/types';
import { updateUser, createUser, importOrUpdateUser } from '@/services/api';
import Spinner from '@/components/Spinner';
import { useDebounce } from '@/hooks/useDebounce';
import { useAnimatedModal } from '@/hooks/useAnimatedModal';
import { ICONS } from '@/constants';
import { useData } from '@/hooks/useData';
import ImportModal from '@/components/ImportModal';

const parseCsvRow = (row: string): string[] => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            if (inQuotes && row[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);
    return values.map(v => v.trim().replace(/^"|"$/g, ''));
};

const UserFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  userToEdit: User | null;
}> = ({ isOpen, onClose, userToEdit }) => {
    const { t } = useLocalization();
    const { user: currentUser } = useAuth();
    const { refetchData } = useData();
    const [formData, setFormData] = useState({ name: '', email: '', role: Role.EndUser, company: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const isEditMode = !!userToEdit;
    const { isRendered, isAnimating } = useAnimatedModal(isOpen);

    useEffect(() => {
        if (isOpen) {
            if (isEditMode && userToEdit) {
                setFormData({
                    name: userToEdit.name,
                    email: userToEdit.email,
                    role: userToEdit.role,
                    company: userToEdit.company || ''
                });
            } else {
                setFormData({ name: '', email: '', role: Role.EndUser, company: '' });
            }
            setError('');
        }
    }, [userToEdit, isEditMode, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSave = async () => {
        if (!formData.name || !formData.email) {
            setError(t('fill required fields'));
            return;
        }
        setIsSaving(true);
        setError('');
        try {
            if (isEditMode && userToEdit) {
                await updateUser(userToEdit.id, formData);
            } else {
                await createUser(formData);
            }
            refetchData('users');
            onClose();
        } catch (error: any) {
            console.error("Failed to save user:", error);
            setError(t(error.message || 'unexpected error'));
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!isRendered) return null;
    
    const isEditingSelf = isEditMode && currentUser?.id === userToEdit?.id;

    const labelStyle = "block text-sm font-medium text-neutral-600 dark:text-neutral-300";
    const inputStyle = "mt-1 block w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition";

    return (
        <div className={`fixed inset-0 bg-black z-40 flex justify-center items-center transition-opacity duration-200 ${isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'}`} onClick={onClose}>
            <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] transition-all duration-300 ${isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-10 scale-95'}`} onClick={e => e.stopPropagation()}>
                <header className="p-5 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{isEditMode ? t('edit user') : t('invite user')}</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{!isEditMode && t('invite user desc')}</p>
                </header>
                <main className="p-6 space-y-6 overflow-y-auto">
                    {error && <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md text-sm">{error}</div>}
                    <div>
                        <label htmlFor="name" className={labelStyle}>{t('full name')}</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={inputStyle} />
                    </div>
                    <div>
                        <label htmlFor="email" className={labelStyle}>{t('email address')}</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} disabled={isEditMode} className={`${inputStyle} disabled:bg-neutral-100 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`} />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="role" className={labelStyle}>{t('user role')}</label>
                            <select name="role" id="role" value={formData.role} onChange={handleChange} disabled={isEditingSelf} className={`${inputStyle} disabled:opacity-50 disabled:cursor-not-allowed`}>
                                {Object.values(Role).map((role: string) => (
                                    <option key={role} value={role}>{t(`role ${role.toLowerCase().replace(/ /g, '-')}`)}</option>
                                ))}
                            </select>
                            {isEditingSelf && <p className="text-xs text-neutral-500 mt-1">{t('cannot change own role')}</p>}
                        </div>
                        <div>
                            <label htmlFor="company" className={labelStyle}>{t('company')}</label>
                            <input type="text" name="company" id="company" value={formData.company} onChange={handleChange} className={inputStyle} />
                        </div>
                    </div>
                </main>
                <footer className="p-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200">{t('cancel')}</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50">
                        {isSaving ? <Spinner size="sm" /> : (isEditMode ? t('save changes') : t('invite'))}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export const UsersSettings: React.FC = () => {
    const { t } = useLocalization();
    const { users, isLoading, refetchData } = useData();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const handleEditUser = (user: User) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };

    const handleNewUser = () => {
        setUserToEdit(null);
        setIsModalOpen(true);
    };
    
    const handleBulkImport = async (data: any[]) => {
        const requiredHeaders = ['email', 'name', 'role'];
        const headers = Object.keys(data[0] || {});
        if (!requiredHeaders.every(h => headers.includes(h))) {
            // Error handling is managed by ImportModal
            throw new Error(`Invalid headers. File must include: ${requiredHeaders.join(', ')}.`);
        }

        const results = await Promise.all(data.map(row => {
            const userData = {
                email: row['email'],
                name: row['name'],
                role: row['role'] as Role,
                company: row['company']
            };
            return importOrUpdateUser(userData);
        }));

        const successCount = results.filter(r => r && (r.status === 'invited' || r.status === 'updated')).length;
        const errors = results.filter((r): r is { status: 'error', message?: string } => r?.status === 'error').map(r => r.message || 'Unknown error');
        
        refetchData('users');
        
        if (errors.length > 0) {
            throw new Error(`Imported ${successCount} users. Errors: ${errors.join(', ')}`);
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            user.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );
    }, [users, debouncedSearchQuery]);

    if (isLoading) {
        return <Spinner />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold">{t('settings users')}</h2>
                    <p className="text-neutral-500 dark:text-neutral-400">{t('settings users desc')}</p>
                </div>
                <div className="flex gap-2">
                     <button onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700">
                        {React.cloneElement(ICONS.upload, { className: 'w-4 h-4' })} {t('import users')}
                    </button>
                    <button onClick={handleNewUser} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
                        {React.cloneElement(ICONS.plus, { className: 'w-4 h-4' })} {t('new user')}
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <input
                    type="search"
                    placeholder={t('user search placeholder')}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full max-w-sm px-3 py-2 bg-white dark:bg-neutral-700/50 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-sm"
                />
            </div>
            
            <div className="overflow-x-auto bg-white dark:bg-neutral-800 rounded-lg border dark:border-neutral-700">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                     <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('user')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('user role')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('company')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('last login')}</th>
                            <th className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                        {filteredUsers.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            <img className="h-10 w-10 rounded-full" src={user.avatarUrl} alt="" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{user.name}</div>
                                            <div className="text-sm text-neutral-500 dark:text-neutral-400">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">{t(`role ${user.role.toLowerCase().replace(/ /g, '-')}`)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">{user.company || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">N/A</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEditUser(user)} className="text-primary-600 hover:text-primary-900">{t('edit')}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <UserFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userToEdit={userToEdit}
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleBulkImport}
                title={t('Import Users')}
                expectedColumns={['email', 'name', 'role', 'company']}
            />
        </div>
    );
};
