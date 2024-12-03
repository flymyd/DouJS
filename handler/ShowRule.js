import {ResponseFactory} from "../ResponseFactory.js";

/**
 * 展示出牌规则
 * @param socket
 */
export const showRule = (socket) => {
    const resp = new ResponseFactory();

    try {
        const messages = [];
        
        // 特殊规则说明
        messages.push("=== 发牌规则 ===");
        messages.push("玩家人数为3人时，使用一副完整牌。每人17张牌，地主有额外的3张地主牌。");
        messages.push("当玩家人数为4~6人时的特别发牌规则如下：");
        messages.push("4人场：分地主队和农民队，地主没有额外的牌。使用一副完整牌 + 去掉黑桃、草花、大小王的半副牌。每人20张牌。");
        messages.push("5人场：2地主对3农民。使用两副完整牌。每人20张牌，每个地主有4张地主牌。");
        messages.push("6人场：分地主队和农民队，地主没有额外的牌。使用三副完整牌。每人27张牌。");
        messages.push("");
        
        // 出牌规则说明
        messages.push("=== 出牌规则 ===");
        messages.push("单牌");
        messages.push("对子（一对相同点数的牌）");
        messages.push("三张相同点数的牌");
        messages.push("三带一（三张相同点数的牌 + 单牌）");
        messages.push("三带一对（三张相同点数的牌 + 一对）");
        messages.push("顺子（连续的五张或更多点数相邻的牌）");
        messages.push("连对（连续的两对或更多对点数相邻的牌）");
        messages.push("飞机不带翅膀（连续的两个或更多个三张相同点数的牌）");
        messages.push("飞机带单牌（连续的两个或更多个三张相同点数的牌 + 相同数量的单牌）");
        messages.push("飞机带对子（连续的两个或更多个三张相同点数的牌 + 相同数量的对子）");
        messages.push("炸弹（四张点数相同的牌）");
        messages.push("王炸（即大王+小王）");

        const ruleInfo = {
            specialRules: {
                fourPlayers: "4人场：分地主队和农民队，地主没有额外的牌。使用一副完整牌 + 去掉黑桃、草花、大小王的半副牌。每人20张牌。",
                fivePlayers: "5人场：2地主对3农民。使用两副完整牌。每人20张牌，每个地主有4张地主牌。",
                sixPlayers: "6人场：分地主队和农民队，地主没有额外的牌。使用三副完整牌。每人27张牌。"
            },
            cardTypes: [
                { name: "单牌", description: "单张牌" },
                { name: "对子", description: "一对相同点数的牌" },
                { name: "三张", description: "三张相同点数的牌" },
                { name: "三带一", description: "三张相同点数的牌 + 单牌" },
                { name: "三带一对", description: "三张相同点数的牌 + 一对" },
                { name: "顺子", description: "连续的五张或更多点数相邻的牌" },
                { name: "连对", description: "连续的两对或更多对点数相邻的牌" },
                { name: "飞机不带翅膀", description: "连续的两个或更多个三张相同点数的牌" },
                { name: "飞机带单牌", description: "连续的两个或更多个三张相同点数的牌 + 相同数量的单牌" },
                { name: "飞机带对子", description: "连续的两个或更多个三张相同点数的牌 + 相同数量的对子" },
                { name: "炸弹", description: "四张点数相同的牌" },
                { name: "王炸", description: "大王+小王" }
            ]
        };

        resp.success(302, ruleInfo, messages.join('\n'));
        socket.emit('302', resp.serialize());
    } catch (e) {
        resp.error(302, `获取规则失败: ${e}`);
        socket.emit('302', resp.serialize());
    }
}; 