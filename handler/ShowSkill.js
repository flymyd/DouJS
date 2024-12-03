import {ResponseFactory} from "../ResponseFactory.js";

/**
 * 展示特殊事件
 * @param socket
 */
export const showSkill = (socket) => {
    const resp = new ResponseFactory();

    try {
        const messages = [];
        
        // 特殊事件说明
        messages.push("魔改/万宁模式下可能触发的特殊事件如下：");
        messages.push("");
        messages.push("以小博大：当前玩家最大的一张手牌变为2");
        messages.push("昙花一现：随机让一位玩家明牌");
        messages.push("散财童子：当前玩家手牌数大于1时，随机丢掉一张手牌");
        messages.push("阳光普照：每人随机获得一张牌");
        messages.push("偷天换日：将一名玩家的一张手牌和自己的一张手牌交换");
        messages.push("乾坤大挪移：将一名玩家的全部手牌和自己的全部手牌交换");
        messages.push("狸猫换太子：将一名玩家的身份和自己的身份交换");
        messages.push("反转了：翻转出牌顺序");
        messages.push("摇滚狂欢：每名手牌数大于1的玩家均失去点数最大的一张手牌");
        messages.push("三山四海：当前玩家随机获得1~4张3或1~4张4");
        messages.push("");
        messages.push("触发概率：");
        messages.push("经典模式：无特殊事件");
        messages.push("魔改模式：每次出牌有10%概率触发");
        messages.push("万宁模式：每次出牌有25%概率触发");

        const skillInfo = {
            skills: [
                {
                    name: "以小博大",
                    description: "当前玩家最大的一张手牌变为2",
                    type: "牌面变化"
                },
                {
                    name: "昙花一现",
                    description: "随机让一位玩家明牌",
                    type: "信息暴露"
                },
                {
                    name: "散财童子",
                    description: "当前玩家手牌数大于1时，随机丢掉一张手牌",
                    type: "失去手牌"
                },
                {
                    name: "阳光普照",
                    description: "每人随机获得一张牌",
                    type: "获得手牌"
                },
                {
                    name: "偷天换日",
                    description: "将一名玩家的一张手牌和自己的一张手牌交换",
                    type: "手牌交换"
                },
                {
                    name: "狸猫换太子",
                    description: "将一名玩家的身份和自己的身份交换",
                    type: "身份交换"
                },
                {
                    name: "乾坤大挪移",
                    description: "将一名玩家的全部手牌和自己的全部手牌交换",
                    type: "手牌交换"
                },
                {
                    name: "反转了",
                    description: "翻转出牌顺序",
                    type: "规则变化"
                },
                {
                    name: "摇滚狂欢",
                    description: "每名手牌数大于1的玩家均失去点数最大的一张手牌",
                    type: "失去手牌"
                },
                {
                    name: "三山四海",
                    description: "当前玩家随机获得1~4张3或1~4张4",
                    type: "获得手牌"
                }
            ],
            triggerRates: {
                classic: {
                    mode: 0,
                    name: "经典模式",
                    rate: "无特殊事件"
                },
                modified: {
                    mode: 1,
                    name: "魔改模式",
                    rate: "10%"
                },
                wanning: {
                    mode: 2,
                    name: "万宁模式",
                    rate: "25%"
                }
            }
        };

        resp.success(304, skillInfo, messages.join('\n'));
        socket.emit('304', resp.serialize());
    } catch (e) {
        resp.error(304, `获取事件说明失败: ${e}`);
        socket.emit('304', resp.serialize());
    }
}; 