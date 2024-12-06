import { ResponseFactory } from "../ResponseFactory.js";
import { getCardType } from "../core/JudgeUtils.js";
import { PokerHandEnum } from "../core/PokerHandEnum.js";
import { playCard } from "./PlayCard.js";  // 导入 playCard 函数

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

        // 如果开启托管且轮到该玩家出牌，立即触发一次自动出牌
        if (status && room.nextPlayerId === userToken) {
            process.nextTick(() => {
                autoPlay(socket, userToken, room, args);
            });
        }

        resp.success(203, { autoPlay: status }, 
            `${status ? '已开启' : '已关闭'}托管模式`);
        socket.emit('203', resp.serialize());
    } catch (e) {
        resp.error(203, `切换托管状态失败: ${e}`);
        socket.emit('203', resp.serialize());
    }
};

// 修改自动出牌逻辑
export const autoPlay = (socket, userToken, room, args) => {
    const [clients, users, rooms] = args || [];
    const { playerDetail, prevStats } = room;
    const currentDetail = playerDetail[userToken];
    const handCards = [...currentDetail.cards];

    // 获取建议出牌
    let suggestions = [];
    
    // 如果是自由出牌（上家是自己或没有上家出牌）
    if (!prevStats.cards?.length || prevStats.playerId === userToken) {
        // 找出最小的单张
        suggestions = [{
            cards: [handCards[0]],
            command: `出 ${handCards[0].cardName}`
        }];
        
        // 尝试找对子
        const cardGroups = {};
        handCards.forEach(card => {
            cardGroups[card.cardValue] = (cardGroups[card.cardValue] || []);
            cardGroups[card.cardValue].push(card);
        });
        
        // 优先出对子和三张
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
        // 跟牌逻辑，复用 ShowInfo 中的建议出牌逻辑
        const prevType = getCardType(prevStats.cards);
        
        if (prevType === PokerHandEnum.Single) {
            handCards.forEach(card => {
                if (card.cardValue > prevStats.cards[0].cardValue) {
                    suggestions.push({
                        cards: [card],
                        command: `出 ${card.cardName}`
                    });
                }
            });
        } else if (prevType === PokerHandEnum.Pair) {
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
        } else if (prevType === PokerHandEnum.ThreeWithPair) {
            // 查找三带对
            const cardGroups = {};
            handCards.forEach(card => {
                cardGroups[card.cardValue] = (cardGroups[card.cardValue] || []);
                cardGroups[card.cardValue].push(card);
            });

            // 找出所有三张
            Object.entries(cardGroups).forEach(([threeValue, threeCards]) => {
                if (threeCards.length >= 3 && parseInt(threeValue) > prevStats.cards[0].cardValue) {
                    // 找出所有对子
                    Object.entries(cardGroups).forEach(([pairValue, pairCards]) => {
                        if (pairValue !== threeValue && pairCards.length >= 2) {
                            const combination = [...threeCards.slice(0, 3), ...pairCards.slice(0, 2)];
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
        } else if (prevType === PokerHandEnum.DoubleStraight) {
            // 查找连对
            const len = prevStats.cards.length;
            const cardGroups = {};
            handCards.forEach(card => {
                cardGroups[card.cardValue] = (cardGroups[card.cardValue] || []);
                cardGroups[card.cardValue].push(card);
            });

            // 找出所有可能的连对
            const pairs = Object.entries(cardGroups)
                .filter(([_, cards]) => cards.length >= 2)
                .map(([value, cards]) => ({
                    value: parseInt(value),
                    cards: cards.slice(0, 2)
                }))
                .sort((a, b) => a.value - b.value);

            for (let i = 0; i < pairs.length - (len/2) + 1; i++) {
                const possibleDoubleStraight = pairs.slice(i, i + len/2)
                    .flatMap(pair => pair.cards);
                if (getCardType(possibleDoubleStraight) === PokerHandEnum.DoubleStraight &&
                    possibleDoubleStraight[0].cardValue > prevStats.cards[0].cardValue) {
                    suggestions.push({
                        cards: possibleDoubleStraight,
                        command: `出 ${possibleDoubleStraight.map(c => c.cardName).join(" ")}`
                    });
                }
            }
        }

        // 检查是否可以出炸弹
        const cardGroups = {};
        handCards.forEach(card => {
            cardGroups[card.cardValue] = (cardGroups[card.cardValue] || []);
            cardGroups[card.cardValue].push(card);
        });

        // 添加炸弹
        Object.values(cardGroups).forEach(group => {
            if (group.length === 4) {
                suggestions.push({
                    cards: group,
                    command: `出 ${group.map(c => c.cardName).join(" ")}`
                });
            }
        });

        // 添加王炸
        const jokers = handCards.filter(card => card.cardValue >= 14);
        if (jokers.length === 2) {
            suggestions.push({
                cards: jokers,
                command: `出 ${jokers.map(c => c.cardName).join(" ")}`
            });
        }
    }

    // 按点数排序，选择最小的一手牌
    suggestions.sort((a, b) => a.cards[0].cardValue - b.cards[0].cardValue);
    
    // 修改这里：不再发送消息，而是直接调用 playCard
    const command = suggestions.length > 0 ? suggestions[0].command : "过";
    const cardStr = command.replace('出 ', '');
    
    // 直接调用 playCard 函数
    playCard(socket, userToken, { card: cardStr }, clients, users, rooms);
}; 