'use client';

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { MessageSquare, X, Settings, Minimize2, Send } from "lucide-react";
import { messagesApi, friendsApi } from "@/lib/api";
import { sendChatMessage, subscribeToMessages, unsubscribeFromMessages, markMessagesAsRead, subscribeToTyping, unsubscribeFromTyping, broadcastTyping } from "@/lib/realtime";
import { useRealtime } from "@/contexts/RealtimeContext";
import type { ChatMessage } from "@/lib/realtime";

interface Friend {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  presence_status?: string;
}

interface Conversation {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  presence_status?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

interface ChatWindow {
  id: string;
  name: string;
  avatar: string;
  username: string;
  messages: ChatMessage[];
  isLoadingMessages: boolean;
}

// Global function to open chat from external components
let globalOpenChat: ((userId: string, username: string, displayName?: string, avatarUrl?: string) => void) | null = null;

export const openChatWithUser = (userId: string, username: string, displayName?: string, avatarUrl?: string) => {
  if (globalOpenChat) {
    globalOpenChat(userId, username, displayName, avatarUrl);
  }
};

export default function ChatWidget() {
  const [isChatListOpen, setIsChatListOpen] = useState(false);
  const [openChats, setOpenChats] = useState<ChatWindow[]>([]);
  const [messageInputs, setMessageInputs] = useState<{ [key: string]: string }>({});
  const [friends, setFriends] = useState<Friend[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: boolean }>({});
  const typingTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const typingBroadcastTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const currentUserIdRef = useRef<string | null>(null);
  const { presenceMap } = useRealtime();
  const messagesEndRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Decode current user ID once
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserIdRef.current = payload.userId;
    } catch {}
  }, []);

  // Register global chat opener
  useEffect(() => {
    globalOpenChat = (userId: string, username: string, displayName?: string, avatarUrl?: string) => {
      if (!openChats.find(chat => chat.id === userId)) {
        const newChat: ChatWindow = {
          id: userId,
          name: displayName || username,
          avatar: avatarUrl || `https://robohash.org/${username}?set=set3`,
          username: `@${username}`,
          messages: [],
          isLoadingMessages: false,
        };
        setOpenChats(prev => [...prev, newChat]);
        loadMessages(userId);
      }
      setIsChatListOpen(false);
    };

    return () => {
      globalOpenChat = null;
    };
  }, [openChats]);

  // Load friends and conversations on mount
  useEffect(() => {
    loadFriends();
    loadConversations();
  }, []);

  // Subscribe to messages + typing for open chats
  useEffect(() => {
    const userId = currentUserIdRef.current;
    if (!userId) return;

    openChats.forEach(chat => {
      subscribeToMessages(userId, chat.id, (message: ChatMessage) => {
        setOpenChats(prev => prev.map(c =>
          c.id === chat.id ? { ...c, messages: [...c.messages.filter(m => m.id !== message.id), message] } : c
        ));
        loadConversations();
        markMessagesAsRead(message.sender_id);
        // Scroll to bottom
        setTimeout(() => {
          const el = messagesEndRef.current[chat.id];
          el?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      });

      subscribeToTyping(userId, chat.id, (isTyping) => {
        setTypingUsers(prev => ({ ...prev, [chat.id]: isTyping }));
        if (typingTimeouts.current[chat.id]) clearTimeout(typingTimeouts.current[chat.id]);
        if (isTyping) {
          typingTimeouts.current[chat.id] = setTimeout(() => {
            setTypingUsers(prev => ({ ...prev, [chat.id]: false }));
          }, 3000);
        }
      });
    });

    return () => {
      openChats.forEach(chat => {
        unsubscribeFromMessages(userId, chat.id);
        unsubscribeFromTyping(userId, chat.id);
      });
    };
  }, [openChats.map(c => c.id).join(',')]);

  const loadFriends = async () => {
    const response = await friendsApi.getFriends();
    if (response.success && response.data) {
      setFriends(response.data.friends as Friend[]);
    }
  };

  const loadConversations = async () => {
    const response = await messagesApi.getConversations();
    if (response.success && response.data) {
      setConversations(response.data.conversations as Conversation[]);
    }
  };

  const loadMessages = async (userId: string) => {
    setOpenChats(prev => prev.map(chat => 
      chat.id === userId ? { ...chat, isLoadingMessages: true } : chat
    ));

    const response = await messagesApi.getMessages(userId);
    if (response.success && response.data) {
      setOpenChats(prev => prev.map(chat => 
        chat.id === userId 
          ? { ...chat, messages: response.data!.messages as ChatMessage[], isLoadingMessages: false }
          : chat
      ));

      // Mark as read
      markMessagesAsRead(userId);
    }
  };

  // Merge conversations and friends into one unified list
  const allContacts = [
    ...conversations.map(conv => ({ ...conv, type: 'conversation' as const })),
    ...friends.filter(friend => !conversations.some(conv => conv.id === friend.id)).map(friend => ({ ...friend, type: 'friend' as const }))
  ];

  const filteredContacts = allContacts.filter(contact => 
    contact.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openChatWindow = (conv: Conversation) => {
    if (!openChats.find(chat => chat.id === conv.id)) {
      const newChat: ChatWindow = {
        id: conv.id,
        name: conv.display_name || conv.username,
        avatar: conv.avatar_url || `https://robohash.org/${conv.username}?set=set3`,
        username: `@${conv.username}`,
        messages: [],
        isLoadingMessages: false,
      };
      setOpenChats([...openChats, newChat]);
      loadMessages(conv.id);
    }
    setIsChatListOpen(false);
  };

  const openChatWindowFromFriend = (friend: Friend) => {
    if (!openChats.find(chat => chat.id === friend.id)) {
      const newChat: ChatWindow = {
        id: friend.id,
        name: friend.display_name || friend.username,
        avatar: friend.avatar_url || `https://robohash.org/${friend.username}?set=set3`,
        username: `@${friend.username}`,
        messages: [],
        isLoadingMessages: false,
      };
      setOpenChats([...openChats, newChat]);
      loadMessages(friend.id);
    }
    setIsChatListOpen(false);
  };

  const closeChatWindow = (chatId: string) => {
    setOpenChats(openChats.filter(chat => chat.id !== chatId));
    delete messageInputs[chatId];
  };

  const handleSendMessage = async (chatId: string) => {
    const message = messageInputs[chatId];
    if (message && message.trim()) {
      const response = await sendChatMessage(chatId, message.trim());
      if (response.success && response.message) {
        // Add message to chat
        setOpenChats(prev => prev.map(chat => {
          if (chat.id === chatId) {
            return {
              ...chat,
              messages: [...chat.messages, response.message!]
            };
          }
          return chat;
        }));
        
        // Clear input
        setMessageInputs({ ...messageInputs, [chatId]: "" });
        
        // Update conversations
        loadConversations();
      }
    }
  };

  const handleInputChange = (chatId: string, value: string) => {
    setMessageInputs({ ...messageInputs, [chatId]: value });

    const userId = currentUserIdRef.current;
    if (!userId) return;

    // Broadcast typing
    broadcastTyping(userId, chatId, true);

    if (typingBroadcastTimeouts.current[chatId]) clearTimeout(typingBroadcastTimeouts.current[chatId]);
    typingBroadcastTimeouts.current[chatId] = setTimeout(() => {
      broadcastTyping(userId, chatId, false);
    }, 1500);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getPresenceStatus = (userId: string) => {
    const presence = presenceMap.get(userId);
    return presence?.presenceStatus || 'offline';
  };

  return (
    <>
      {/* Chat List Window */}
      {isChatListOpen && (
        <div className="fixed bottom-0 right-4 w-80 h-96 bg-white dark:bg-gray-800 rounded-t-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Chat</h3>
            <div className="flex items-center gap-1">
              <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button 
                onClick={() => setIsChatListOpen(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <Minimize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <input
                type="text"
                placeholder="Search friends and conversations"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 pl-8 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>

          {/* Unified Contacts List */}
          <div className="flex-1 overflow-y-auto">
          {filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => {
              const isConversation = contact.type === 'conversation';
              return (
                <button
                  key={contact.id}
                  onClick={() => isConversation ? openChatWindow(contact) : openChatWindowFromFriend(contact)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                      <Image
                        src={contact.avatar_url || `https://robohash.org/${contact.username}?set=set3`}
                        alt={contact.username || 'User'}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {getPresenceStatus(contact.id) !== 'offline' && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                    )}
                    {isConversation && (contact.unread_count || 0) > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {contact.unread_count}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                        {contact.display_name || contact.username}
                      </p>
                      {isConversation && contact.last_message_time && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                          {formatTime(contact.last_message_time)}
                        </span>
                      )}
                    </div>
                    {isConversation && contact.last_message ? (
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {contact.last_message}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getPresenceStatus(contact.id) === 'online' ? 'Online' : getPresenceStatus(contact.id) === 'in-game' ? 'Playing' : 'Offline'}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">No contacts yet</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Start chatting with your friends!</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Individual Chat Windows */}
      {openChats.map((chat, index) => (
        <div
          key={chat.id}
          className="fixed bottom-0 w-80 h-96 bg-white dark:bg-gray-800 rounded-t-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50"
          style={{ right: `${(index + 1) * 336 + 16}px` }}
        >
          {/* Chat Header */}
          <div className="flex items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
              <Image
                src={chat.avatar}
                alt={chat.name}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                {chat.name}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {chat.username}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button 
                onClick={() => closeChatWindow(chat.id)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chat.isLoadingMessages ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                Loading messages...
              </div>
            ) : chat.messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                  <Image
                    src={chat.avatar}
                    alt={chat.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {chat.name}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                  {chat.username}
                </p>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 max-w-xs mx-auto">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Start a conversation with {chat.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Send a message to begin chatting!
                  </p>
                </div>
              </div>
            ) : (
              <>
                {chat.messages.map((msg) => {
                  const isCurrentUser = msg.sender_id !== chat.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-3 py-2 ${
                          isCurrentUser
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isCurrentUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {typingUsers[chat.id] && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-bl-md px-3 py-2.5 flex items-center gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={(el) => { messagesEndRef.current[chat.id] = el; }} />
              </>
            )}
          </div>

          {/* Message Input */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Send a message"
                value={messageInputs[chat.id] || ""}
                onChange={(e) => handleInputChange(chat.id, e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(chat.id)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => handleSendMessage(chat.id)}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsChatListOpen(!isChatListOpen)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-40"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    </>
  );
}

