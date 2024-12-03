import {ResponseFactory} from "../ResponseFactory.js";
import {Random} from "../utils/Random.js";
import {initHand, sortCards} from "../core/CardUtils.js";

/**
 * 开始游戏
 * @param socket
 * @param userToken
 * @param data
 * @param clients
 * @param users
 * @param rooms
 */
export const startGame = (socket, userToken, data, clients, users, rooms) => {
    const resp = new ResponseFactory();

    // 获取用户昵称
    const username = users.get(userToken)?.nickName;
    if (!username) {
        resp.error(106, '用户信息无效')
        socket.emit('106', resp.serialize());
        return;
    }

    // 获取用户当前所在的房间
    const room = rooms.find(room => room.playerList.includes(userToken));
    
    // 如果用户没有在任何房间中
    if (!room) {
        resp.error(106, '您不在任何房间中');
        socket.emit('106', resp.serialize());
        return;
    }

    // 检查是否是房主
    if (room.owner !== userToken) {
        resp.error(106, '只有房主才能开始游戏');
        socket.emit('106', resp.serialize());
        return;
    }

    // 检查房间状态
    if (room.status !== 0) {
        resp.error(106, '房间已经在游戏中');
        socket.emit('106', resp.serialize());
        return;
    }

    const playerNum = room.playerList.length;
    if (playerNum < 3) {
        resp.error(106, `当前房间人数为 ${playerNum}, 至少需要3人才能开始游戏`);
        socket.emit('106', resp.serialize());
        return;
    }

    try {
        // 设置房间状态为游戏中
        room.status = 1;

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
        const lordList = Random.pick(room.playerList, lordNum);
        lordList.forEach(id => {
            room.playerDetail[id].isLord = true;
        });

        // 发牌逻辑
        const holeCardsRecord = [];  // 地主牌记录
        room.playerList.forEach((id, index) => {
            let cards = toShuffleCards.cards[index];
            if (room.playerDetail[id].isLord) {
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
            room.playerDetail[id].cards = cards;
        });

        // 设置首个出牌玩家（第一个地主）
        const firstLordId = room.playerList.find(player => room.playerDetail[player]?.isLord);
        room.prevStats = {
            playerId: firstLordId,
            playerName: room.playerDetail[firstLordId].name,
            cards: []
        };
        room.nextPlayerId = firstLordId;

        // 准备广播信息
        const lordNameList = room.playerList
            .filter(id => room.playerDetail[id].isLord)
            .map(id => room.playerDetail[id].name);
        const peasantNameList = room.playerList
            .filter(id => !room.playerDetail[id].isLord)
            .map(id => room.playerDetail[id].name);

        const messages = [];
        messages.push(`本局地主是: ${lordNameList.join('、')}`);
        messages.push(`本局农民是: ${peasantNameList.join('、')}`);

        if (holeCardsRecord.length > 0) {
            messages.push(`地主牌是: ${holeCardsRecord.map(cards => 
                cards.map(card => card.cardName).join("、")
            ).join(" 和 ")}`);
        }

        messages.push(`请 ${room.playerDetail[firstLordId].name} 出牌`);

        const gameInfo = {
            messages,
            lords: room.playerList
                .filter(id => room.playerDetail[id].isLord)
                .map(id => ({
                    id: id,
                    name: room.playerDetail[id].name
                })),
            peasants: room.playerList
                .filter(id => !room.playerDetail[id].isLord)
                .map(id => ({
                    id: id,
                    name: room.playerDetail[id].name
                })),
            holeCards: holeCardsRecord,
            nextPlayer: {
                id: firstLordId,
                name: room.playerDetail[firstLordId].name
            }
        };

        // 发送游戏开始消息
        resp.success(106, gameInfo, messages.join('\n'));
        socket.to(room.id).emit('106', resp.serialize());
        socket.emit('106', resp.serialize());

    } catch (e) {
        resp.error(106, `开始游戏失败: ${e}`);
        socket.emit('106', resp.serialize());
    }
}
