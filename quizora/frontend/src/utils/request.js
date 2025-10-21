import { message } from 'antd';
const BASE_HOST = 'http://localhost:5005';

const defaultOptions = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    },
};

// fetch get function
export function get(url) {
    return fetch(`${BASE_HOST}${url}`, {
        ...defaultOptions,
        headers: {
            ...defaultOptions.headers,
            Authorization: `Bearer ${window.localStorage.getItem('token')}`,
        },
    })
    .then((res) => {
        if (!res.ok) {
        }
        return res.json();
    })
    .then((data) => {
        if (data.error) {
            
        }
        return data;
    })
    .catch((err) => {
        throw err;
    });
}

// fetch post function
export function post(url, data) {
    return fetch(`${BASE_HOST}${url}`, {
        ...defaultOptions,
        method: 'POST',
        headers: {
            ...defaultOptions.headers,
            Authorization: `Bearer ${window.localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
    })
    .then((res) => {
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
    })
    .then((data) => {
        if (data.error) {
            throw new Error(data.error);
        }
        return data;
    })
    .catch((err) => {
        message.error(err.message);
        throw err;
    });
}

// fetch put function
export function put(url, data) {
    return fetch(`${BASE_HOST}${url}`, {
        ...defaultOptions,
        method: 'PUT',
        headers: {
            ...defaultOptions.headers,
            Authorization: `Bearer ${window.localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
    })
    .then((res) => {
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
    })
    .then((data) => {
        if (data.error) {
            throw new Error(data.error);
        }
        return data;
    })
    .catch((err) => {
        message.error(err.message);
        throw err;
    });
}

// fetch game by id
export function fetchGameById(gameId, callback) {
    return get('/admin/games')
        .then((response) => {
            // 确保 response.games 存在且是数组
            const games = response && response.games && Array.isArray(response.games) 
                ? response.games 
                : [];
                
            const game = games.find((g) => g.id === parseInt(gameId));
            if (game) {
                callback(game);
                return game;
            } else {
                message.error('Game not found');
                throw new Error('Game not found');
            }
        })
        .catch((err) => {
            // 错误消息已经在 get 方法中显示，这里不需要重复
            if (err.message !== 'Game not found') {
                message.error('Failed to fetch game');
            }
            throw err;
        });
}