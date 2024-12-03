import {ResponseFactory} from "../ResponseFactory.js";

/**
 * 退出房间
 * @param socket
 * @param userToken
 * @param roomId
 * @param args
 */
export const exitRoom = (socket, userToken, data, clients, users, rooms) => {
    const resp = new ResponseFactory();

    // 获取用户昵称
    const username = users.get(userToken)?.nickName;
    if (!username) {
        resp.error(103, '用户信息无效')
        socket.emit('103', resp.serialize());
        return;
    }

    // 获取用户当前所在的房间
    const room = rooms.find(room => room.playerList.includes(userToken));
    
    // 如果用户没有在任何房间中
    if (!room) {
        resp.error(103, '您不在任何房间中');
        socket.emit('103', resp.serialize());
        return;
    }

    // 检查游戏状态
    if (room.status) {
        resp.error(103, '游戏进行中，无法退出房间');
        socket.emit('103', resp.serialize());
        return;
    }

    try {
        // 从房间移除玩家
        room.playerList = room.playerList.filter(id => id !== userToken);
        delete room.playerDetail[userToken];
        
        // 离开socket房间
        socket.leave(room.id);

        // 如果房间没有玩家了，删除房间
        if (room.playerList.length === 0) {
            rooms.splice(rooms.indexOf(room), 1);
            resp.success(103, null, `退出房间成功，房间 ${room.id} 已被删除`);
            // 广播房间列表更新
            socket.broadcast.emit('roomListUpdate');
        } else {
            // 更新房主（如果当前用户是房主）
            if (room.owner === userToken) {
                const nextOwner = room.playerList[0];
                room.owner = nextOwner;
                const nextOwnerName = users.get(nextOwner)?.nickName;
                socket.to(room.id).emit('message', 
                    `房主 ${username} 退出了房间，${nextOwnerName} 成为新房主`);
            } else {
                // 通知房间其他玩家
                socket.to(room.id).emit('message', `玩家 ${username} 退出了房间`);
            }
            resp.success(103, room, `退出房间 ${room.id} 成功`);
            // 广播房间更新
            socket.to(room.id).emit('roomUpdate', room);
        }
        
        socket.emit('103', resp.serialize());
    } catch (e) {
        console.error('退出房间时发生错误:', e);
        resp.error(103, '退出房间失败，请稍后重试');
        socket.emit('103', resp.serialize());
    }
}
