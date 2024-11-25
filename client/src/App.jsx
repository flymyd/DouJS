import './App.css'
import { useState, useRef, useEffect } from "react";
import ChatMessage from './components/ChatMessage';
import { useSocket } from './hooks/useSocket';
import { setupSocketEvents } from './services/socketEvents';
import { parseCommand } from './services/commandParser';

function App() {
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [hasNickname, setHasNickname] = useState(!!localStorage.getItem('nickname'));
  const [endpoint] = useState('http://localhost:11451');
  const messagesEndRef = useRef(null);

  const messageHandlers = {
    addSystemMessage: (text) => setChatMessages(prev => [...prev, { type: 'system', content: text }]),
    addUserMessage: (text) => setChatMessages(prev => [...prev, { type: 'user', content: text }]),
    addServerMessage: (text) => setChatMessages(prev => [...prev, { type: 'server', content: text }]),
    addHintMessage: (text) => setChatMessages(prev => [...prev, { type: 'hint', content: text }]),
    addErrorMessage: (text) => setChatMessages(prev => [...prev, { type: 'error', content: text }]),
    clearMessages: () => setChatMessages([])
  };

  const { socket, isConnected, ddzToken } = useSocket(endpoint, messageHandlers);

  useEffect(() => {
    setupSocketEvents(socket, messageHandlers, { setHasNickname });
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (isConnected && ddzToken) {
      const savedNickname = localStorage.getItem('nickname');
      if (savedNickname) {
        setHasNickname(true);
      }
    }
  }, [isConnected, ddzToken]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (!ddzToken) {
      messageHandlers.addSystemMessage('连接已断开，请刷新页面重新连接');
      return;
    }

    messageHandlers.addUserMessage(message);

    if (!hasNickname) {
      if (!message.startsWith('/nick ') && !message.startsWith('/help')) {
        messageHandlers.addSystemMessage('请先设置昵称，输入: /nick <你的昵称>');
        setMessage('');
        return;
      }
    }

    let messageObj = null;
    if (message.startsWith('/')) {
      messageObj = parseCommand(message, messageHandlers, hasNickname);
    } else {
      if (!hasNickname) {
        messageHandlers.addSystemMessage('请先设置昵称，输入: /nick <你的昵称>');
        setMessage('');
        return;
      }
      messageObj = { type: 999, data: { message } };
    }

    if (messageObj) {
      try {
        socket.emit('message', JSON.stringify(messageObj));
      } catch (error) {
        messageHandlers.addErrorMessage('命令格式错误：' + error.message);
      }
    }
    
    setMessage('');
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {chatMessages.map((msg, index) => (
          <ChatMessage 
            key={index}
            message={msg.content}
            type={msg.type}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="输入消息或命令 (/help 查看帮助)"
        />
        <button type="submit">发送</button>
      </form>
    </div>
  );
}

export default App;
