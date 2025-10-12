```javascript
(async function(){
  const listEl = document.getElementById('events-list');
  const totalEl = document.getElementById('total-events');
  const todayEl = document.getElementById('events-today');
  const weekEl = document.getElementById('events-week');
  const confirmedEl = document.getElementById('events-confirmed');

  // SUPABASE config: public/config.js (copie config.example.js -> config.js e preencha)
  const SUPABASE_URL = window.SUPABASE_URL || null;
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || null;

  async function fetchEvents() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      // fallback: dados de exemplo
      return [
        {
          id: '1',
          title: 'Evento de Exemplo',
          event_date: new Date().toISOString(),
          status: 'confirmed',
          event_djs: [{ id:'dj1', fee:150.00, dj:{ id:'dj1', name:'DJ Suzy' } }]
        }
      ];
    }

    const url = `${SUPABASE_URL.replace(/\/$/,'')}/rest/v1/events_with_djs?select=*&order=event_date.desc`;
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Accept': 'application/json'
    };

    try {
      const res = await fetch(url, { headers, method: 'GET' });
      if (!res.ok) {
        const bodyText = await res.text();
        console.error('Supabase REST error', res.status, bodyText);
        return [];
      }
      return await res.json();
    } catch(err){
      console.error('fetchEvents error', err);
      return [];
    }
  }

  function renderEvents(items){
    listEl.innerHTML = '';
    if (!items || items.length === 0){
      listEl.innerHTML = '<div class="card">Nenhum evento encontrado.</div>';
      totalEl.textContent = '0';
      todayEl.textContent = '0';
      weekEl.textContent = '0';
      confirmedEl.textContent = '0';
      return;
    }

    const now = new Date();
    let total = items.length, today=0, week=0, confirmed=0;
    items.forEach(ev=>{
      const d = new Date(ev.event_date);
      const diffDays = Math.floor((d - now) / (1000*60*60*24));
      if (d.toDateString() === now.toDateString()) today++;
      if (diffDays >=0 && diffDays <=6) week++;
      if (ev.status === 'confirmed') confirmed++;

      const el = document.createElement('div');
      el.className = 'event-row';
      el.innerHTML = `
        <div class="event-main">
          <div>
            <div class="event-title">${escapeHtml(ev.title || ev.name || 'Evento sem título')}</div>
            <div class="event-meta">${(new Date(ev.event_date)).toLocaleString()} • ${ev.event_djs?.length || 0} DJs</div>
          </div>
        </div>
        <div class="event-actions">
          <div class="dj-badge">${(ev.event_djs && ev.event_djs[0] && ev.event_djs[0].dj?.name) || '—'}</div>
        </div>
      `;
      listEl.appendChild(el);
    });

    totalEl.textContent = String(total);
    todayEl.textContent = String(today);
    weekEl.textContent = String(week);
    confirmedEl.textContent = String(confirmed);
  }

  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m]); }

  const items = await fetchEvents();
  renderEvents(items);

  // Busca simples (debounce)
  const input = document.getElementById('search-input');
  let to;
  input && input.addEventListener('input', (e)=>{
    clearTimeout(to);
    to = setTimeout(()=> {
      const q = e.target.value.toLowerCase();
      const filtered = items.filter(it => (it.title||it.name||'').toLowerCase().includes(q) || (it.event_djs && it.event_djs.some(ed => (ed.dj?.name||'').toLowerCase().includes(q))));
      renderEvents(filtered);
    }, 250);
  });

})();
```