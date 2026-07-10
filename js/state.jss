const KEYS = {
  profile:'pm_profile_v2',
  sessions:'pm_sessions_v2',
  coach:'pm_coach_cache_v2',
  adaptations:'pm_adaptations_v1',
  chat:'pm_chat_v1'
};

const PHASE_META = {
  base:{name:'Base Building', desc:'Rebuilding running consistency and aerobic engine.'},
  halfbuild:{name:'Half Marathon Build', desc:'Sharpening toward Copenhagen.'},
  recovery:{name:'Recovery', desc:'Easy running only — absorb the half marathon.'},
  marathonbase:{name:'Marathon Base', desc:'Rebuilding volume and endurance for London.'},
  marathonbuild:{name:'Marathon Build', desc:'Peak long runs and marathon-pace work.'},
  taper:{name:'Taper', desc:'Sharpen, rest, and arrive fresh.'},
  done:{name:'Race Complete', desc:'Well done.'}
};

const KM_MARATHON = 42.195;
const KM_HALF = 21.0975;
const KM_5K = 5;

const DEFAULT_PROFILE = {
  startDate: localDateISO(new Date()),
  copenhagenDate: '2026-09-20',
  copenhagenGoal: null,
  londonDate: '2027-04-25',
  goalMarathonSeconds: 4*3600,
  priorMarathonSeconds: 4*3600 + 58*60,
  trainingDays: [2,4,6,0],
  strengthDays: [1,5],
  dietaryPref: 'none',
  trainingTimeOfDay: 'morning',
  loadMultiplier: 1.0,
  lastAdaptedWeekKey: null,
  strengthFocus: 'balanced'
};

const MEAL_POOLS = {
  long: [
    {pre:'2–3 hrs before: porridge with banana and honey, or toast with peanut butter and a banana.', post:'Within 45 min: chocolate milk or a protein shake, followed by a proper meal within 2 hrs — e.g. chicken, rice, and roasted veg.'},
    {pre:'2–3 hrs before: bagel with jam, or overnight oats with berries.', post:'Within 45 min: a smoothie, then eggs on toast or a rice bowl within 2 hrs.'}
  ],
  quality: [
    {pre:'60–90 min before: toast with honey or a banana with a few dates.', post:'Within an hour: a balanced meal — salmon, sweet potato, and greens, or a chicken stir-fry.'},
    {pre:'60–90 min before: a small bowl of cereal or a banana.', post:'Within an hour: an omelette with toast, or a burrito bowl with rice and beans.'}
  ],
  steady: [
    {pre:'60 min before: a banana or a handful of dried fruit.', post:'Within 1–2 hrs: a balanced plate — protein, carbs, veg.'},
    {pre:'60 min before: toast with jam.', post:'Within 1–2 hrs: chicken and rice, or a hearty soup with bread.'}
  ],
  easy: [
    {pre:'Light snack optional — a banana or a few crackers if training first thing.', post:'Your next normal meal is fine — no rush, just don’t skip it.'},
    {pre:'Training fasted can be fine for a short easy run if that suits you.', post:'A balanced meal within a couple of hours — protein, carbs, veg.'}
  ],
  strength: [
    {pre:'60–90 min before: yoghurt with fruit, or toast with peanut butter.', post:'Prioritise protein after lifting — for example eggs and toast, Greek yoghurt with granola, or chicken and rice.'},
    {pre:'Have a normal mixed meal 2–3 hrs before, or a banana plus whey/yoghurt if short on time.', post:'Aim for a protein-rich meal within 1–2 hrs, with enough carbs if also running that day.'}
  ],
  rest: [
    {pre:'—', post:'No session today — keep meals balanced with a good protein source at each meal to support recovery and muscle retention.'}
  ],
  race: [
    {pre:'3 hrs before: your usual pre-long-run breakfast — nothing new on race day. Small carb snack 15 min before the gun if that suits you.', post:'Within 30–60 min: a recovery shake or chocolate milk, then a proper meal as soon as you can face food — carbs and protein.'}
  ]
};

let profile = null;
let sessions = [];
let adaptations = {};
let chatHistory = [];
let pendingChatAdaptations = [];
let pendingRpe = null;
let modalDate = null;
let calendarMonthOffset = 0;

function saveLocal(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

function loadLocal(key){
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

function saveProfile(){
  saveLocal(KEYS.profile, profile);
}

function saveSessions(){
  saveLocal(KEYS.sessions, sessions);
}

function saveAdaptations(){
  saveLocal(KEYS.adaptations, adaptations);
}

function saveChatHistory(){
  saveLocal(KEYS.chat, chatHistory);
}

function escapeHtml(str){
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function loadAllState(){
  profile = loadLocal(KEYS.profile) || {...DEFAULT_PROFILE};
  profile = {...DEFAULT_PROFILE, ...profile};
  sessions = loadLocal(KEYS.sessions) || [];
  adaptations = loadLocal(KEYS.adaptations) || {};
  chatHistory = loadLocal(KEYS.chat) || [];
}
