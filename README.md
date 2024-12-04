# 欢乐斗地主 - 服务端

基于 Node.js 和 Socket.IO 实现的欢乐斗地主游戏服务端。

## 项目结构

```
.
├── core/                 # 斗地主游戏核心逻辑
├── handler/              # Socket.IO 消息处理器
├── utils/                # 工具函数
├── docs/                 # 项目文档
├── index.js              # 服务器入口文件
└── MessageDispatcher.js  # 消息分发器
```

## 功能特性

- 基于 WebSocket 的实时通信
- 支持多房间同时对局
- 支持断线重连
- 支持多种游戏模式：
  - 普通模式
  - 魔改模式
  - 万宁模式

## Docker一键部署

提示：`git clone`后记得修改`docker-compose.yml`中的服务器IP和端口：

```bash
git clone https://github.com/flymyd/DouJS.git
cd DouJS
docker-compose up -d --build
```

## 开发环境

- Node.js >= 20

## 安装

```bash
npm install
```

## 运行

```bash
npm start
```

服务器默认运行在 11451 端口。

## 协议

游戏使用基于事件的通信协议，详见 [protocol.md](docs/protocol.md)。

## 开发指南

1. 所有的消息处理逻辑都在 `handler/` 目录下
2. 游戏核心逻辑在 `core/` 目录下
3. 工具函数在 `utils/` 目录下
4. 新增功能时需要在 `MessageDispatcher.js` 中注册对应的处理器

## 许可证

MIT 