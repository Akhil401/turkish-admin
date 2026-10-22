import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from './supabaseClient';
import LogoSpinner from './components/LogoSpinner';

export default function Chat() {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [adminId, setAdminId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const USERS_PER_PAGE = 10;

  useEffect(() => {
    const initializeChat = async () => {
      // Get admin user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAdminId(user.id);
        
        // Handle deep link from URL
        const userIdFromParams = searchParams.get('userId');
        let initialSelectedUser = null;
        if (userIdFromParams) {
          initialSelectedUser = await loadSpecificUser(userIdFromParams);
        }
        
        await loadUsers(0, true, '', user.id, initialSelectedUser);
        setLoading(false);
      }
    };

    initializeChat();
  }, []);

  // Watch search term
  useEffect(() => {
    if (adminId && !loading) {
      const delayDebounceFn = setTimeout(() => {
        setPage(0);
        loadUsers(0, true, searchTerm, adminId);
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm, adminId]);

  const loadSpecificUser = async (userId) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profile) {
      setSelectedUser(profile);
      return profile;
    }
    return null;
  };

  const loadUsers = async (pageNumber, reset = false, currentSearchTerm = searchTerm, currentAdminId = adminId, linkedUser = null) => {
    if (loadingMore) return;
    setLoadingMore(true);

    const from = pageNumber * USERS_PER_PAGE;
    const to = from + USERS_PER_PAGE - 1;

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .neq('id', currentAdminId)
      .order('full_name', { ascending: true })
      .range(from, to);

    if (currentSearchTerm) {
      query = query.or(`full_name.ilike.%${currentSearchTerm}%,email.ilike.%${currentSearchTerm}%`);
    }

    const { data, count, error } = await query;

    if (!error && data) {
      setUsers(prev => {
        let newList = reset ? data : [...prev, ...data];
        
        // If we have a linked user and they aren't in the list, prepend them
        if (linkedUser && !newList.find(u => u.id === linkedUser.id)) {
           // Only prepend if they match the current search term (or if no search term)
           const matchesSearch = !currentSearchTerm || 
             (linkedUser.full_name?.toLowerCase().includes(currentSearchTerm.toLowerCase()) || 
              linkedUser.email?.toLowerCase().includes(currentSearchTerm.toLowerCase()));
           
           if (matchesSearch) {
             newList = [linkedUser, ...newList];
           }
        }
        
        return newList;
      });
      setHasMore(count > (pageNumber + 1) * USERS_PER_PAGE);
    }
    setLoadingMore(false);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadUsers(nextPage);
  };

  useEffect(() => {
    if (selectedUser && adminId) {
      loadMessages(selectedUser.id, adminId);
      return subscribeToMessages(selectedUser.id, adminId);
    }
  }, [selectedUser, adminId]);


  const loadMessages = async (userId, adminId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${adminId}),and(sender_id.eq.${adminId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
      markMessagesAsRead(userId, adminId);
    }
  };

  const subscribeToMessages = (userId, adminId) => {
    const channel = supabase
      .channel(`admin_messages_${userId}_${adminId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('New message received:', payload.new);
          console.log('Sender:', payload.new.sender_id);
          console.log('Admin ID:', adminId);
          console.log('User ID:', userId);

          // Only add messages that are part of this conversation
          if (
            (payload.new.sender_id === userId && payload.new.receiver_id === adminId) ||
            (payload.new.sender_id === adminId && payload.new.receiver_id === userId)
          ) {
            setMessages((prev) => {
              const filtered = prev.filter((msg) => !msg.id.startsWith('temp-'));
              return [...filtered, payload.new];
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Admin subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Admin successfully subscribed to realtime');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Admin subscription error');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !adminId) return;

    const messageContent = newMessage.trim();
    setNewMessage("");

    // Optimistically add the message to the state
    const tempMessage = {
      id: `temp-${Date.now()}`,
      sender_id: adminId,
      receiver_id: selectedUser.id,
      content: messageContent,
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    const { error } = await supabase.from('messages').insert({
      sender_id: adminId,
      receiver_id: selectedUser.id,
      content: messageContent,
    });

    // The push notification is sent server-side: the messages insert trigger
    // calls the message-notify edge function (no OneSignal key in the browser).
    if (error) {
      console.error('Error sending message:', error);
      // Remove the temp message if there was an error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
    }
  };

  const markMessagesAsRead = async (userId, adminId) => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', adminId)
      .eq('sender_id', userId)
      .eq('is_read', false);
  };

  const renderMessage = (message) => {
    const isMyMessage = message.sender_id === adminId;

    return (
      <div
        key={message.id}
        className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-4 px-2`}
      >
        <div
          className={`max-w-[75%] p-4 rounded-2xl shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 ${isMyMessage
            ? 'bg-gradient-to-br from-orange-600 to-orange-500 text-white rounded-br-none shadow-orange-100'
            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-gray-100'
            }`}
        >
          <p className="text-[15px] mb-1.5 leading-relaxed font-normal">{message.content}</p>
          <div className={`flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold ${isMyMessage ? 'opacity-80 text-orange-50' : 'opacity-40 text-gray-500'}`}>
             {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {isMyMessage && (
              <span className="ml-1">
                {message.is_read ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-white min-h-[400px]">
        <LogoSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-white relative">
      {/* Users List */}
      <div className={`w-full md:w-80 bg-white border-r border-gray-100 flex flex-col shadow-sm z-10 transition-all duration-300 ${
        selectedUser ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold mb-3">Chat</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Cerca utenti..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
            />
            <svg
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`w-full p-4 text-left hover:bg-gray-50 transition-all duration-200 group relative ${selectedUser?.id === user.id ? 'bg-orange-50' : ''
                }`}
            >
              {selectedUser?.id === user.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-600 rounded-r-full" />
              )}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm overflow-hidden flex-shrink-0 ${
                   selectedUser?.id === user.id ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                }`}>
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    (user.full_name || 'U')[0].toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold truncate ${selectedUser?.id === user.id ? 'text-orange-900' : 'text-gray-900'}`}>
                    {user.full_name || 'Utente'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{user.email}</div>
                </div>
              </div>
            </button>
          ))}
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full p-4 text-sm text-orange-600 font-medium hover:bg-orange-50 disabled:text-gray-400 flex items-center justify-center gap-2"
            >
              {loadingMore ? (
                <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                'Carica Altri Utenti'
              )}
            </button>
          )}
          {users.length === 0 && !loadingMore && (
            <div className="p-8 text-gray-500 text-center">
              <div className="mb-2">📭</div>
              Nessun utente trovato
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-gray-50 transition-all duration-300 ${
        selectedUser ? 'flex' : 'hidden md:flex'
      }`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-4">
              <button
                onClick={() => setSelectedUser(null)}
                className="md:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Torna alle chat"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-orange-100 text-orange-600 shadow-sm overflow-hidden flex-shrink-0">
                {selectedUser.avatar_url ? (
                  <img src={selectedUser.avatar_url} alt={selectedUser.full_name} className="w-full h-full object-cover" />
                ) : (
                  (selectedUser.full_name || 'U')[0].toUpperCase()
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-semibold truncate">
                  Chat con {selectedUser.full_name || 'Utente'}
                </h2>
                <p className="text-xs text-gray-500 truncate">{selectedUser.email}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map(renderMessage)}
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-10">
                  Inizia una conversazione
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Scrivi un messaggio..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-6 py-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Invia
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Seleziona un utente per iniziare a chattare
          </div>
        )}
      </div>
    </div>
  );
}
