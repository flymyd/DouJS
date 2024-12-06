import { ResponseFactory } from "../ResponseFactory.js";
import { getCardType, canBeatPreviousCards } from "../core/JudgeUtils.js";
import { PokerHandEnum } from "../core/PokerHandEnum.js";
import { playCard } from "./PlayCard.js";
import { io } from "../index.js";

// 从 ShowInfo 中提取获取建议出牌的逻辑
const getSuggestions = (handCards, prevStats) => {
    console.log("************ getSuggestions start ************")
    let suggestions = [];

    // 获取所有可能打过上家的牌型
    const prevType = getCardType(prevStats.cards);

    // 按照相同牌型查找可能的出牌组合
    if (prevType === PokerHandEnum.Single) {
        // 查找单张
        handCards.forEach(card => {
            if (card.cardValue > prevStats.cards[0].cardValue) {
                suggestions.push({
                    cards: [card],
                    command: `出 ${card.cardName}`
                });
            }
        });
    } else if (prevType === PokerHandEnum.Pair) {
        // 查找对子
        const cardGroups = {};
        handCards.forEach(card => {
            cardGroups[card.cardValue] = (cardGroups[card.cardValue] || []);
            cardGroups[card.cardValue].push(card);
        });

        Object.entries(cardGroups).forEach(([value, cards]) => {
            if (cards.length >= 2 && parseInt(value) > prevStats.cards[0].cardValue) {
                suggestions.push({
                    cards: cards.slice(0, 2),
                    command: `出 ${cards[0].cardName} ${cards[1].cardName}`
                });
            }
        });
    } else if (prevType === PokerHandEnum.ThreeOfAKind) {
        // 查找三张
        const cardGroups = {};
        handCards.forEach(card => {
            cardGroups[card.cardValue] = (cardGroups[card.cardValue] || []);
            cardGroups[card.cardValue].push(card);
        });

        Object.entries(cardGroups).forEach(([value, cards]) => {
            if (cards.length >= 3 && parseInt(value) > prevStats.cards[0].cardValue) {
                suggestions.push({
                    cards: cards.slice(0, 3),
                    command: `出 ${cards.map(c => c.cardName).join(" ")}`
                });
            }
        });
    } else if (prevType === PokerHandEnum.ThreeWithSingle) {
        // 查找三带一
        const cardGroups = {};
        handCards.forEach(card => {
            cardGroups[card.cardValue] = (cardGroups[card.cardValue] || []);
            cardGroups[card.cardValue].push(card);
        });

        // 找出所有三张
        Object.entries(cardGroups).forEach(([value, cards]) => {
            if (cards.length >= 3 && parseInt(value) > prevStats.cards[0].cardValue) {
                // 找出可能的单张
                handCards.forEach(singleCard => {
                    if (singleCard.cardValue !== parseInt(value)) {
                        const combination = [...cards.slice(0, 3), singleCard];
                        suggestions.push({
                            cards: combination,
                            command: `出 ${combination.map(c => c.cardName).join(" ")}`
                        });
                    }
                });
            }
        });
    } else if (prevType === PokerHandEnum.Straight) {
        // 查找顺子
        const len = prevStats.cards.length;
        const minValue = prevStats.cards[0].cardValue;

        // 尝试找到所有可能的顺子
        for (let i = 0; i < handCards.length - len + 1; i++) {
            const possibleStraight = handCards.slice(i, i + len);
            if (getCardType(possibleStraight) === PokerHandEnum.Straight &&
                possibleStraight[0].cardValue > minValue) {
                suggestions.push({
                    cards: possibleStraight,
                    command: `出 ${possibleStraight.map(c => c.cardName).join(" ")}`
                });
            }
        }
    }
    console.log(suggestions)
    console.log("************ getSuggestions end ************")
    return suggestions;
};

// 自动出牌逻辑
export const autoPlay = (socket, userToken, room, args) => {
    const [clients, users, rooms] = args || [];
    const { playerDetail, prevStats } = room;
    const currentDetail = playerDetail[userToken];
    const handCards = [...currentDetail.cards];

    // 获取建议出牌
    let suggestions = [];

    // 找到最后一个真正出牌的人（不是过牌的人）
    const findLastValidPlay = () => {
        // 如果当前的 prevStats 有牌，直接用它
        if (prevStats.cards && prevStats.cards.length > 0) {
            return {
                playerId: prevStats.playerId,
                cards: prevStats.cards
            };
        }

        // 如果上家过牌了，直接用 room.prevStats
        // 因为 room.prevStats 保存的是最后一个出牌的人的信息
        if (room.prevStats.cards && room.prevStats.cards.length > 0) {
            return {
                playerId: room.prevStats.playerId,
                cards: room.prevStats.cards
            };
        }

        // 如果都没有找到，说明是新一轮
        return { playerId: userToken, cards: null };
    };

    // 判断是否是新一轮
    const lastValidPlay = findLastValidPlay();
    const isNewRound = !lastValidPlay.playerId || lastValidPlay.playerId === userToken;

    console.log('\n========== 出牌判断 ==========');
    console.log('当前玩家:', users.get(userToken)?.nickName);
    console.log('上家:', prevStats.playerId ? users.get(prevStats.playerId)?.nickName : '无');
    console.log('最后出牌者:', lastValidPlay.playerId ? users.get(lastValidPlay.playerId)?.nickName : '无');
    console.log('最后出的牌:', lastValidPlay.cards?.map(c => c.cardName).join(' ') || '无');
    console.log('是否新一轮:', isNewRound);
    console.log('================================\n');

    // 如果是新的一轮，自由出牌
    if (isNewRound) {
        // 找出最小的单张
        suggestions = [{
            cards: [handCards[0]],
            command: `出 ${handCards[0].cardName}`
        }];

        // 尝试找对子和三张
        const cardGroups = {};
        handCards.forEach(card => {
            cardGroups[card.cardValue] = (cardGroups[card.cardValue] || []);
            cardGroups[card.cardValue].push(card);
        });

        Object.values(cardGroups).forEach(group => {
            if (group.length >= 2) {
                suggestions.unshift({
                    cards: group.slice(0, 2),
                    command: `出 ${group[0].cardName} ${group[1].cardName}`
                });
            }
            if (group.length >= 3) {
                suggestions.unshift({
                    cards: group.slice(0, 3),
                    command: `出 ${group.map(c => c.cardName).join(" ")}`
                });
            }
        });
    } else {
        // 尝试接最后一个出牌的人的牌
        if (lastValidPlay.cards) {  // 确保有牌可以接
            suggestions = getSuggestions(handCards, {
                ...prevStats,
                cards: lastValidPlay.cards,
                playerId: lastValidPlay.playerId
            });
        }
    }

    // 按点数排序，选择最小的一手牌
    suggestions.sort((a, b) => a.cards[0].cardValue - b.cards[0].cardValue);

    // 添加调试信息
    console.log('\n========== 自动出牌系统 ==========');
    console.log('当前玩家:', users.get(userToken)?.nickName);
    console.log('手牌:', handCards.map(c => c.cardName).join(' '));
    console.log('上家出牌:', prevStats.cards?.map(c => c.cardName).join(' ') || '无');
    console.log('可选的出牌:', suggestions.map(s => s.command).join(', '));
    console.log('最终选择:', suggestions.length > 0 ? suggestions[0].command : "过");
    console.log('================================\n');

    // 如果没有找到可以出的牌，就过牌
    const command = suggestions.length > 0 ? suggestions[0].command : "过";
    const cardStr = command.replace('出 ', '');

    // 直接调用 playCard 函数
    playCard(socket, userToken, { card: cardStr }, clients, users, rooms);
};

export const toggleAutoPlay = (socket, userToken, data, ...args) => {
    const resp = new ResponseFactory();
    const [clients, users, rooms] = args;

    // 检查用户是否设置昵称
    const username = users.get(userToken)?.nickName;
    if (!username) {
        resp.error(203, '用户信息无效');
        socket.emit('203', resp.serialize());
        return;
    }

    // 查找用户所在的房间
    const room = rooms.find(room => room.playerList.includes(userToken));
    if (!room) {
        resp.error(203, '你还没有加入房间');
        socket.emit('203', resp.serialize());
        return;
    }

    // 检查游戏是否开始
    if (!room.status) {
        resp.error(203, '游戏尚未开始');
        socket.emit('203', resp.serialize());
        return;
    }

    try {
        // 切换托管状态
        room.playerDetail[userToken].autoPlay = !room.playerDetail[userToken].autoPlay;
        const status = room.playerDetail[userToken].autoPlay;

        // 创建系统消息
        const message = `${username} ${status ? '开启' : '关闭'}了托管模式`;
        resp.success(203, { autoPlay: status }, message);

        // 向房间内所有玩家广播状态变化
        io.to(room.id).emit('203', resp.serialize());
        // socket.emit('203', resp.serialize());

        // 如果开启托管且轮到该玩家出牌，立即触发一次自动出牌
        if (status && room.nextPlayerId === userToken) {
            process.nextTick(() => {
                autoPlay(socket, userToken, room, args);
            });
        }
    } catch (e) {
        resp.error(203, `切换托管状态失败: ${e}`);
        socket.emit('203', resp.serialize());
    }
};