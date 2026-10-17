import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { ChatMessage } from '../../types';

interface RoomChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
}

const REACTION_EMOJIS = ['🔥', '🎧', '💃', '❤️', '⚡', '🚀'];

export default function RoomChat({ messages, onSendMessage, onSendReaction }: RoomChatProps) {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0D121F] border border-slate-800/80 rounded-xl overflow-hidden shadow-lg">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200">Room Chat &amp; Log</span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-400 font-mono tabular-nums">{messages.length} events</span>
        </div>
        <div className="flex items-center gap-1">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendReaction(emoji)}
              title={`Send ${emoji}`}
              className="p-1 hover:bg-slate-800 rounded transition-transform active:scale-125 text-sm"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Messages List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] max-h-[360px]">
        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="text-center my-1.5">
                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-mono text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20">
                  {msg.text}
                </span>
              </div>
            );
          }

          const isSelf = msg.senderId === 'user-self';

          return (
            <div key={msg.id} className={`flex items-start gap-2.5 ${isSelf ? 'flex-row-reverse' : ''}`}>
              {msg.senderAvatar ? (
                <img
                  src={msg.senderAvatar}
                  alt={msg.senderName}
                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-700"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-bold shrink-0">
                  {msg.senderName[0]}
                </div>
              )}

              <div className={`max-w-[78%] flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                  <span className="font-medium text-slate-300">{msg.senderName}</span>
                  {msg.senderRole === 'host' && (
                    <span className="text-[10px] text-amber-400 font-mono">HOST</span>
                  )}
                  {msg.senderRole === 'dj' && (
                    <span className="text-[10px] text-emerald-400 font-mono">DJ</span>
                  )}
                  <span className="text-slate-500">·</span>
                  <span className="font-mono text-[10px]">{msg.timestamp}</span>
                </div>

                <div
                  className={`px-3 py-1.5 rounded-lg text-xs leading-relaxed ${
                    isSelf
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/60'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Composer */}
      <form onSubmit={handleSubmit} className="p-2.5 border-t border-slate-800 bg-slate-900/80 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send message to room listeners..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-semibold rounded-lg transition-colors shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
