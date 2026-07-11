function roleColor(role){
  const map = {
    quality:'#ff8a97',
    easy:'#7fe0cc',
    steady:'#9dbdff',
    long:'#FFB300',
    rest:'#8a8a8a',
    race:'#ff6b7a',
    strength:'#c9b3ff',
    timetrial:'#ff9cab'
  };
  return map[role] || '#8a8a8a';
}

function shortTitle(s){
  if(!s) return '';
  if(s.role==='race') return 'RACE DAY';
  if(s.role==='rest') return 'Rest';
  if(s.role==='strength') return 'Strength';
  return (s.title || s.role || '')
    .replace(' (cutback week)','')
    .replace(' (cutback)','')
    .replace(' (tapering)','');
}

function isLogged(dateISO){
  return sessions.some(s=>s.date===dateISO);
}

function sessionsForDate(dateISO){
  return sessions
    .map((s,i)=>({...s,_i:i}))
    .filter(s=>s.date===dateISO)
    .sort((a,b)=>(a.role||'').localeCompare(b.role||''));
}

function latestSessionForDate(dateISO){
  const arr = sessionsForDate(dateISO);
  return arr.length ? arr[arr.length-1] : null;
}

function hasStrengthLogged(dateISO){
  return sessionsForDate(dateISO).some(s=>s.role==='strength');
}

function formatSessionSummary(s){
  if(!s) return '';

  if(s.role==='strength'){
    const exCount = Array.isArray(s.exercises) ? s.exercises.length : 0;
    return s.completed
      ? `Gym${exCount ? ` · ${exCount} exercises` : ''}${s.notes ? ' · notes saved' : ''}`
      : 'Gym missed';
  }

  return s.completed
    ? `${s.role}${s.distanceKm ? ` · ${s.distanceKm}km` : ''}${s.durationSec ? ` · ${fmtHMS(s.durationSec)}` : ''}${s.notes ? ' · notes saved' : ''}`
    : `${s.role} missed`;
}

function formatSessionSummaryShort(s){
  if(!s) return '';

  if(s.role==='strength'){
    const exCount = Array.isArray(s.exercises) ? s.exercises.length : 0;
    return s.completed ? `Gym${exCount ? ` · ${exCount} ex` : ''}` : 'Gym missed';
  }

  if(!s.completed) return `${s.role} missed`;
  return `${s.role}${s.distanceKm ? ` · ${s.distanceKm}k` : ''}`;
}

function renderStrengthInputs(existing){
  const data = existing && Array.isArray(existing.exercises) && existing.exercises.length
    ? existing.exercises
    : defaultStrengthExercises();

  const focusText = existing && existing.strengthFocusText ? existing.strengthFocusText : '';
  const mobility = existing && existing.mobility ? existing.mobility : '';

  return `
    <div id="strengthFields">
      <label>Strength session focus</label>
      <input id="strengthFocusText" type="text" placeholder="e.g. Lower body strength + calves" value="${escapeHtml(focusText)}">

      <label>Exercises</label>
      <div id="exerciseList">
        ${data.map((ex,idx)=>renderExerciseRow(ex, idx)).join('')}
      </div>

      <div class="btn-row">
        <button type="button" class="btn secondary" onclick="addExerciseRow()">+ Add exercise</button>
      </div>

      <label>Mobility / stretches</label>
      <textarea id="strengthMobility" rows="2" placeholder="e.g. hip flexor stretch, couch stretch, calves, hamstrings">${escapeHtml(mobility)}</textarea>
    </div>
  `;
}

function renderExerciseRow(ex, idx){
  return `
    <div class="grid2 exercise-row" data-idx="${idx}" style="margin-top:8px;">
      <div><input class="ex-name" type="text" placeholder="Exercise" value="${escapeHtml(ex.name || '')}"></div>
      <div style="display:flex;gap:8px;">
        <input class="ex-sets" type="text" placeholder="Sets" value="${escapeHtml(ex.sets || '')}">
        <input class="ex-reps" type="text" placeholder="Reps" value="${escapeHtml(ex.reps || '')}">
        <input class="ex-weight" type="text" placeholder="Weight" value="${escapeHtml(ex.weight || '')}">
      </div>
    </div>
  `;
}

function renderChart(){
  const today = toDate(todayISO());
  const weeks = [];

  for(let i=7;i>=0;i--){
    const wkStart = addWeeks(mondayOf(today), -i);
    const wkEnd = addWeeks(wkStart,1);

    const km = sessions.filter(s=>{
      const d = toDate(s.date);
      return d>=wkStart &&
        d<wkEnd &&
        s.completed &&
        s.distanceKm &&
        ['quality','easy','steady','long','race','timetrial'].includes(s.role);
    }).reduce((a,s)=>a+s.distanceKm,0);

    weeks.push({label: fmtDateHuman(wkStart), km: Math.round(km)});
  }

  const max = Math.max(1, ...weeks.map(w=>w.km));

  return `<div class="chart">${weeks.map(w=>`
    <div class="bar-wrap">
      <div class="bar" style="height:${Math.max(2,(w.km/max)*100)}%"></div>
      <div class="bar-lbl">${w.km||''}</div>
    </div>`).join('')}</div>
    <div class="hint">Weekly logged running distance, last 8 weeks (km)</div>`;
}

function renderHistory(){
  const recent = sessions
    .map((s,i)=>({...s,_i:i}))
    .sort((a,b)=>b.date.localeCompare(a.date))
    .slice(0,12);

  if(!recent.length){
    return `<div class="empty">No sessions logged yet — use the buttons on today's card above.</div>`;
  }

  return recent.map(s=>{
    let detail = '';

    if(s.role==='strength'){
      const count = Array.isArray(s.exercises) ? s.exercises.length : 0;
      detail = s.completed
        ? `gym${count ? ` · ${count} exercises` : ''}${s.rpe ? ` · RPE ${s.rpe}` : ''}`
        : 'gym missed';
    } else {
      detail = s.completed
        ? `${s.distanceKm ? s.distanceKm+'km' : 'completed'}${s.rpe ? ' · RPE '+s.rpe : ''}${s.durationSec ? ' · '+fmtHMS(s.durationSec) : ''}`
        : 'missed';
    }

    return `
      <div class="log-row">
        <div>
          <span class="log-role" style="background:${roleColor(s.role)}22;color:${roleColor(s.role)}">${escapeHtml(s.role)}</span>
          <span style="margin-left:8px;">${escapeHtml(detail)}</span>
          ${s.notes ? `<div class="hint" style="margin-top:4px;">${escapeHtml(s.notes)}</div>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="log-meta">${escapeHtml(s.date)}</div>
          <button class="del-btn" onclick="deleteSession(${s._i})" aria-label="Delete entry">×</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderStrengthCard(strength){
  if(!strength){
    return `
      <div class="card">
        <h2>Strength</h2>
        <div class="today-role role-rest">No gym planned</div>
        <div class="today-detail">Today is not one of your configured strength days. You can still do light mobility, calves, or core if you feel fresh.</div>
      </div>
    `;
  }

  return `
    <div class="card">
      <h2>Strength</h2>
      <span class="today-role role-strength">Strength</span>
      <div class="today-title" style="font-size:20px;">${escapeHtml(strength.title)}</div>
      <div class="today-detail">${escapeHtml(strength.detail)}</div>
      <div class="pace-chip">${escapeHtml(strength.load)} <small>load</small></div>
      <div class="hint">Aim to leave 1–3 reps in reserve and avoid heavy soreness before your key run and long run.</div>
    </div>
  `;
}

function renderChatThread(){
  if(!chatHistory.length){
    return `<div class="hint">Ask about missed sessions, fatigue, travel, soreness, strength work, or whether to progress the plan.</div>`;
  }

  return chatHistory.map(m => `
    <div style="margin-bottom:10px;">
      <div style="font-size:11px;color:${m.role==='user' ? 'var(--amber)' : 'var(--teal)'};text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;">
        ${escapeHtml(m.role === 'user' ? 'You' : 'Coach')}
      </div>
      <div>${escapeHtml(m.text)}</div>
    </div>
  `).join('');
}

function renderUpcomingEvents(){
  const upcoming = getUpcomingEvents();

  if(!upcoming.length){
    return `<div class="empty">No upcoming events added yet.</div>`;
  }

  return upcoming.map(e => {
    const dist = eventDistanceKm(e);
    const hm = secondsToHoursMinutes(e.goalSeconds || 0);

    return `
      <button
        type="button"
        class="event-row-btn"
        data-event-id="${escapeHtml(String(e.id))}"
      >
        <div class="log-row" style="border-bottom:none;padding:0;">
          <div>
            <span class="log-role" style="background:${e.priority==='A' ? 'rgba(215,38,61,.22)' : e.priority==='B' ? 'rgba(255,179,0,.18)' : 'rgba(255,255,255,.08)'};color:${e.priority==='A' ? '#ff9cab' : e.priority==='B' ? 'var(--amber)' : 'var(--chalk-dim)'}">${escapeHtml(e.priority)}</span>
            <span style="margin-left:8px;">${escapeHtml(e.name)}</span>
            <div class="hint" style="margin-top:4px;">
              ${dist ? `${dist}km` : ''}${e.goalSeconds ? ` · target ${hm.hours}h ${hm.minutes}m` : ''} · ${escapeHtml(e.date)}
            </div>
          </div>
          <div class="log-meta">View</div>
        </div>
      </button>
    `;
  }).join('');
}
function renderCalendarMonths(){
  const start = startOfMonth(toDate(profile.startDate));
  const endEvent = getUpcomingEvents().length ? getUpcomingEvents()[getUpcomingEvents().length - 1] : null;
  const end = endEvent ? startOfMonth(toDate(endEvent.date)) : startOfMonth(addMonths(new Date(), 6));
  const current = currentCalendarMonth();

  const atStart = current.getFullYear()===start.getFullYear() && current.getMonth()===start.getMonth();
  const atEnd = current.getFullYear()===end.getFullYear() && current.getMonth()===end.getMonth();

  return `
    <div class="btn-row" style="justify-content:space-between;align-items:center;margin-bottom:12px;">
      <button class="btn secondary" onclick="changeCalendarMonth(-1)" ${atStart?'disabled':''}>← Previous month</button>
      <div class="today-role role-steady" style="margin:0;">${escapeHtml(monthName(current))}</div>
      <button class="btn secondary" onclick="changeCalendarMonth(1)" ${atEnd?'disabled':''}>Next month →</button>
    </div>

    <div class="calendar-months">
      ${renderSingleMonth(current)}
    </div>

    <div class="legend">
      <span><i style="background:rgba(215,38,61,.16)"></i>Quality</span>
      <span><i style="background:rgba(63,167,150,.16)"></i>Easy</span>
      <span><i style="background:rgba(76,141,255,.16)"></i>Steady</span>
      <span><i style="background:rgba(255,179,0,.16)"></i>Long</span>
      <span><i style="background:rgba(139,92,246,.18)"></i>Strength</span>
      <span><i style="background:rgba(215,38,61,.30)"></i>Race</span>
    </div>
  `;
}

function renderSingleMonth(monthDate){
  const first = startOfMonth(monthDate);
  const firstGrid = mondayOf(first);
  const cells = [];
  const today = toDate(todayISO());
  const todayKey = todayISO();

  for(let i=0;i<42;i++){
    const d = addDays(firstGrid, i);
    const iso = fmtISO(d);
    const out = d.getMonth() !== monthDate.getMonth();
    const plan = fullDayPlan(d);
    const run = plan.run;
    const strength = plan.strength;
    const logged = sessionsForDate(iso);
    const pastOrToday = iso <= todayKey;

    let items = '';

    if(logged.length){
      logged.forEach(s => {
        const cls = s.role==='strength' ? 'cal-strength' : `cal-run-${s.role || 'rest'}`;
        items += `<span class="cal-item ${cls}" title="${escapeHtml(formatSessionSummary(s) + (s.notes ? ' — ' + s.notes : ''))}">
          ${escapeHtml(formatSessionSummaryShort(s))}
        </span>`;
      });
    } else {
      if(run){
        const cls = `cal-run-${run.role || 'rest'}`;
        const label = run.role==='rest'
          ? 'Rest'
          : run.role==='race'
            ? 'Race'
            : `${shortTitle(run)}${run.km ? ' ' + run.km + 'k' : ''}`;

        items += `<span class="cal-item ${cls}">${escapeHtml(label)}</span>`;
      }

      if(strength){
        items += `<span class="cal-item cal-strength">Gym</span>`;
      }
    }

    cells.push(`
    <div
        class="cal-day ${out?'out':''} ${sameDay(d,today)?'today':''} clickable"
        onclick="${pastOrToday ? `openLogModal('${iso}')` : `openSessionDetails('${iso}')`}"
      >
        <div class="cal-num">${d.getDate()}</div>
        ${items}
      </div>
    `);
  }

  return `
    <div class="month-card">
      <div class="month-grid">
        <div class="cal-head">Mon</div>
        <div class="cal-head">Tue</div>
        <div class="cal-head">Wed</div>
        <div class="cal-head">Thu</div>
        <div class="cal-head">Fri</div>
        <div class="cal-head">Sat</div>
        <div class="cal-head">Sun</div>
        ${cells.join('')}
      </div>
    </div>
  `;
}

function render(){
  const app = document.getElementById('app');
  const today = toDate(todayISO());
  const todayKey = todayISO();
  const b = phaseBoundaries();

  let warn = '';
  if(getUpcomingEvents().length === 0){
    warn = `<div class="banner">You have no events set up yet. Add an event to build a targeted plan.</div>`;
  }

  const nextEvent = getNextEvent(today);
  const primaryEvent = getPrimaryEvent(today);

  const daysToNext = nextEvent ? daysBetween(today, toDate(nextEvent.date)) : null;
  const daysToPrimary = primaryEvent ? daysBetween(today, toDate(primaryEvent.date)) : null;

  const ph = phaseForDate(today);
  const phaseMetaKey = ph.key === 'build'
    ? ((b.distanceKm || KM_MARATHON) <= KM_HALF ? 'halfbuild' : 'marathonbuild')
    : ph.key;

  const meta = PHASE_META[phaseMetaKey] || PHASE_META[ph.key] || {name:ph.key, desc:''};

  const todayPlan = fullDayPlan(today);
  const todayRun = todayPlan.run;
  const todayStrength = todayPlan.strength;
  const roleClass = 'role-'+(todayRun.role || 'rest');

  const monday = mondayOf(today);
  let strip = '';

  for(let i=0;i<7;i++){
    const d = addDays(monday, i);
    const iso = fmtISO(d);
    const plan = fullDayPlan(d);
    const s = plan.run;
    const logged = sessionsForDate(iso);

    const isToday = iso === todayKey;
    const isPastOrToday = iso <= todayKey;

    const distLabel = s.km ? `${s.km}km` : '';
    const extra = plan.strength ? ' + gym' : '';

    let summary = '';
    if(logged.length){
      summary = logged.map(x => formatSessionSummaryShort(x)).join(' · ');
    }

strip += `<div class="day-cell ${isToday?'today':''} clickable" onclick="${isPastOrToday ? `openLogModal('${iso}')` : `openSessionDetails('${iso}')`}">
      <div class="dname">${dayName(d)} ${d.getDate()}${logged.length?' <span class="logged-dot">●</span>':''}</div>
      <div class="drole" style="color:${roleColor(s.role)}">${escapeHtml(shortTitle(s))}${extra}</div>
      <div class="ddist">${escapeHtml(summary || distLabel)}</div>
    </div>`;
  }

  const meal = mealPlanFor(today, todayRun.role || 'rest', !!todayStrength);
  const outline = dayOutline(todayRun.role || 'rest', !!todayStrength);
  const paceLabel = paceLabelForRole(todayRun.role);

  app.innerHTML = `
    ${warn}
    <div class="topbar">
      <div>
        <div class="brand">PACE<span>MAKER</span></div>
        <div class="tagline">Your adaptive marathon coach</div>
      </div>
      <button class="gear" onclick="openSettings()">Settings</button>
    </div>

    <div class="board">
      <div class="board-row">
        <div class="clock ${nextEvent && daysToNext < 0 ? 'past' : ''}">
          <div class="clock-label">${nextEvent ? 'Days to next event' : 'Next event'}</div>
          <div class="clock-digits mono">${nextEvent ? String(Math.max(daysToNext,0)).padStart(3,'0') : '---'}</div>
          <div class="clock-sub">${nextEvent ? `${escapeHtml(nextEvent.name)} · ${fmtDateHuman(toDate(nextEvent.date))}` : 'No event scheduled'}</div>
        </div>
        <div class="clock">
          <div class="clock-label">${primaryEvent ? 'Days to primary goal' : 'Primary goal'}</div>
          <div class="clock-digits mono">${primaryEvent ? String(Math.max(daysToPrimary,0)).padStart(3,'0') : '---'}</div>
          <div class="clock-sub">${primaryEvent ? `${escapeHtml(primaryEvent.name)} · ${fmtDateHuman(toDate(primaryEvent.date))}` : 'No primary event selected'}</div>
        </div>
      </div>
      <div class="phase-strip">
        <div class="phase-dot"></div>
        <div>
          <div class="phase-name">${escapeHtml(meta.name)} — week ${ph.idx}</div>
          <div class="phase-desc">${escapeHtml(meta.desc)}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Upcoming events</h2>
      <div class="btn-row">
        <button class="btn secondary" onclick="openEventEditor()">Add event</button>
      </div>
      <div style="margin-top:10px;">
        ${renderUpcomingEvents()}
      </div>
    </div>

    <div class="card">
      <h2>Today · ${today.toLocaleDateString('en-GB',{weekday:'long', day:'numeric', month:'long'})}</h2>
      <span class="today-role ${roleClass}">${escapeHtml(todayRun.role || 'rest')}</span>
      <div class="today-title">${escapeHtml(todayRun.title)}</div>
      <div class="today-detail">${escapeHtml(todayRun.detail)}</div>
      ${todayRun.km ? `<div class="pace-chip">${todayRun.km} km <small>target</small></div>` : ''}
      ${paceLabel ? `<div class="pace-chip">${escapeHtml(paceLabel)} <small>pace</small></div>` : ''}
      ${todayRun.role && todayRun.role!=='rest' ? `
      <div class="btn-row">
        <button class="btn" onclick="showEffortPicker()">✓ Completed as planned</button>
        <button class="btn secondary" onclick="quickLog('${fmtISO(today)}', false, null)">✕ Skipped it</button>
        <button class="btn secondary" onclick="openLogModal('${fmtISO(today)}')">✏ Log details</button>
      </div>
      <div id="effortPicker"></div>` : `
      <div class="btn-row">
        <button class="btn secondary" onclick="openLogModal('${fmtISO(today)}')">✏ Log day</button>
      </div>`}
      ${isLogged(fmtISO(today)) ? `<div class="hint">✓ Already logged today. Use "Log details" to add another entry.</div>` : ''}
      ${profile.loadMultiplier!==1 ? `<div class="hint">Load adjusted to ${Math.round(profile.loadMultiplier*100)}% of plan based on recent sessions.</div>` : ''}
    </div>

    ${renderStrengthCard(todayStrength)}

    <div class="card">
      <h2>This week</h2>
      <div class="hint" style="margin-bottom:10px;">Tap any past day to log or backfill it.</div>
      <div class="week-strip">${strip}</div>
    </div>

    <div class="card">
      <h2>Fuel for today <span class="accent">·</span> ${escapeHtml(todayRun.role || 'rest')}</h2>
      ${meal.pre!=='—' ? `<div class="meal-block pre"><div class="meal-label">Before</div><div class="meal-text">${escapeHtml(meal.pre)}</div></div>` : ''}
      <div class="meal-block post"><div class="meal-label">After</div><div class="meal-text">${escapeHtml(meal.post)}</div></div>
      <div class="hint">${escapeHtml(meal.timing)}</div>
      <div class="day-outline">
        ${outline.map(r=>`<div class="row"><span class="t">${escapeHtml(r[0])}</span><span>${escapeHtml(r[1])}</span></div>`).join('')}
      </div>
    </div>

    <div class="card">
      <h2>Ask your coach</h2>
      <div id="coachOut" class="coach-note">Get a personalised read on how your training is going — this will use your secure backend endpoint when deployed.</div>
      <div id="coachMeta" class="coach-meta"></div>
      <div class="btn-row">
        <button class="btn secondary" id="coachBtn" onclick="askCoach()">Get coaching notes</button>
        <button class="btn secondary" id="adaptBtn" onclick="requestAdaptivePlan()">Adapt upcoming plan</button>
        <button class="btn secondary" onclick="clearAdaptations()">Clear AI adaptations</button>
      </div>
    </div>

    <div class="card">
      <h2>Coach chat</h2>
      <div id="chatThread" class="coach-note" style="max-height:260px;overflow:auto;background:var(--ink);padding:12px;border-radius:8px;border:1px solid var(--line);">
        ${renderChatThread()}
      </div>
      <label>Message your coach</label>
      <textarea id="chatInput" rows="3" placeholder="Example: I'll miss Tuesday and Thursday next week because I'm travelling. Can you adjust the plan?"></textarea>
      <div class="btn-row">
        <button class="btn secondary" id="chatSendBtn" onclick="sendCoachChat()">Send</button>
        ${pendingChatAdaptations.length ? `<button class="btn" onclick="applyPendingChatAdaptations()">Apply suggested changes</button>` : ''}
        ${pendingChatAdaptations.length ? `<button class="btn secondary" onclick="discardPendingChatAdaptations()">Discard suggestions</button>` : ''}
      </div>
    </div>

    <div class="card">
      <h2>Progress</h2>
      ${renderChart()}
      <div style="margin-top:14px;">${renderHistory()}</div>
    </div>

    <div class="card">
      <h2>Plan calendar</h2>
      <div class="hint" style="margin-bottom:10px;">Month-by-month view of your runs and gym sessions.</div>
      ${renderCalendarMonths()}
    </div>

    <footer>Built for flexible event-based training. Plans adapt weekly based on what you log.</footer>
  `;

  const cached = loadLocal(KEYS.coach);
  if(cached){
    const out = document.getElementById('coachOut');
    const metaEl = document.getElementById('coachMeta');
    if(out) out.textContent = cached.text;
    if(metaEl) metaEl.textContent = 'Last updated ' + new Date(cached.ts).toLocaleString();
  }
}
