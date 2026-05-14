import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useLocalization } from '@/hooks/useLocalization';
import { ICONS } from '@/constants';
import { ChatMessage } from '@/types';
import { useAnimatedModal } from '@/hooks/useAnimatedModal';
import { useData } from '@/hooks/useData';
import { getAIChatResponse } from '@/services/api';
import DOMPurify from 'dompurify';

const formatAIMessage = (text: string): string => {
  let html = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-600 rounded text-xs">$1</code>')
    .replace(/^### (.+)$/gm, '<h4 class="font-semibold mt-2 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-bold mt-2 mb-1">$1</h3>')
    .replace(/^- (.+)$/gm, '<li class="ml-3">• $1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-3">$1. $2</li>')
    .replace(/\n/g, '<br/>');
  return DOMPurify.sanitize(html);
};

const AIAssistant: React.FC = () => {
  const { t, language } = useLocalization();
  const { tickets, assets, incidents, articles } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isRendered, isAnimating } = useAnimatedModal(isOpen);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const context = useMemo(() => ({
    kb: articles,
    tickets,
    incidents,
    assets,
  }), [articles, tickets, incidents, assets]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const aiResponseText = await getAIChatResponse(messages, input, context, language);
        const aiMessage: ChatMessage = { id: `ai-${Date.now()}`, text: aiResponseText, sender: 'ai' };
        setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
        console.error("AI Assistant Error:", error);
        const errorMessage: ChatMessage = { id: `err-${Date.now()}`, text: t('ai assistant connection error'), sender: 'ai' };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  }, [input, messages, context, language, t]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSend();
    }
  };

  if (!isRendered && !isOpen) {
    return (
        <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-primary-600 text-white p-3 sm:p-4 rounded-full shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 z-40 transform hover:scale-110 transition-transform"
            style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
            aria-label={t('ai assistant')}
        >
            {React.cloneElement(ICONS.sparkle_chat, { className: 'w-6 h-6 sm:w-8 sm:h-8' })}
        </button>
    );
  }

  return (
    <>
      <div
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 transition-all duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-[calc(100vw-2rem)] sm:w-80 max-h-[70vh] sm:h-[28rem] flex flex-col border dark:border-neutral-700">
          <header className="flex items-center justify-between p-3 border-b dark:border-neutral-700 flex-shrink-0">
            <div className="flex items-center gap-2">
              {React.cloneElement(ICONS.sparkle, { className: 'w-5 h-5 text-primary-500' })}
              <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">{t('ai assistant')}</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-neutral-400 dark:text-neutral-500 mt-8 space-y-2">
                {React.cloneElement(ICONS.sparkle, { className: 'w-10 h-10 mx-auto text-primary-300 dark:text-primary-600 mb-3' })}
                <p className="text-sm font-medium">{t('ai assistant')}</p>
                <p className="text-xs">{t('ai assistant hint')}</p>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-primary-600 text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200'}`}>
                  {msg.sender === 'ai' ? (
                    <div className="text-sm prose-sm [&_strong]:font-bold [&_li]:list-none [&_code]:text-xs" dangerouslySetInnerHTML={{ __html: formatAIMessage(msg.text) }} />
                  ) : (
                    <p className="text-sm">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] px-3 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700">
                  <p className="text-sm italic text-neutral-500 animate-pulse">{t('ai thinking')}</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <footer className="p-3 border-t dark:border-neutral-700 flex-shrink-0">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('type your question')}
                className="w-full pl-3 pr-10 py-2 bg-neutral-100 dark:bg-neutral-700 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary-600 dark:text-primary-400 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/50 disabled:text-neutral-400 dark:disabled:text-neutral-500 disabled:bg-transparent"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
              </button>
            </div>
          </footer>
        </div>
      </div>
      
      {/* Closed State Button */}
       <button
            onClick={() => setIsOpen(true)}
            className={`fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 z-40 transform hover:scale-110 transition-all duration-300 ${isAnimating ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}
            aria-label={t('ai assistant')}
        >
            {React.cloneElement(ICONS.sparkle_chat, { className: 'w-8 h-8' })}
        </button>
    </>
  );
};

export default AIAssistant;