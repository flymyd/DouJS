/**
 * @typedef {Object.<string, {name: string, cards: Array<import('./CardTypes').CardTypes>, isLord: boolean}>} PlayerDetail
 */

/**
 * 斗地主房间详情定义
 * @typedef {Object} RoomTypes
 * @property {number} [id] - 房间ID
 * @property {number} mode - 房间模式
 * @property {number} status - 房间状态
 * @property {Array<string>} playerList - 玩家ID列表
 * @property {PlayerDetail} playerDetail - 玩家详情
 * @property {{cards: Array<import('./CardTypes').CardTypes>, playerId: string, playerName: string}} prevStats - 堂子详情
 * @property {string} nextPlayerId - 下家ID
 * @property {Array<import('./CardTypes').CardTypes>} usedCard - 弃牌堆
 */ 