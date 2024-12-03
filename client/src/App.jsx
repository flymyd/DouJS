import './App.css'
import { useState, useRef, useEffect } from "react";
import ChatMessage from './components/ChatMessage';
import { useSocket } from './hooks/useSocket';
import { setupSocketEvents } from './services/socketEvents';
import { parseCommand, AVAILABLE_COMMANDS } from './services/commandParser';

function App() {
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [hasNickname, setHasNickname] = useState(!!localStorage.getItem('nickname'));
  const [endpoint] = useState('http://localhost:11451');
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const commandMenuRef = useRef(null);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(-1);
  const selectedCommandRef = useRef(null);

  const showUserStatus = () => {
    if (!hasNickname || !socket) return;

    // 发送状态查询请求
    socket.emit('message', JSON.stringify({
      type: 108,  // 新增一个状态查询的消息类型
      data: {}
    }));
  };

  // 在清除消息后显示状态
  const handleClearMessages = () => {
    setChatMessages([]);
    showUserStatus();
  };

  const messageHandlers = {
    addSystemMessage: (text) => setChatMessages(prev => [...prev, { type: 'system', content: text }]),
    addUserMessage: (text) => setChatMessages(prev => [...prev, { type: 'user', content: text }]),
    addServerMessage: (text) => setChatMessages(prev => [...prev, { type: 'server', content: text }]),
    addHintMessage: (text) => setChatMessages(prev => [...prev, { type: 'hint', content: text }]),
    addErrorMessage: (text) => setChatMessages(prev => [...prev, { type: 'error', content: text }]),
    clearMessages: handleClearMessages
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCommandMenu && 
          commandMenuRef.current && 
          !commandMenuRef.current.contains(event.target) &&
          !inputRef.current.contains(event.target)) {
        setShowCommandMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showCommandMenu]);

  useEffect(() => {
    if (showCommandMenu && message.startsWith('/')) {
      const input = message.toLowerCase();
      const matchIndex = AVAILABLE_COMMANDS.findIndex(cmd => 
        cmd.command.toLowerCase().startsWith(input)
      );
      
      setSelectedCommandIndex(matchIndex);

      if (matchIndex !== -1 && selectedCommandRef.current) {
        selectedCommandRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    } else {
      setSelectedCommandIndex(-1);
    }
  }, [message, showCommandMenu]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setShowCommandMenu(false);

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
      const [cmd] = message.split(' ');
      if (['出', '过', '手牌', '查看手牌'].includes(cmd)) {
        messageObj = parseCommand(message, messageHandlers, hasNickname);
      } else {
        if (!hasNickname) {
          messageHandlers.addSystemMessage('请先设置昵称，输入: /nick <你的昵称>');
          setMessage('');
          return;
        }
        messageObj = { type: 999, data: { message } };
      }
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

  const handleCommandSelect = (command) => {
    setMessage(command);
    setShowCommandMenu(false);
    setSelectedCommandIndex(-1);
    inputRef.current?.focus();
  };

  const handleMessageChange = (e) => {
    const newValue = e.target.value;
    setMessage(newValue);
    
    if (newValue === '/') {
      setShowCommandMenu(true);
    } else if (!newValue.startsWith('/')) {
      setShowCommandMenu(false);
    }
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
      <div className="input-container">
        {showCommandMenu && (
          <div 
            ref={commandMenuRef}
            className="command-menu"
          >
            {AVAILABLE_COMMANDS.map((cmd, index) => (
              <div
                key={cmd.command}
                ref={index === selectedCommandIndex ? selectedCommandRef : null}
                className={`command-item ${index === selectedCommandIndex ? 'selected' : ''}`}
                onClick={() => handleCommandSelect(cmd.command)}
              >
                <div className="command-name">{cmd.command}</div>
                <div className="command-desc">{cmd.description}</div>
              </div>
            ))}
          </div>
        )}
        <form className="chat-input" onSubmit={handleSendMessage}>
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleMessageChange}
            placeholder="输入消息或命令 (/help 查看帮助)"
          />
          <button type="submit">发送</button>
        </form>
      </div>
    </div>
  );
}

export default App;
