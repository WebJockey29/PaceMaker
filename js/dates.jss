function localDateISO(d){
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function todayISO(){
  return localDateISO(new Date());
}

function toDate(iso){
  const [y,m,d] = iso.split('-').map(Number);
  return new Date(y, m-1, d, 12, 0, 0, 0);
}

function fmtISO(d){
  return localDateISO(d);
}

function addDays(d,n){
  const r = new Date(d);
  r.setDate(r.getDate()+n);
  return r;
}

function addWeeks(d,n){
  return addDays(d,n*7);
}

function addMonths(d,n){
  return new Date(d.getFullYear(), d.getMonth()+n, 1, 12, 0, 0, 0);
}

function startOfMonth(d){
  return new Date(d.getFullYear(), d.getMonth(), 1, 12, 0, 0, 0);
}

function monthName(d){
  return d.toLocaleDateString('en-GB',{month:'long', year:'numeric'});
}

function monthDiff(a,b){
  return (b.getFullYear()-a.getFullYear())*12 + (b.getMonth()-a.getMonth());
}

function mondayOf(d){
  const r = new Date(d);
  const day = r.getDay();
  const diff = (day===0 ? -6 : 1-day);
  r.setDate(r.getDate()+diff);
  r.setHours(12,0,0,0);
  return r;
}

function daysBetween(a,b){
  return Math.round((b-a)/86400000);
}

function sameDay(a,b){
  return fmtISO(a) === fmtISO(b);
}

function dayName(d){
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
}

function fmtDateHuman(d){
  return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
}

function weekdayIdx(d){
  const j = d.getDay();
  return j===0 ? 7 : j;
}

function dayOfYear(d){
  return Math.floor((d - new Date(d.getFullYear(),0,0))/86400000);
}

function currentCalendarMonth(){
  const start = startOfMonth(toDate(profile.startDate));
  const end = startOfMonth(toDate(profile.londonDate));
  let target = addMonths(start, calendarMonthOffset);
  if(target < start) target = start;
  if(target > end) target = end;
  return target;
}

function changeCalendarMonth(delta){
  const start = startOfMonth(toDate(profile.startDate));
  const end = startOfMonth(toDate(profile.londonDate));
  const current = currentCalendarMonth();
  let next = addMonths(current, delta);

  if(next < start) next = start;
  if(next > end) next = end;

  calendarMonthOffset = monthDiff(start, next);
  render();
}
