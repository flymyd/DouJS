import {createServer} from 'http';
import {Server} from 'socket.io';
import {v4 as uuidv4} from 'uuid';
import {MessageDispatcher} from "./MessageDispatcher.js";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const serverStartTime = new Date().getTime();
// 客户端Token映射表
const clients = new Map();
// 用户信息列表
const users = new Map();
// 房间列表
const rooms = [];
// 客户端携带Token鉴权则检查是否需要重连，否则发放新的Token
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  const clientToken = socket.handshake.query.ddzToken;
  
  if (clientToken && clients.has(clientToken)) {
    console.log(`Client ${socket.id} reconnected with token:`, clientToken);
    clients.set(clientToken, socket.id);
    
    // 恢复用户状态
    if (users.has(clientToken)) {
      const userInfo = users.get(clientToken);
      socket.emit('100', JSON.stringify({
        code: 1,
        msg: '昵称已恢复',
        data: { nickName: userInfo.nickName },
        silent: true
      }));
    }
    
    // 恢复房间状态
    const userRoom = rooms.find(room => room.playerList.includes(clientToken));
    if (userRoom) {
      // 重新加入 socket room
      socket.join(userRoom.id);
      
      // 发送房间状态
      socket.emit('102', JSON.stringify({
        code: 1,
        msg: '房间状态已恢复',
        data: userRoom,
        silent: true
      }));

      // 如果游戏已经开始，发送游戏状态
      if (userRoom.status === 1) {
        const gameInfo = {
          messages: [
            `你的身份是：${userRoom.playerDetail[clientToken].isLord ? '地主' : '农民'}`,
            `轮到 ${userRoom.playerDetail[userRoom.nextPlayerId].name} 出牌`
          ],
          lords: userRoom.playerList
            .filter(id => userRoom.playerDetail[id].isLord)
            .map(id => ({
              id: id,
              name: userRoom.playerDetail[id].name
            })),
          peasants: userRoom.playerList
            .filter(id => !userRoom.playerDetail[id].isLord)
            .map(id => ({
              id: id,
              name: userRoom.playerDetail[id].name
            })),
          nextPlayer: {
            id: userRoom.nextPlayerId,
            name: userRoom.playerDetail[userRoom.nextPlayerId].name
          }
        };

        socket.emit('106', JSON.stringify({
          code: 1,
          msg: '游戏状态已恢复',
          data: gameInfo,
          silent: true
        }));
      }
    }
    
    socket.emit('ddzToken', clientToken);
  } else {
    const newToken = uuidv4();
    clients.set(newToken, socket.id);
    socket.emit('ddzToken', newToken);
    console.log(`Generated new token for ${socket.id}:`, newToken);
  }
  // 向客户端发送服务器启动时间
  socket.emit('serverStartTime', serverStartTime);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // TODO 查找该玩家在哪个房间，只向特定房间的玩家广播断开链接的消息
    // socket.broadcast.emit('message', JSON.stringify({
    //   clientId: socket.id,
    //   message: 'Client disconnected'
    // }));
  });
  socket.on('message', (data) => {
    try {
      console.log(`Message received from ${socket.id}:`, data);
      MessageDispatcher(socket, data, clients, users, rooms)
      console.log(clients, users, rooms)
    } catch (error) {
      console.error('Error processing message:', error);
      socket.emit('error', JSON.stringify({
        code: 0,
        msg: 'Internal Server Error',
        data: null
      }));
    }
  });
  socket.onAny((event, ...args) => {
    console.warn(`Unknown event: ${event} with args:`, args);
  });
});
const PORT = process.env.PORT || 11451;
httpServer.listen(PORT, () => {
  console.log(httpServer.address())
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

