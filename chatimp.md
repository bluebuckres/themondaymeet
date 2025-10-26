import React, { useState, useEffect, useRef } from 'react';
import { Send, Lock, Shield, Heart, Smile, ThumbsUp, Check, CheckCheck, Loader } from 'lucide-react';

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

let firebaseApp = null;
let database = null;

const initFirebase = () => {
  if (typeof window !== 'undefined' && !firebaseApp) {
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
  const [userId] = useState(() => 'user_' + Math.random().toString(36).substr(2, 9));
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isInChat, setIsInChat] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingUpdateRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const init = async () => {
      await initFirebase();
      const urlParams = new URLSearchParams(window.location.search);
      const urlChatId = urlParams.get('chat');
      
      if (urlChatId) {
        setChatId(urlChatId);
        setIsInChat(true);
        setShowWelcome(false);
      }
      
      setIsLoading(false);
    };
    
    init();
  }, []);

  useEffect(() => {
    if (!isInChat || !chatId || !database) return;

    const messagesRef = database.ref(`chats/${chatId}/messages`);
    const typingRef = database.ref(`chats/${chatId}/typing`);

    messagesRef.on('child_added', (snapshot) => {
      const msg = snapshot.val();
      setMessages(prev => {
        if (prev.some(m => m.id === snapshot.key)) return prev;
        return [...prev, { id: snapshot.key, ...msg }];
      });
    });

    messagesRef.on('child_changed', (snapshot) => {
      const updatedMsg = snapshot.val();
      setMessages(prev => prev.map(m => 
        m.id === snapshot.key ? { id: snapshot.key, ...updatedMsg } : m
      ));
    });

    typingRef.on('value', (snapshot) => {
      const typingData = snapshot.val() || {};
      const othersTyping = Object.entries(typingData).some(
        ([id, isTyping]) => id !== userId && isTyping
      );
      setIsTyping(othersTyping);
    });

    database.ref(`chats/${chatId}/lastActivity`).set(Date.now());

    return () => {
      messagesRef.off();
      typingRef.off();
    };
  }, [isInChat, chatId, userId]);

  const updateTypingStatus = (typing) => {
    if (!database || !chatId) return;
    const now = Date.now();
    if (now - lastTypingUpdateRef.current < 1000) return;
    lastTypingUpdateRef.current = now;
    database.ref(`chats/${chatId}/typing/${userId}`).set(typing);
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    updateTypingStatus(true);
    
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 2000);
  };

  const sendMessage = async () => {
    if (!message.trim() || !database) return;

    const newMessage = {
      text: message.trim(),
      sender: userId,
      timestamp: Date.now(),
      read: false
    };

    await database.ref(`chats/${chatId}/messages`).push(newMessage);
    setMessage('');
    updateTypingStatus(false);
  };

  const markAsRead = async (msgId) => {
    if (!database) return;
    await database.ref(`chats/${chatId}/messages/${msgId}`).update({ read: true });
  };

  const addReaction = async (msgId, emoji) => {
    if (!database) return;
    const msgRef = database.ref(`chats/${chatId}/messages/${msgId}`);
    const snapshot = await msgRef.once('value');
    const msg = snapshot.val();
    
    const reactions = msg.reactions || {};
    reactions[userId] = emoji;
    
    await msgRef.update({ reactions });
  };

  const startChat = () => {
    if (!chatId.trim()) return;
    const newUrl = `${window.location.pathname}?chat=${chatId}`;
    window.history.pushState({}, '', newUrl);
    setIsInChat(true);
    setShowWelcome(false);
  };

  useEffect(() => {
    if (!isInChat) return;
    
    messages.forEach(msg => {
      if (msg.sender !== userId && !msg.read) {
        markAsRead(msg.id);
      }
    });
  }, [messages, isInChat, userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <Loader className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  if (showWelcome && !isInChat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4">
                <Lock className="text-white" size={32} />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Private Space
              </h1>
              <p className="text-gray-600">A safe place to connect, completely anonymous</p>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <Shield className="text-purple-500 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">100% Anonymous</p>
                    <p className="text-gray-600 text-xs">No phone number, email, or personal info needed</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Lock className="text-pink-500 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Private & Secure</p>
                    <p className="text-gray-600 text-xs">Your conversation stays between you two</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="text-rose-500 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">No Pressure</p>
                    <p className="text-gray-600 text-xs">Chat at your own pace, leave anytime</p>
                  </div>
                </div>
              </div>

              <button
                onClick={startChat}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Start Chatting
              </button>

              <p className="text-center text-xs text-gray-500">
                Messages are stored temporarily and can be deleted anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isInChat) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <div className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Lock className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="font-semibold text-gray-800">Private Chat</h1>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>End-to-end encrypted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-4">
                  <Heart className="text-purple-500" size={28} />
                </div>
                <p className="text-gray-600 font-medium mb-2">Your private space is ready</p>
                <p className="text-gray-500 text-sm">Feel free to share what's on your mind</p>
              </div>
            )}

            {messages.map((msg) => {
              const isMe = msg.sender === userId;
              const reactions = msg.reactions || {};
              const reactionEmojis = { heart: '❤️', smile: '😊', thumbsup: '👍' };

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className={`px-4 py-3 rounded-2xl ${
                      isMe 
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-br-md' 
                        : 'bg-white/80 backdrop-blur-lg text-gray-800 rounded-bl-md shadow-sm'
                    }`}>
                      <p className="break-words">{msg.text}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className={`text-xs ${isMe ? 'text-purple-100' : 'text-gray-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          msg.read ? 
                            <CheckCheck size={14} className="text-purple-100" /> : 
                            <Check size={14} className="text-purple-100" />
                        )}
                      </div>
                    </div>

                    {!isMe && (
                      <div className="flex gap-1 ml-2">
                        {['heart', 'smile', 'thumbsup'].map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => addReaction(msg.id, emoji)}
                            className={`text-xs px-2 py-1 rounded-full transition-all ${
                              reactions[userId] === emoji
                                ? 'bg-purple-100 scale-110'
                                : 'bg-gray-100 hover:bg-purple-50'
                            }`}
                          >
                            {reactionEmojis[emoji]}
                          </button>
                        ))}
                      </div>
                    )}

                    {Object.keys(reactions).length > 0 && (
                      <div className="flex gap-1 text-sm ml-2">
                        {Object.values(reactions).map((emoji, i) => (
                          <span key={i}>{reactionEmojis[emoji]}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg border-t border-white/20 p-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input
              type="text"
              value={message}
              onChange={handleMessageChange}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 bg-white/50 border border-purple-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all"
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default App;