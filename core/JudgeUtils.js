import {PokerHandEnum} from "./PokerHandEnum.js";
import {classifyAndCount, countCards} from "./CardUtils.js";

/**
 * 判断牌组的牌型
 * @param cards 牌组
 */
export function getCardType(cards) {
  const length = cards.length;
  if (length === 1) {
    return PokerHandEnum.Single;
  } else if (length === 2 && isJokerBomb(cards)) {
    return PokerHandEnum.JokerBomb;
  } else if (length === 2 && isPair(cards)) {
    return PokerHandEnum.Pair;
  } else if (length === 4 && isBomb(cards)) {
    return PokerHandEnum.Bomb;
  } else if (length === 3) {
    return isThreeOfAKind(cards) ? PokerHandEnum.ThreeOfAKind : PokerHandEnum.Invalid;
  } else if (length === 4) {
    if (isThreeWithSingle(cards)) {
      return PokerHandEnum.ThreeWithSingle;
    } else {
      return PokerHandEnum.Invalid;
    }
  } else if (length >= 5) {
    if (isStraight(cards)) {
      return PokerHandEnum.Straight;
    } else if (isThreeWithPair(cards)) {
      return PokerHandEnum.ThreeWithPair;
    } else if (isDoubleStraight(cards)) {
      return PokerHandEnum.DoubleStraight;
    } else if (isTripleStraight(cards)) {
      return PokerHandEnum.TripleStraight;
    } else if (isTripleStraightWithSingle(cards)) {
      return PokerHandEnum.TripleStraightWithSingle;
    } else if (isTripleStraightWithPair(cards)) {
      return PokerHandEnum.TripleStraightWithPair;
    } else {
      return PokerHandEnum.Invalid;
    }
  } else {
    return PokerHandEnum.Invalid;
  }
}

/**
 * 判断待出的牌能否管住上家的牌
 * @param currentCards 本家牌组
 * @param previousCards 上家牌组
 */
export function canBeatPreviousCards(currentCards, previousCards) {
  const currentCardType = getCardType(currentCards);
  const previousCardType = getCardType(previousCards);

  if (currentCardType === PokerHandEnum.Invalid) {
    return false;
  } else if (currentCardType === PokerHandEnum.JokerBomb && previousCardType !== PokerHandEnum.JokerBomb) {
    return true;
  } else if (currentCardType === PokerHandEnum.JokerBomb && previousCardType === PokerHandEnum.JokerBomb) {
    return false;
  } else if (currentCardType === PokerHandEnum.Bomb && previousCardType !== PokerHandEnum.JokerBomb) {
    if (currentCardType === PokerHandEnum.Bomb && previousCardType === PokerHandEnum.Bomb) {
      return currentCards[0].cardValue > previousCards[0].cardValue;
    } else return true;
  } else if (currentCardType === previousCardType && currentCards.length === previousCards.length) {
    const cardTypesToCheck = [
      PokerHandEnum.ThreeWithSingle,
      PokerHandEnum.ThreeWithPair,
      PokerHandEnum.TripleStraightWithSingle,
      PokerHandEnum.TripleStraightWithPair
    ];
    if (cardTypesToCheck.includes(currentCardType)) {
      const prevCardGroupCount = classifyAndCount(previousCards)
      const currentCardGroupCount = classifyAndCount(currentCards)
      // 提出两组牌的三连牌点数并查找最大值，然后比较
      const prevMaxTriple = Math.max(...prevCardGroupCount['3'])
      const currMaxTriple = Math.max(...currentCardGroupCount['3'])
      return currMaxTriple > prevMaxTriple;
    } else if (currentCards[0].cardValue > previousCards[0].cardValue) {
      return true;
    }
  }
  return false;
}

/**
 * 王炸
 * @param cards
 */
function isJokerBomb(cards) {
  return cards.every(card => card.cardValue === 14 || card.cardValue === 15);
}

/**
 * 炸弹
 * @param cards
 */
function isBomb(cards) {
  return cards.every(card => card.cardValue === cards[0].cardValue);
}

/**
 * 三张
 * @param cards
 */
function isThreeOfAKind(cards) {
  return cards.every(card => card.cardValue === cards[0].cardValue);
}

/**
 * 对子
 * @param cards
 */
function isPair(cards) {
  return cards.every(card => card.cardValue === cards[0].cardValue);
}

/**
 * 三带一
 * @param cards
 */
function isThreeWithSingle(cards) {
  const cardCountMap = countCards(cards);
  const values = Object.values(cardCountMap);
  return (
    values.length === 2 &&
    (values[0] === 3 || values[1] === 3) &&
    cards.length === 4
  );
}

/**
 * 三带一对
 * @param cards
 */
function isThreeWithPair(cards) {
  const cardCountMap = countCards(cards);
  const values = Object.values(cardCountMap);
  return (
    values.length === 2 &&
    (values[0] === 3 || values[1] === 3) &&
    cards.length === 5
  );
}

/**
 * 顺子
 * @param cards
 */
function isStraight(cards) {
  const sortedCards = cards.sort((a, b) => a.cardValue - b.cardValue);
  for (let i = 0; i < sortedCards.length - 1; i++) {
    if (sortedCards[i].cardValue + 1 !== sortedCards[i + 1].cardValue) {
      return false;
    }
  }
  return true;
}

/**
 * 连对
 * @param cards
 */
function isDoubleStraight(cards) {
  if (cards.length % 2 !== 0) {
    return false;
  }
  const sortedCards = cards.sort((a, b) => a.cardValue - b.cardValue);
  for (let i = 0; i < sortedCards.length; i += 2) {
    if (sortedCards[i].cardValue !== sortedCards[i + 1].cardValue) {
      return false;
    }
  }
  for (let i = 0; i < sortedCards.length - 2; i += 2) {
    if (sortedCards[i].cardValue + 1 !== sortedCards[i + 2].cardValue) {
      return false;
    }
  }
  return true;
}

/**
 * 飞机不带翅膀
 * @param cards
 */
function isTripleStraight(cards) {
  if (cards.length % 3 !== 0) {
    return false;
  }
  const cardCountMap = countCards(cards);
  const values = Object.values(cardCountMap);
  if (values.length !== 1 || values[0] !== 3) {
    return false;
  }
  const sortedCards = cards.sort((a, b) => a.cardValue - b.cardValue);
  for (let i = 0; i < sortedCards.length - 3; i += 3) {
    if (sortedCards[i].cardValue + 1 !== sortedCards[i + 3].cardValue) {
      return false;
    }
  }
  return true;
}

/**
 * 飞机带单张
 * @param cards
 */
function isTripleStraightWithSingle(cards) {
  const cardCountMap = countCards(cards);
  const tripleCards = [];
  const singleCards = [];
  const doubleCards = [];
  for (const cardValue in cardCountMap) {
    if (cardCountMap[cardValue] === 3) {
      tripleCards.push(parseInt(cardValue));
    } else if (cardCountMap[cardValue] === 1) {
      singleCards.push(parseInt(cardValue));
    } else if (cardCountMap[cardValue] === 2) {
      doubleCards.push(parseInt(cardValue));
      singleCards.push(parseInt(cardValue), parseInt(cardValue));  // 将对子视为两张单牌处理
    } else {
      return false; // 非法输入
    }
  }
  if (tripleCards.length !== singleCards.length) {
    return false; // 飞机牌和单牌数量不匹配
  }
  tripleCards.sort((a, b) => a - b);
  for (let i = 0; i < tripleCards.length - 1; i++) {
    if (tripleCards[i + 1] - tripleCards[i] !== 1) {
      return false; // 飞机牌不连续
    }
  }
  return true;
}


/**
 * 飞机带对子
 * @param cards
 */
function isTripleStraightWithPair(cards) {
  const cardCountMap = countCards(cards);
  const tripleCards = [];
  const pairCards = [];
  for (const cardValue in cardCountMap) {
    if (cardCountMap[cardValue] === 3) {
      tripleCards.push(parseInt(cardValue));
    } else if (cardCountMap[cardValue] === 2) {
      pairCards.push(parseInt(cardValue));
    } else {
      return false; // 非法输入
    }
  }
  if (tripleCards.length !== pairCards.length) {
    return false; // 飞机牌和对子数量不匹配
  }
  tripleCards.sort((a, b) => a - b);
  for (let i = 0; i < tripleCards.length - 1; i++) {
    if (tripleCards[i + 1] - tripleCards[i] !== 1) {
      return false; // 飞机牌不连续
    }
  }
  return true;
}
