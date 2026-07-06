import { useState, useRef, useEffect, useContext } from 'react';
import { Bot, X, Send, Loader2, Sparkles, Minus } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');

const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([{ sender: 'ai', text: 'Chào bạn! Mình là Trợ lý AI. Mình có thể hướng dẫn bạn sử dụng ứng dụng, hoặc giải đáp các thắc mắc. Bạn cần giúp gì nào?' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const dragControls = useDragControls();
  const constraintsRef = useRef(null);
  
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
      // Chỉ gửi tối đa 10 tin nhắn gần nhất để làm lịch sử ngữ cảnh, tránh bị quá giới hạn token đầu vào
      const historyToSend = messages.slice(-10);
      const res = await axios.post(`${BACKEND_URL}/api/ai/chat`, 
        { message: userMessage, history: historyToSend },
        { headers: { token } }
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
      {/* Container dùng để giới hạn vùng kéo thả */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[-1]" />

      <button
        onClick={() => { 
          if (isOpen) setIsOpen(false); 
          else { setIsOpen(true); setIsMinimized(false); } 
        }}
        className="fixed bottom-6 left-[140px] z-[100] w-14 h-14 rounded-full shadow-[0_8px_25px_rgba(150,155,231,0.4)] hover:shadow-[0_8px_30px_rgba(150,155,231,0.7)] hover:scale-105 transition-all duration-300 cursor-pointer hidden md:block overflow-hidden p-0 border-2 border-white"
        title="Trợ lý AI"
      >
        <img src="/girl_picture.jpg" alt="Trợ lý AI" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10">
            <span className="text-white font-black text-lg tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">AI</span>
        </div>
      </button>

      {/* Button for mobile */}
      <button
        onClick={() => { 
          if (isOpen) setIsOpen(false); 
          else { setIsOpen(true); setIsMinimized(false); } 
        }}
        className="fixed bottom-24 right-4 z-[100] w-12 h-12 rounded-full shadow-[0_8px_20px_rgba(150,155,231,0.4)] hover:shadow-[0_8px_25px_rgba(150,155,231,0.7)] hover:scale-105 transition-all duration-300 cursor-pointer md:hidden overflow-hidden p-0 border-2 border-white"
        title="Trợ lý AI"
      >
        <img src="/girl_picture.jpg" alt="Trợ lý AI" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10">
            <span className="text-white font-black text-base tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">AI</span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragControls={dragControls}
            dragConstraints={constraintsRef}
            dragListener={false}
            dragMomentum={false}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`fixed md:bottom-24 md:left-[140px] bottom-0 left-0 w-full md:w-[350px] bg-[#FCF8FB] md:rounded-3xl shadow-[0_15px_50px_-10px_rgba(150,155,231,0.5)] flex flex-col overflow-hidden z-[100] border border-[#D1D0EF]/60 transition-[height] duration-300 ease-in-out ${isMinimized ? 'h-[88px]' : 'h-[100dvh] md:h-[520px]'}`}
          >
            {/* Diffuse Aurora Background */}
            <div className="absolute inset-0 bg-aurora opacity-[0.15] pointer-events-none mix-blend-multiply"></div>
            {/* Noise/Grain Overlay */}
            <div className="absolute inset-0 bg-noise opacity-[0.08] pointer-events-none mix-blend-overlay"></div>
            
            {/* Glowing Orbs for Depth */}
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#EEC1DD]/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-[#969BE7]/20 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header */}
            <div 
              className="relative p-5 flex items-center justify-between shrink-0 border-b border-[#D1D0EF]/40 bg-white/30 backdrop-blur-xl z-10 cursor-grab active:cursor-grabbing select-none h-[88px]"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="flex items-center gap-4 pointer-events-none">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-[0_8px_15px_rgba(150,155,231,0.3)] overflow-hidden border border-white/50">
                  <img src="/girl_picture.jpg" alt="AI Avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                    <h3 className="font-serif font-bold tracking-wide text-lg text-[#6b6f9e]">TRỢ LÝ AI</h3>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(!isMinimized);
                  }} 
                  onPointerDown={(e) => e.stopPropagation()}
                  className="text-[#969BE7] hover:text-[#7a7ea6] transition-colors cursor-pointer p-2 rounded-full hover:bg-white/50 backdrop-blur-sm"
                  title={isMinimized ? "Phóng to" : "Thu nhỏ"}
                >
                  {isMinimized ? <Sparkles className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    setTimeout(() => setIsMinimized(false), 300);
                  }} 
                  onPointerDown={(e) => e.stopPropagation()}
                  className="text-[#969BE7] hover:text-[#7a7ea6] transition-colors cursor-pointer p-2 rounded-full hover:bg-white/50 backdrop-blur-sm"
                  title="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Wrapper */}
            <div className={`flex-1 flex flex-col overflow-hidden transition-opacity duration-300 ${isMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 z-10 custom-scrollbar">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'ai' && (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0 shadow-sm border border-[#D1D0EF]/60 self-end mb-1 overflow-hidden">
                            <img src="/girl_picture.jpg" alt="AI Avatar" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div 
                      className={`max-w-[78%] rounded-[1.25rem] px-5 py-3.5 text-[14px] leading-relaxed shadow-sm backdrop-blur-md 
                        ${msg.sender === 'user' 
                          ? 'bg-gradient-to-r from-[#969BE7] to-[#a2a6ea] text-white rounded-br-sm shadow-[0_4px_15px_rgba(150,155,231,0.2)]' 
                          : 'bg-white/80 border border-[#D1D0EF]/40 text-gray-700 rounded-bl-sm shadow-[0_4px_15px_rgba(209,208,239,0.2)]'}`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                     <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0 shadow-sm border border-[#D1D0EF]/60 self-end mb-1 overflow-hidden">
                            <img src="/girl_picture.jpg" alt="AI Avatar" className="w-full h-full object-cover" />
                     </div>
                    <div className="bg-white/80 border border-[#D1D0EF]/40 rounded-[1.25rem] px-5 py-3.5 rounded-bl-sm flex items-center shadow-[0_4px_15px_rgba(209,208,239,0.2)] backdrop-blur-md">
                      <Loader2 className="w-5 h-5 animate-spin text-[#969BE7]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSend} className="p-4 bg-white/40 backdrop-blur-xl border-t border-[#D1D0EF]/40 flex items-center gap-3 shrink-0 z-10">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Hỏi AI điều gì đó..."
                    className="w-full bg-[#FCF8FB]/80 border border-[#D1D0EF]/70 rounded-full pl-5 pr-12 py-3.5 text-[14px] outline-none text-gray-700 placeholder-[#969BE7]/60 focus:border-[#969BE7]/60 focus:bg-white transition-all shadow-inner"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#EEC1DD]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={!input.trim() || isLoading}
                  className="w-12 h-12 bg-gradient-to-br from-[#969BE7] to-[#EEC1DD] text-white rounded-full flex items-center justify-center hover:shadow-[0_0_20px_rgba(150,155,231,0.6)] transition-all duration-300 disabled:opacity-50 flex-shrink-0 cursor-pointer shadow-md hover:scale-105"
                >
                  <Send className="w-5 h-5 -ml-0.5 mt-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatBot;
