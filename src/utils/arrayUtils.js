// Array utility functions
export const unique = (array) => {
    return [...new Set(array)];
};

export const flatten = (array) => {
    return array.flat(Infinity);
};

export const chunk = (array, size) => {
    return array.reduce((acc, item, idx) => {
        const chunkIdx = Math.floor(idx / size);
        if (!acc[chunkIdx]) acc[chunkIdx] = [];
        acc[chunkIdx].push(item);
        return acc;
    }, []);
};

export const groupBy = (array, key) => {
    return array.reduce((acc, item) => {
        const groupKey = typeof key === 'function' ? key(item) : item[key];
        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(item);
        return acc;
    }, {});
};
