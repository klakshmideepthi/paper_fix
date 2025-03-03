// src/components/DocumentChatEditor.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DocumentChatEditorProps {
  documentContent: string;
  onDocumentUpdate: (newContent: string) => void;
}

export function DocumentChatEditor({ documentContent, onDocumentUpdate }: DocumentChatEditorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your document assistant. Tell me what changes you\'d like to make to your document.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    const userMessage = input;
    setInput('');
    setErrorMessage('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage,
      timestamp: new Date()
    }]);
    setIsLoading(true);
    
    try {
      // Create a timeout promise to abort the request if it takes too long
      const timeoutId = setTimeout(() => {
        throw new Error('Request timed out after 30 seconds');
      }, 30000);
      
      // Send the request to the edit API
      const response = await fetch('/api/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: documentContent,
          instruction: userMessage,
        }),
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      // Get the edited document content
      const editedContent = await response.text();
      
      if (!editedContent || editedContent.trim() === '') {
        throw new Error('Received empty response from AI service');
      }
      
      // Add AI response to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I\'ve updated the document based on your request.',
        timestamp: new Date()
      }]);
      
      // Update the document content
      onDocumentUpdate(editedContent);
      
    } catch (error) {
      console.error('Error editing document:', error);
      
      const errorMsg = error instanceof Error 
        ? error.message 
        : 'Unknown error occurred';
      
      setErrorMessage(errorMsg);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I encountered an error: ${errorMsg}. Please try again or simplify your request.`,
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Examples of document edits to suggest to the user
  const suggestions = [
    "Add a section on data privacy",
    "Make the language more formal",
    "Add a refund policy section",
    "Rewrite the introduction paragraph",
    "Simplify the legal terminology",
    "Add GDPR compliance information"
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Document Assistant</span>
          {errorMessage && (
            <span className="text-xs text-destructive">
              Error encountered. Try again.
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto p-4">
        <div className="space-y-4 mb-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex flex-col gap-1 max-w-[80%]",
                message.role === 'user' ? "ml-auto" : ""
              )}
            >
              <div className={cn(
                "flex w-max flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                message.role === 'user'
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-muted"
              )}>
                {message.content}
              </div>
              <span className={cn(
                "text-xs text-muted-foreground",
                message.role === 'user' ? "text-right" : "text-left"
              )}>
                {formatTime(message.timestamp)}
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="bg-muted w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0.2s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      
      {/* Quick suggestion buttons */}
      <div className="px-4 py-2 border-t flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <Button 
            key={index} 
            variant="outline" 
            size="sm" 
            onClick={() => handleSuggestionClick(suggestion)}
            className="text-xs"
          >
            {suggestion}
          </Button>
        ))}
      </div>
      
      <CardFooter className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me what changes you'd like to make..."
            disabled={isLoading}
            className="flex-grow"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Processing..." : "Send"}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}