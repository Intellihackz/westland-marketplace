'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Conversation, Message } from '@/lib/types/message';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch('/api/messages');
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations);
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      const fetchMessages = async () => {
        try {
          const res = await fetch(`/api/messages/${selectedConversation.listingId}`);
          if (res.ok) {
            const data = await res.json();
            setMessages(data.messages);
          }
        } catch (error) {
          console.error('Failed to fetch messages:', error);
        }
      };

      fetchMessages();
    }
  }, [selectedConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      const otherParticipant = selectedConversation.participants.find(
        p => p._id !== user?._id
      );

      if (!otherParticipant) return;

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: selectedConversation.listingId,
          sellerId: otherParticipant._id,
          message: newMessage
        })
      });

      if (res.ok) {
        setNewMessage('');
        // Refresh messages
        const messagesRes = await fetch(`/api/messages/${selectedConversation.listingId}`);
        if (messagesRes.ok) {
          const data = await messagesRes.json();
          setMessages(data.messages);
        }
        // Refresh conversations to update last message
        const conversationsRes = await fetch('/api/messages');
        if (conversationsRes.ok) {
          const data = await conversationsRes.json();
          setConversations(data.conversations);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-8">Messages</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className={`${selectedConversation ? 'hidden md:block' : 'block'} border rounded-lg overflow-hidden`}>
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No conversations yet
              </div>
            ) : (
              <div className="divide-y">
                {conversations.map(conversation => (
                  <button
                    key={conversation._id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedConversation?._id === conversation._id
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative w-12 h-12">
                        <Image
                          src={conversation.listing.image}
                          alt={conversation.listing.title}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">
                          {conversation.listing.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {conversation.lastMessage.content}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="ml-2 bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className={`${selectedConversation ? 'block' : 'hidden md:block'} md:col-span-2 border rounded-lg overflow-hidden flex flex-col h-[calc(100vh-16rem)]`}>
            {selectedConversation ? (
              <>
                {/* Conversation Header with Back Button for Mobile */}
                <div className="p-4 border-b flex items-center">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="mr-4 text-blue-500 md:hidden"
                  >
                    &larr; Back
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12">
                      <Image
                        src={selectedConversation.listing.image}
                        alt={selectedConversation.listing.title}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <div>
                      <h2 className="font-medium">
                        {selectedConversation.listing.title}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ₦{selectedConversation.listing.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map(message => {
                    const isOwnMessage = message.sender._id === user?._id;
                    return (
                      <div
                        key={message._id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start gap-2 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                          {!isOwnMessage && (
                            <div className="relative w-8 h-8 flex-shrink-0">
                              {message.sender.avatar ? (
                                <Image
                                  src={message.sender.avatar}
                                  alt={message.sender.name}
                                  fill
                                  className="object-cover rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <span className="text-sm">
                                    {message.sender.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          <div>
                            {!isOwnMessage && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                {message.sender.name}
                              </p>
                            )}
                            <div
                              className={`rounded-lg p-3 ${
                                isOwnMessage
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 dark:bg-gray-800'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">
                                {message.content}
                              </p>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a conversation to view messages
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}