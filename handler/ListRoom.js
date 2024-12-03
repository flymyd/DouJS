import {ResponseFactory} from "../ResponseFactory.js";

/**
 * 列出所有房间
 * @param socket
 * @param clients
 * @param users
 * @param rooms
 */
export const listRoom = (socket, clients, users, rooms) => {
    const resp = new ResponseFactory();
    try {
        const roomList = rooms.map(room => ({
            id: room.id,
            mode: room.mode,
            ownerName: users.get(room.owner)?.nickName || '未知',
            playerCount: room.playerList.length,
            status: room.status  // 0=等待中 1=游戏中
        }));
        
        resp.success(105, roomList);
        socket.emit('105', resp.serialize());
    } catch (e) {
        resp.error(105, '获取房间列表失败');
        socket.emit('105', resp.serialize());
    }
};
