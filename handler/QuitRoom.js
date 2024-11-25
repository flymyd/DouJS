import {ResponseFactory} from "../ResponseFactory.js";

/**
 * 退出所有房间
 * @param socket
 * @param userToken
 * @param data
 * @param clients
 * @param users
 * @param rooms
 */
export const quitRoom = (socket, userToken, data, clients, users, rooms) => {
    const resp = new ResponseFactory();

    // 获取用户昵称
    const username = users.get(userToken)?.nickName;
    if (!username) {
        resp.error(107, '用户信息无效')
        socket.emit('107', resp.serialize());
        return;
    }

    try {
        // 找出用户所在的所有房间
        const userRooms = rooms.filter(room => room.playerList.includes(userToken));
        
        if (userRooms.length === 0) {
            resp.error(107, '您当前不在任何房间中');
            socket.emit('107', resp.serialize());
            return;
        }

        const quitMessages = [];
        
        // 处理每个房间
        userRooms.forEach(room => {
            // 如果是房主且房间还有其他玩家，移交房主权限
            if (room.owner === userToken && room.playerList.length > 1) {
                const nextOwner = room.playerList.find(id => id !== userToken);
                room.owner = nextOwner;
                const nextOwnerName = users.get(nextOwner)?.nickName;
                socket.to(room.id).emit('message', 
                    `房主 ${username} 退出了房间，${nextOwnerName} 成为新房主`);
            }

            // 从房间移除玩家
            room.playerList = room.playerList.filter(id => id !== userToken);
            delete room.playerDetail[userToken];
            
            // 离开socket房间
            socket.leave(room.id);

            if (room.playerList.length === 0) {
                // 如果房间没有玩家了，删除房间
                rooms.splice(rooms.indexOf(room), 1);
                quitMessages.push(`房间 ${room.id} 已被删除`);
            } else {
                // 通知房间其他玩家
                socket.to(room.id).emit('message', `玩家 ${username} 退出了房间`);
                socket.to(room.id).emit('roomUpdate', room);
            }
        });

        const message = quitMessages.length > 0 
            ? `退出所有房间成功。${quitMessages.join('，')}` 
            : '退出所有房间成功';
            
        resp.success(107, null, message);
        socket.emit('107', resp.serialize());
        
        // 广播房间列表更新
        socket.broadcast.emit('roomListUpdate');
    } catch (e) {
        resp.error(107, '退出房间失败，请稍后重试');
        socket.emit('107', resp.serialize());
    }
};
