// Object utility functions
export const mergeDeep = (target, ...sources) => {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isPlainObject(target) && isPlainObject(source)) {
        for (const key in source) {
            if (isPlainObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
};

export const isPlainObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return false;
    const proto = Object.getPrototypeOf(obj);
    return proto === Object.prototype || proto === null;
};

export const omit = (obj, keys) => {
    return Object.entries(obj)
        .filter(([key]) => !keys.includes(key))
        .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {});
};

export const pick = (obj, keys) => {
    return Object.entries(obj)
        .filter(([key]) => keys.includes(key))
        .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {});
};
