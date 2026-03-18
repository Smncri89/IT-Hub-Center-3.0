import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocalization } from '@/hooks/useLocalization';
import { ICONS } from '@/constants';
import { ChatMessage, KBArticle, Ticket, Incident } from '@/types';
import { useAnimatedModal } from '@/hooks/useAnimatedModal';
import { getAIChatResponse, getKBArticles, getTickets, getIncidents } from '@/services/api';

const AIAssistant: React.FC = () => {
  const { t, language } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isRendered, isAnimating } = useAnimatedModal(isOpen);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // State for context data
  const [kbArticles, setKbArticles] = useState<KBArticle[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Fetch context data when the assistant is opened
  useEffect(() => {
    const fetchContextData = async () => {
        if (isOpen) {
            try {
                const [kbData, ticketsData, incidentsData] = await Promise.all([
                    getKBArticles(),
                    getTickets(),
                    getIncidents()
                ]);
                setKbArticles(kbData);
                setTickets(ticketsData);
                setIncidents(incidentsData);
            } catch (error) {
                console.error("Failed to fetch context for AI Assistant:", error);
            }
        }
    };
    fetchContextData();
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const context = { kb: kbArticles, tickets, incidents };
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
  }, [input, messages, kbArticles, tickets, incidents, language, t]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSend();
    }
  };

  if (!isRendered && !isOpen) {
    return (
        <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 z-40 transform hover:scale-110 transition-transform"
            aria-label={t('ai assistant')}
        >
            {React.cloneElement(ICONS.sparkle_chat, { className: 'w-8 h-8' })}
        </button>
    );
  }

  return (
    <>
      <div 
        className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-80 h-[28rem] flex flex-col border dark:border-neutral-700">
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
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-primary-600 text-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
                  <p className="text-sm">{msg.text}</p>
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