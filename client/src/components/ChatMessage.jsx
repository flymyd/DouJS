import React from 'react';
import './ChatMessage.css';

const ChatMessage = ({ message, type }) => {
  const handleCopyRoomId = (text) => {
    // 检查是否包含房间ID信息
    const match = text.match(/房间ID：(\w+)/);
    if (match) {
      const roomId = match[1];
      const copyText = `/join ${roomId}`;
      navigator.clipboard.writeText(copyText)
        .then(() => {
          // 添加系统消息到聊天记录
          const event = new CustomEvent('addSystemMessage', {
            detail: `已复制加入房间命令：${copyText}`
          });
          window.dispatchEvent(event);
          
          // 保留原有的视觉反馈
          const element = document.getElementById(`room-id-${roomId}`);
          if (element) {
            element.classList.add('copied');
            setTimeout(() => {
              element.classList.remove('copied');
            }, 1000);
          }
        })
        .catch(err => {
          console.error('复制失败:', err);
          const event = new CustomEvent('addSystemMessage', {
            detail: '复制失败，请手动复制房间ID'
          });
          window.dispatchEvent(event);
        });
    }
  };

  const formatMessage = (text) => {
    // 如果是创建房间成功的消息，为房间ID添加可点击的样式
    if (text.includes('创建房间成功')) {
      const match = text.match(/(.*房间ID：)(\w+)(.*)/);
      if (match) {
        return (
          <>
            {match[1]}
            <span 
              id={`room-id-${match[2]}`}
              className="clickable-room-id"
              onClick={() => handleCopyRoomId(text)}
              title="点击复制加入房间命令"
            >
              {match[2]}
            </span>
            {match[3]}
          </>
        );
      }
    }
    return <div dangerouslySetInnerHTML={{ __html: text }} />;
  };

  return (
    <div className={`message ${type}`}>
      {formatMessage(message)}
    </div>
  );
};

export default ChatMessage; 