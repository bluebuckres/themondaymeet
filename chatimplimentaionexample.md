import React, { useState, useEffect, useRef } from 'react';
import { Send, Copy, Check, Trash2, Clock } from 'lucide-react';

// Firebase configuration - Replace with your own config
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase (only once)
let firebaseApp = null;
let database = null;

const initFirebase = () => {
  if (typeof window !== 'undefined' && !firebaseApp) {
    // Load Firebase SDK dynamically
    const script1 = document.createElement('script');
    script1.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
    script1.async = true;
    document.head.appendChild(script1);
    
    const script2 = document.createElement('script');
    script2.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js';
    script2.async = true;
    document.head.appendChild(script2);
    
    return new Promise((resolve) => {
      script2.onload = () => {
        firebaseApp = window.firebase.initializeApp(FIREBASE_CONFIG);
        database = window.firebase.database();
        resolve(database);
      };
    });
  }
  return Promise.resolve(database);
};

const App = () => {
  const [chatId, setChatId] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isInChat, setIsInChat] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const dbRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Firebase and check URL for chat ID
  useEffect(() => {
    const init = async () => {
      await initFirebase();
      
      // Check URL for chat ID (simulate routing)
      const urlParams = new URLSearchParams(window.location.search);
      const urlChatId = urlParams.get('chat');
      
      if (urlChatId) {
        setChatId(urlChatId);
      }
      
      setIsLoading(false);
    };
    
    init();
  }, []);

  // Listen to messages when in chat
  useEffect(() => {
    if (!isInChat || !chatId || !database) return;

    const messagesRef = database.ref(`chats/${chatId}/messages`);
    dbRef.current = messagesRef;

    // Listen for new messages
    const onMessageAdded = messagesRef.on('child_added', (snapshot) => {
      const msg = snapshot.val();
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === snapshot.key)) return prev;
        return [...prev, { id: snapshot.key, ...msg }];
      });
    });

    // Update last activity
    database.ref(`chats/${chatId}/lastActivity`).set(Date.now());

    return () => {
      messagesRef.off('child_added', onMessageAdded);
    };
  }, [isInChat, chatId]);

  const generateChatId = () => {
    return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  };

  const joinChat = () => {
    if (!username.trim() || !chatId.trim()) return;
    
    // Update URL without reload
    const newUrl = `${window.location.pathname}?chat=${chatId}`;
    window.history.pushState({}, '', newUrl);
    
    setIsInChat(true);
  };

  const sendMessage = async () => {
    if (!message.trim() || !database) return;

    const newMessage = {
      text: message.trim(),
      sender: username,
      timestamp: Date.now()
    };

    await database.ref(`chats/${chatId}/messages`).push(newMessage);
    setMessage('');
  };

  const copyChatLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?chat=${chatId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearChat = async () => {
    if (!database || !window.confirm('Delete all messages? This cannot be undone.')) return;
    
    await database.ref(`chats/${chatId}/messages`).remove();
    setMessages([]);
  };

  const leaveChat = () => {
    setIsInChat(false);
    setMessages([]);
    setChatId('');
    setUsername('');
    window.history.pushState({}, '', window.location.pathname);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Chat Room View
  if (isInChat) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white shadow-md p-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Private Chat</h1>
            <p className="text-sm text-gray-500">Room: {chatId}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyChatLink}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Share Link'}
            </button>
            <button
              onClick={clearChat}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
              title="Clear chat"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={leaveChat}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Leave
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender === username;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      isMe
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-800 shadow'
                    }`}
                  >
                    <p className={`text-xs font-semibold mb-1 ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                      {msg.sender}
                    </p>
                    <p className="break-words">{msg.text}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Join/Create Chat View
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Private Chat</h1>
        <p className="text-gray-600 mb-8">Secure, real-time messaging with no registration required</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chat Room ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="Enter or generate chat ID"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setChatId(generateChatId())}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                title="Generate new ID"
              >
                Generate
              </button>
            </div>
          </div>

          <button
            onClick={joinChat}
            disabled={!username.trim() || !chatId.trim()}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
          >
            Join Chat Room
          </button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Clock size={16} />
            How it works
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Generate a unique chat ID and share it</li>
            <li>• Both users enter the same chat ID</li>
            <li>• Messages sync in real-time</li>
            <li>• History persists across refreshes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;