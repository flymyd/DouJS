import React from 'react';
import './ChatMessage.css';

const ChatMessage = ({ message, type }) => {
  return (
    <div className={`message ${type}`}>
      <div dangerouslySetInnerHTML={{ __html: message }} />
    </div>
  );
};

export default ChatMessage; 