import React, { useState, useEffect, useMemo } from 'react';
import {
  Sun, Moon, Flame, ChevronLeft, ChevronRight, Check, X, Sparkles,
  Home, History as HistoryIcon, Pencil, Cloud
} from 'lucide-react';

/* ---------------------------------- data ---------------------------------- */

const MOODS = [
  { id: 'happy',  label: 'Happy',  emoji: '😄', category: 'positive', hue: '#E0904F', soft: '#FBE0C4' },
  { id: 'calm',   label: 'Calm',   emoji: '😌', category: 'positive', hue: '#6E9C7C', soft: '#D9EAE0' },
  { id: 'normal', label: 'Normal', emoji: '😐', category: 'neutral',  hue: '#8B84C4', soft: '#E4E1F5' },
  { id: 'sad',    label: 'Sad',    emoji: '😔', category: 'negative', hue: '#6E86AE', soft: '#DCE3F0' },
  { id: 'angry',  label: 'Angry',  emoji: '😡', category: 'negative', hue: '#C96A56', soft: '#F3D6CC' },
  { id: 'tired',  label: 'Tired',  emoji: '😴', category: 'negative', hue: '#5C5680', soft: '#DAD7E9' },
];
const moodById = (id) => MOODS.find((m) => m.id === id);

const THEME = {
  light: {
    paper: '#FAF8FC', paperAlt: '#F2EEF9', card: '#FFFFFF',
    ink: '#2E2A3D', inkSoft: '#7A7390', border: '#EAE5F3',
    violet: '#8B7FD1', violetSoft: '#ECE8FA', shadow: '0 10px 30px -12px rgba(60,50,90,0.18)',
  },
  dark: {
    paper: '#18151F', paperAlt: '#201C2B', card: '#241F30',
    ink: '#EEEAF8', inkSoft: '#9C93B8', border: '#342D42',
    violet: '#A79BE8', violetSoft: '#332C4A', shadow: '0 10px 30px -12px rgba(0,0,0,0.5)',
  },
};

/* --------------------------------- dates ---------------------------------- */

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const pad = (n) => n.toString().padStart(2, '0');
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function getWeekDates(offset = 0) {
  const base = new Date();
  base.setDate(base.getDate() + offset * 7);
  const start = startOfWeek(base);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function seedEntries() {
  const week = getWeekDates(0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sample = [
    { mood: 'happy',  note: 'Finished a big project at work, felt great walking home.' },
    { mood: 'calm',   note: 'Quiet morning, coffee on the balcony before anyone woke up.' },
    { mood: 'normal', note: 'Pretty average day, nothing much happened.' },
    { mood: 'tired',  note: 'Long day, barely made it through the evening.' },
    { mood: 'happy',  note: 'Had lunch with an old friend, laughed a lot.' },
    { mood: 'calm',   note: '' },
  ];
  const entries = {};
  let s = 0;
  week.forEach((d) => {
    if (d < today && s < sample.length) {
      const key = dateKey(d);
      const m = sample[s];
      entries[key] = { id: key, date: key, mood: m.mood, moodEmoji: moodById(m.mood).emoji, note: m.note };
      s++;
    }
  });
  return entries;
}

function computeWeekStats(entries, weekDates) {
  const weekEntries = weekDates.map((d) => entries[dateKey(d)]).filter(Boolean);
  const counts = {};
  weekEntries.forEach((e) => { counts[e.mood] = (counts[e.mood] || 0) + 1; });
  let mostCommon = null;
  Object.entries(counts).forEach(([mood, count]) => {
    if (!mostCommon || count > mostCommon.count) mostCommon = { mood, count };
  });
  const categoryCounts = { positive: 0, neutral: 0, negative: 0 };
  weekEntries.forEach((e) => {
    const m = moodById(e.mood);
    if (m) categoryCounts[m.category]++;
  });
  return {
    trackedDays: weekEntries.length,
    mostCommon: mostCommon ? moodById(mostCommon.mood) : null,
    categoryCounts,
  };
}

function computeStreak(entries) {
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!entries[dateKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
  while (entries[dateKey(cursor)]) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/* -------------------------------- pieces ---------------------------------- */

function AtmosphereBackdrop({ mood, t }) {
  const c1 = mood ? mood.soft : t.violetSoft;
  const c2 = mood ? mood.hue : t.violet;
  return (
    <div
      className="absolute inset-0 transition-all duration-700 ease-out"
      style={{
        background: `radial-gradient(circle at 15% 15%, ${c1}99, transparent 55%), radial-gradient(circle at 85% 30%, ${c2}55, transparent 50%), radial-gradient(circle at 50% 100%, ${c1}66, transparent 60%)`,
        filter: 'blur(38px)',
      }}
    />
  );
}

function MoodSelector({ selected, onSelect, t, size = 'lg' }) {
  const isLg = size === 'lg';
  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {MOODS.map((m) => {
        const active = selected === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={`flex items-center gap-2 rounded-full transition-all duration-300 ease-out ${isLg ? 'px-4 py-2.5' : 'px-3 py-1.5 text-sm'}`}
            style={{
              background: active ? m.hue : t.card,
              border: `1px solid ${active ? m.hue : t.border}`,
              color: active ? '#FFFFFF' : t.ink,
              transform: active ? 'scale(1.05) translateY(-1px)' : 'scale(1)',
              boxShadow: active ? `0 8px 20px -8px ${m.hue}99` : '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <span style={{ fontSize: isLg ? '1.25rem' : '1rem' }}>{m.emoji}</span>
            <span className="font-medium">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function JournalInput({ value, onChange, t, placeholder }) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 300))}
        placeholder={placeholder}
        rows={3}
        maxLength={300}
        className="w-full rounded-2xl p-4 outline-none resize-none transition-colors duration-300 text-[15px] leading-relaxed"
        style={{ background: t.paperAlt, color: t.ink, border: `1px solid ${t.border}` }}
      />
      <div className="text-right text-xs mt-1.5" style={{ color: t.inkSoft }}>
        {value.length} / 300
      </div>
    </div>
  );
}

function StreakBadge({ streak, t }) {
  if (streak <= 0) return null;
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
      style={{ background: t.violetSoft, color: t.violet }}
    >
      <Flame size={14} />
      {streak} day{streak === 1 ? '' : 's'} streak
    </div>
  );
}

function StatCard({ label, value, sub, t }) {
  return (
    <div className="flex-1 rounded-2xl p-5" style={{ background: t.card, border: `1px solid ${t.border}` }}>
      <div className="text-xs uppercase tracking-wide mb-2" style={{ color: t.inkSoft, letterSpacing: '0.06em' }}>
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: '1.9rem', fontWeight: 600, color: t.ink }}>
          {value}
        </span>
        {sub && <span className="text-sm" style={{ color: t.inkSoft }}>{sub}</span>}
      </div>
    </div>
  );
}

function EmptyState({ emoji, title, subtitle, t }) {
  return (
    <div className="text-center py-12 px-6 rounded-2xl" style={{ background: t.paperAlt, border: `1px dashed ${t.border}` }}>
      <div className="text-3xl mb-3">{emoji}</div>
      <div className="font-medium mb-1" style={{ color: t.ink, fontFamily: "'Fraunces', serif", fontSize: '1.1rem' }}>{title}</div>
      <div className="text-sm" style={{ color: t.inkSoft }}>{subtitle}</div>
    </div>
  );
}

function TodayHero({ selectedMood, setSelectedMood, note, setNote, onSave, isUpdate, flash, streak, t }) {
  const mood = selectedMood ? moodById(selectedMood) : null;
  return (
    <div className="relative overflow-hidden mb-6" style={{ borderRadius: '28px', background: t.card, border: `1px solid ${t.border}`, boxShadow: t.shadow }}>
      <AtmosphereBackdrop mood={mood} t={t} />
      <div className="relative z-10 p-6 sm:p-9">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium mb-2" style={{ color: t.inkSoft }}>
              <Sparkles size={13} />
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontWeight: 500, fontSize: '1.9rem', color: t.ink, lineHeight: 1.15 }}>
              How are you feeling today?
            </h1>
          </div>
          <StreakBadge streak={streak} t={t} />
        </div>

        <MoodSelector selected={selectedMood} onSelect={setSelectedMood} t={t} size="lg" />

        <div className="mt-6">
          <JournalInput value={note} onChange={setNote} t={t} placeholder="How was your day? Write a little about it..." />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={onSave}
            disabled={!selectedMood}
            className="flex items-center gap-2 rounded-full px-6 py-3 font-medium transition-all duration-300"
            style={{
              background: selectedMood ? t.violet : t.border,
              color: selectedMood ? '#FFFFFF' : t.inkSoft,
              cursor: selectedMood ? 'pointer' : 'not-allowed',
              boxShadow: selectedMood ? `0 10px 24px -10px ${t.violet}99` : 'none',
            }}
          >
            <Check size={16} />
            {isUpdate ? 'Update Mood' : 'Save Mood'}
          </button>
          <span
            className="text-sm font-medium transition-all duration-300"
            style={{ color: t.violet, opacity: flash ? 1 : 0, transform: flash ? 'translateY(0)' : 'translateY(-4px)' }}
          >
            Saved ✓
          </span>
        </div>
      </div>
    </div>
  );
}

function WeeklySummary({ stats, streak, t }) {
  return (
    <div className="mb-10">
      <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: t.inkSoft, letterSpacing: '0.06em' }}>
        This Week
      </h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <StatCard label="Tracked Days" value={stats.trackedDays} sub="/ 7" t={t} />
        <StatCard label="Current Streak" value={streak} sub={streak === 1 ? 'day' : 'days'} t={t} />
        <StatCard
          label="Most Common"
          value={stats.mostCommon ? stats.mostCommon.emoji : '—'}
          sub={stats.mostCommon ? stats.mostCommon.label : 'No data yet'}
          t={t}
        />
      </div>
    </div>
  );
}

function HistoryWeekList({ weekDates, weekOffset, setWeekOffset, entries, t, onOpenDay }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const label = weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : `${Math.abs(weekOffset)} weeks ${weekOffset < 0 ? 'ago' : 'ahead'}`;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: t.inkSoft, letterSpacing: '0.06em' }}>
          {label}
        </h2>
        <div className="flex items-center gap-1">
          <button onClick={() => setWeekOffset(weekOffset - 1)} className="w-7 h-7 rounded-full flex items-center justify-center transition-colors" style={{ background: t.paperAlt, color: t.inkSoft }}>
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            disabled={weekOffset >= 0}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            style={{ background: t.paperAlt, color: weekOffset >= 0 ? t.border : t.inkSoft, cursor: weekOffset >= 0 ? 'default' : 'pointer' }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${t.border}` }}>
        {weekDates.map((d, i) => {
          const key = dateKey(d);
          const entry = entries[key];
          const isToday = sameDay(d, today);
          const isFuture = d > today;
          return (
            <button
              key={key}
              onClick={() => !isFuture && onOpenDay(key)}
              disabled={isFuture}
              className="w-full flex items-center gap-4 px-4 sm:px-5 py-3.5 text-left transition-colors duration-200"
              style={{
                background: isToday ? t.violetSoft : t.card,
                borderTop: i === 0 ? 'none' : `1px solid ${t.border}`,
                cursor: isFuture ? 'default' : 'pointer',
                opacity: isFuture ? 0.45 : 1,
              }}
            >
              <div className="w-24 shrink-0">
                <div className="text-sm font-medium" style={{ color: t.ink }}>{DAY_NAMES[i]}</div>
                <div className="text-xs" style={{ color: t.inkSoft }}>{d.getDate()} {MONTH_NAMES[d.getMonth()].slice(0, 3)}</div>
              </div>
              <div className="text-xl w-7 shrink-0">{entry ? entry.moodEmoji : '—'}</div>
              <div className="flex-1 min-w-0">
                {entry ? (
                  <>
                    <div className="text-sm font-medium" style={{ color: t.ink }}>{moodById(entry.mood)?.label}</div>
                    {entry.note && <div className="text-xs truncate" style={{ color: t.inkSoft }}>{entry.note}</div>}
                  </>
                ) : (
                  <div className="text-xs" style={{ color: t.inkSoft }}>{isFuture ? 'Not yet' : 'No entry — tap to add'}</div>
                )}
              </div>
              {entry && <Pencil size={14} style={{ color: t.inkSoft, flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MoodCalendar({ calMonth, setCalMonth, entries, t, onOpenDay }) {
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: t.inkSoft, letterSpacing: '0.06em' }}>
          Mood Calendar
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: t.ink }}>{MONTH_NAMES[month]} {year}</span>
          <button onClick={() => setCalMonth(new Date(year, month - 1, 1))} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: t.paperAlt, color: t.inkSoft }}>
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setCalMonth(new Date(year, month + 1, 1))}
            disabled={year === today.getFullYear() && month === today.getMonth()}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: t.paperAlt, color: (year === today.getFullYear() && month === today.getMonth()) ? t.border : t.inkSoft }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-4 sm:p-5" style={{ background: t.card, border: `1px solid ${t.border}` }}>
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {DAY_SHORT.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold tracking-wide" style={{ color: t.inkSoft }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} />;
            const key = dateKey(d);
            const entry = entries[key];
            const isFuture = d > today;
            const isToday = sameDay(d, today);
            return (
              <button
                key={key}
                onClick={() => !isFuture && onOpenDay(key)}
                disabled={isFuture}
                className="aspect-square rounded-xl flex flex-col items-center justify-center transition-transform duration-200 hover:scale-105"
                style={{
                  background: entry ? (moodById(entry.mood)?.soft) : t.paperAlt,
                  border: isToday ? `1.5px solid ${t.violet}` : `1px solid ${t.border}`,
                  opacity: isFuture ? 0.35 : 1,
                  cursor: isFuture ? 'default' : 'pointer',
                }}
              >
                <span style={{ fontSize: entry ? '1rem' : '0.7rem', color: t.inkSoft }}>{entry ? entry.moodEmoji : d.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EntryModal({ dateStr, entry, onSave, onClose, t }) {
  const [mood, setMood] = useState(entry ? entry.mood : null);
  const [note, setNote] = useState(entry ? entry.note : '');
  const d = new Date(dateStr + 'T00:00:00');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(20,16,28,0.45)', animation: 'moodly-fade 0.25s ease' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl p-6 sm:p-7"
        style={{ background: t.card, border: `1px solid ${t.border}`, boxShadow: t.shadow, animation: 'moodly-modal-in 0.3s ease' }}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: t.inkSoft }}>
              {d.toLocaleDateString(undefined, { weekday: 'long' })}
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.3rem', fontWeight: 600, color: t.ink }}>
              {d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: t.paperAlt, color: t.inkSoft }}>
            <X size={15} />
          </button>
        </div>

        <MoodSelector selected={mood} onSelect={setMood} t={t} size="sm" />

        <div className="mt-4">
          <JournalInput value={note} onChange={setNote} t={t} placeholder="How was your day? Write a little about it..." />
        </div>

        <button
          onClick={() => mood && onSave(dateStr, mood, note)}
          disabled={!mood}
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-full px-5 py-3 font-medium transition-all duration-300"
          style={{
            background: mood ? t.violet : t.border,
            color: mood ? '#FFFFFF' : t.inkSoft,
            cursor: mood ? 'pointer' : 'not-allowed',
          }}
        >
          <Check size={16} />
          {entry ? 'Update Entry' : 'Save Entry'}
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------- app ----------------------------------- */

export default function App() {
  const [theme, setTheme] = useState('light');
  const [entries, setEntries] = useState(() => seedEntries());
  const [view, setView] = useState('today');
  const [weekOffset, setWeekOffset] = useState(0);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; });
  const [modalDate, setModalDate] = useState(null);
  const [flash, setFlash] = useState(false);

  const t = THEME[theme];
  const todayKey = dateKey(new Date());
  const todayEntry = entries[todayKey];

  const [selectedMood, setSelectedMood] = useState(todayEntry ? todayEntry.mood : null);
  const [note, setNote] = useState(todayEntry ? todayEntry.note : '');

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;1,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const thisWeekDates = useMemo(() => getWeekDates(0), []);
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const stats = useMemo(() => computeWeekStats(entries, thisWeekDates), [entries, thisWeekDates]);
  const streak = useMemo(() => computeStreak(entries), [entries]);
  const hasAnyEntries = Object.keys(entries).length > 0;

  function handleSave() {
    if (!selectedMood) return;
    const m = moodById(selectedMood);
    setEntries((prev) => ({ ...prev, [todayKey]: { id: todayKey, date: todayKey, mood: selectedMood, moodEmoji: m.emoji, note } }));
    setFlash(true);
    setTimeout(() => setFlash(false), 2200);
  }

  function handleModalSave(dateStr, mood, noteText) {
    const m = moodById(mood);
    setEntries((prev) => ({ ...prev, [dateStr]: { id: dateStr, date: dateStr, mood, moodEmoji: m.emoji, note: noteText } }));
    if (dateStr === todayKey) {
      setSelectedMood(mood);
      setNote(noteText);
    }
    setModalDate(null);
  }

  return (
    <div
      style={{
        background: t.paper, color: t.ink, minHeight: '100vh',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        transition: 'background 0.5s ease, color 0.5s ease',
      }}
    >
      <style>{`
        @keyframes moodly-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes moodly-modal-in { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes moodly-fade-up { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-6">
        <header className="flex items-center justify-between mb-8 sm:mb-12">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: t.violetSoft }}>
              <Cloud size={18} style={{ color: t.violet }} />
            </div>
            <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '1.25rem', letterSpacing: '-0.01em' }}>Moodly</span>
          </div>

          <nav className="flex items-center gap-1 p-1 rounded-full" style={{ background: t.paperAlt, border: `1px solid ${t.border}` }}>
            <button
              onClick={() => setView('today')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-300"
              style={{ background: view === 'today' ? t.card : 'transparent', color: view === 'today' ? t.ink : t.inkSoft, boxShadow: view === 'today' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}
            >
              <Home size={14} /> <span className="hidden sm:inline">Today</span>
            </button>
            <button
              onClick={() => setView('history')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-300"
              style={{ background: view === 'history' ? t.card : 'transparent', color: view === 'history' ? t.ink : t.inkSoft, boxShadow: view === 'history' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}
            >
              <HistoryIcon size={14} /> <span className="hidden sm:inline">History</span>
            </button>
          </nav>

          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-105"
            style={{ background: t.paperAlt, border: `1px solid ${t.border}`, color: t.inkSoft }}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </header>

        {view === 'today' ? (
          <div style={{ animation: 'moodly-fade-up 0.4s ease' }}>
            <TodayHero
              selectedMood={selectedMood}
              setSelectedMood={setSelectedMood}
              note={note}
              setNote={setNote}
              onSave={handleSave}
              isUpdate={!!todayEntry}
              flash={flash}
              streak={streak}
              t={t}
            />
            <WeeklySummary stats={stats} streak={streak} t={t} />
          </div>
        ) : (
          <div style={{ animation: 'moodly-fade-up 0.4s ease' }}>
            {hasAnyEntries ? (
              <>
                <HistoryWeekList
                  weekDates={weekDates}
                  weekOffset={weekOffset}
                  setWeekOffset={setWeekOffset}
                  entries={entries}
                  t={t}
                  onOpenDay={setModalDate}
                />
                <MoodCalendar calMonth={calMonth} setCalMonth={setCalMonth} entries={entries} t={t} onOpenDay={setModalDate} />
              </>
            ) : (
              <EmptyState
                emoji="☁️"
                title="No moods recorded yet."
                subtitle="Start tracking your first day and build your mood history."
                t={t}
              />
            )}
          </div>
        )}

        <footer className="text-center text-xs mt-16 pb-8" style={{ color: t.inkSoft }}>
          A quiet place to check in with yourself · Moodly
        </footer>
      </div>

      {modalDate && (
        <EntryModal
          dateStr={modalDate}
          entry={entries[modalDate]}
          onSave={handleModalSave}
          onClose={() => setModalDate(null)}
          t={t}
        />
      )}
    </div>
  );
}
