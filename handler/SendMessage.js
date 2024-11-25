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
    socket.emit('message', JSON.stringify({
      code: 0,
      msg: '请先设置昵称'
    }));
    return;
  }

  const userRoom = [...rooms.values()].find(room => 
    room.players.some(player => player.token === userToken)
  );

  if (!userRoom) {
    socket.emit('message', JSON.stringify({
      code: 0,
      msg: '您不在任何房间中'
    }));
    return;
  }

  // 向房间内所有玩家广播消息
  userRoom.players.forEach(player => {
    const clientSocket = clients.get(player.token);
    if (clientSocket) {
      clientSocket.emit('message', JSON.stringify({
        code: 1,
        msg: `${user.nickName}: ${data.message}`
      }));
    }
  });
}; 