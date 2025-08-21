// Simplified app core with state and rendering
let data = JSON.parse(localStorage.getItem('bnb_state')||'{"units":[],"bookings":[],"expenses":[],"settings":{"currency":"USD"}}');

function save(){ localStorage.setItem('bnb_state', JSON.stringify(data)); updateConflictBadge(); }

function uid(){ return Math.random().toString(36).slice(2); }

function unitName(id){ let u=data.units.find(x=>x.id===id); return u?u.name:"?"; }

// --- globals & helpers (outside DOMContentLoaded) ---
let sidebarVisible = true;     // track sidebar
let dirty = false;             // track unsaved changes

function markClean(){ dirty = false; }
function markDirty(){ dirty = true; }

// lightweight toast for this simplified file
function toast(msg){ try{ alert(msg); }catch(_){} }

// --- init once the DOM is ready ---
document.addEventListener('DOMContentLoaded', ()=>{
  renderSidebar();
  renderCalendar();

  const $ = id => document.getElementById(id);

  $('toggleUnits') && ($('toggleUnits').onclick = ()=>{
    sidebarVisible = !sidebarVisible;
    const sb = document.getElementById('sidebar');
    if (sb) sb.style.display = sidebarVisible ? 'block' : 'none';
  });

  $('navCalendar')  && ($('navCalendar').onclick  = ()=>renderCalendar());
  $('navExpenses')  && ($('navExpenses').onclick  = ()=>renderExpenses());
  $('navSettings')  && ($('navSettings').onclick  = ()=>renderSettings());
  $('viewConflicts')&& ($('viewConflicts').onclick= ()=>showConflicts());
  $('syncAll')      && ($('syncAll').onclick      = ()=>syncAll());

  // 🔥 Save Changes button
  $('saveBtn') && ($('saveBtn').onclick = ()=>{
    save();
    markClean();
    toast('Changes saved ✅');
  });

  // (optional) wire export/import only if you have these helpers defined
  // $('exportBtn') && ($('exportBtn').onclick = ()=>exportData());
  // $('importBtn') && ($('importBtn').onclick = ()=>$('importFile').click());
  // $('importFile') && ($('importFile').onchange = importData);

  updateConflictBadge();
});

// warn if unsaved changes
window.addEventListener('beforeunload', (e)=>{
  if (dirty) { e.preventDefault(); e.returnValue = ''; }
});


function renderSidebar(){
  const sb=document.getElementById('sidebar');
  sb.innerHTML='<button onclick="addUnit()">+ Add Unit</button>';
  data.units.forEach(u=>{
    sb.innerHTML+=`<div><b>${u.name}</b><br>
      <button onclick="editUnit('${u.id}')">Edit</button>
      <button onclick="deleteUnit('${u.id}')">Del</button>
      <button onclick="syncUnit('${u.id}')">Sync</button></div>`;
  });
}

function addUnit(){
  const name=prompt("Unit name?");
  if(!name) return;
  data.units.push({id:uid(),name,ical:"",rate:0});
  save(); renderSidebar();
}

function editUnit(id){
  let u=data.units.find(x=>x.id===id);
  const name=prompt("Edit name",u.name)||u.name;
  const rate=parseFloat(prompt("Nightly rate",u.rate)||u.rate);
  u.name=name; u.rate=isNaN(rate)?0:rate;
  save(); renderSidebar();
}
function deleteUnit(id){ if(confirm("Delete unit?")){ data.units=data.units.filter(x=>x.id!==id); save(); renderSidebar(); } }

// --- Calendar ---
function renderCalendar(){
  const v=document.getElementById('view');
  v.innerHTML='<h2>Bookings</h2>';
  v.innerHTML+='<button onclick="addBooking()">+ Add Booking</button>';
  const rows=data.bookings.map(b=>`<tr><td>${unitName(b.unitId)}</td><td>${b.guest}</td><td>${b.checkIn}</td><td>${b.checkOut}</td><td>${b.status}</td><td>${b.source||''}</td></tr>`).join('');
  v.innerHTML+=`<table><tr><th>Unit</th><th>Guest</th><th>In</</th><th>Out</th><th>Status</th><th>Source</th></tr>${rows}</table>`;
}

function addBooking(){
  if(data.units.length==0){alert("Add a unit first"); return;}
  const unitId=data.units[0].id;
  const guest=prompt("Guest name?");
  const inDate=prompt("Check-in date (YYYY-MM-DD)");
  const outDate=prompt("Check-out date (YYYY-MM-DD)");
  if(!guest||!inDate||!outDate) return;
  const conflicts=findOverlaps(unitId,inDate,outDate);
  if(conflicts.length){ if(!confirm("Overlap! Save anyway?")) return; logConflict({id:'temp',unitId,checkIn:inDate,checkOut:outDate},conflicts,'overlap-manual'); }
  data.bookings.push({id:uid(),unitId,guest,checkIn:inDate,checkOut:outDate,status:'booked',source:'manual'});
  save(); renderCalendar();
}

// Overlap + conflicts
function rangesOverlap(aStart,aEnd,bStart,bEnd){ return (aStart<bEnd)&&(bStart<aEnd); }
function findOverlaps(unitId,checkIn,checkOut,excludeId=null){
  return data.bookings.filter(b=>b.unitId===unitId&&(!excludeId||b.id!==excludeId)&&rangesOverlap(checkIn,checkOut,b.checkIn,b.checkOut));
}
function logConflict(nb,conf,reason){ data.conflicts=data.conflicts||[]; data.conflicts.push({id:uid(),unitId:nb.unitId,newId:nb.id,reason,existingIds:conf.map(x=>x.id)}); save(); }
function updateConflictBadge(){ const n=(data.conflicts||[]).length; const el=document.getElementById('confCount'); if(el) el.textContent=n; }
function showConflicts(){ if(!data.conflicts||!data.conflicts.length){alert("No conflicts"); return;} alert("Conflicts: "+JSON.stringify(data.conflicts,null,2)); }

// --- Expenses ---
function renderExpenses(){
  const v=document.getElementById('view');
  const unitOpts=`<option value="">General</option>`+data.units.map(u=>`<option value="${u.id}">${u.name}</option>`).join('');
  v.innerHTML=`<h2>Expenses</h2>
  <div><select id="exUnit">${unitOpts}</select>
  <input id="exDate" type="date" value="${new Date().toISOString().slice(0,10)}"/>
  <input id="exDesc" placeholder="Description"/>
  <input id="exAmt" type="number" placeholder="Amount"/>
  <button onclick="addExpense()">+ Add</button></div>`;
  const rows=data.expenses.map(x=>`<tr><td>${x.date}</td><td>${x.unitId?unitName(x.unitId):'General'}</td><td>${x.desc||''}</td><td>${x.amt}</td></tr>`).join('');
  v.innerHTML+=`<table><tr><th>Date</th><th>Unit</th><th>Desc</th><th>Amt</th></tr>${rows}</table>`;
}
function addExpense(){ const unitId=document.getElementById('exUnit').value||null; const date=document.getElementById('exDate').value; const desc=document.getElementById('exDesc').value; const amt=parseFloat(document.getElementById('exAmt').value); if(!amt){alert("Enter amount"); return;} data.expenses.push({id:uid(),unitId,date,desc,amt}); save(); renderExpenses(); }

// --- Settings ---
function renderSettings(){
  const v=document.getElementById('view');
  v.innerHTML=`<h2>Settings</h2>
  Currency: <select id="setCurr">
    <option value="USD">USD</option>
    <option value="EUR">EUR</option>
    <option value="SEK">SEK</option>
    <option value="GBP">GBP</option>
    <option value="ZAR">ZAR</option>
  </select>`;
  document.getElementById('setCurr').value=data.settings.currency;
  document.getElementById('setCurr').onchange=e=>{ data.settings.currency=e.target.value; save(); };
}

// --- Sync (stub) ---
function syncUnit(id){ alert("Would fetch iCal for unit "+unitName(id)); }
function syncAll(){ alert("Would sync all units"); }
