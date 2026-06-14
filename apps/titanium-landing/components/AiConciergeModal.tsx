// @ts-nocheck
"use client";

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@ai-sdk/react';
import { X, Send } from 'lucide-react';
import Image from 'next/image';
import { ADVISORS } from '../app/LandingClient';

interface AiConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: string;
  advisorName?: string;
  advisorRole?: string;
  advisorPhotoUrl?: string;
  customSystemPrompt?: string;
  onTransferAdvisor?: (targetAdvisor: string) => void;
}

export default function AiConciergeModal({ isOpen, onClose, context, advisorName = "Alex", advisorRole = "Especialista en Éxito", advisorPhotoUrl = "/images/advisors/alex.png", customSystemPrompt, onTransferAdvisor }: AiConciergeModalProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferTarget, setTransferTarget] = useState("");
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading } = useChat({
    api: '/api/chat',
    body: {
      context,
      customSystemPrompt,
      sessionId,
    },
    onToolCall: async ({ toolCall }) => {
      if (toolCall.toolName === 'transferToAdvisor') {
        const { targetAdvisor } = toolCall.args;
        setIsTransferring(true);
        setTransferTarget(targetAdvisor);
        
        // Artificial delay for UX
        setTimeout(() => {
          if (onTransferAdvisor) onTransferAdvisor(targetAdvisor);
          setIsTransferring(false);
        }, 1800);
      }
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize UUID and fetch history
  useEffect(() => {
    if (!isOpen) return;

    let currentSessionId = localStorage.getItem('titanium_session_id');
    if (!currentSessionId) {
      currentSessionId = crypto.randomUUID();
      localStorage.setItem('titanium_session_id', currentSessionId);
    }
    setSessionId(currentSessionId);

    // Fetch history
    const fetchHistory = async () => {
      setIsFetchingHistory(true);
      try {
        const res = await fetch(`/api/chat/history?sessionId=${currentSessionId}`);
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }
      } catch (error) {
        console.error('Error cargando historial de Supabase:', error);
      } finally {
        setIsFetchingHistory(false);
      }
    };
    
    fetchHistory();
  }, [isOpen, setMessages]);

  // Save history on messages change
  useEffect(() => {
    if (messages.length > 0 && sessionId) {
      fetch('/api/chat/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, messages })
      }).catch(console.error);
    }
  }, [messages, sessionId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTransferring]);

  // Reset chat when modal closes or context changes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setMessages([]), 300); // Clear after animation
    }
  }, [isOpen, setMessages]);

  console.log("Rastreador de Candados:", { isLoading, isFetchingHistory, inputLength: input?.length });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />

          {/* Sidebar Modal — floating card */}
          {/* 1. CAJA EXTERNA: Solo maneja posición, tamaño, cristal y bordes (CERO PADDING) */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-4 right-4 bottom-4 w-[420px] rounded-[2rem] bg-[#050505]/70 backdrop-blur-3xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden z-50"
          >
            {/* 2. CAJA INTERNA: Maneja el padding absoluto para forzar los márgenes internos */}
            <div className="absolute inset-0 p-8 flex flex-col">
              
              {/* HEADER (Sin paddings propios) */}
              <div className="flex-shrink-0 flex items-center justify-between pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center -space-x-4">
                    {[...ADVISORS]
                      .sort((a, b) => (a.name === advisorName ? -1 : b.name === advisorName ? 1 : 0))
                      .map((adv, index) => {
                        const isActive = adv.name === advisorName;
                        return (
                          <div
                            key={adv.name}
                            style={{ zIndex: ADVISORS.length - index }}
                            className={`relative rounded-full border-2 border-[#121212] transition-all duration-300 ${
                              isActive
                                ? 'w-12 h-12 shadow-[0_0_20px_rgba(123,79,255,0.5)] ring-2 ring-[#00C2FF]'
                                : 'w-10 h-10 opacity-50 grayscale'
                            }`}
                          >
                            <Image src={adv.photoUrl} alt={adv.name} fill className="rounded-full object-cover" sizes={isActive ? "48px" : "40px"} />
                            {isActive && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#1a1a1a]" />
                            )}
                          </div>
                        );
                      })}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white tracking-wide">{advisorName}</h3>
                    <p className="text-xs text-gray-400 tracking-wider uppercase">{advisorRole}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <X size={18} />
                </button>
              </div>

              {/* ÁREA DE MENSAJES (Scrollable) */}
              <div className="flex-1 overflow-y-auto py-6 pr-2 custom-scrollbar space-y-6">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-4 mt-12 text-center">
                    <div className="relative w-16 h-16 rounded-full border border-white/10 shadow-[0_0_30px_rgba(123,79,255,0.3)]">
                      <Image src={advisorPhotoUrl} alt={advisorName} fill className="rounded-full object-cover" sizes="64px" />
                    </div>
                    <p className="text-gray-400 text-sm max-w-[260px] leading-relaxed">
                      Hola, soy {advisorName}, tu {advisorRole}. ¿En qué te puedo ayudar a optimizar la operación de tu restaurante hoy?
                    </p>
                  </div>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Advisor avatar */}
                    {m.role !== 'user' && (
                      <div className="relative w-7 h-7 shrink-0 rounded-full border border-white/10 mb-1">
                        <Image src={advisorPhotoUrl} alt={advisorName} fill className="rounded-full object-cover" sizes="28px" />
                      </div>
                    )}

                    <div
                      className={`max-w-[78%] text-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-gradient-to-tr from-[#7B4FFF]/80 to-[#00C2FF]/80 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-[0_4px_15px_rgba(123,79,255,0.2)]'
                          : 'bg-white/5 border border-white/10 text-gray-200 rounded-2xl rounded-tl-sm backdrop-blur-md px-4 py-3'
                      }`}
                    >
                      {m.role === 'user' ? (
                        <p>{m.content}</p>
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {isTransferring && (
                  <div className="flex items-end gap-2 justify-center my-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md px-4 py-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#00C2FF] rounded-full animate-ping" />
                      <span className="text-xs text-[#00C2FF]">Transfiriendo a {transferTarget}...</span>
                    </div>
                  </div>
                )}
                {isLoading && !isTransferring && (
                  <div className="flex items-end gap-2 justify-start">
                    <div className="relative w-7 h-7 shrink-0 rounded-full border border-white/10">
                      <Image src={advisorPhotoUrl} alt={advisorName} fill className="rounded-full object-cover" sizes="28px" />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm backdrop-blur-md px-4 py-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#7B4FFF] rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-[#9B6FFF] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="w-1.5 h-1.5 bg-[#00C2FF] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* FOOTER (Sin paddings propios, padding-top para separar del scroll) */}
              <div className="flex-shrink-0 pt-6">
                <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-2 pl-5 py-2 focus-within:border-[#7B4FFF]/50 focus-within:shadow-[0_0_0_1px_rgba(123,79,255,0.25)] transition-all duration-300">
                  <input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!input || input.trim() === ''}
                    className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer enabled:bg-gradient-to-r enabled:from-[#7B4FFF] enabled:to-[#00C2FF] enabled:shadow-[0_0_14px_rgba(123,79,255,0.4)] enabled:hover:shadow-[0_0_20px_rgba(0,194,255,0.35)]"
                  >
                    <Send size={15} className="ml-0.5" />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
