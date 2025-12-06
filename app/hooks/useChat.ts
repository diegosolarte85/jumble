'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: Date;
}

export interface MatchInfo {
  id: string;
  user1Id: string;
  user2Id: string;
  matchScore: number | null;
  createdAt: Date;
  lastMessageAt: Date | null;
  otherUser: {
    id: string;
    name: string | null;
    bio: string | null;
    location: string | null;
    profilePicture: string | null;
    commitmentLevel: string | null;
  } | null;
}

export function useChat(matchId: string | null) {
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const fetchMatch = useCallback(async () => {
    if (!matchId) return;

    try {
      const response = await fetch(`/api/matches/${matchId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch match');
      }
      const matchData = await response.json();
      setMatch(matchData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat');
    }
  }, [matchId]);

  const fetchMessages = useCallback(async () => {
    if (!matchId) return;

    try {
      const response = await fetch(`/api/matches/${matchId}/messages`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const messagesData = await response.json();
      // Sort by createdAt ascending (oldest first)
      const sortedMessages = messagesData.sort((a: Message, b: Message) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return aTime - bTime;
      });
      setMessages(sortedMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    }
  }, [matchId]);

  useEffect(() => {
    if (matchId) {
      setLoading(true);
      Promise.all([fetchMatch(), fetchMessages()]).finally(() => {
        setLoading(false);
      });
    }
  }, [matchId, fetchMatch, fetchMessages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!matchId || !content.trim()) return;

    setSending(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const newMessage = await response.json();
      setMessages(prev => [...prev, newMessage]);
      
      // Refresh match to update lastMessageAt
      await fetchMatch();
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    } finally {
      setSending(false);
    }
  }, [matchId, fetchMatch]);

  return {
    match,
    messages,
    loading,
    error,
    sending,
    sendMessage,
    refetch: fetchMessages,
  };
}

