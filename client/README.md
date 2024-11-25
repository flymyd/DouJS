# 欢乐斗地主 - 客户端

基于 React 和 Socket.IO-client 实现的欢乐斗地主游戏客户端。

## 项目结构

```
.
├── src/
│   ├── components/    # React 组件
│   ├── hooks/        # 自定义 Hooks
│   ├── services/     # 服务层（Socket.IO 事件处理等）
│   ├── types/        # 类型定义
│   └── App.jsx       # 主应用组件
└── public/           # 静态资源
```

## 功能特性

- 实时对战
- 自动重连
- 命令行式交互
- 支持多种消息类型：
  - 系统消息
  - 用户消息
  - 服务器消息
  - 提示消息
  - 错误消息

## 开发环境

- Node.js >= 14.0.0
- npm >= 6.0.0

## 安装

```bash
npm install
```

## 开发

```bash
npm run dev
```

## 构建

```bash
npm run build
```

## 命令列表

- `/help` - 显示帮助信息
- `/nick <昵称>` - 设置昵称
- `/create <模式>` - 创建房间 (模式: 0=普通 1=魔改 2=万宁)
- `/join <房间ID>` - 加入房间
- `/exit` - 退出当前房间
- `/disband` - 解散房间(仅房主)
- `/list` - 查看房间列表
- `/start` - 开始游戏(仅房主)
- `/info` - 查看手牌
- `/play <牌>` - 出牌
- `/quit` - 退出所有房间
- `/rule` - 查看规则
- `/skill` - 查看技能说明

## 开发指南

1. Socket.IO 事件处理在 `src/services/socketEvents.js`
2. 命令解析逻辑在 `src/services/commandParser.js`
3. Socket.IO 连接管理在 `src/hooks/useSocket.js`

## 许可证

MIT