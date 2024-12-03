import {ResponseFactory} from "../ResponseFactory.js";
import {parseArrToCards, sortCards} from "../core/CardUtils.js";
import {canBeatPreviousCards, getCardType} from "../core/JudgeUtils.js";
import {modernEventGenerator} from "../utils/EventUtils.js";
import {getSpecifiedPlayer} from "../utils/GameUtils.js";

/**
 * 出牌
 * @param socket
 * @param userToken
 * @param data
 * @param args
 */
export const playCard = (socket, userToken, data, ...args) => {
    const resp = new ResponseFactory();
    const [clients, users, rooms] = args;

    // 检查用户是否设置昵称
    const username = users.get(userToken)?.nickName;
    if (!username) {
        resp.error(202, '用户信息无效');
        socket.emit('202', resp.serialize());
        return;
    }

    // 查找用户所在的房间
    const room = rooms.find(room => room.playerList.includes(userToken));
    if (!room) {
        resp.error(202, '你还没有加入房间');
        socket.emit('202', resp.serialize());
        return;
    }

    // 检查游戏是否开始
    if (!room.status) {
        resp.error(202, '你所在的房间尚未开始游戏');
        socket.emit('202', resp.serialize());
        return;
    }

    const {playerDetail, prevStats, nextPlayerId, usedCard} = room;

    // 获取上家、本家、下家信息
    const prevPlayer = getSpecifiedPlayer(userToken, room.id, rooms, -1);
    const currentPlayer = {...playerDetail[userToken], id: userToken};
    const nextPlayer = getSpecifiedPlayer(userToken, room.id, rooms, 1);

    // 是否轮到当前用户出牌
    if (currentPlayer.id !== nextPlayerId) {
        resp.error(202, '还没轮到你出牌');
        socket.emit('202', resp.serialize());
        return;
    }

    try {
        let cardStr = data.card;  // 从 data 对象中获取 card
        
        if (!cardStr) {
            resp.error(202, '请输入要出的牌或输入"过"以跳过本轮');
            socket.emit('202', resp.serialize());
            return;
        }

        cardStr = cardStr.toUpperCase();

        // 本轮跳过
        if (cardStr.includes('过')) {
            room.nextPlayerId = nextPlayer.id;
            resp.success(202, {
                nextPlayer: {
                    id: nextPlayer.id,
                    name: nextPlayer.name
                }
            }, `${username} 跳过本轮，请下家 ${nextPlayer.name} 出牌`);
            socket.to(room.id).emit('202', resp.serialize());
            socket.emit('202', resp.serialize());
            return;
        }

        // 当前玩家的手牌
        const originalHand = JSON.parse(JSON.stringify(currentPlayer.cards));

        // 分割用户输入的待出牌
        const splicePattern = /[2-9]|10|[JQKA]|大王|小王/gi;
        let currentCardArr = cardStr.match(splicePattern) || [];

        // 判断输入有效性
        const validCards = ['大王', '小王', 'J', 'Q', 'K', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
        if (!currentCardArr.every(v => validCards.includes(v))) {
            resp.error(202, '请输入有效的手牌。只能输入2~9的数字、大小写字母J、Q、K、A及"大王"、"小王"');
            socket.emit('202', resp.serialize());
            return;
        }

        // 把待出的牌恢复成存储结构的牌组然后排序
        currentCardArr = parseArrToCards(currentCardArr);
        sortCards(currentCardArr);

        // 堂子牌
        const prevCard = JSON.parse(JSON.stringify(prevStats.cards));
        sortCards(prevCard);

        // 判断手牌是否包含待出的牌
        const containsPlayedCards = currentCardArr.every(playedCard => {
            const matchingCardIndex = originalHand.findIndex(handCard => 
                handCard.cardValue === playedCard.cardValue);
            if (matchingCardIndex !== -1) {
                originalHand.splice(matchingCardIndex, 1);
                return true;
            }
            return false;
        });

        if (!containsPlayedCards) {
            resp.error(202, '你不能出自己没有的牌');
            socket.emit('202', resp.serialize());
            return;
        }

        // 出牌逻辑
        let canBeat;
        if (prevCard.length < 1 || prevStats.playerId === userToken) {
            // 第一手随便出。其他人都过，轮到自己也随便出
            canBeat = getCardType(currentCardArr) !== 13;
        } else {
            canBeat = canBeatPreviousCards(currentCardArr, prevCard);
        }

        if (!canBeat) {
            resp.error(202, '你所出的牌不大于上家或不符合出牌规则');
            socket.emit('202', resp.serialize());
            return;
        }

        // 魔改斗地主的触发事件逻辑
        if (room.mode === 1) {
            const modernEvent = modernEventGenerator(room, currentPlayer.id, 0.1);
            if (modernEvent) {
                resp.error(202, modernEvent);
                socket.emit('202', resp.serialize());
                return;
            }
        } else if (room.mode === 2) {
            const modernEvent = modernEventGenerator(room, currentPlayer.id, 0.25);
            if (modernEvent) {
                resp.error(202, modernEvent);
                socket.emit('202', resp.serialize());
                return;
            }
        }

        // 出牌成功逻辑：播报剩余手牌, 刷新对局信息
        const messages = [];
        messages.push(`出牌成功！堂子的牌面是: ${currentCardArr.map(o => o.cardName).join(' ')}`);
        messages.push(`${username} 剩余手牌数: ${originalHand.length}`);
        messages.push(`请下家 ${nextPlayer.name} 出牌`);

        // 更新弃牌堆
        room.usedCard = [...room.usedCard, ...currentCardArr];

        // 更新堂子
        room.prevStats.playerId = currentPlayer.id;
        room.prevStats.playerName = currentPlayer.name;
        room.prevStats.cards = [...currentCardArr];

        // 更新下家指针
        room.nextPlayerId = nextPlayer.id;

        // 把打出的牌移走
        const newHand = originalHand.filter(card => {
            return !currentCardArr.some(playedCard => 
                playedCard.cardValue === card.cardValue && 
                playedCard.cardColor === card.cardColor);
        });
        room.playerDetail[userToken].cards = [...newHand];

        // 如果该玩家手牌剩余0则播报该玩家胜利
        if (newHand.length < 1) {
            // 队友列表
            const teammates = room.playerList
                .filter(id => playerDetail[id].isLord === currentPlayer.isLord)
                .map(id => playerDetail[id].name);

            // 清空对局信息
            room.status = 0;
            room.prevStats = {cards: [], playerId: "", playerName: ""};
            room.nextPlayerId = "";
            room.usedCard = [];
            room.playerList.forEach(id => {
                room.playerDetail[id].isLord = false;
                room.playerDetail[id].cards = [];
            });

            const winMessage = `${currentPlayer.isLord ? '地主' : '农民'} ${teammates.join("、")} 获胜！`;
            resp.success(202, {gameOver: true}, winMessage);
        } else {
            resp.success(202, {
                prevStats: room.prevStats,
                nextPlayer: {
                    id: nextPlayer.id,
                    name: nextPlayer.name
                },
                remainingCards: originalHand.length
            }, messages.join('\n'));
        }

        socket.to(room.id).emit('202', resp.serialize());
        socket.emit('202', resp.serialize());

    } catch (e) {
        resp.error(202, `出牌失败: ${e}`);
        socket.emit('202', resp.serialize());
    }
};
