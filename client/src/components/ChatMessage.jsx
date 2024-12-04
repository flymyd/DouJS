import React from 'react';
import './ChatMessage.css';

const ChatMessage = ({ message, type }) => {
  const fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // 避免滚动到底部
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        const event = new CustomEvent('addSystemMessage', {
          detail: `已复制加入房间命令：${text}`
        });
        window.dispatchEvent(event);
      } else {
        throw new Error('复制失败');
      }
    } catch (err) {
      console.error('复制失败:', err);
      const event = new CustomEvent('addSystemMessage', {
        detail: '复制失败，请手动复制房间ID'
      });
      window.dispatchEvent(event);
    }

    document.body.removeChild(textArea);
  };

  const handleCopyRoomId = (text) => {
    const match = text.match(/房间ID：(\w+)/);
    if (match) {
      const roomId = match[1];
      const copyText = `/join ${roomId}`;

      // 检查是否支持 Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(copyText)
          .then(() => {
            const event = new CustomEvent('addSystemMessage', {
              detail: `已复制加入房间命令：${copyText}`
            });
            window.dispatchEvent(event);
          })
          .catch(() => {
            // 如果 Clipboard API 失败，使用后备方案
            fallbackCopyTextToClipboard(copyText);
          });
      } else {
        // 直接使用后备方案
        fallbackCopyTextToClipboard(copyText);
      }
      
      // 视觉反馈
      const element = document.getElementById(`room-id-${roomId}`);
      if (element) {
        element.classList.add('copied');
        setTimeout(() => {
          element.classList.remove('copied');
        }, 1000);
      }
    }
  };

  const formatMessage = (text) => {
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