import {loadUsers,renderRows} from './app.js';
const users = await loadUsers();
document.querySelector('[data-count="members"]').textContent = users.length.toLocaleString('id-ID');
document.querySelector('[data-count="spina"]').textContent = users.reduce((a,u)=>a+u.spina,0).toLocaleString('id-ID');
document.querySelector('[data-count="quest"]').textContent = users.reduce((a,u)=>a+u.questClear,0).toLocaleString('id-ID');
renderRows(document.querySelector('#topQuest'), users, 'quest', 5);
renderRows(document.querySelector('#topTier'), users, 'tier', 5);
renderRows(document.querySelector('#topSpina'), users, 'spina', 5);
