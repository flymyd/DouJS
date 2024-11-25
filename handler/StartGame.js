import {ResponseFactory} from "../ResponseFactory.js";
import {Random} from "../utils/Random.js";
import {initHand, sortCards} from "../core/CardUtils.js";

/**
 * 开始游戏
 * @param socket
 * @param userToken
 * @param roomId
 * @param args
 */
export const startGame = (socket, userToken, roomId, ...args) => {
    const resp = new ResponseFactory();
    const [clients, users, rooms] = args;

    // 查找目标房间
    const targetRoom = rooms.find(room => room.id === roomId);
    if (!targetRoom) {
        resp.error(106, '房间不存在');
        socket.emit('106', resp.serialize());
        return;
    }

    // 检查是否是房主
    if (targetRoom.playerList[0] !== userToken) {
        resp.error(106, '你不是房主，无法开始游戏');
        socket.emit('106', resp.serialize());
        return;
    }

    // 检查房间状态
    if (targetRoom.status !== 0) {
        resp.error(106, '房间已经在游戏中');
        socket.emit('106', resp.serialize());
        return;
    }

    const playerNum = targetRoom.playerList.length;
    if (playerNum < 3) {
        resp.error(106, `当前房间人数为 ${playerNum}, 至少需要3人才能开始游戏`);
        socket.emit('106', resp.serialize());
        return;
    }

    try {
        // 设置房间状态为游戏中
        targetRoom.status = 1;

        // 初始化牌组
        const toShuffleCards = initHand(playerNum);

        // 确定地主数量
        let lordNum = 1;
        if (playerNum === 4 || playerNum === 5) {
            lordNum = 2;
        } else if (playerNum === 6) {
            lordNum = 3;
        }

        // 随机选择地主
        const lordList = Random.pick(targetRoom.playerList, lordNum);
        lordList.forEach(id => {
            targetRoom.playerDetail[id].isLord = true;
        });

        // 发牌逻辑
        const holeCardsRecord = [];  // 地主牌记录
        targetRoom.playerList.forEach((id, index) => {
            let cards = toShuffleCards.cards[index];
            if (targetRoom.playerDetail[id].isLord) {
                if (playerNum === 3) {
                    holeCardsRecord.push(toShuffleCards.holeCards);
                    cards = [...cards, ...toShuffleCards.holeCards];
                } else if (playerNum === 5) {
                    const holeCards = toShuffleCards.holeCards.splice(0, 4);
                    holeCardsRecord.push(holeCards);
                    cards = [...cards, ...holeCards];
                }
            }
            sortCards(cards);
            targetRoom.playerDetail[id].cards = cards;
        });

        // 设置首个出牌玩家（第一个地主）
        const firstLordId = targetRoom.playerList.find(player => targetRoom.playerDetail[player]?.isLord);
        targetRoom.prevStats = {
            playerId: firstLordId,
            playerName: targetRoom.playerDetail[firstLordId].name,
            cards: []
        };
        targetRoom.nextPlayerId = firstLordId;

        // 准备广播信息
        const lordNameList = targetRoom.playerList
            .filter(id => targetRoom.playerDetail[id].isLord)
            .map(id => targetRoom.playerDetail[id].name);
        const peasantNameList = targetRoom.playerList
            .filter(id => !targetRoom.playerDetail[id].isLord)
            .map(id => targetRoom.playerDetail[id].name);

        const messages = [];
        messages.push(`本局地主是: ${lordNameList.join('、')}`);
        messages.push(`本局农民是: ${peasantNameList.join('、')}`);

        if (holeCardsRecord.length > 0) {
            messages.push(`地主牌是: ${holeCardsRecord.map(cards => 
                cards.map(card => card.cardName).join("、")
            ).join(" 和 ")}`);
        }

        messages.push(`请 ${targetRoom.playerDetail[firstLordId].name} 出牌`);

        const gameInfo = {
            messages,
            lords: targetRoom.playerList
                .filter(id => targetRoom.playerDetail[id].isLord)
                .map(id => ({
                    id: id,
                    name: targetRoom.playerDetail[id].name
                })),
            peasants: targetRoom.playerList
                .filter(id => !targetRoom.playerDetail[id].isLord)
                .map(id => ({
                    id: id,
                    name: targetRoom.playerDetail[id].name
                })),
            holeCards: holeCardsRecord,
            nextPlayer: {
                id: firstLordId,
                name: targetRoom.playerDetail[firstLordId].name
            }
        };

        // 发送游戏开始消息
        resp.success(106, gameInfo, messages.join('\n'));
        socket.to(roomId).emit('106', resp.serialize());
        socket.emit('106', resp.serialize());

    } catch (e) {
        resp.error(106, `开始游戏失败: ${e}`);
        socket.emit('106', resp.serialize());
    }
}
