import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { getSocket } from '../api/socket';
import { useAuth } from '../context/AuthContext';
import type { ChatMessage, MatchSummary } from '../types';

export default function Messages() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [activeMatch, setActiveMatch] = useState<MatchSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [warning, setWarning] = useState('');
  const [safetyNotice, setSafetyNotice] = useState('');
  const [isNewMatchWindow, setIsNewMatchWindow] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/matches').then((r) => setMatches(r.data.matches));
    const socket = getSocket();

    socket.on('new_message', (msg: ChatMessage) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    });
    socket.on('message_blocked', ({ reason }: { reason: string }) => setWarning(reason));
    socket.on('account_banned', ({ reason }: { reason: string }) => {
      alert(`Your account has been banned: ${reason}`);
      window.location.href = '/';
    });
    socket.on('flagged_for_review', () => setWarning('You have received multiple strikes and your account is flagged for human review.'));
    socket.on('typing', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      if (userId !== user?.id) setOtherTyping(isTyping);
    });

    return () => {
      socket.off('new_message');
      socket.off('message_blocked');
      socket.off('account_banned');
      socket.off('flagged_for_review');
      socket.off('typing');
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function openMatch(m: MatchSummary) {
    setActiveMatch(m);
    setWarning('');
    const resp = await api.get(`/matches/${m.matchId}/messages`);
    setMessages(resp.data.messages);
    setSafetyNotice(resp.data.safetyNotice);
    setIsNewMatchWindow(resp.data.isNewMatchWindow);
    const socket = getSocket();
    socket.emit('join_match', m.matchId);
    socket.emit('mark_read', { matchId: m.matchId });
  }

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !activeMatch) return;
    getSocket().emit('send_message', { matchId: activeMatch.matchId, content: text });
    setText('');
  }

  function handleTyping(value: string) {
    setText(value);
    if (activeMatch) getSocket().emit('typing', { matchId: activeMatch.matchId, isTyping: value.length > 0 });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 h-[80vh] flex gap-4">
      <div className="w-72 bg-white rounded-xl shadow-sm overflow-y-auto">
        <h2 className="font-bold p-4 border-b">Matches</h2>
        {matches.length === 0 && <p className="p-4 text-sm text-gray-500">No matches yet. Go like some profiles!</p>}
        {matches.map((m) => (
          <button
            key={m.matchId}
            onClick={() => openMatch(m)}
            className={`w-full text-left p-3 flex gap-3 items-center border-b hover:bg-gray-50 ${activeMatch?.matchId === m.matchId ? 'bg-brand-50' : ''}`}
          >
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
              {m.otherUser.photos[0] && <img src={`${import.meta.env.VITE_API_URL}${m.otherUser.photos[0].url}`} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{m.otherUser.name} {m.otherUser.isOnline && <span className="text-green-500">●</span>}</p>
              <p className="text-xs text-gray-500 truncate">{m.lastMessage?.content || 'Say hi!'}</p>
            </div>
            {m.unreadCount > 0 && <span className="bg-brand-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{m.unreadCount}</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm flex flex-col">
        {!activeMatch ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">Select a match to start chatting</div>
        ) : (
          <>
            <div className="border-b p-3 font-semibold">{activeMatch.otherUser.name}</div>
            {safetyNotice && (
              <div className="bg-yellow-50 text-yellow-800 text-xs p-2 px-3 border-b">📌 {safetyNotice}</div>
            )}
            {isNewMatchWindow && (
              <div className="bg-blue-50 text-blue-800 text-xs p-2 px-3 border-b">
                This is a new match. For your safety, phone numbers and UPI IDs cannot be shared until 7 days after matching.
              </div>
            )}
            {warning && <div className="bg-red-50 text-red-700 text-xs p-2 px-3 border-b">⚠️ {warning}</div>}

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${m.senderId === user?.id ? 'bg-brand-600 text-white' : 'bg-gray-100'}`}>
                    {m.content}
                    {m.senderId === user?.id && m.readAt && <span className="block text-[10px] opacity-70 mt-0.5">Read</span>}
                  </div>
                </div>
              ))}
              {otherTyping && <p className="text-xs text-gray-400 italic">Typing...</p>}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="border-t p-3 flex gap-2">
              <input
                value={text}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button className="bg-brand-600 text-white rounded-full px-5 py-2 font-semibold hover:bg-brand-700">Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
