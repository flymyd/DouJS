import {ResponseFactory} from "../ResponseFactory.js";
import { findMatchingId } from '../utils/idMatcher.js';

/**
 * 加入房间
 * @param socket
 * @param userToken
 * @param data
 * @param clients
 * @param users
 * @param rooms
 */
export const joinRoom = (socket, userToken, data, clients, users, rooms) => {
    const { roomId } = data;
    const roomIds = rooms.map(room => room.id);
    const { matched, candidates } = findMatchingId(roomId, roomIds);

    if (!matched && candidates.length > 0) {
        // 有多个匹配项，返回提示
        const candidateList = candidates.join(', ');
        socket.emit('102', JSON.stringify({
            code: 0,
            msg: `找到多个匹配的房间: ${candidateList}，请输入更具体的ID`,
            data: null
        }));
        return;
    }

    if (!matched && candidates.length === 0) {
        socket.emit('102', JSON.stringify({
            code: 0,
            msg: '房间不存在',
            data: null
        }));
        return;
    }

    // 使用完整匹配的房间ID继续处理
    const room = rooms.find(r => r.id === matched);

    const resp = new ResponseFactory();

    // 检查是否已经设置昵称
    const username = users.get(userToken)?.nickName;
    if (!username) {
        resp.error(102, '请先设置昵称')
        socket.emit('102', resp.serialize());
        return;
    }

    // 检查用户是否已经在其他房间中
    const inRoomIndex = rooms.findIndex(room => room.playerList.includes(userToken));
    if (inRoomIndex !== -1) {
        resp.error(102, `你已在房间 ${inRoomIndex} 中`)
        socket.emit('102', resp.serialize());
        return;
    }

    // 检查房间是否已满
    if (room.playerList.length >= 6) {
        resp.error(102, '房间已满');
        socket.emit('102', resp.serialize());
        return;
    }

    try {
        // 加入房间
        socket.join(room.id);
        room.playerList.push(userToken);
        room.playerDetail[userToken] = {
            isLord: false,
            name: username,
            cards: []
        };

        resp.success(102, room, '加入房间成功');
        socket.emit('102', resp.serialize());

        // 通知房间其他玩家有新玩家加入
        socket.to(room.id).emit('message', `玩家 ${username} 加入了房间`);
    } catch (e) {
        resp.error(102, `加入房间失败: ${e}`);
        socket.emit('102', resp.serialize());
    }
}
