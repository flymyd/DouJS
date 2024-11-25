import {ResponseFactory} from "../ResponseFactory.js";

/**
 * 100 设置用户信息
 * @param socket 实例
 * @param userToken 用户token
 * @param data 数据
 * @param args
 */
export const setUserInfo = (socket, userToken, data, ...args) => {
  const resp = new ResponseFactory();
  const nickName = data?.nickName ?? '';
  if (nickName.length >= 15 || nickName.length < 1) {
    resp.error(100, '昵称长度应为0-15位')
    socket.emit('100', resp.serialize());
  } else {
    const [clients, users, rooms] = args;
    users.set(userToken, data)
    resp.success(100, data, '设置成功')
    socket.emit('100', resp.serialize());
  }
}
