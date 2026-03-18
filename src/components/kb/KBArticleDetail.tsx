
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { KBArticle, Role } from '@/types';
import { getKBArticleById, deleteKBArticle } from '@/services/api';
import { useLocalization } from '@/hooks/useLocalization';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/Spinner';
import { useAnimatedModal } from '@/hooks/useAnimatedModal';
import { useData } from '@/hooks/useData';

const DeleteConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}> = ({ isOpen, onClose, onConfirm, title }) => {
  const { t } = useLocalization();
  const { isRendered, isAnimating } = useAnimatedModal(isOpen);

  if (!isRendered) return null;

  return (
    <div className={`fixed inset-0 bg-black z-50 flex justify-center items-center transition-opacity duration-200 ${isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'}`} onClick={onClose}>
      <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-md transition-all duration-300 ${isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-10 scale-95'}`} onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold">{t('delete article')}</h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-300">{t('delete confirmation')}</p>
        <p className="font-semibold">{`"${title}"`}</p>
        <p className="mt-2 text-sm text-red-500 dark:text-red-400">{t('delete warning')}</p>
        <div className="flex justify-end mt-6 space-x-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600">{t('cancel')}</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">{t('delete')}</button>
        </div>
      </div>
    </div>
  );
};

const KBArticleDetail: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const { t, language } = useLocalization();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { refetchData } = useData();

  const [article, setArticle] = useState<KBArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const canManage = useMemo(() => user?.role === Role.Admin || user?.role === Role.Agent, [user]);

  useEffect(() => {
    if (!articleId) {
      setIsLoading(false);
      setError("Article ID is missing.");
      return;
    }
    
    const fetchArticle = async () => {
      setIsLoading(true);
      try {
        const fetchedArticle = await getKBArticleById(articleId);
        if (fetchedArticle) {
          if (user?.role && fetchedArticle.audience.includes(user.role)) {
            setArticle(fetchedArticle);
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
          }
        } else {
          setError("Article not found.");
        }
      } catch (err) {
        setError("Failed to fetch article.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArticle();
  }, [articleId, user]);
  
  const handleDeleteConfirm = async () => {
    if (!article) return;
    try {
      await deleteKBArticle(article.id);
      refetchData('articles');
      setIsDeleteModalOpen(false);
      navigate('/kb');
    } catch (error) {
      console.error("Failed to delete article", error);
    }
  };

  if (isLoading || isAuthorized === null) {
    return <Spinner />;
  }
  
  if (isAuthorized === false) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">{t('access denied')}</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          {t('no permission to view')}
        </p>
        <Link to="/kb" className="mt-6 inline-block px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
          &larr; {t('back to kb')}
        </Link>
      </div>
    );
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }
  
  if (!article) {
    return <Navigate to="/kb" replace />;
  }

  return (
    <>
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md max-w-4xl mx-auto">
        {/* Article Header */}
        <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start">
                <Link to="/kb" className="text-primary-600 dark:text-primary-400 hover:underline text-sm flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    {t('back to kb')}
                </Link>
                {canManage && (
                    <div className="flex space-x-2">
                        <button onClick={() => navigate(`/kb/edit/${article.id}`)} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">{t('edit article')}</button>
                        <button onClick={() => setIsDeleteModalOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">{t('delete article')}</button>
                    </div>
                )}
            </div>
            
            <div className="mt-6 text-sm text-neutral-500 dark:text-neutral-400">
              <span>{t('last updated')} {new Date(article.updatedAt).toLocaleDateString()}</span>
              {article.author && <span> &bull; {t('by author', { author: article.author.name })}</span>}
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <span className="font-semibold text-sm text-neutral-600 dark:text-neutral-300">{t('tags')}:</span>
              {article.tags.map(tag => (
                <span key={tag} className="text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
        </div>

        <hr className="border-neutral-200 dark:border-neutral-700" />
        
        {/* Article Content */}
        <div className="p-6 sm:p-8 prose prose-neutral dark:prose-invert max-w-none">
            <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-neutral-100 !mb-6">
              {article.title[language]}
            </h1>
            <p className="whitespace-pre-wrap">{article.content[language]}</p>
        </div>
      </div>
      
      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={article.title[language]}
      />
    </>
  );
};

export default KBArticleDetail;
