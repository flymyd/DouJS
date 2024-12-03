import {ResponseFactory} from "../ResponseFactory.js";

export const showStatus = (socket, userToken, data, clients, users, rooms) => {
    const resp = new ResponseFactory();

    try {
        const messages = [];
        const user = users.get(userToken);
        
        if (!user?.nickName) {
            resp.error(108, '请先设置昵称');
            socket.emit('108', resp.serialize());
            return;
        }

        messages.push(`当前昵称: ${user.nickName}`);

        // 查找用户所在的房间
        const room = rooms.find(room => room.playerList.includes(userToken));
        
        if (room) {
            messages.push(`当前房间: ${room.id}`);
            messages.push(`房间模式: ${['普通', '魔改', '万宁'][room.mode]}`);
            messages.push(`房间人数: ${room.playerList.length}/6`);
            messages.push(`房主: ${users.get(room.owner)?.nickName || '未知'}`);
            messages.push(`游戏状态: ${room.status ? '游戏中' : '等待中'}`);
            
            if (room.status) {
                const identity = room.playerDetail[userToken].isLord ? '地主' : '农民';
                messages.push(`你的身份: ${identity}`);
                if (room.nextPlayerId === userToken) {
                    messages.push('轮到你出牌');
                }
            }
        } else {
            messages.push('当前未加入任何房间');
        }

        resp.success(108, null, messages.join('\n'));
        socket.emit('108', resp.serialize());
    } catch (e) {
        resp.error(108, '获取状态失败');
        socket.emit('108', resp.serialize());
    }
}; 