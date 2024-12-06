import { ResponseFactory } from "../ResponseFactory.js";
import { sortCards } from "../core/CardUtils.js";
import { getCardType } from "../core/JudgeUtils.js";
import { PokerHandEnum } from "../core/PokerHandEnum.js";

/**
 * 查看手牌信息
 * @param socket
 * @param userToken
 * @param data
 * @param args
 */
export const showInfo = (socket, userToken, data, ...args) => {
    const resp = new ResponseFactory();
    const [clients, users, rooms] = args;

    // 检查用户是否设置昵称
    const username = users.get(userToken)?.nickName;
    if (!username) {
        resp.error(201, '用户信息无效');
        socket.emit('201', resp.serialize());
        return;
    }

    // 查找用户所在的房间
    const room = rooms.find(room => room.playerList.includes(userToken));
    if (!room) {
        resp.error(201, '你还没有加入房间');
        socket.emit('201', resp.serialize());
        return;
    }

    // 检查游戏是否开始
    if (!room.status) {
        resp.error(201, '你所在的房间尚未开始游戏');
        socket.emit('201', resp.serialize());
        return;
    }

    try {
        const { playerDetail, prevStats, usedCard = [] } = room;
        const currentDetail = playerDetail[userToken];

        // 记牌器逻辑
        const recorder = usedCard && usedCard.length > 0 ? (() => {
            sortCards(usedCard);
            const groupedCards = usedCard.reduce((acc, card) => {
                if (acc[card.cardName]) {
                    acc[card.cardName]++;
                } else {
                    acc[card.cardName] = 1;
                }
                return acc;
            }, {});
            return Object.keys(groupedCards).map(k => k + "*" + groupedCards[k]).join(" ");
        })() : '无';

        // 获取队友列表
        const teammates = room.playerList
            .filter(id => (playerDetail[id].isLord === currentDetail.isLord) && id !== userToken)
            .map(id => playerDetail[id].name);

        // 准备返回信息
        const messages = [];
        messages.push(`你的身份是：${currentDetail.isLord ? '地主' : '农民'}`);
        messages.push(`你的队友是：${teammates.length > 0 ? teammates.join("、") : '无'}`);
        messages.push(`上家是：${prevStats?.playerName || '无'}`);

        // 添加建议出牌逻辑
        let suggestions = [];
        if (prevStats?.cards?.length > 0) {
            messages.push(`上家出牌：${prevStats.cards.map(card => card.cardName).join(" ")}`);

            // 获取所有可能打过上家的牌型
            const handCards = [...currentDetail.cards];
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

            // 查找炸弹
            const cardGroups = {};
            handCards.forEach(card => {
                cardGroups[card.cardValue] = (cardGroups[card.cardValue] || []);
                cardGroups[card.cardValue].push(card);
            });

            Object.values(cardGroups).forEach(group => {
                if (group.length === 4) {
                    suggestions.push({
                        cards: group,
                        command: `出 ${group.map(c => c.cardName).join(" ")}`
                    });
                }
            });

            // 查找王炸
            const jokers = handCards.filter(card => card.cardValue >= 14);
            if (jokers.length === 2) {
                suggestions.push({
                    cards: jokers,
                    command: `出 ${jokers.map(c => c.cardName).join(" ")}`
                });
            }

            console.log('*************建议出牌：',suggestions);

            // 添加建议出牌到消息中
            if (suggestions.length > 0) {
                messages.push("建议出牌：");
                suggestions.forEach(suggestion => {
                    messages.push(`<span class="clickable-suggestion">${suggestion.command}</span>`);
                });
            }
        } else {
            messages.push("上家出牌：无");
        }

        messages.push(`记牌器: ${recorder}`);
        messages.push(`手牌: ${currentDetail.cards.map(card => card.cardName).join(" ")}`);

        const info = {
            identity: currentDetail.isLord ? '地主' : '农民',
            teammates: teammates,
            prevPlayer: {
                name: prevStats?.playerName || '无',
                cards: prevStats?.cards || []
            },
            usedCards: recorder,
            handCards: currentDetail.cards,
            messages: messages,
            suggestions: suggestions  // 添加建议出牌到返回数据中
        };

        resp.success(201, info, messages.join('\n'));
        socket.emit('201', resp.serialize());
    } catch (e) {
        console.error('获取信息失败:', e);
        resp.error(201, `获取信息失败: ${e}`);
        socket.emit('201', resp.serialize());
    }
}
