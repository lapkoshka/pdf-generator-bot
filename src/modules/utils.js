const USERS_PATH = 'users.json';
const fs = require('fs');

const readUsers = () => {
    const file = fs.readFileSync(USERS_PATH).toString();
    if (file.length) {
        return JSON.parse(file);
    }
    return {};
}

const writeUser = user => {
    const users = readUsers();
    users[user.id] = user;
    fs.writeFileSync(USERS_PATH, JSON.stringify(users));
}

const getIdiNahuyText = () => {
    return [
        'Idi nahuy',
        'Poshel nahuy',
        'Ti zaebal'
    ][Math.floor(Math.random() * (3 - 0) + 0)];
}

module.exports = {
    readUsers,
    writeUser,
    getIdiNahuyText
}