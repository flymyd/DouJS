import {ResponseFactory} from "../ResponseFactory.js";
import {sortCards} from "../core/CardUtils.js";

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
        const {playerDetail, prevStats, usedCard} = room;
        const currentDetail = playerDetail[userToken];

        // 记牌器逻辑
        sortCards(usedCard);
        const groupedCards = usedCard.reduce((acc, card) => {
            if (acc[card.cardName]) {
                acc[card.cardName]++;
            } else {
                acc[card.cardName] = 1;
            }
            return acc;
        }, {});

        const recorder = Object.keys(groupedCards).length > 0 
            ? Object.keys(groupedCards).map(k => k + "*" + groupedCards[k]).join(" ") 
            : '无';

        // 获取队友列表
        const teammates = room.playerList
            .filter(id => (playerDetail[id].isLord === currentDetail.isLord) && id !== userToken)
            .map(id => playerDetail[id].name);

        // 准备返回信息
        const messages = [];
        messages.push(`你的身份是：${currentDetail.isLord ? '地主' : '农民'}`);
        messages.push(`你的队友是：${teammates.length > 0 ? teammates.join("、") : '无'}`);
        messages.push(`上家是：${prevStats.playerName}`);
        messages.push(`上家出牌：${prevStats.cards.length > 0 
            ? prevStats.cards.map(card => card.cardName).join(" ") 
            : '无'}`);
        messages.push(`记牌器: ${recorder}`);
        messages.push(`手牌: ${currentDetail.cards.map(card => card.cardName).join(" ")}`);

        const info = {
            identity: currentDetail.isLord ? '地主' : '农民',
            teammates: teammates,
            prevPlayer: {
                name: prevStats.playerName,
                cards: prevStats.cards
            },
            usedCards: recorder,
            handCards: currentDetail.cards,
            messages: messages
        };

        resp.success(201, info, messages.join('\n'));
        socket.emit('201', resp.serialize());
    } catch (e) {
        resp.error(201, `获取信息失败: ${e}`);
        socket.emit('201', resp.serialize());
    }
}
