// String utility functions
export const capitalize = (str) => {
    if (typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export const camelCase = (str) => {
    return str.replace(/(?:^|\s|-|_)(.)/g, (match, firstChar) => firstChar.toUpperCase());
};

export const kebabCase = (str) => {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
};

export const snakeCase = (str) => {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
};
