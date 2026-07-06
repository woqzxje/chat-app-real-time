import { useState, useRef, useEffect, useContext } from 'react';
import { Bot, X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');

const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ sender: 'ai', text: 'Chào bạn! Mình là Trợ lý AI. Mình có thể hướng dẫn bạn sử dụng ứng dụng, hoặc giải đáp các thắc mắc. Bạn cần giúp gì nào?' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { authUser } = useContext(AuthContext);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${BACKEND_URL}/api/ai/chat`, 
        { message: userMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessages(prev => [...prev, { sender: 'ai', text: res.data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { sender: 'ai', text: 'Xin lỗi, có lỗi xảy ra khi kết nối với AI.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!authUser) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 left-8 z-[100] p-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full shadow-2xl hover:scale-110 transition-transform cursor-pointer hidden md:block"
        title="Trợ lý AI"
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* Button for mobile (smaller, different position if needed) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-[100] p-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full shadow-2xl hover:scale-110 transition-transform cursor-pointer md:hidden"
        title="Trợ lý AI"
      >
        <Bot className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed md:bottom-28 md:left-8 bottom-0 left-0 w-full md:w-[380px] h-[100dvh] md:h-[600px] bg-white dark:bg-[#1e293b] md:rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[100] border border-gray-200 dark:border-white/10"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6" />
                <div>
                    <h3 className="font-semibold text-base">Trợ lý ảo AI</h3>
                    <p className="text-[11px] text-indigo-100">Luôn sẵn sàng hỗ trợ bạn</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors cursor-pointer p-2 rounded-full hover:bg-white/20">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-gray-50 dark:bg-transparent custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'ai' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center mr-2 shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                      </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm ${msg.sender === 'user' ? 'bg-indigo-500 text-white rounded-tr-none' : 'bg-white border border-gray-200 dark:border-white/5 dark:bg-white/10 text-gray-800 dark:text-gray-100 rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                   <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center mr-2 shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                   </div>
                  <div className="bg-white border border-gray-200 dark:border-white/5 dark:bg-white/10 rounded-2xl px-4 py-3 rounded-tl-none flex items-center shadow-sm">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500 dark:text-indigo-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-[#0f172a] border-t border-gray-200 dark:border-white/10 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Hỏi AI điều gì đó..."
                className="flex-1 bg-gray-100 dark:bg-white/5 border-none rounded-full px-4 py-3 text-sm outline-none text-gray-900 dark:text-white"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="p-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-colors disabled:opacity-50 flex-shrink-0 cursor-pointer shadow-md"
              >
                <Send className="w-4 h-4 -ml-0.5 mt-0.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatBot;
