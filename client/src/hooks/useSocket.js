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
          // 等待一小段时间后查询状态（确保昵称设置完成）
          setTimeout(() => {
            newSocket.emit('message', JSON.stringify({
              type: 108,
              data: {}
            }));
          }, 500);
        }
        messageHandlers.addSystemMessage('连接成功！输入 /help 查看帮助');
      } else {
        messageHandlers.addSystemMessage('重连成功！已恢复游戏状态。');
        // 重连后也查询状态
        setTimeout(() => {
          newSocket.emit('message', JSON.stringify({
            type: 108,
            data: {}
          }));
        }, 500);
      }
      setIsReconnecting(false);
    });

    // 添加房间状态恢复的处理
    newSocket.on('102', (data) => {
      const response = JSON.parse(data);
      if (response.silent) {
        // 静默恢复房间状态，不显示消息
        return;
      }
      // 处理正常的房间消息
      if (response.code === 1) {
        messageHandlers.addServerMessage(response.msg);
      } else {
        messageHandlers.addErrorMessage(response.msg);
      }
    });

    // 添加游戏状态恢复的处理
    newSocket.on('106', (data) => {
      const response = JSON.parse(data);
      // 只在重连恢复状态时显示消息
      if (response.silent && isReconnecting) {
        messageHandlers.addServerMessage(response.msg);
      }
      // 其他情况交给 socketEvents 处理
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [endpoint]);

  return { socket, isConnected, ddzToken };
}; 