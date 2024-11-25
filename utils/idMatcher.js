/**
 * 在给定的ID列表中查找匹配的ID
 * @param {string} partialId - 用户输入的部分ID
 * @param {string[]} idList - 可用的ID列表
 * @returns {{matched: string|null, candidates: string[]}} - 返回匹配结果和候选列表
 */
export const findMatchingId = (partialId, idList) => {
    if (!partialId || !idList?.length) {
        return { matched: null, candidates: [] };
    }

    const candidates = idList.filter(id => id.startsWith(partialId));

    if (candidates.length === 0) {
        return { matched: null, candidates: [] };
    } else if (candidates.length === 1) {
        return { matched: candidates[0], candidates: [] };
    } else {
        return { matched: null, candidates };
    }
}; 