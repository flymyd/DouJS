/**
 * 处理普通消息
 * @param socket socket实例
 * @param userToken 用户标识
 * @param data 消息数据
 * @param clients 客户端映射
 * @param users 用户信息
 * @param rooms 房间信息
 */
export const sendMessage = (socket, userToken, data, clients, users, rooms) => {
  const user = users.get(userToken);
  if (!user || !user.nickName) {
    return; // 静默忽略
  }

  const userRoom = rooms.find(room => 
    Array.isArray(room.playerList) && room.playerList.includes(userToken)
  );

  if (!userRoom) {
    return; // 静默忽略
  }

  // 使用 socket.to() 向房间内广播消息
  const messageData = JSON.stringify({
    code: 1,
    msg: `${user.nickName}: ${data.message}`
  });

  // 向房间内其他人广播消息
  socket.to(userRoom.id).emit('message', messageData);
  
  // 发送给自己
  socket.emit('message', messageData);
}; 