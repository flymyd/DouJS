import { setUserInfo } from "./handler/SetUserInfo.js";
import { createRoom } from "./handler/CreateRoom.js";
import { joinRoom } from "./handler/JoinRoom.js";
import { exitRoom } from "./handler/ExitRoom.js";
import { disbandRoom } from "./handler/DisbandRoom.js";
import { listRoom } from "./handler/ListRoom.js";
import { showInfo } from "./handler/ShowInfo.js";
import { startGame } from "./handler/StartGame.js";
import { playCard } from "./handler/PlayCard.js";
import { quitRoom } from "./handler/QuitRoom.js";
import { showRule } from "./handler/ShowRule.js";
import { showSkill } from "./handler/ShowSkill.js";
import { sendMessage } from "./handler/SendMessage.js";
import { showStatus } from "./handler/ShowStatus.js";
import { toggleAutoPlay } from "./handler/AutoPlay.js";

/**
 * 客户端信息的校验和分发
 * @param socket socket实例
 * @param message 接收到的信息
 * @param args 全局payload
 * @constructor
 */
export const MessageDispatcher = (socket, message, ...args) => {
  if (isJSONObject(message)) {
    const messageObj = JSON.parse(message);
    const [clients, users, rooms] = args;
    const userToken = getKeyByValue(clients, socket.id);
    if (userToken && messageObj.type) {
      switch (Number(messageObj.type)) {
        case 100:
          // 设置昵称
          setUserInfo(socket, userToken, messageObj.data, ...args);
          break;
        case 101:
          // 创建房间
          createRoom(socket, userToken, messageObj.data, ...args);
          break;
        case 102:
          // 加入房间
          joinRoom(socket, userToken, messageObj.data, ...args);
          break;
        case 103:
          // 加入房间
          exitRoom(socket, userToken, messageObj.data, ...args);
          break;
        case 104:
          // 解散房间
          disbandRoom(socket, userToken, messageObj.data, ...args);
          break;
        case 105:
          // 房间列表
          listRoom(socket, ...args);
          break;
        case 106:
          // 开始对局
          startGame(socket, userToken, messageObj.data, ...args);
          break;
        case 201:
          // 查看手牌
          showInfo(socket, userToken, messageObj.data, ...args);
          break;
        case 202:
          // 出牌
          playCard(socket, userToken, messageObj.data, ...args);
          break;
        case 203:
          // 托管
          toggleAutoPlay(socket, userToken, messageObj.data, ...args);
        break;
        case 107:
          // 退出所有房间
          quitRoom(socket, userToken, messageObj.data, ...args);
          break;
        case 302:
          // 展示规则
          showRule(socket);
          break;
        case 304:
          // 展示特殊事件
          showSkill(socket);
          break;
        case 999:
          // 处理普通消息
          sendMessage(socket, userToken, messageObj.data, ...args);
          break;
        case 108:
          // 查看状态
          showStatus(socket, userToken, messageObj.data, ...args);
          break;
      }
    }
  }
}

const isJSONObject = (str) => {
  try {
    const obj = JSON.parse(str);
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
  } catch (e) {
    return false;
  }
}

const getKeyByValue = (map, value) => [...map].find(([k, v]) => v === value)?.[0];
