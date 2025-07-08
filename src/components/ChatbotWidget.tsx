'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, MessageCircle, X, ExternalLink, MapPin, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  content: React.ReactNode;
}

const QUICK_REPLIES = [
  '📅 ¿Cómo reservo un turno?',
  '💆‍♀️ ¿Qué servicios ofrecen?',
  '📍 ¿Dónde están ubicados?',
  '💳 ¿Cuáles son los medios de pago?',
  '🙋 Quiero hablar con un humano',
];

const BOT_RESPONSES: Record<string, React.ReactNode> = {
  '📅 ¿Cómo reservo un turno?': (
    <div className="space-y-2">
      <p>
        Para reservar un turno, dirigite a la sección "Servicios", elegí el tratamiento que más te guste y seguí los pasos para seleccionar fecha y horario. ¡En pocos clics queda confirmado!
      </p>
      <Link href="/servicios" className="inline-flex items-center gap-1 text-accent hover:underline font-medium">
        <span>Ver servicios</span>
        <ExternalLink size={14} />
      </Link>
    </div>
  ),
  '💆‍♀️ ¿Qué servicios ofrecen?': (
    <div className="space-y-2">
      <p>
        Ofrecemos masajes descontracturantes, relajantes, tratamientos faciales, manicura, pedicura y mucho más.
      </p>
      <Link href="/servicios" className="inline-flex items-center gap-1 text-accent hover:underline font-medium">
        <span>Catálogo completo</span>
        <ExternalLink size={14} />
      </Link>
    </div>
  ),
  '📍 ¿Dónde están ubicados?': (
    <div className="space-y-2">
      <p>
        Nos encontramos en Av. Siempre Viva 742, Buenos Aires.
      </p>
      <a
        href="https://www.google.com/maps/search/?api=1&query=Av.+Siempre+Viva+742+Buenos+Aires"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-accent hover:underline font-medium"
      >
        <span>Abrir en Maps</span>
        <MapPin size={14} />
      </a>
    </div>
  ),
  '💳 ¿Cuáles son los medios de pago?': (
    <ul className="list-disc list-inside space-y-1">
      <li>Efectivo</li>
      <li>Tarjetas de débito con un descuento de 15% si se abona antes de las 48hs de la reserva.</li>
    </ul>
  ),
  '🙋 Quiero hablar con un humano': (
    <div className="space-y-2">
      <p>¡Claro! Podés contactarnos a través de cualquiera de estos medios:</p>
      <a
        href="https://wa.me/5491198765432?text=Hola%20SPA%20Sentirse%20Bien,%20necesito%20ayuda"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm shadow"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path d="M16 0C7.177 0 0 7.177 0 16c0 2.823.737 5.562 2.142 7.965L0 32l8.277-2.119A15.91 15.91 0 0016 32c8.823 0 16-7.177 16-16S24.823 0 16 0zm0 29.333a13.26 13.26 0 01-6.781-1.823l-.486-.29-4.917 1.259 1.306-4.799-.318-.492A13.259 13.259 0 1129.333 16 13.277 13.277 0 0116 29.333zm7.291-9.698c-.401-.2-2.372-1.172-2.741-1.304-.369-.133-.638-.2-.906.2-.268.401-1.041 1.304-1.276 1.573-.234.267-.469.3-.87.1-.401-.2-1.693-.621-3.228-1.981-1.193-1.067-1.999-2.389-2.234-2.79-.234-.4-.028-.617.173-.817.177-.176.401-.457.602-.686.201-.234.268-.401.402-.668.133-.267.067-.5-.033-.7-.1-.2-.906-2.226-1.239-3.06-.326-.782-.659-.677-.906-.691l-.773-.013c-.267 0-.7.1-1.066.5-.368.4-1.402 1.369-1.402 3.34 0 1.973 1.434 3.875 1.634 4.142.2.267 2.824 4.31 6.837 6.04 1.003.433 1.783.689 2.389.879 1.005.318 1.92.273 2.64.166.806-.12 2.372-.969 2.705-1.905.334-.934.334-1.735.234-1.905-.1-.166-.367-.267-.768-.467z" />
        </svg>
        <span>WhatsApp</span>
      </a>
      <p>
        También podés llamarnos al <a href="tel:01112345678" className="underline">011-1234-5678</a> o enviar un email a{' '}
        <a href="mailto:info@spasentirsebien.com.ar" className="underline">info@spasentirsebien.com.ar</a>
      </p>
    </div>
  ),
};

export default function ChatbotWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [waitingBot, setWaitingBot] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState('');
  const [filteredReplies, setFilteredReplies] = useState(QUICK_REPLIES);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Initialize greeting when chat opens for first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greetingText = `¡Hola${user ? ` ${user.first_name}` : ''}! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?`;
      pushBotMessage(<span>{greetingText}</span>);
    }
  }, [isOpen]);

  // Filtrar respuestas según el texto del input
  useEffect(() => {
    if (inputText.trim() === '') {
      setFilteredReplies(QUICK_REPLIES);
    } else {
      const filtered = QUICK_REPLIES.filter(reply =>
        reply.toLowerCase().includes(inputText.toLowerCase())
      );
      setFilteredReplies(filtered);
    }
  }, [inputText]);

  const pushBotMessage = (content: React.ReactNode) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), sender: 'bot', content },
    ]);
  };

  const pushUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), sender: 'user', content: text },
    ]);
  };

  const handleQuickReply = (text: string) => {
    pushUserMessage(text);
    setWaitingBot(true);

    // Simulate typing delay
    setTimeout(() => {
      const botContent = BOT_RESPONSES[text] || <span>Disculpame, todavía no aprendí a responder eso 🙈</span>;
      pushBotMessage(botContent);
      setWaitingBot(false);
    }, 600);
  };

  const toggleChat = () => {
    if (isOpen) {
      // Si se cierra, limpiar historial y estados.
      setIsOpen(false);
      setMessages([]);
      setWaitingBot(false);
      setInputText('');
      setFilteredReplies(QUICK_REPLIES);
    } else {
      setIsOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputText.trim()) {
      // Si hay coincidencias exactas, usar la primera
      const exactMatch = filteredReplies.find(reply => 
        reply.toLowerCase().includes(inputText.toLowerCase())
      );
      if (exactMatch) {
        handleQuickReply(exactMatch);
        setInputText('');
      }
    }
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 font-roboto">
      {/* Botón flotante: solo cuando está cerrado */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full shadow-xl bg-accent text-white hover:scale-105 active:scale-95 transition-transform duration-150"
          aria-label="Abrir chat"
        >
          <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
        </button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="w-[92vw] sm:w-[85vw] md:w-[28rem] max-w-[420px] h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)] lg:h-[calc(100vh-8rem)] max-h-[calc(100vh-4rem)] bg-white border border-gray-300 rounded-2xl shadow-2xl flex flex-col overflow-hidden mr-1 sm:mr-2 mb-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-primary to-accent text-white text-base">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <span className="font-semibold">Chat SPA Sentirse Bien</span>
              </div>
              <button onClick={toggleChat} aria-label="Cerrar chat" className="hover:opacity-80 transition-opacity">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-snug whitespace-pre-line ${
                    msg.sender === 'bot'
                      ? 'bg-white text-gray-800 rounded-bl-none shadow border border-gray-200'
                      : 'bg-primary text-white rounded-br-none self-end ml-auto'
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              {waitingBot && (
                <div className="w-14 h-6 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 text-xs animate-pulse">
                  ...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies + Input simulado */}
            <div className="border-t border-gray-300 bg-gray-50 p-2 space-y-2">
              {/* Quick Replies */}
              <div className="grid gap-1">
                {filteredReplies.map((qr) => (
                  <button
                    key={qr}
                    onClick={() => handleQuickReply(qr)}
                    className="w-full flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors border border-gray-200"
                  >
                    {qr}
                  </button>
                ))}
              </div>

              {/* Input habilitado */}
              <div className="flex items-center gap-2 bg-white rounded-full border border-gray-300 px-2.5 py-1.5">
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyPress={handleInputKeyPress}
                  placeholder="Escribí un mensaje..."
                  className="flex-1 bg-transparent placeholder:text-gray-400 text-xs focus:outline-none border-none"
                />
                <Send className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 