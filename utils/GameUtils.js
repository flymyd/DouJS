import {CONST} from "./CONST.js";

/**
 * 查询用户加入的房间
 * @param {string} userId
 * @param {Array} rooms
 * @returns {Array|false}
 */
export const getJoinedRoom = (userId, rooms) => {
    const joinedList = rooms.filter(obj => obj.playerList.includes(userId));
    return joinedList.length > 0 ? joinedList : false;
};

/**
 * 获取上/下家信息（相对于当前用户）
 * @param {string} userId - 用户id
 * @param {string} roomId - 房间id
 * @param {number} step - 步长 正数表示取下家 负数表示取上家
 * @param {Array} rooms - 房间列表
 */
export const getSpecifiedPlayer = (userId, roomId, rooms, step = 1) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return null;

    const {playerList, playerDetail} = room;
    const index = playerList.indexOf(userId);
    let nextIndex;
    if (step >= 0) {
        nextIndex = (index + step) % playerList.length;
    } else {
        nextIndex = (index - Math.abs(step)) % playerList.length;
        if (nextIndex < 0) {
            nextIndex += playerList.length;
        }
    }
    const id = playerList[nextIndex];
    return {...playerDetail[id], id};
};

/**
 * 随机选择一名其它玩家
 * @param {import('../types/RoomTypes').RoomTypes} originalRoom
 * @param {string} currentPlayerId
 * @param {boolean} excludeOneCard - 是否排除只剩一张手牌的玩家
 */
export const getAnotherPlayer = (originalRoom, currentPlayerId, excludeOneCard = false) => {
    const room = JSON.parse(JSON.stringify(originalRoom));
    room.playerList = room.playerList.filter(id => id !== currentPlayerId);
    if (excludeOneCard) {
        room.playerList = room.playerList.filter(id => room.playerDetail[id].cards.length > 1);
    }
    const randomIndex = Math.floor(Math.random() * room.playerList.length);
    return room.playerList[randomIndex];
}; 