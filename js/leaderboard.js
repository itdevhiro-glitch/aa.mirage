import {loadUsers,renderRows} from './app.js';
const users = await loadUsers();
renderRows(document.querySelector('#topQuest'), users, 'quest', 10);
renderRows(document.querySelector('#topTier'), users, 'tier', 10);
renderRows(document.querySelector('#topSpina'), users, 'spina', 10);
