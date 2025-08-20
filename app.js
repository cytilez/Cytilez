
// KaelBnB App
const stateKey = 'kael_bnb_v1';

let state = JSON.parse(localStorage.getItem(stateKey) || '{"units":[],"bookings":[],"expenses":[],"settings":{"currency":"SEK"}}');

function saveState() {
  localStorage.setItem(stateKey, JSON.stringify(state));
}

function render() {
  const tabs = ['Master','Units','Bookings','Earnings','Expenses','Settings'];
  const nav = document.getElementById('tabs');
  nav.innerHTML = '';
  tabs.forEach(t => {
    const btn = document.createElement('button');
    btn.textContent = t;
    btn.onclick = () => showTab(t);
    nav.appendChild(btn);
  });
  showTab('Master');
}

function showTab(tab) {
  const content = document.getElementById('content');
  content.innerHTML = '';

  if (tab === 'Units') {
    const btn = document.createElement('button');
    btn.textContent = 'Add Unit';
    btn.onclick = () => { state.units.push({name:'Unit '+(state.units.length+1), ical:''}); saveState(); showTab('Units'); };
    content.appendChild(btn);
    state.units.forEach((u,i) => {
      const div = document.createElement('div');
      div.innerHTML = `<b>${u.name}</b>`;
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit'; editBtn.className='small';
      editBtn.onclick = () => {
        const name = prompt('Unit name', u.name);
        if (name) { u.name = name; saveState(); showTab('Units'); }
      };
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete'; delBtn.className='small';
      delBtn.onclick = () => { if (confirm('Delete unit?')) { state.units.splice(i,1); saveState(); showTab('Units'); } };
      const syncBtn = document.createElement('button');
      syncBtn.textContent = 'Sync'; syncBtn.className='small';
      syncBtn.onclick = () => syncUnit(u);
      div.appendChild(editBtn);
      div.appendChild(delBtn);
      div.appendChild(syncBtn);
      content.appendChild(div);
    });
    const syncAllBtn = document.createElement('button');
    syncAllBtn.textContent = 'Sync All Units';
    syncAllBtn.onclick = () => state.units.forEach(u => syncUnit(u));
    content.appendChild(syncAllBtn);
  }

  if (tab === 'Expenses') {
    const btn = document.createElement('button');
    btn.textContent = 'Add Expense';
    btn.onclick = () => {
      const desc = prompt('Expense description');
      const amount = prompt('Amount');
      if(desc && amount) { state.expenses.push({desc,amount}); saveState(); showTab('Expenses'); }
    };
    content.appendChild(btn);
    state.expenses.forEach(e => {
      const div = document.createElement('div');
      div.textContent = `${e.desc} - ${e.amount} ${state.settings.currency}`;
      content.appendChild(div);
    });
  }

  if (tab === 'Settings') {
    const backupBtn = document.createElement('button');
    backupBtn.textContent = 'Backup to GitHub';
    backupBtn.onclick = async () => {
      const res = await fetch('/.netlify/functions/push-data',{method:'POST',body:JSON.stringify(state)});
      alert(res.ok ? 'Backup saved' : 'Backup failed');
    };
    const restoreBtn = document.createElement('button');
    restoreBtn.textContent = 'Restore from GitHub';
    restoreBtn.onclick = async () => {
      const res = await fetch('/.netlify/functions/pull-data');
      if(res.ok) { const j=await res.json(); localStorage.setItem(stateKey, JSON.stringify(j)); location.reload(); }
      else alert('Restore failed');
    };
    content.appendChild(backupBtn);
    content.appendChild(restoreBtn);
  }
}

async function syncUnit(unit) {
  if (!unit.ical) { alert('No iCal URL set for this unit'); return; }
  const url = '/.netlify/functions/fetch-ical?url='+encodeURIComponent(unit.ical);
  const res = await fetch(url);
  alert(res.ok ? 'Fetched iCal OK' : 'Error fetching iCal');
}

render();
