
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { KBArticle, Role, Language } from '@/types';
import { createKBArticle } from '@/services/api';
import { useLocalization } from '@/hooks/useLocalization';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/Spinner';
import { useAnimatedModal } from '@/hooks/useAnimatedModal';
import { ICONS } from '@/constants';
import { useData } from '@/hooks/useData';

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

const KnowledgeBase: React.FC = () => {
  const { t, language } = useLocalization();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { articles: allArticles, isLoading, refetchData } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  const canManage = useMemo(() => user?.role === Role.Admin || user?.role === Role.Agent, [user]);
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: number; errors: string[] } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isRendered: isImportModalRendered, isAnimating: isImportModalAnimating } = useAnimatedModal(isImportModalOpen);

  const articles = useMemo(() => {
    return allArticles.filter(article => user?.role && article.audience.includes(user.role));
  }, [allArticles, user]);

  const categories = useMemo(() => {
    const allCats = articles.map(a => a.category);
    return ['all', ...Array.from(new Set(allCats))];
  }, [articles]);
  
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const categoryMatch = activeCategory === 'all' || article.category === activeCategory;
      const lowercasedQuery = searchQuery.toLowerCase().trim();
      const searchMatch = !lowercasedQuery ||
        Object.values(article.title).some((title: string) => title.toLowerCase().includes(lowercasedQuery)) ||
        Object.values(article.content).some((content: string) => content.toLowerCase().includes(lowercasedQuery)) ||
        article.tags.some(tag => tag.toLowerCase().includes(lowercasedQuery));
      
      return categoryMatch && searchMatch;
    });
  }, [articles, searchQuery, activeCategory]);

  const translateCategory = (category: string): string => {
    if (!category) return '';
    const key = `kb category ${category.toLowerCase().replace(/ & | /g, ' ')}`;
    const translated = t(key);
    // If translation fails, t returns the key. In that case, return the original category name.
    if (translated === key) {
        return category;
    }
    return translated;
  };
  
  const handleImportClick = () => {
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
        fileInputRef.current.click();
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsImporting(true);
    setImportStatus({ success: 0, errors: [] });
    setIsImportModalOpen(true);

    const text = await file.text();
    const rows = text.trim().split('\n');
    const headerRow = rows.shift()?.trim() || '';
    const headers = parseCsvRow(headerRow);
    
    const requiredHeaders = ['title_en', 'content_en', 'category'];
    if (!requiredHeaders.every(h => headers.includes(h))) {
        setImportStatus({ success: 0, errors: [`Invalid headers. CSV must include: ${requiredHeaders.join(', ')}.`] });
        setIsImporting(false);
        return;
    }
    
    const headerMap = headers.reduce((acc, h, i) => ({ ...acc, [h.trim()]: i }), {} as Record<string, number>);

    const importPromises = rows.map(async (rowStr, index) => {
        if (!rowStr.trim()) return { status: 'skipped' };
        const row = parseCsvRow(rowStr);
        try {
            const validRoles = Object.values(Role);
            const audienceRolesStr = row[headerMap['audience']];
            let audienceRoles: Role[] = [];
            if (audienceRolesStr) {
                audienceRoles = audienceRolesStr
                    .split(';')
                    .map(r => r.trim())
                    .filter(r => validRoles.includes(r as Role)) as Role[];
            }
            if (audienceRoles.length === 0) {
                audienceRoles.push(...validRoles); // Default to all roles if empty or invalid
            }

            const articleData = {
                title: {
                    [Language.en]: row[headerMap['title_en']],
                    [Language.it]: row[headerMap['title_it']] || '',
                    [Language.es]: row[headerMap['title_es']] || '',
                },
                content: {
                    [Language.en]: row[headerMap['content_en']],
                    [Language.it]: row[headerMap['content_it']] || '',
                    [Language.es]: row[headerMap['content_es']] || '',
                },
                category: row[headerMap['category']],
                tags: row[headerMap['tags']]?.split(';').map(t => t.trim()).filter(Boolean) || [],
                audience: audienceRoles,
            };

            if (!articleData.title.en || !articleData.content.en || !articleData.category) {
                throw new Error("Missing required fields (title_en, content_en, category).");
            }

            await createKBArticle(articleData, user);
            return { status: 'success' };
        } catch (error: any) {
            return { status: 'error', message: `Row ${index + 2}: ${error.message}` };
        }
    });

    const results = await Promise.allSettled(importPromises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.status === 'success').length;
    const errors = results
        .filter((r): r is PromiseRejectedResult | { status: 'fulfilled'; value: { status: 'error'; message: string } } => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status === 'error'))
        .map(r => {
            if (r.status === 'rejected') {
                const reason = r.reason;
                let message = 'An unknown error occurred';
                if (reason instanceof Error) {
                    message = reason.message;
                } else if (typeof reason === 'string') {
                    message = reason;
                } else {
                    message = String(reason as any);
                }
                return `Row ${results.indexOf(r) + 2}: ${message}`;
            }
            return r.value.message;
        });

    setImportStatus({ success: successCount, errors });
    setIsImporting(false);
    refetchData('articles');
  };
  
  const handleExport = () => {
    const toCsvRow = (items: (string | number | undefined | null)[]) => {
        return items.map(item => {
            const str = String(item || '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        }).join(',');
    };

    const headers = ['id', 'category', 'tags', 'audience', 'title_en', 'content_en', 'title_it', 'content_it', 'title_es', 'content_es', 'author_email', 'created_at', 'updated_at'];
    
    const rows = filteredArticles.map(article => toCsvRow([
        article.id,
        article.category,
        article.tags.join(';'),
        article.audience.join(';'),
        article.title.en,
        article.content.en,
        article.title.it,
        article.content.it,
        article.title.es,
        article.content.es,
        article.author.email,
        article.createdAt,
        article.updatedAt,
    ]));

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kb_articles_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="space-y-6">
      <div className="md:flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100">{t('page title kb')}</h1>
         {canManage && (
            <div className="flex items-center gap-2 mt-4 md:mt-0">
                <button
                    onClick={handleImportClick}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-600"
                    title={t('import')}
                >
                    {React.cloneElement(ICONS.upload, { className: "h-4 w-4"})}
                    <span>{t('import')}</span>
                </button>
                 <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileImport} />
                 <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-600"
                    title={t('export')}
                >
                    {React.cloneElement(ICONS.download, { className: "h-4 w-4"})}
                    <span>{t('export')}</span>
                </button>
                <button 
                  onClick={() => navigate('/kb/new')}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    {t('create article')}
                </button>
            </div>
        )}
      </div>
       <div className="mt-4 max-w-2xl mx-auto">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('kb search placeholder')}
            className="w-full px-4 py-3 text-lg bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

      <div className="flex justify-center flex-wrap gap-2 pb-4 border-b border-neutral-200 dark:border-neutral-700">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
              activeCategory === category
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-600'
            }`}
          >
            {category === 'all' ? t('all categories') : translateCategory(category)}
          </button>
        ))}
      </div>

      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map(article => (
            <div
              key={article.id}
              onClick={() => navigate(`/kb/${article.id}`)}
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-6 flex flex-col cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all"
              role="link"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/kb/${article.id}`)}
            >
              <div className="flex-grow">
                <div className="flex justify-between items-baseline">
                    <span className="text-xs font-semibold uppercase text-primary-600 dark:text-primary-400">{translateCategory(article.category)}</span>
                    {article.author && <span className="text-xs text-neutral-500">{t('by author', { author: article.author.name })}</span>}
                </div>
                <h2 className="text-lg font-bold mt-2 text-neutral-900 dark:text-neutral-100">{article.title[language] || article.title.en}</h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 line-clamp-3">
                  {article.content[language] || article.content.en}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 flex flex-wrap gap-2">
                {article.tags.map(tag => (
                  <span key={tag} className="text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-xl font-semibold text-neutral-700 dark:text-neutral-300">{t('no articles found')}</p>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2">{t('try different search')}</p>
        </div>
      )}
      
      {isImportModalRendered && (
        <div className={`fixed inset-0 bg-black z-40 flex justify-center items-center transition-opacity duration-200 ${isImportModalAnimating ? 'bg-opacity-50' : 'bg-opacity-0'}`} onClick={() => setIsImportModalOpen(false)}>
            <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-all duration-300 ${isImportModalAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-10 scale-95'}`} onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-semibold">{t('import status')}</h2>
                {isImporting ? (
                    <div className="py-8 text-center">{t('importing data')}<Spinner /></div>
                ) : (
                    importStatus && (
                        <div className="mt-4">
                            <p className="text-green-600">{t('import success', { count: importStatus.success })}</p>
                            {importStatus.errors.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="font-semibold text-red-500">{t('import errors')}</h3>
                                    <ul className="list-disc list-inside mt-2 text-sm text-red-500 max-h-64 overflow-y-auto bg-neutral-100 dark:bg-neutral-700 p-2 rounded">
                                        {importStatus.errors.map((err: string, i: number) => <li key={i}>{err}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )
                )}
                <div className="flex justify-end pt-4 mt-4 border-t dark:border-neutral-700">
                    <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-md bg-primary-600 text-white">{t('close')}</button>
                </div>
            </div>
        </div>
    )}
    </div>
  );
};

export default KnowledgeBase;
