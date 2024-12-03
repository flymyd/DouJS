import { RoomModeNames } from '../types/RoomTypes';

export const setupSocketEvents = (socket, messageHandlers, userState) => {
    if (!socket) return;

    const eventHandlers = {
        '100': handleNicknameResponse,
        '101': handleCreateRoomResponse,
        '102': handleJoinRoomResponse,
        '103': handleExitRoomResponse,
        '104': handleDisbandRoomResponse,
        '105': handleListRoomResponse,
        '106': handleStartGameResponse,
        '201': handleShowInfoResponse,
        '202': handlePlayCardResponse,
        '107': handleQuitRoomResponse,
        '302': handleShowRuleResponse,
        '304': handleShowSkillResponse,
        '108': handleStatusResponse
    };

    // 注册所有事件处理器
    Object.entries(eventHandlers).forEach(([event, handler]) => {
        socket.on(event, (data) => handleSocketResponse(data, handler));
    });

    // 通用消息处理
    socket.on('message', (data) => {
        try {
            const messageData = JSON.parse(data);
            messageHandlers.addServerMessage(messageData.msg || data);
        } catch (e) {
            messageHandlers.addServerMessage(data);
        }
    });

    function handleSocketResponse(data, handler) {
        try {
            console.log(data)
            const response = JSON.parse(data);
            handler(response, messageHandlers, userState);
        } catch (e) {
            console.log(e)
            messageHandlers.addServerMessage('收到无效的响应数据');
        }
    }
};

function handleNicknameResponse(response, messageHandlers, userState) {
    if (response.code === 1) {
        userState.setHasNickname(true);
        localStorage.setItem('nickname', response.data.nickName);
        if (!response.silent) {
            messageHandlers.addServerMessage(response.msg);
        }
    } else {
        messageHandlers.addErrorMessage(response.msg);
    }
}

function handleCreateRoomResponse(response, messageHandlers) {
    if (response.code === 1) {
        messageHandlers.addServerMessage(response.msg);
    } else {
        messageHandlers.addErrorMessage(response.msg);
    }
}

function handleJoinRoomResponse(response, messageHandlers) {
    if (response.code === 1) {
        messageHandlers.addServerMessage(response.msg);
    } else {
        // messageHandlers.addErrorMessage(response.msg);
    }
}

function handleExitRoomResponse(response, messageHandlers) {
    if (response.code === 1) {
        messageHandlers.addServerMessage(response.msg);
    } else {
        messageHandlers.addErrorMessage(response.msg);
    }
}

function handleDisbandRoomResponse(response, messageHandlers) {
    if (response.code === 1) {
        messageHandlers.addServerMessage(response.msg);
    } else {
        messageHandlers.addErrorMessage(response.msg);
    }
}

function handleListRoomResponse(response, messageHandlers) {
    if (response.code === 1) {
        if (response.data.length) {
            const roomList = response.data.map(room =>
                `房间ID：${room.id} | 模式：${RoomModeNames[room.mode]} | ` +
                `房主：${room.ownerName} | 玩家数：${room.playerCount} | ` +
                `状态：${room.status ? '游戏中' : '等待中'}`
            ).join('<br/>');
            messageHandlers.addHintMessage(roomList);
        } else {
            messageHandlers.addServerMessage('当前没有房间');
        }
    } else {
        messageHandlers.addErrorMessage(response.msg);
    }
}

function handleStartGameResponse(response, messageHandlers) {
    if (response.code === 1) {
        messageHandlers.addServerMessage(response.msg);
    } else {
        messageHandlers.addErrorMessage(response.msg);
    }
}

function handleShowInfoResponse(response, messageHandlers) {
    if (response.code === 1) {
        messageHandlers.addServerMessage(response.msg || `您的手牌：${response.data.cards.join(', ')}`);
    } else {
        messageHandlers.addErrorMessage(response.msg);
    }
}

function handlePlayCardResponse(response, messageHandlers) {
    if (response.code === 1) {
        messageHandlers.addServerMessage(response.msg);
    } else {
        messageHandlers.addErrorMessage(response.msg);
    }
}

function handleQuitRoomResponse(response, messageHandlers) {
    if (response.code === 1) {
        messageHandlers.addServerMessage(response.msg);
    } else {
        messageHandlers.addErrorMessage(response.msg);
    }
}

function handleShowRuleResponse(response, messageHandlers) {
    if (response.code === 1) {
        messageHandlers.addSystemMessage(response.msg);
    } else {
        messageHandlers.addErrorMessage(response.msg);
    }
}

function handleShowSkillResponse(response, messageHandlers) {
    if (response.code === 1) {
        messageHandlers.addSystemMessage('=== 特殊事件 ===\n' + response.msg);
    } else {
        messageHandlers.addErrorMessage(response.msg);
    }
}

function handleStatusResponse(response, messageHandlers) {
    if (response.code === 1) {
        messageHandlers.addSystemMessage('=== 当前状态 ===\n' + response.msg);
    } else {
        messageHandlers.addErrorMessage(response.msg);
    }
}