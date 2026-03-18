
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { KBArticle, Role, Language } from '@/types';
import { getKBArticleById, createKBArticle, updateKBArticle, translateTextWithAI, getAIWritingAssistance, generateArticleContentFromTopic, getKBArticles } from '@/services/api';
import { useLocalization } from '@/hooks/useLocalization';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/Spinner';
import { ICONS } from '@/constants';
import { useData } from '@/hooks/useData';

const KBArticleEditor: React.FC = () => {
  const { articleId } = useParams<{ articleId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLocalization();
  const { user: currentUser } = useAuth();
  const { refetchData } = useData();
  
  const [article, setArticle] = useState<Partial<KBArticle>>({
    title: { [Language.en]: '', [Language.it]: '', [Language.es]: '' },
    content: { [Language.en]: '', [Language.it]: '', [Language.es]: '' },
    category: '',
    tags: [],
    audience: [Role.EndUser, Role.Member, Role.Agent, Role.Admin],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState<Language>(Language.en);
  const [isTranslatingTitle, setIsTranslatingTitle] = useState(false);
  const [isAiWorking, setIsAiWorking] = useState(false);
  const [articleExamples, setArticleExamples] = useState<KBArticle[]>([]);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const aiMenuRef = useRef<HTMLDivElement>(null);
  
  const isEditMode = Boolean(articleId);
  const [initialStateApplied, setInitialStateApplied] = useState(false);

  useEffect(() => {
    // Fetch examples for AI styling
    getKBArticles()
      .then(setArticleExamples)
      .catch(err => console.error("Failed to load article examples for AI", err));
      
    const fromState = location.state;
    
    if (isEditMode) {
      getKBArticleById(articleId!)
        .then(data => {
          if (data) {
            setArticle(data);
          } else {
            navigate('/kb'); // Article not found
          }
        })
        .finally(() => setIsLoading(false));
    } else if (fromState && fromState.title && fromState.content && !initialStateApplied) {
        // Pre-fill from navigation state (from ticket/incident)
        const newTitle = { [Language.en]: fromState.title, [Language.it]: fromState.title, [Language.es]: fromState.title };
        const newContent = { [Language.en]: fromState.content, [Language.it]: fromState.content, [Language.es]: fromState.content };
        const newArticle = {
            title: newTitle,
            content: newContent,
            category: fromState.category || '',
            tags: fromState.tags || [],
            audience: [Role.EndUser, Role.Member, Role.Agent, Role.Admin], // Default to all
        };
        setArticle(newArticle);
        setInitialStateApplied(true);
        setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [articleId, isEditMode, navigate, location.state, initialStateApplied]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (aiMenuRef.current && !aiMenuRef.current.contains(event.target as Node)) {
            setIsAiMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocalizedChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const field = name as 'title' | 'content';
  
    setArticle(prev => ({
        ...prev,
        [field]: {
            ...prev[field],
            [activeLangTab]: value
        }
    }));
  };
  
  const handleTranslate = async (field: 'title' | 'content') => {
      if (!article[field]?.[Language.en]) return;

      const setLoading = field === 'title' ? setIsTranslatingTitle : setIsAiWorking;
      setLoading(true);

      try {
          const textToTranslate = article[field]![Language.en];
          const targetLanguageName = {
              [Language.it]: 'Italian',
              [Language.es]: 'Spanish',
          }[activeLangTab] || 'English';

          const translatedText = await translateTextWithAI(textToTranslate, targetLanguageName);

          setArticle(prev => {
              const prevField = prev[field] as { [lang in Language]: string };
              return {
                  ...prev,
                  [field]: {
                      ...prevField,
                      [activeLangTab]: translatedText.trim(),
                  }
              };
          });
      } catch (error) {
          console.error(`Failed to translate ${field}`, error);
          alert(t('kb editor translate failed', { field }));
      } finally {
          setLoading(false);
      }
  };
  
  const handleWritingAssistance = async (mode: 'generate' | 'correct' | 'complete') => {
      setIsAiMenuOpen(false); // Close menu on action
      const languageName = {
          [Language.en]: 'English',
          [Language.it]: 'Italian',
          [Language.es]: 'Spanish',
      }[activeLangTab];
      
      const currentTitle = article.title?.[activeLangTab] || '';
      const currentContent = article.content?.[activeLangTab] || '';

      if (mode === 'generate' && !currentTitle) {
          alert(t('kb editor provide title for ai'));
          return;
      }
      if ((mode === 'correct' || mode === 'complete') && !currentContent) {
          alert(t('kb editor provide content for ai'));
          return;
      }
      
      setIsAiWorking(true);
      try {
          if (mode === 'generate') {
            const examples = articleExamples.slice(0, 2);
            const newContent = await generateArticleContentFromTopic(currentTitle, languageName, examples);

            if (activeLangTab !== Language.en) {
                const [englishTitle, englishContent] = await Promise.all([
                    translateTextWithAI(currentTitle, 'English'),
                    translateTextWithAI(newContent, 'English')
                ]);
                setArticle(prev => ({
                    ...prev,
                    title: {
                        ...prev.title,
                        [activeLangTab]: currentTitle,
                        [Language.en]: englishTitle,
                    },
                    content: {
                        ...prev.content,
                        [activeLangTab]: newContent,
                        [Language.en]: englishContent,
                    }
                }));
            } else {
                setArticle(prev => ({ ...prev, content: { ...prev.content, [Language.en]: newContent } }));
            }
        } else { // Correct or Complete
            const newContent = await getAIWritingAssistance(currentContent, languageName, mode);
            setArticle(prev => ({ ...prev, content: { ...prev.content, [activeLangTab]: newContent } }));
        }

      } catch (error) {
          console.error(`AI assistance failed for mode: ${mode}`, error);
          alert(t('kb editor ai failed'));
      } finally {
          setIsAiWorking(false);
      }
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setArticle(prev => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',');
    setArticle(prev => ({ ...prev, tags }));
  };

  const handleAudienceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    const role = value as Role;
    setArticle(prev => {
      const currentAudience = prev.audience || [];
      const newAudience = checked 
        ? [...currentAudience, role]
        : currentAudience.filter(r => r !== role);
      return { ...prev, audience: newAudience };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSaving(true);
    // Use a deep copy to safely manipulate data before saving.
    let finalArticleData = JSON.parse(JSON.stringify(article));

    try {
      // Step 1: Intelligent English Fallback.
      // If the English version is empty, find content from another language and translate it.
      
      // Translate title if English is missing
      if (!finalArticleData.title[Language.en]) {
          const sourceTitle = finalArticleData.title[Language.it] || finalArticleData.title[Language.es];
          if (sourceTitle) {
              finalArticleData.title[Language.en] = await translateTextWithAI(sourceTitle, 'English');
          }
      }
      
      // Translate content if English is missing
      if (!finalArticleData.content[Language.en]) {
          const sourceContent = finalArticleData.content[Language.it] || finalArticleData.content[Language.es];
          if (sourceContent) {
              finalArticleData.content[Language.en] = await translateTextWithAI(sourceContent, 'English');
          }
      }

      // Step 2: Final Validation.
      // This happens AFTER the background translation, ensuring it passes.
      if (!finalArticleData.title?.[Language.en] || !finalArticleData.content?.[Language.en] || !finalArticleData.category || !finalArticleData.audience || finalArticleData.audience.length === 0) {
          throw new Error(t('kb editor save error required'));
      }

      // Step 3: Prepare and Save.
      const cleanedTags = (finalArticleData.tags || []).map((tag: string) => tag.trim()).filter(Boolean);
      
      if (isEditMode) {
        const { id, author, createdAt, updatedAt, ...updateData } = finalArticleData;
        const dataToUpdate = { ...updateData, tags: cleanedTags };
        const updated = await updateKBArticle(articleId!, dataToUpdate);
        refetchData('articles');
        if(updated) navigate(`/kb/${updated.id}`);
      } else {
        const newArticleData = {
            title: finalArticleData.title,
            content: finalArticleData.content,
            category: finalArticleData.category,
            tags: cleanedTags,
            audience: finalArticleData.audience || [],
        }
        const created = await createKBArticle(newArticleData, currentUser);
        refetchData('articles');
        navigate(`/kb/${created.id}`);
      }
    } catch (error: any) {
      console.error("Failed to save article:", error);
      alert(t('kb editor save failed', { error: error?.message || String(error) }));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Spinner />;

  const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500";
  const labelClasses = "block text-sm font-medium text-neutral-700 dark:text-neutral-300";
  
  const aiActions = [
      { id: 'generate', label: t('ai action generate'), icon: ICONS.sparkle, action: () => handleWritingAssistance('generate') },
      { id: 'correct', label: t('ai action correct'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>, action: () => handleWritingAssistance('correct') },
      { id: 'complete', label: t('ai action complete'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>, action: () => handleWritingAssistance('complete') },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-6">
        {isEditMode ? t('edit article') : t('create article')}
      </h1>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-6 space-y-6">
        
        <div>
            <div className="border-b border-neutral-200 dark:border-neutral-700">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    {(Object.keys(Language) as Language[]).map(lang => (
                        <button
                            key={lang}
                            type="button"
                            onClick={() => setActiveLangTab(lang)}
                            className={`${
                                activeLangTab === lang
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:border-neutral-600'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                        >
                            {t(`lang ${lang}`)}
                        </button>
                    ))}
                </nav>
            </div>
            <p className="text-xs text-neutral-500 mt-2">{t('kb auto translate note')}</p>
            <div className="mt-4 space-y-4">
                <div>
                    <div className="flex justify-between items-center">
                        <label htmlFor="title" className={labelClasses}>{t('title')}</label>
                        {activeLangTab !== Language.en && (
                            <button 
                                type="button" 
                                onClick={() => handleTranslate('title')}
                                disabled={isTranslatingTitle || isAiWorking}
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/50 disabled:opacity-50"
                                title={t('translate')}
                            >
                                {isTranslatingTitle ? (
                                    <Spinner size="sm"/>
                                ) : (
                                    React.cloneElement(ICONS.language, { className: 'w-4 h-4'})
                                )}
                                <span>{t('translate')}</span>
                            </button>
                        )}
                    </div>
                    <input type="text" id="title" name="title" value={article.title?.[activeLangTab] || ''} onChange={handleLocalizedChange} required={activeLangTab === Language.en} className={inputClasses} />
                </div>
                <div>
                    <div className="flex justify-between items-center">
                        <label htmlFor="content" className={labelClasses}>{t('content')}</label>
                        <div className="flex items-center gap-2">
                           {activeLangTab !== Language.en && (
                                <button type="button" onClick={() => handleTranslate('content')} disabled={isAiWorking || isTranslatingTitle} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/50 disabled:opacity-50" title={t('translate')}>
                                    {React.cloneElement(ICONS.language, { className: 'w-4 h-4'})}
                                    <span>{t('translate')}</span>
                                </button>
                           )}
                           <div className="relative" ref={aiMenuRef}>
                                <button type="button" onClick={() => setIsAiMenuOpen(prev => !prev)} disabled={isAiWorking || isTranslatingTitle} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/50 hover:bg-primary-100 dark:hover:bg-primary-900 disabled:opacity-50" title={t('ai assistant')}>
                                     {React.cloneElement(ICONS.sparkle, { className: 'w-4 h-4'})}
                                     <span>{t('ai assistant')}</span>
                                     <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isAiMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {isAiMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-700 rounded-md shadow-lg border dark:border-neutral-600 py-1 z-10">
                                        {aiActions.map(action => (
                                            <button key={action.id} type="button" onClick={action.action} className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-600">
                                                {React.cloneElement(action.icon, { className: 'w-4 h-4' })}
                                                <span>{action.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                           </div>
                        </div>
                    </div>
                    <div className="relative">
                        <textarea id="content" name="content" value={article.content?.[activeLangTab] || ''} onChange={handleLocalizedChange} required={activeLangTab === Language.en} rows={15} className={`${inputClasses} ${isAiWorking ? 'opacity-50' : ''}`}></textarea>
                        {isAiWorking && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-neutral-800/50 rounded-md">
                                <Spinner />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="category" className={labelClasses}>{t('category')}</label>
            <input type="text" id="category" name="category" value={article.category} onChange={handleChange} required className={inputClasses} placeholder="e.g., Troubleshooting Guides" />
          </div>
          <div>
            <label htmlFor="tags" className={labelClasses}>{t('tags comma separated')}</label>
            <input type="text" id="tags" name="tags" value={article.tags?.join(',') || ''} onChange={handleTagsChange} className={inputClasses} placeholder="e.g., vpn, network, new user" />
          </div>
        </div>
        <div>
          <label className={labelClasses}>{t('visible to')}</label>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.values(Role).map((role: Role) => (
              <label key={role} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={role}
                  checked={article.audience?.includes(role)}
                  onChange={handleAudienceChange}
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm">{t(`role ${role.toLowerCase().replace(' ', '-')}`)}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t dark:border-neutral-700 space-x-2">
          <button type="button" onClick={() => navigate(isEditMode ? `/kb/${articleId}` : '/kb')} className="px-4 py-2 text-sm font-medium rounded-md bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600">{t('cancel')}</button>
          <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-primary-400">
            {isSaving ? '...' : (isEditMode ? t('save changes') : t('publish article'))}
          </button>
        </div>
      </form>
    </div>
  );
};

export default KBArticleEditor;
