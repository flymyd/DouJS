import {ResponseFactory} from "../ResponseFactory.js";
import { findMatchingId } from '../utils/idMatcher.js';

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
    const { roomId } = data;
    const resp = new ResponseFactory();

    // 获取用户昵称
    const username = users.get(userToken)?.nickName;
    if (!username) {
        resp.error(104, '用户信息无效')
        socket.emit('104', resp.serialize());
        return;
    }

    // 获取用户作为房主的房间ID列表
    const userOwnedRoomIds = rooms
        .filter(room => room.owner === userToken)
        .map(room => room.id);
    
    const { matched, candidates } = findMatchingId(roomId, userOwnedRoomIds);

    if (!matched && candidates.length > 0) {
        const candidateList = candidates.join(', ');
        socket.emit('104', JSON.stringify({
            code: 0,
            msg: `找到多个匹配的房间: ${candidateList}，请输入更具体的ID`,
            data: null
        }));
        return;
    }

    if (!matched && candidates.length === 0) {
        socket.emit('104', JSON.stringify({
            code: 0,
            msg: '您不是该房间的房主',
            data: null
        }));
        return;
    }

    // 使用完整匹配的房间ID继续处理
    const room = rooms.find(r => r.id === matched);

    // 检查是否是房主（房间创建者为playerList中的第一个玩家）
    if (room.playerList[0] !== userToken) {
        resp.error(104, '只有房主才能解散房间');
        socket.emit('104', resp.serialize());
        return;
    }

    try {
        // 通知房间所有玩家房间被解散
        socket.to(roomId).emit('message', `房主 ${username} 解散了房间`);
        
        // 让所有玩家离开socket房间
        const io = socket.nsp;
        const socketsInRoom = io.adapter.rooms.get(roomId);
        if (socketsInRoom) {
            for (const socketId of socketsInRoom) {
                io.sockets.get(socketId)?.leave(roomId);
            }
        }

        // 删除房间
        rooms.splice(rooms.indexOf(room), 1);
        
        resp.success(104, null, '房间已解散');
        socket.emit('104', resp.serialize());
    } catch (e) {
        resp.error(104, `解散房间失败: ${e}`);
        socket.emit('104', resp.serialize());
    }
}
