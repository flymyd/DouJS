import { RoomMode } from '../types/RoomTypes';

export const AVAILABLE_COMMANDS = [
  { command: '/clear', description: '清空聊天记录' },
  { command: '/nick', description: '设置昵称' },
  { command: '/create', description: '创建房间 (模式: 0=普通 1=魔改 2=万宁)' },
  { command: '/join', description: '加入房间' },
  { command: '/exit', description: '退出当前房间' },
  { command: '/disband', description: '解散房间(仅房主)' },
  { command: '/list', description: '查看房间列表' },
  { command: '/start', description: '开始游戏(仅房主)' },
  { command: '/info', description: '查看手牌' },
  { command: '/play', description: '出牌' },
  { command: '/quit', description: '退出所有房间' },
  { command: '/rule', description: '查看规则' },
  { command: '/skill', description: '查看技能说明' },
];

export const parseCommand = (message, messageHandlers, hasNickname) => {
    const [command, ...args] = message.slice(1).split(' ');

    switch (command.toLowerCase()) {
        case 'clear':
            messageHandlers.clearMessages();
            return null;

        case 'help':
            messageHandlers.addHintMessage(
                '可用命令：<br/><br/>' +
                '/clear - 清空聊天记录<br/><br/>' +
                '/nick &lt;昵称&gt; - 设置昵称<br/><br/>' +
                '/create &lt;模式&gt; - 创建房间 (模式: 0=普通 1=魔改 2=万宁)<br/><br/>' +
                '/join &lt;房间ID&gt; - 加入房间<br/><br/>' +
                '/exit - 退出当前房间<br/><br/>' +
                '/disband - 解散房间(仅房主)<br/><br/>' +
                '/list - 查看房间列表<br/><br/>' +
                '/start - 开始游戏(仅房主)<br/><br/>' +
                '/info - 查看手牌<br/><br/>' +
                '/play &lt;牌&gt; - 出牌<br/><br/>' +
                '/quit - 退出所有房间<br/><br/>' +
                '/rule - 查看规则<br/><br/>' +
                '/skill - 查看技能说明'
            );
            return null; // 不返回消息对象，避免服务器响应

        case 'nick':
            if (!args.length) {
                messageHandlers.addErrorMessage('请输入昵称');
                return null;
            }
            return { type: 100, data: { nickName: args[0] } };

        case 'create':
            if (!hasNickname) return null;
            if (!args.length) {
                messageHandlers.addErrorMessage('请指定游戏模式。0=普通，1=魔改，2=万宁');
                return null;
            }
            const mode = Number(args[0]);
            if (![0, 1, 2].includes(mode)) {
                messageHandlers.addErrorMessage('无效的游戏模式。0=普通，1=魔改，2=万宁');
                return null;
            }
            return { type: 101, data: { mode } };

        case 'join':
            if (!args[0]) {
                return null;
            }
            return { type: 102, data: { roomId: args[0] } };

        case 'exit':
            if (!args[0]) {
                return null;
            }
            return { type: 103, data: { roomId: args[0] } };

        case 'disband':
            console.log(args)
            if (!args[0]) {
                return null;
            }
            return { type: 104, data: { roomId: args[0] } };

        case 'list':
            return { type: 105, data: {} };

        case 'start':
            return { type: 106, data: {} };

        case 'info':
            return { type: 201, data: {} };

        case 'play':
            if (!args[0]) {
                return null;
            }
            return { type: 202, data: { card: args[0] } };

        case 'quit':
            return { type: 107, data: {} };

        case 'rule':
            return { type: 302, data: {} };

        case 'skill':
            return { type: 304, data: {} };

        default:
            messageHandlers.addErrorMessage('未知命令');
            return null;
    }
}; 