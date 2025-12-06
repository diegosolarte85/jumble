'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useChat } from '@/app/hooks/useChat';
import { getAvatarUrl } from '@/lib/utils';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;
  const { match, messages, loading, error, sending, sendMessage } = useChat(matchId);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    fetch('/api/users/me')
      .then(res => res.json())
      .then(data => setCurrentUserId(data.id))
      .catch(() => {});
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!messageInput.trim() || sending) return;

    const content = messageInput;
    setMessageInput('');
    
    try {
      await sendMessage(content);
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessageInput(content); // Restore message on error
    }
  }, [messageInput, sending, sendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  if (loading) {
    return (
      <div className="chat-loading">
        <div className="loading-spinner" />
        <p>Loading chat...</p>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="chat-error">
        <h2>Unable to load chat</h2>
        <p>{error || 'Match not found'}</p>
        <button className="back-btn" onClick={() => router.push('/graph')}>
          Back to Matches
        </button>
      </div>
    );
  }

  const otherUser = match.otherUser;
  if (!otherUser) {
    return (
      <div className="chat-error">
        <h2>User not found</h2>
        <button className="back-btn" onClick={() => router.push('/graph')}>
          Back to Matches
        </button>
      </div>
    );
  }

  return (
    <div className="chat-page">
      {/* Header */}
      <header className="chat-header">
        <button className="back-button" onClick={() => router.push('/graph')}>
          ← Back
        </button>
        <div className="chat-header-user">
          <img
            src={getAvatarUrl(otherUser.profilePicture, otherUser.name, otherUser.id)}
            alt={otherUser.name || 'User'}
            className="chat-header-avatar"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const container = target.parentElement;
              if (container) {
                const fallback = document.createElement('div');
                fallback.className = 'chat-header-avatar-fallback';
                fallback.textContent = (otherUser.name || 'U').charAt(0).toUpperCase();
                container.appendChild(fallback);
              }
            }}
          />
          <div className="chat-header-info">
            <h2>{otherUser.name || 'Anonymous'}</h2>
            {otherUser.location && (
              <span className="chat-header-location">{otherUser.location}</span>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === currentUserId;
            return (
              <div
                key={message.id}
                className={`message ${isOwn ? 'message-own' : 'message-other'}`}
              >
                {!isOwn && (
                  <img
                    src={getAvatarUrl(otherUser.profilePicture, otherUser.name, otherUser.id)}
                    alt={otherUser.name || 'User'}
                    className="message-avatar"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <div className="message-content">
                  <div className="message-bubble">
                    {message.content}
                  </div>
                  <div className="message-time">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-container">
        <textarea
          className="chat-input"
          placeholder="Type a message..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={1}
          disabled={sending}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!messageInput.trim() || sending}
        >
          {sending ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

