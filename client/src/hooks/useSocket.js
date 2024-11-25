import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (endpoint, messageHandlers) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [ddzToken, setDdzToken] = useState(localStorage.getItem('ddzToken') || '');
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const newSocket = io(endpoint, {
      query: { ddzToken }
    });

    // 基础连接事件
    newSocket.on('connect', () => {
      messageHandlers.addSystemMessage('正在连接服务器...');
      if (ddzToken) {
        setIsReconnecting(true);
        messageHandlers.addSystemMessage('正在使用已有身份重新连接...');
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      messageHandlers.addSystemMessage('已与服务器断开连接');
    });

    newSocket.on('ddzToken', (newToken) => {
      const isNewConnection = newToken !== ddzToken;
      localStorage.setItem('ddzToken', newToken);
      setDdzToken(newToken);
      setIsConnected(true);
      
      if (isNewConnection) {
        // 如果是新连接，需要重新发送昵称
        const savedNickname = localStorage.getItem('nickname');
        if (savedNickname) {
          const nickCommand = {
            type: 100,
            data: { nickName: savedNickname }
          };
          newSocket.emit('message', JSON.stringify(nickCommand));
        }
      }
      
      messageHandlers.addSystemMessage('连接成功！输入 /help 查看帮助');
      setIsReconnecting(false);
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [endpoint]);

  return { socket, isConnected, ddzToken };
}; 