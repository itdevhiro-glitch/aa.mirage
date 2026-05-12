import {loadUsers,rankValue,escapeHtml} from './app.js';
const users=(await loadUsers()).sort((a,b)=>rankValue(b.rank)-rankValue(a.rank)||b.questClear-a.questClear);
const body=document.querySelector('#memberRows');
body.innerHTML=users.length?users.map((u,i)=>`<div class="tableRow"><div class="pos">${i+1}</div><div><b>${escapeHtml(u.name)}</b><div class="meta">${escapeHtml(u.id)}</div></div><div class="hideM">Rank ${escapeHtml(u.rank)}</div><div class="hideM">${u.questClear.toLocaleString('id-ID')} Clear</div><div>${u.spina.toLocaleString('id-ID')} Spina</div></div>`).join(''):`<div class="empty">Belum ada member yang terbaca.</div>`;
