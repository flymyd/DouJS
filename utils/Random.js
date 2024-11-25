/**
 * 随机工具类
 */
export class Random {
    /**
     * 从数组中随机挑选元素
     * @template T
     * @param {readonly T[]} array 源数组
     * @param {number} [count] 需要挑选的元素个数
     * @returns {T|T[]} 如果指定count则返回数组，否则返回单个元素
     */
    static pick(array, count) {
        if (!array || array.length === 0) {
            return count ? [] : undefined;
        }

        // 如果没有指定count，随机返回一个元素
        if (count === undefined) {
            const index = Math.floor(Math.random() * array.length);
            return array[index];
        }

        // 如果指定了count，返回指定数量的随机元素
        count = Math.min(count, array.length);
        const result = [];
        const tempArray = [...array];

        for (let i = 0; i < count; i++) {
            const index = Math.floor(Math.random() * tempArray.length);
            result.push(tempArray[index]);
            tempArray.splice(index, 1);
        }

        return result;
    }
} 