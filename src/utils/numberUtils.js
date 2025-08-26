// Number utility functions
export const formatNumber = (num, decimals = 2) => {
    return Number(num).toFixed(decimals);
};

export const isNumber = (value) => {
    return typeof value === 'number' && !isNaN(value);
};

export const clamp = (num, min, max) => {
    return Math.max(min, Math.min(num, max));
};

export const roundToDecimal = (num, decimals = 0) => {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
};
