import {ResponseFactory} from "../ResponseFactory.js";

/**
 * 解散房间
 * @param socket
 * @param userToken
 * @param data
 * @param clients
 * @param users
 * @param rooms
 */
export const disbandRoom = (socket, userToken, data, clients, users, rooms) => {
    const resp = new ResponseFactory();

    // 获取用户昵称
    const username = users.get(userToken)?.nickName;
    if (!username) {
        resp.error(104, '用户信息无效')
        socket.emit('104', resp.serialize());
        return;
    }

    // 获取用户当前所在的房间
    const room = rooms.find(room => room.playerList.includes(userToken));
    
    // 如果用户没有在任何房间中
    if (!room) {
        resp.error(104, '您不在任何房间中');
        socket.emit('104', resp.serialize());
        return;
    }

    // 检查是否是房主
    if (room.owner !== userToken) {
        resp.error(104, '只有房主才能解散房间');
        socket.emit('104', resp.serialize());
        return;
    }

    try {
        // 通知房间所有玩家房间被解散
        socket.to(room.id).emit('message', `房主 ${username} 解散了房间`);
        
        // 让所有玩家离开socket房间
        const io = socket.nsp;
        const socketsInRoom = io.adapter.rooms.get(room.id);
        if (socketsInRoom) {
            for (const socketId of socketsInRoom) {
                io.sockets.get(socketId)?.leave(room.id);
            }
        }

        // 删除房间
        rooms.splice(rooms.indexOf(room), 1);
        
        resp.success(104, null, '房间已解散');
        socket.emit('104', resp.serialize());

        // 广播房间列表更新
        socket.broadcast.emit('roomListUpdate');
    } catch (e) {
        resp.error(104, `解散房间失败: ${e}`);
        socket.emit('104', resp.serialize());
    }
}
