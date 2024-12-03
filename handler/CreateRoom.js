import { ResponseFactory } from "../ResponseFactory.js";

/**
 * 创建房间
 * @param socket
 * @param userToken
 * @param data
 * @param clients
 * @param users
 * @param rooms
 */
export const createRoom = (socket, userToken, data, clients, users, rooms) => {
  const resp = new ResponseFactory();
  const { mode } = data;

  // 获取用户昵称
  const username = users.get(userToken)?.nickName;
  if (!username) {
    resp.error(101, '请先设置昵称')
    socket.emit('101', resp.serialize());
    return;
  }

  // 检查用户是否已经在其他房间中
  if (rooms.some(room => room.playerList.includes(userToken))) {
    resp.error(101, '你已经在一个房间中了');
    socket.emit('101', resp.serialize());
    return;
  }

  try {
    // 创建新房间
    const roomId = Math.random().toString(36).substring(2, 10);
    const room = {
      id: roomId,
      mode,
      owner: userToken,
      status: 0,
      playerList: [userToken],
      playerDetail: {
        [userToken]: {
          isLord: false,
          name: username,
          cards: []
        }
      },
      usedCard: []
    };
    rooms.push(room);

    // 加入socket房间
    socket.join(roomId);

    resp.success(101, room, `创建房间成功，房间ID：${roomId}`);
    socket.emit('101', resp.serialize());
  } catch (e) {
    resp.error(101, '创建房间失败，请稍后重试');
    socket.emit('101', resp.serialize());
  }
}
