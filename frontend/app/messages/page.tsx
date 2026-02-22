"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Send, ArrowLeft, Search, PenSquare, Reply, X } from "lucide-react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { messagesApi, searchApi, storage } from "@/lib/api";
import {
  subscribeToMessages,
  unsubscribeFromMessages,
  subscribeToTyping,
  unsubscribeFromTyping,
  broadcastTyping,
  markMessagesAsRead,
} from "@/lib/realtime";

interface Conversation {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  presence_status?: string;
  last_message?: string;
  last_message_time?: string;
  is_read?: boolean;
  is_sender?: boolean;
  unread_count?: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_username: string;
  sender_display_name?: string;
  sender_avatar_url?: string;
  reply_to_id?: string;
  reply_to_content?: string;
  reply_to_sender?: string;
}

const MessagesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);

  // Active conversation / thread
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingBroadcastRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const activeConvRef = useRef<Conversation | null>(null);

  // New message compose
  const [showCompose, setShowCompose] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientResults, setRecipientResults] = useState<any[]>([]);
  const [searchingRecipient, setSearchingRecipient] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<any | null>(null);
  const [composeMessage, setComposeMessage] = useState("");
  const [sendingCompose, setSendingCompose] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep activeConvRef in sync so realtime callbacks always have current value
  useEffect(() => {
    activeConvRef.current = activeConversation;
  }, [activeConversation]);

  // Decode current user ID once
  useEffect(() => {
    const token = storage.getAccessToken();
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      currentUserIdRef.current = payload.userId;
    } catch {}
  }, []);

  const refreshConversations = useCallback(async () => {
    const response = await messagesApi.getConversations();
    if (response.success && response.data) {
      setConversations((response.data.conversations as Conversation[]) || []);
    }
  }, []);

  // Fetch conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      setLoadingConversations(true);
      try {
        await refreshConversations();
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setLoadingConversations(false);
      }
    };
    fetchConversations();
  }, [refreshConversations]);

  // Fetch messages + subscribe to realtime when active conversation changes
  useEffect(() => {
    if (!activeConversation) return;

    const userId = currentUserIdRef.current;
    if (!userId) return;

    // Fetch existing messages
    const fetchMessages = async () => {
      setLoadingMessages(true);
      setIsOtherUserTyping(false);
      try {
        const response = await messagesApi.getMessages(activeConversation.id);
        if (response.success && response.data) {
          setMessages((response.data.messages as Message[]) || []);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoadingMessages(false);
      }
      // Mark as read
      markMessagesAsRead(activeConversation.id);
    };

    fetchMessages();

    // Subscribe to incoming messages in real-time
    subscribeToMessages(userId, activeConversation.id, (newMsg) => {
      setMessages((prev) => {
        // Deduplicate by id
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg as unknown as Message];
      });
      // Update conversation list preview
      refreshConversations();
      // Mark as read immediately since we're in the conversation
      markMessagesAsRead(activeConversation.id);
    });

    // Subscribe to typing indicators
    subscribeToTyping(userId, activeConversation.id, (isTyping) => {
      setIsOtherUserTyping(isTyping);
      // Auto-clear typing after 3s in case stop event is missed
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => setIsOtherUserTyping(false), 3000);
      }
    });

    return () => {
      if (!userId) return;
      unsubscribeFromMessages(userId, activeConversation.id);
      unsubscribeFromTyping(userId, activeConversation.id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (typingBroadcastRef.current) clearTimeout(typingBroadcastRef.current);
    };
  }, [activeConversation?.id, refreshConversations]);

  // Scroll to bottom when messages change or typing indicator appears
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOtherUserTyping]);

  // Recipient search with debounce
  useEffect(() => {
    if (recipientSearch.trim().length < 2) {
      setRecipientResults([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingRecipient(true);
      try {
        const response = await searchApi.searchUsers(recipientSearch, 6);
        if (response.success && response.data) {
          setRecipientResults((response.data.users as any[]) || []);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setSearchingRecipient(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [recipientSearch]);

  // Handle typing input — broadcast typing events with debounce
  const handleMessageInput = (value: string) => {
    setMessageText(value);

    const userId = currentUserIdRef.current;
    const conv = activeConvRef.current;
    if (!userId || !conv) return;

    // Broadcast "is typing"
    broadcastTyping(userId, conv.id, true);

    // Debounce "stopped typing"
    if (typingBroadcastRef.current) clearTimeout(typingBroadcastRef.current);
    typingBroadcastRef.current = setTimeout(() => {
      broadcastTyping(userId, conv.id, false);
    }, 1500);
  };

  // Send message in thread
  const handleSendMessage = async () => {
    if (!activeConversation || !messageText.trim()) return;

    const userId = currentUserIdRef.current;

    // Stop typing indicator immediately on send
    if (userId) broadcastTyping(userId, activeConversation.id, false);
    if (typingBroadcastRef.current) clearTimeout(typingBroadcastRef.current);

    setSendingMessage(true);
    const text = messageText.trim();
    // Prepend reply quote if replying
    const fullContent = replyingTo
      ? `> @${replyingTo.sender_username}: ${replyingTo.content.slice(0, 80)}${replyingTo.content.length > 80 ? '…' : ''}\n${text}`
      : text;
    setMessageText("");
    setReplyingTo(null);

    try {
      const response = await messagesApi.sendMessage(activeConversation.id, fullContent);
      if (response.success && response.data) {
        const newMsg = response.data.message as Message;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        refreshConversations();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessageText(text); // restore on failure
      setReplyingTo(null);
    } finally {
      setSendingMessage(false);
    }
  };

  // Send compose message
  const handleSendCompose = async () => {
    if (!selectedRecipient || !composeMessage.trim()) return;

    setSendingCompose(true);
    try {
      const response = await messagesApi.sendMessage(selectedRecipient.id, composeMessage.trim());
      if (response.success) {
        const convResponse = await messagesApi.getConversations();
        if (convResponse.success && convResponse.data) {
          const convs = (convResponse.data.conversations as Conversation[]) || [];
          setConversations(convs);
          const newConv = convs.find((c) => c.id === selectedRecipient.id);
          if (newConv) setActiveConversation(newConv);
        }
        setShowCompose(false);
        setSelectedRecipient(null);
        setRecipientSearch("");
        setComposeMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingCompose(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Messages
          </h1>
          <button
            onClick={() => { setShowCompose(true); setActiveConversation(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            <PenSquare className="w-4 h-4" />
            New Message
          </button>
        </div>

        <div className="flex gap-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex-1 min-h-0">
          {/* Conversations List (Left Panel) */}
          <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Conversations</h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingConversations ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No conversations yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Send a message to start a conversation
                  </p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => { setActiveConversation(conv); setShowCompose(false); }}
                    className={`w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 ${
                      activeConversation?.id === conv.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 overflow-hidden relative">
                      {conv.avatar_url ? (
                        <Image src={conv.avatar_url} alt={conv.username} fill className="object-cover" sizes="40px" />
                      ) : (
                        <Image src={`https://robohash.org/${conv.username}?set=set3`} alt={conv.username} fill className="object-cover" sizes="40px" />
                      )}
                      {conv.presence_status === "online" && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm truncate ${conv.unread_count && conv.unread_count > 0 ? "font-bold text-gray-900 dark:text-gray-100" : "font-medium text-gray-700 dark:text-gray-300"}`}>
                          {conv.display_name || conv.username}
                        </span>
                        {conv.last_message_time && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                            {formatTime(conv.last_message_time)}
                          </span>
                        )}
                      </div>
                      {conv.last_message && (
                        <p className={`text-xs truncate mt-0.5 ${conv.unread_count && conv.unread_count > 0 ? "text-gray-700 dark:text-gray-300 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                          {conv.is_sender ? "You: " : ""}{conv.last_message}
                        </p>
                      )}
                    </div>
                    {conv.unread_count && conv.unread_count > 0 && (
                      <span className="w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                        {conv.unread_count > 9 ? "9+" : conv.unread_count}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Panel - Message Thread or Compose */}
          <div className="flex-1 flex flex-col">
            {showCompose ? (
              /* Compose New Message */
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">New Message</h2>
                  <div className="relative">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">To:</label>
                    {selectedRecipient ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {selectedRecipient.display_name || selectedRecipient.username}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">@{selectedRecipient.username}</span>
                        <button
                          onClick={() => { setSelectedRecipient(null); setRecipientSearch(""); }}
                          className="ml-auto text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                          <Search className="w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={recipientSearch}
                            onChange={(e) => setRecipientSearch(e.target.value)}
                            placeholder="Search for a user..."
                            className="bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none w-full"
                          />
                        </div>
                        {(recipientResults.length > 0 || searchingRecipient) && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                            {searchingRecipient ? (
                              <div className="p-3 text-center">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-500 mx-auto" />
                              </div>
                            ) : (
                              recipientResults.map((user: any) => (
                                <button
                                  key={user.id}
                                  onClick={() => {
                                    setSelectedRecipient(user);
                                    setRecipientSearch("");
                                    setRecipientResults([]);
                                  }}
                                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                                >
                                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                                  <div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {user.display_name || user.username}
                                    </span>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</p>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-4">
                  <textarea
                    value={composeMessage}
                    onChange={(e) => setComposeMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={6}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                  <button
                    onClick={() => { setShowCompose(false); setSelectedRecipient(null); setRecipientSearch(""); setComposeMessage(""); }}
                    className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendCompose}
                    disabled={!selectedRecipient || !composeMessage.trim() || sendingCompose}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingCompose ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send
                  </button>
                </div>
              </div>
            ) : activeConversation ? (
              /* Message Thread */
              <div className="flex flex-col h-full">
                {/* Thread Header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors md:hidden"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 overflow-hidden relative">
                    {activeConversation.avatar_url ? (
                      <Image src={activeConversation.avatar_url} alt={activeConversation.username} fill className="object-cover" sizes="36px" />
                    ) : (
                      <Image src={`https://robohash.org/${activeConversation.username}?set=set3`} alt={activeConversation.username} fill className="object-cover" sizes="36px" />
                    )}
                  </div>
                  <div>
                    <Link href={`/profile?user=${activeConversation.username}`} className="text-sm font-bold text-gray-900 dark:text-gray-100 hover:underline">
                      {activeConversation.display_name || activeConversation.username}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400">@{activeConversation.username}</p>
                  </div>
                </div>

                {/* Messages — fixed height, internal scroll only */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-gray-500 dark:text-gray-400">No messages yet. Say hello!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isSender = msg.sender_id !== activeConversation.id;
                      // Parse reply quote from content (lines starting with "> ")
                      const lines = msg.content.split('\n');
                      const quoteLines = lines.filter(l => l.startsWith('> '));
                      const bodyLines = lines.filter(l => !l.startsWith('> '));
                      const hasQuote = quoteLines.length > 0;
                      const quoteText = quoteLines.map(l => l.slice(2)).join(' ');
                      const bodyText = bodyLines.join('\n').trim();
                      return (
                        <div key={msg.id} className={`group flex items-end gap-1 ${isSender ? "justify-end" : "justify-start"}`}>
                          {/* Reply button — left side for received, right side for sent */}
                          {!isSender && (
                            <button
                              onClick={() => { setReplyingTo(msg); inputRef.current?.focus(); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex-shrink-0 mb-1"
                              title="Reply"
                            >
                              <Reply className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                            </button>
                          )}
                          <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                            isSender
                              ? "bg-blue-600 text-white rounded-br-md"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md"
                          }`}>
                            {hasQuote && (
                              <div className={`text-xs mb-1.5 px-2 py-1 rounded border-l-2 ${
                                isSender
                                  ? "border-blue-300 bg-blue-500/30 text-blue-100"
                                  : "border-gray-400 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                              }`}>
                                <span className="truncate block">{quoteText}</span>
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">{bodyText || msg.content}</p>
                            <p className={`text-xs mt-1 ${isSender ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                          {isSender && (
                            <button
                              onClick={() => { setReplyingTo(msg); inputRef.current?.focus(); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex-shrink-0 mb-1"
                              title="Reply"
                            >
                              <Reply className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                  {/* Typing indicator */}
                  {isOtherUserTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2.5 rounded-2xl rounded-bl-md flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-gray-400 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-400 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-400 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 dark:border-gray-700">
                  {/* Reply preview bar */}
                  {replyingTo && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
                      <Reply className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">Replying to</span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">@{replyingTo.sender_username}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">{replyingTo.content.slice(0, 60)}{replyingTo.content.length > 60 ? '…' : ''}</span>
                      <button onClick={() => setReplyingTo(null)} className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 p-4">
                    <input
                      ref={inputRef}
                      type="text"
                      value={messageText}
                      onChange={(e) => handleMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                        if (e.key === "Escape") setReplyingTo(null);
                      }}
                      placeholder={replyingTo ? `Reply to @${replyingTo.sender_username}...` : "Type a message..."}
                      className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendingMessage}
                      className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* No conversation selected */
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <Send className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Your Messages</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Select a conversation or start a new one
                  </p>
                  <button
                    onClick={() => setShowCompose(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    New Message
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MessagesPage;
