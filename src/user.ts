import * as tt from "telegram-typings";
import {existsSync, readFileSync, writeFileSync} from 'fs';

const USERS_PATH = process.env.USER_PATH || 'users.json';
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT || '60000', 10);

type UserId = number;

export interface User {
  id: UserId;
  firstName: string;
  lastName: string;
  username: string;
  lastRequest: Date;
}

interface Users<T> {
  [key: number]: T;
}

export const readUsers = (): Users<User> => {
  if (!existsSync(USERS_PATH)) {
    writeFileSync(USERS_PATH, '');
  }

  const file = readFileSync(USERS_PATH).toString();
  if (file.length) {
    return JSON.parse(file);
  }
  return {};
}

export const writeUser = (user: User): void => {
  const users = readUsers();
  users[user.id] = user;
  writeFileSync(USERS_PATH, JSON.stringify(users));
}

export const checkUser = (chatData: tt.Chat): boolean => {
  const {id, first_name, last_name, username } = chatData;
  const user = readUsers()[id];
  if (user) {
    if (new Date().getTime() - new Date(user.lastRequest).getTime() < REQUEST_TIMEOUT) {
      return false;
    }
  }

  writeUser({
    id,
    firstName: first_name || 'NO_FIRSTNAME',
    lastName: last_name || 'NO_LASTNAME',
    username: username || 'NO_USERNAME',
    lastRequest: new Date(),
  })

  return true;
};

export const getDeclineText = (): string => {
  const variants = [
    'Idi nahuy',
    'Poshel nahuy',
    'Ti zaebal'
  ];
  return variants[Math.floor(Math.random() * (variants.length - 0) + 0)]
      + ' by timeout';
}
