/* ═══════════════════════════════════════════
   js/components/crops.js
═══════════════════════════════════════════ */
const CropManager = (() => {

  function render() {
    const el = document.getElementById('crops-list');
    if (!el) return;
    const crops = AppState.crops;

    if (!crops.length) {
      el.innerHTML = `<div class="empty-state">
        <div class="empty-icon"><svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M13 24V14M13 14C13 14 7.5 12 5 7.5c3 0 7.5 1.5 8 6.5zM13 14c0 0 5.5-1.5 8-6.5-3 0-7.5 1.5-8 6.5z" stroke="#43A047" stroke-width="1.8" stroke-linecap="round"/></svg></div>
        <div class="empty-text">No crops added yet</div>
        <div class="empty-sub">Add your first crop to get recommendations</div>
        <button class="btn btn-primary" onclick="UI.openSheet('sh-addcrop')">+ Add crop</button>
      </div>`;
      return;
    }

    el.innerHTML = crops.map((c, i) => {
      const sc = c.status === 'Healthy' ? 'pill-green' : c.status === 'Needs water' ? 'pill-amber' : 'pill-red';
      return `<div class="crop-card">
        <div class="crop-top">
          <div>
            <div class="crop-name">${c.name} — ${c.field}</div>
            <div class="crop-meta">${c.stage} · Day ${c.day} · ${c.area}ha · ${c.device || 'No device'}</div>
          </div>
          <div class="crop-btns">
            <span class="pill ${sc}">${c.status}</span>
            <button class="btn-icon" title="Irrigate" onclick="IrrigationController.openSheet(${i})">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5c0 0-5 5-5 8a5 5 0 0010 0c0-3-5-8-5-8z" stroke="#1E88E5" stroke-width="1.4" fill="none"/></svg>
            </button>
            <button class="btn-icon" title="Edit" onclick="CropManager.openEdit(${i})">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M10.5 2.5l2 2-7.5 7.5H3v-2L10.5 2.5z" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linejoin="round"/></svg>
            </button>
            <button class="btn-icon" title="Delete" onclick="CropManager.delete(${i})">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2.5 4h10M5 4V3h5v1M6 7v4M9 7v4M3.5 4l.5 8h7l.5-8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
        <div class="prog-row"><div class="prog-meta"><span>Water req.</span><span class="prog-val">${c.moisture}%</span></div><div class="prog-track"><div class="prog-fill f-blue" style="width:${c.moisture}%"></div></div></div>
        <div class="prog-row"><div class="prog-meta"><span>Pesticide</span><span class="prog-val">${c.pestLvl}%</span></div><div class="prog-track"><div class="prog-fill f-amber" style="width:${c.pestLvl}%"></div></div></div>
        <div class="prog-row" style="margin-bottom:0"><div class="prog-meta"><span>Nutrients</span><span class="prog-val">${c.nutrients}%</span></div><div class="prog-track"><div class="prog-fill f-green" style="width:${c.nutrients}%"></div></div></div>
        <div class="rec-row">
          <div class="rec-cell"><div class="rec-lbl">Water</div><div class="rec-val">${c.water}L/m²</div></div>
          <div class="rec-cell"><div class="rec-lbl">Pest.</div><div class="rec-val">${c.pest}mL/L</div></div>
          <div class="rec-cell" style="${c.status==='Needs water'?'background:var(--amber-bg);border-color:#FFCC80':''}">
            <div class="rec-lbl">Irrigate</div>
            <div class="rec-val" style="${c.status==='Needs water'?'color:var(--amber)':''}">${c.status==='Needs water'?'Now!':'6 hrs'}</div>
          </div>
          <div class="rec-cell"><div class="rec-lbl">N:P:K</div><div class="rec-val">4:2:3</div></div>
        </div>
      </div>`;
    }).join('');

    ChartManager.initSchedule(crops);
  }

  function save() {
    const name  = Helpers.required('fc-name', 'Crop name');
    const field = Helpers.required('fc-field', 'Field');
    if (!name || !field) return;

    AppState.crops.push({
      id:       Helpers.uid(),
      name, field,
      area:     parseFloat(document.getElementById('fc-area').value) || 1,
      stage:    document.getElementById('fc-stage').value,
      day:      1,
      device:   document.getElementById('fc-device').value || '',
      water:    parseFloat(document.getElementById('fc-water').value) || 10,
      pest:     parseFloat(document.getElementById('fc-pest').value) || 2,
      moisture: Math.floor(50 + Math.random() * 40),
      pestLvl:  Math.floor(30 + Math.random() * 50),
      nutrients:Math.floor(55 + Math.random() * 35),
      status:   'Healthy',
      planting: document.getElementById('fc-date').value || new Date().toISOString().slice(0, 10),
    });

    AppState.persist();
    UI.closeSheet('sh-addcrop');
    ['fc-name','fc-field','fc-area','fc-water','fc-pest'].forEach(id => document.getElementById(id).value = '');
    render();
    Helpers.toast(name + ' added', 'ok');
  }

  function openEdit(i) {
    const c = AppState.crops[i];
    document.getElementById('ec-idx').value   = i;
    document.getElementById('ec-name').value  = c.name;
    document.getElementById('ec-field').value = c.field;
    document.getElementById('ec-area').value  = c.area;
    document.getElementById('ec-stage').value = c.stage;
    document.getElementById('ec-water').value = c.water;
    document.getElementById('ec-pest').value  = c.pest;
    UI.openSheet('sh-editcrop');
  }

  function update() {
    const i     = parseInt(document.getElementById('ec-idx').value);
    const name  = Helpers.required('ec-name', 'Crop name');
    const field = Helpers.required('ec-field', 'Field');
    if (!name || !field) return;

    Object.assign(AppState.crops[i], {
      name, field,
      area:  parseFloat(document.getElementById('ec-area').value)  || AppState.crops[i].area,
      stage: document.getElementById('ec-stage').value,
      water: parseFloat(document.getElementById('ec-water').value) || AppState.crops[i].water,
      pest:  parseFloat(document.getElementById('ec-pest').value)  || AppState.crops[i].pest,
    });

    AppState.persist();
    UI.closeSheet('sh-editcrop');
    render();
    Helpers.toast('Crop updated', 'ok');
  }

  function deleteCrop(i) {
    if (!confirm('Delete ' + AppState.crops[i].name + '?')) return;
    AppState.crops.splice(i, 1);
    AppState.persist();
    render();
    Helpers.toast('Crop deleted');
  }

  return { render, save, openEdit, update, delete: deleteCrop };
})();
