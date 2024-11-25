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
    
    // 如果用户信息存在，只更新状态但不发送消息
    if (users.has(clientToken)) {
      const userInfo = users.get(clientToken);
      socket.emit('100', JSON.stringify({
        code: 1,
        msg: '昵称已恢复',
        data: { nickName: userInfo.nickName },
        silent: true  // 添加标记，表示这是静默恢复
      }));
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

