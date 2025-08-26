// Error handling utility functions
export const handleError = (error, fallback = null) => {
    console.error('Error:', error);
    return fallback;
};

export const createError = (message, code = null, data = null) => {
    const error = new Error(message);
    if (code) error.code = code;
    if (data) error.data = data;
    return error;
};

export const isNetworkError = (error) => {
    return error instanceof Error && 
           (error.message.includes('Network Error') || 
            error.message.includes('Failed to fetch'));
};

export const getErrorMessage = (error) => {
    if (!error) return 'Unknown error';
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.response && error.response.data && error.response.data.message) 
        return error.response.data.message;
    return 'An error occurred';
};
