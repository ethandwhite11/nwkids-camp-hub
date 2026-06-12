import { useState, useEffect, createContext, useContext } from 'react'
import { db, auth } from './firebase'
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { ChevronLeft, Search, Sun, Moon, Calendar, Trophy, Map, HelpCircle, BookOpen, Phone, Leaf } from 'lucide-react'

// ─── THEMES ──────────────────────────────────────────────────────────────────
const DARK = {
  bg: '#101813',          surface: '#172018',      surfaceHi: '#1D2B1D',
  border: 'rgba(255,255,255,0.08)',
  accent: '#E05C1A',      accentBg: 'rgba(224,92,26,0.15)',  accentBdr: 'rgba(224,92,26,0.40)',
  active: '#C8E020',      activeBg: 'rgba(200,224,32,0.12)', activeBdr: 'rgba(200,224,32,0.35)',
  brand: '#C8E020',
  yellow: '#C8E020',      yellowBg: 'rgba(200,224,32,0.12)', yellowBdr: 'rgba(200,224,32,0.35)',
  yellowText: '#C8E020',
  text: '#F0EDDF',        muted: '#7A9E8E',         mutedLight: '#9BBFAF',
  green: '#52CC96',       greenBg: 'rgba(82,204,150,0.12)',
  blue: '#4A90E2',        purple: '#B87AFF',
  bannerBg: 'linear-gradient(150deg,#1D5A3F 0%,#0A3025 100%)',
  bannerBdr: 'rgba(224,92,26,0.40)',
  bannerStripe: 'rgba(255,255,255,0.02)',
  navBg: '#101813',
  headerStripe: 'rgba(255,255,255,0.015)',
  overlay: 'rgba(0,0,0,0.25)',
  progressTrack: 'rgba(255,255,255,0.10)',
}

const LIGHT = {
  bg: '#F4F7F5',          surface: '#FFFFFF',       surfaceHi: '#EBF0EC',
  border: 'rgba(0,0,0,0.09)',
  accent: '#C44D0C',      accentBg: 'rgba(196,77,12,0.08)',  accentBdr: 'rgba(196,77,12,0.22)',
  active: '#0D4A2F',      activeBg: 'rgba(13,74,47,0.08)',   activeBdr: 'rgba(13,74,47,0.22)',
  brand: '#0D4A2F',
  yellow: '#C8E020',      yellowBg: 'rgba(200,224,32,0.22)', yellowBdr: 'rgba(80,100,0,0.25)',
  yellowText: '#2D3800',
  text: '#0C1A10',        muted: '#4A6055',          mutedLight: '#6A8070',
  green: '#0A5C2E',       greenBg: 'rgba(10,92,46,0.10)',
  blue: '#1D5EA0',        purple: '#6A38B0',
  bannerBg: 'linear-gradient(150deg,#D8F0E5 0%,#EAF8F2 100%)',
  bannerBdr: 'rgba(13,74,47,0.18)',
  bannerStripe: 'rgba(0,0,0,0.025)',
  navBg: '#FFFFFF',
  headerStripe: 'rgba(0,0,0,0.020)',
  overlay: 'rgba(0,0,0,0.06)',
  progressTrack: 'rgba(0,0,0,0.08)',
}

const ThemeCtx = createContext(LIGHT)
const useC = () => useContext(ThemeCtx)

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TEAM = {
  red:    { color: '#E53E3E', bg: 'rgba(229,62,62,0.14)',    dark: 'rgba(229,62,62,0.24)',    label: 'Red'    },
  yellow: { color: '#C8960C', bg: 'rgba(200,150,12,0.14)',   dark: 'rgba(200,150,12,0.24)',   label: 'Yellow' },
  green:  { color: '#2D8B46', bg: 'rgba(45,139,70,0.14)',    dark: 'rgba(45,139,70,0.24)',    label: 'Green'  },
  blue:   { color: '#2563B8', bg: 'rgba(37,99,184,0.14)',    dark: 'rgba(37,99,184,0.24)',    label: 'Blue'   },
}

const DEFAULT_SCORES = { red: 0, yellow: 0, green: 0, blue: 0 }

const SCHEDULE = {
  1: [
    { time: '4:00P',  label: 'Check-In',       emoji: '🏕️' },
    { time: '5:30P',  label: 'Dinner',          emoji: '🍽️' },
    { time: '7:30P',  label: 'Orientation',     emoji: '📋' },
    { time: '9:30P',  label: 'Flush & Brush',   emoji: '🦷' },
    { time: '10:00P', label: 'Lights Out',       emoji: '🌙' },
  ],
  '2-3': [
    { time: '8:00A',  label: 'Breakfast',        emoji: '🥞' },
    { time: '9:00A',  label: 'Cabin Clean Up',   emoji: '🧹' },
    { time: '9:30A',  label: 'Chapel',            emoji: '✝️' },
    { time: '12:00P', label: 'Lunch',             emoji: '🥪' },
    { time: '1:00P',  label: 'Rotation 1', emoji: '🔄', isRotation: true, rotNum: 1 },
    { time: '2:00P',  label: 'Rotation 2', emoji: '🔄', isRotation: true, rotNum: 2 },
    { time: '3:00P',  label: 'Rotation 3', emoji: '🔄', isRotation: true, rotNum: 3 },
    { time: '4:00P',  label: 'Rotation 4', emoji: '🔄', isRotation: true, rotNum: 4 },
    { time: '5:30P',  label: 'Dinner',          emoji: '🍽️' },
    { time: '6:30P',  label: 'Cabin Time',       emoji: '🏡' },
    { time: '7:30P',  label: 'Response Chapel',  emoji: '✝️' },
    { time: '9:30P',  label: 'Flush & Brush',    emoji: '🦷' },
    { time: '10:00P', label: 'Lights Out',        emoji: '🌙' },
  ],
  4: [
    { time: '7:30A', label: 'Pack Up',         emoji: '🎒' },
    { time: '8:00A', label: 'Breakfast',        emoji: '🥞' },
    { time: '9:00A', label: 'Closing Chapel',   emoji: '✝️' },
    { time: '9:30A', label: 'Departure',         emoji: '👋' },
  ],
}

const ROTATIONS = {
  2: {
    1: { yellow: 'Lake', green: 'Lake', blue: 'Snack Shack', red: 'Field Games' },
    2: { yellow: 'Lake', green: 'Lake', blue: 'Field Games', red: 'Snack Shack' },
    3: { yellow: 'Snack Shack', green: 'Field Games', blue: 'Lake', red: 'Lake' },
    4: { yellow: 'Field Games', green: 'Snack Shack', blue: 'Lake', red: 'Lake' },
  },
  3: {
    1: { yellow: 'Snack Shack', green: 'Field Games', blue: 'Lake', red: 'Lake' },
    2: { yellow: 'Field Games', green: 'Snack Shack', blue: 'Lake', red: 'Lake' },
    3: { yellow: 'Lake', green: 'Lake', blue: 'Field Games', red: 'Snack Shack' },
    4: { yellow: 'Lake', green: 'Lake', blue: 'Snack Shack', red: 'Field Games' },
  },
}

const FAQ = [
  { q: 'What do I do if a camper gets hurt?',       a: 'For minor injuries, use the first aid kit in the supply cabin. For anything serious, call the nurse at ext. 105 immediately and stay with the camper until help arrives.' },
  { q: 'What if a camper is homesick?',              a: 'Acknowledge their feelings and redirect to an upcoming activity. If it escalates, notify leadership. Do not promise calls home without checking first.' },
  { q: 'Can campers use their phones?',              a: 'Phones are collected at check-in and returned at departure. Emergency parent contact goes through the main office only.' },
  { q: 'What is the protocol for a missing camper?', a: 'Do not panic. Quick scan of immediate area, then immediately call the camp director. Never leave your group to search alone.' },
  { q: 'When is quiet time?',                        a: 'Quiet hours are 10:00 PM to 7:30 AM. All campers should be in their cabins and settled.' },
]

const RULES = [
  'Leaders are responsible for their group at all times. Know where your campers are.',
  'No camper should ever be alone with a single adult. Two-adult rule applies everywhere.',
  'Phones stay with camp leadership. Direct any camper requests to the main office.',
  'All medical needs go through the camp nurse, even minor ones.',
  'No swimming without a lifeguard present. Lake access only during scheduled rotation.',
  'Report behavioral concerns to leadership immediately. Do not handle major issues alone.',
  'Lights Out means quiet in cabins. Stay present until campers are settled.',
  'Encourage positive competition only. Respect all team colors.',
]

const CONTACTS = [
  { name: 'Ethan',       role: 'Kids Pastor & Camp Director', note: 'Main contact for anything'          },
  { name: 'Camp Nurse',  role: 'All medical needs',            note: 'Ext. 105 · Main lodge'              },
  { name: 'Front Desk',  role: 'Facilities & logistics',       note: 'Main building entrance'             },
  { name: 'Security',    role: 'Safety emergencies',           note: 'Call 911 first, then notify Ethan'  },
]

const FREE_TIME = [
  { icon: '🏊', name: 'Lake & Swimming',   note: 'Open swim hours only, lifeguard must be present'  },
  { icon: '🏓', name: 'Ping Pong',         note: 'Tables in the rec hall, open all day'              },
  { icon: '🎨', name: 'Crafts',            note: 'Art supplies in Cabin B, open 2:00-5:00 PM'        },
  { icon: '🏀', name: 'Basketball',        note: 'Court near Field B, pick-up games welcome'          },
  { icon: '📖', name: 'Library / Reading', note: 'Quiet room in main lodge'                           },
  { icon: '🎮', name: 'Board Games',       note: 'Available at the rec hall desk'                     },
  { icon: '🌲', name: 'Nature Trail',      note: 'Self-guided, map posted at main entrance'           },
]

const GLOBAL_CSS = `
  @keyframes splashIcon  { 0%{opacity:0;transform:scale(0.5)} 60%{opacity:1;transform:scale(1.12)} 80%{transform:scale(0.96)} 100%{transform:scale(1)} }
  @keyframes splashText  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideInRight{ from{transform:translateX(100%)} to{transform:translateX(0)} }
  @keyframes slideInLeft { from{opacity:0.6;transform:translateX(-28px)} to{opacity:1;transform:translateX(0)} }
  @keyframes tabFade     { from{opacity:0;transform:scale(0.98) translateY(5px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes fadeUp      { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
  body { overscroll-behavior: none; }
  input, textarea { -webkit-appearance: none; }
  button { font-family: inherit; }
`

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function parseTime(t) {
  const p = t.slice(-1)
  const [h, m] = t.slice(0, -1).split(':').map(Number)
  let hr = h
  if (p === 'P' && h !== 12) hr += 12
  if (p === 'A' && h === 12) hr = 0
  return hr * 60 + (m || 0)
}

function dispTime(t) {
  return t.slice(0, -1) + (t.endsWith('A') ? ' AM' : ' PM')
}

function getCampInfo(now) {
  const mo = now.getMonth() + 1
  const d  = now.getDate()
  const y  = now.getFullYear()
  const tm = now.getHours() * 60 + now.getMinutes()
  if (y === 2026 && mo === 8) {
    if (d === 2) return { camp: 'West One', campKey: 'west1', day: 1 }
    if (d === 3) return { camp: 'West One', campKey: 'west1', day: 2 }
    if (d === 4) return { camp: 'West One', campKey: 'west1', day: 3 }
    if (d === 5 && tm < parseTime('9:30A'))  return { camp: 'West One', campKey: 'west1', day: 4 }
    if (d === 5 && tm >= parseTime('4:00P')) return { camp: 'West Two', campKey: 'west2', day: 1 }
    if (d === 6) return { camp: 'West Two', campKey: 'west2', day: 2 }
    if (d === 7) return { camp: 'West Two', campKey: 'west2', day: 3 }
    if (d === 8 && tm < parseTime('9:30A'))  return { camp: 'West Two', campKey: 'west2', day: 4 }
  }
  return null
}

function getSchedule(day) {
  if (day === 1) return SCHEDULE[1]
  if (day === 2 || day === 3) return SCHEDULE['2-3']
  if (day === 4) return SCHEDULE[4]
  return []
}

function getCurrentActivity(sched, now) {
  const tm = now.getHours() * 60 + now.getMinutes()
  for (let i = 0; i < sched.length; i++) {
    const s = parseTime(sched[i].time)
    const e = i < sched.length - 1 ? parseTime(sched[i + 1].time) : 24 * 60
    if (tm >= s && tm < e) {
      return { current: sched[i], next: sched[i + 1] || null, minIn: tm - s, duration: e - s }
    }
  }
  if (tm < parseTime(sched[0].time)) {
    return { current: null, next: sched[0], minUntil: parseTime(sched[0].time) - tm, duration: 0 }
  }
  return { current: sched[sched.length - 1], next: null, minIn: 0, duration: 60 }
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function SCard({ children, style }) {
  const C = useC()
  return (
    <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: '14px 16px', marginBottom: 10, ...style }}>
      {children}
    </div>
  )
}

function SecLabel({ children }) {
  const C = useC()
  return (
    <p style={{ margin: '20px 0 10px', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, fontFamily: "'Oswald',sans-serif" }}>
      {children}
    </p>
  )
}

function BackHeader({ title, onBack }) {
  const C = useC()
  return (
    <div style={{ padding: 'calc(14px + env(safe-area-inset-top,0px)) 16px 14px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.border}`, background: C.bg, position: 'sticky', top: 0, zIndex: 10 }}>
      <Tap onClick={onBack} style={{ color: C.accent, padding: '4px 6px 4px 0', display: 'flex', alignItems: 'center' }}>
        <ChevronLeft size={22} strokeWidth={2.5} />
      </Tap>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.text, fontFamily: "'Oswald',sans-serif" }}>
        {title}
      </h2>
    </div>
  )
}

function ProgressBar({ progress, color }) {
  const C = useC()
  return (
    <div style={{ height: 4, background: C.progressTrack, borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, progress * 100))}%`, background: color, borderRadius: 99, transition: 'width 60s linear' }} />
    </div>
  )
}

function Tap({ onClick, children, style }) {
  const [pressed, setPressed] = useState(false)
  return (
    <div
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        ...style,
        transform: pressed ? 'scale(0.95)' : 'scale(1)',
        transition: pressed ? 'transform 0.07s ease' : 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        cursor: 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {children}
    </div>
  )
}

// ─── SPLASH SCREEN — always dark, brand moment ────────────────────────────────
function SplashScreen({ onDone }) {
  const [exiting, setExiting] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 1400)
    const t2 = setTimeout(onDone, 1900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: '#101813',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: exiting ? 0 : 1,
      transition: exiting ? 'opacity 0.5s ease' : 'none',
      backgroundImage: 'repeating-linear-gradient(-45deg,rgba(255,255,255,0.02) 0px,rgba(255,255,255,0.02) 1px,transparent 1px,transparent 14px)',
    }}>
      <img
        src="/apple-touch-icon.png"
        alt="NW Kids"
        style={{ width: 160, height: 160, borderRadius: 36, marginBottom: 28, animation: 'splashIcon 0.75s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
      />
      <p style={{ margin: '0 0 4px', fontFamily: "'Oswald',sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C8E020', animation: 'splashText 0.5s ease 0.4s both' }}>
        NW Kids
      </p>
      <p style={{ margin: 0, fontFamily: "'Oswald',sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#F0EDDF', animation: 'splashText 0.5s ease 0.5s both' }}>
        Summer Camp
      </p>
    </div>
  )
}

// ─── TEAM PICKER ──────────────────────────────────────────────────────────────
function TeamPicker({ onSelect }) {
  const C = useC()
  const [selected, setSelected] = useState(null)
  return (
    <div style={{
      minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column',
      padding: 'calc(52px + env(safe-area-inset-top,0px)) 24px calc(40px + env(safe-area-inset-bottom,0px))',
      backgroundImage: `repeating-linear-gradient(-45deg,${C.bannerStripe} 0px,${C.bannerStripe} 1px,transparent 1px,transparent 14px)`,
      animation: 'fadeUp 0.4s ease both',
    }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.brand, fontFamily: "'Oswald',sans-serif" }}>NW Kids</p>
        <h1 style={{ margin: '0 0 10px', fontSize: 38, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.text, fontFamily: "'Oswald',sans-serif", lineHeight: 1 }}>Summer Camp</h1>
        <p style={{ margin: 0, fontSize: 15, color: C.muted, lineHeight: 1.5 }}>Select your team for a personalized experience throughout camp.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>
        {Object.entries(TEAM).map(([key, t]) => (
          <Tap key={key} onClick={() => setSelected(key)} style={{
            background: selected === key ? t.dark : C.surface,
            border: `2px solid ${selected === key ? t.color : C.border}`,
            borderRadius: 20, padding: '28px 16px', textAlign: 'center',
          }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: t.color, margin: '0 auto 14px', boxShadow: selected === key ? `0 0 24px ${t.color}70` : 'none' }} />
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: selected === key ? t.color : C.text, fontFamily: "'Oswald',sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase' }}>{t.label}</p>
          </Tap>
        ))}
      </div>
      <Tap onClick={() => selected && onSelect(selected)} style={{ marginTop: 24, padding: '15px', borderRadius: 14, textAlign: 'center', background: selected ? TEAM[selected].color : C.surfaceHi }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: selected ? '#fff' : C.muted, fontFamily: "'Oswald',sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {selected ? `I am on ${TEAM[selected].label} Team` : 'Select a team above'}
        </span>
      </Tap>
    </div>
  )
}

// ─── TEAM CHANGE MODAL ────────────────────────────────────────────────────────
function TeamChangeModal({ myTeam, onSelect, onClose }) {
  const C = useC()
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.surface, width: '100%', borderRadius: '24px 24px 0 0', padding: `24px 20px calc(28px + env(safe-area-inset-bottom,0px))`, border: `1px solid ${C.border}` }}>
        <p style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700, color: C.text, fontFamily: "'Oswald',sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase' }}>Change Team</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {Object.entries(TEAM).map(([key, t]) => (
            <Tap key={key} onClick={() => { onSelect(key); onClose() }} style={{ padding: '14px', borderRadius: 12, background: myTeam === key ? t.bg : 'transparent', border: `1.5px solid ${myTeam === key ? t.color : C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: myTeam === key ? t.color : C.text, fontFamily: "'Oswald',sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase' }}>{t.label}</span>
            </Tap>
          ))}
        </div>
        <Tap onClick={onClose} style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'transparent', border: `1px solid ${C.border}`, textAlign: 'center' }}>
          <span style={{ fontSize: 14, color: C.muted }}>Cancel</span>
        </Tap>
      </div>
    </div>
  )
}

// ─── NOW BANNER ───────────────────────────────────────────────────────────────
function NowBanner({ campInfo, now, myTeam, onViewSchedule }) {
  const C = useC()

  if (!campInfo) {
    const before = now < new Date('2026-08-02')
    const days = Math.ceil((new Date('2026-08-02') - now) / (1000 * 60 * 60 * 24))
    return (
      <SCard style={{ marginBottom: 0 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, fontFamily: "'Oswald',sans-serif" }}>Camp Status</p>
        <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 700, color: C.text, fontFamily: "'Oswald',sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {before ? `West One in ${days} days` : 'Camp wrapped. See you next year.'}
        </p>
      </SCard>
    )
  }

  const sched = getSchedule(campInfo.day)
  const { current, next, minIn, minUntil, duration } = getCurrentActivity(sched, now)
  const rots = (campInfo.day === 2 || campInfo.day === 3) ? ROTATIONS[campInfo.day] : null
  const isRot = current && current.isRotation
  const remaining = duration - minIn
  const progress = duration > 0 ? minIn / duration : 0

  const bannerStyle = {
    background: C.bannerBg,
    borderRadius: 16,
    padding: 18,
    marginBottom: 0,
    border: `1px solid ${C.bannerBdr}`,
    backgroundImage: `repeating-linear-gradient(-45deg,${C.bannerStripe} 0px,${C.bannerStripe} 1px,transparent 1px,transparent 12px)`,
  }

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.green, fontFamily: "'Oswald',sans-serif" }}>Live Now</span>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, background: C.surface, padding: '3px 10px', borderRadius: 99, border: `1px solid ${C.border}` }}>
        {campInfo.camp} · Day {campInfo.day}
      </span>
    </div>
  )

  const footer = onViewSchedule && (
    <Tap onClick={onViewSchedule} style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>View full schedule</span>
      <ChevronLeft size={16} color={C.accent} style={{ transform: 'rotate(180deg)' }} />
    </Tap>
  )

  if (!current) {
    return (
      <div style={bannerStyle}>
        {header}
        <p style={{ margin: '4px 0', fontSize: 22, fontWeight: 700, color: C.text, fontFamily: "'Oswald',sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {next && next.emoji} {next && next.label} in {minUntil} min
        </p>
        {footer}
      </div>
    )
  }

  if (isRot && myTeam && rots) {
    const t = TEAM[myTeam]
    const myLoc = rots[current.rotNum][myTeam] || '—'
    const others = Object.entries(TEAM).filter(([k]) => k !== myTeam)
    return (
      <div style={bannerStyle}>
        {header}
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, fontFamily: "'Oswald',sans-serif" }}>
          {current.emoji} {current.label}
        </p>
        <div style={{ background: t.dark, border: `1.5px solid ${t.color}60`, borderRadius: 12, padding: '14px 16px', marginBottom: 8 }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.color, fontFamily: "'Oswald',sans-serif" }}>
            {t.label} Team — Your Location
          </p>
          <p style={{ margin: '0 0 12px', fontSize: 32, fontWeight: 700, color: C.text, fontFamily: "'Oswald',sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>
            {myLoc}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: t.color, whiteSpace: 'nowrap' }}>{remaining} min left</p>
            <div style={{ flex: 1 }}>
              <ProgressBar progress={progress} color={t.color} />
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
          {others.map(([k, ot]) => (
            <div key={k} style={{ background: C.overlay, borderRadius: 8, padding: '7px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: ot.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: ot.color, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'Oswald',sans-serif" }}>{ot.label}</span>
              </div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.mutedLight }}>{rots[current.rotNum][k] || '—'}</p>
            </div>
          ))}
        </div>
        {footer}
      </div>
    )
  }

  if (isRot && rots) {
    return (
      <div style={bannerStyle}>
        {header}
        <p style={{ margin: '0 0 10px', fontSize: 24, fontWeight: 700, color: C.text, fontFamily: "'Oswald',sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {current.emoji} {current.label}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
          {Object.entries(TEAM).map(([k, t]) => (
            <div key={k} style={{ background: t.bg, borderRadius: 9, padding: '8px 11px', border: `1px solid ${t.color}25` }}>
              <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, color: t.color, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'Oswald',sans-serif" }}>{t.label}</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text }}>{rots[current.rotNum][k] || '—'}</p>
            </div>
          ))}
        </div>
        <div style={{ background: C.accentBg, borderRadius: 8, padding: '8px 12px', border: `1px solid ${C.accentBdr}` }}>
          <p style={{ margin: 0, fontSize: 12, color: C.accent, fontWeight: 600 }}>Tap your team in the header for a personalized view</p>
        </div>
        {footer}
      </div>
    )
  }

  return (
    <div style={bannerStyle}>
      {header}
      <p style={{ margin: '0 0 2px', fontSize: 28, fontWeight: 700, color: C.text, fontFamily: "'Oswald',sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.1 }}>
        {current.emoji} {current.label}
      </p>
      <p style={{ margin: '4px 0 12px', fontSize: 12, color: C.muted }}>{minIn} min in — {remaining} min remaining</p>
      <ProgressBar progress={progress} color={C.accent} />
      {next && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'Oswald',sans-serif" }}>Next</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.mutedLight }}>{next.emoji} {next.label} — {dispTime(next.time)}</span>
        </div>
      )}
      {footer}
    </div>
  )
}

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────
const HOME_CARDS = [
  { id: 'faq',      Icon: HelpCircle, label: 'FAQ',       sub: 'Common questions' },
  { id: 'rules',    Icon: BookOpen,   label: 'Rules',     sub: 'Camp guidelines'  },
  { id: 'contacts', Icon: Phone,      label: 'Contacts',  sub: 'Leadership team'  },
  { id: 'freetime', Icon: Leaf,       label: 'Free Time', sub: 'Things to do'     },
]

function HomeScreen({ campInfo, now, nav, announcement, myTeam }) {
  const C = useC()
  return (
    <div style={{ padding: '16px 16px calc(92px + env(safe-area-inset-bottom,0px))' }}>
      {announcement && (
        <div style={{ background: C.yellowBg, border: `1px solid ${C.yellowBdr}`, borderRadius: 12, padding: '10px 14px', marginBottom: 12, display: 'flex', gap: 10, alignItems: 'flex-start', animation: 'fadeUp 0.3s ease both' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>📢</span>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.yellowText, lineHeight: 1.4 }}>{announcement}</p>
        </div>
      )}
      <div style={{ marginBottom: 12, animation: 'fadeUp 0.35s ease 0.05s both' }}>
        <NowBanner campInfo={campInfo} now={now} myTeam={myTeam} onViewSchedule={() => nav('schedule', false)} />
      </div>
      <SecLabel>More</SecLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, animation: 'fadeUp 0.35s ease 0.1s both' }}>
        {HOME_CARDS.map(({ id, Icon, label, sub }) => (
          <Tap key={id} onClick={() => nav(id, true)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 16px', textAlign: 'left' }}>
            <Icon size={28} color={C.active} strokeWidth={1.75} style={{ marginBottom: 10, display: 'block' }} />
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text, fontFamily: "'Oswald',sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>{sub}</p>
          </Tap>
        ))}
      </div>
    </div>
  )
}

// ─── SCHEDULE PAGE ────────────────────────────────────────────────────────────
function SchedulePage({ campInfo, now, myTeam }) {
  const C = useC()
  const [day, setDay] = useState(campInfo ? campInfo.day : 2)
  const sched = getSchedule(day)
  const tm = now.getHours() * 60 + now.getMinutes()
  const rots = (day === 2 || day === 3) ? ROTATIONS[day] : null

  return (
    <div>
      <div style={{ padding: 'calc(14px + env(safe-area-inset-top,0px)) 16px 12px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.bg, zIndex: 10 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.text, fontFamily: "'Oswald',sans-serif" }}>Schedule</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1, 2, 3, 4].map(d => (
            <button key={d} onClick={() => setDay(d)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: `1px solid ${day === d ? C.accent : C.border}`, background: day === d ? C.accentBg : 'transparent', color: day === d ? C.accent : C.muted, fontWeight: day === d ? 700 : 400, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Day {d}
            </button>
          ))}
        </div>
        {rots && (
          <p style={{ margin: '10px 0 0', fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Oswald',sans-serif" }}>
            {day === 2 ? 'Monday / Thursday' : 'Tuesday / Friday'} Rotation
          </p>
        )}
      </div>
      <div style={{ padding: '12px 16px calc(92px + env(safe-area-inset-bottom,0px))' }}>
        {sched.map((item, i) => {
          const s = parseTime(item.time)
          const e = i < sched.length - 1 ? parseTime(sched[i + 1].time) : 24 * 60
          const isCur = campInfo && campInfo.day === day && tm >= s && tm < e
          const isPast = campInfo && campInfo.day === day && tm >= e
          return (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 56, paddingTop: 10, flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: isCur ? C.active : C.muted, whiteSpace: 'nowrap' }}>{dispTime(item.time)}</p>
                {i < sched.length - 1 && <div style={{ flex: 1, width: 1, background: isCur ? C.accent : C.border, marginTop: 5, marginBottom: 4 }} />}
              </div>
              <div style={{ flex: 1, marginBottom: 6 }}>
                <div style={{ background: isCur ? C.accentBg : C.surface, borderRadius: 12, padding: '11px 14px', border: `1px solid ${isCur ? C.accentBdr : C.border}`, opacity: isPast ? 0.4 : 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: isCur ? 700 : 500, color: isCur ? C.accent : C.text }}>
                    {item.emoji} {item.label}
                  </p>
                  {item.isRotation && rots && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {Object.entries(TEAM).map(([k, t]) => {
                        const isMe = myTeam === k
                        return (
                          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, background: isMe ? t.bg : 'transparent', borderRadius: isMe ? 8 : 0, padding: isMe ? '5px 8px' : '2px 0', border: isMe ? `1px solid ${t.color}40` : 'none' }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: isMe ? t.color : C.muted, fontWeight: isMe ? 700 : 400 }}>{t.label}:</span>
                            <span style={{ fontSize: 12, fontWeight: isMe ? 700 : 500, color: isMe ? C.text : C.mutedLight, flex: 1 }}>{rots[item.rotNum][k]}</span>
                            {isMe && <span style={{ fontSize: 10, fontWeight: 700, color: t.color, background: `${t.color}20`, padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'Oswald',sans-serif" }}>You</span>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── SCOREBOARD ───────────────────────────────────────────────────────────────
function ScoreboardPage({ scores }) {
  const C = useC()
  const sorted = [...Object.entries(scores)].sort(([, a], [, b]) => b - a)
  const medals = ['🥇', '🥈', '🥉', '4']
  return (
    <div>
      <div style={{ padding: 'calc(14px + env(safe-area-inset-top,0px)) 16px 12px', borderBottom: `1px solid ${C.border}` }}>
        <h2 style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.text, fontFamily: "'Oswald',sans-serif" }}>Camp Cup</h2>
        <p style={{ margin: 0, fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Oswald',sans-serif" }}>Live — Updates in real time</p>
      </div>
      <div style={{ padding: '16px 16px calc(92px + env(safe-area-inset-bottom,0px))' }}>
        {sorted.map(([k, score], i) => {
          const t = TEAM[k]
          const leading = k === sorted[0][0] && score > 0
          return (
            <div key={k} style={{ background: leading ? t.bg : C.surface, borderRadius: 16, padding: '18px 20px', marginBottom: 10, border: `1px solid ${leading ? t.color + '50' : C.border}`, display: 'flex', alignItems: 'center', gap: 14, animation: `fadeUp 0.3s ease ${i * 0.07}s both` }}>
              <span style={{ fontSize: 22, width: 28, textAlign: 'center' }}>{medals[i]}</span>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text, flex: 1, fontFamily: "'Oswald',sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.label}</p>
              <p style={{ margin: 0, fontSize: 36, fontWeight: 700, color: leading ? t.color : C.text, minWidth: 50, textAlign: 'right', fontFamily: "'Oswald',sans-serif" }}>{score}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── MAP ──────────────────────────────────────────────────────────────────────
function MapPage() {
  const C = useC()
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const lastTouchRef = useRef(null)
  const lastDistRef = useRef(null)

  const getTouchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else if (e.touches.length === 2) {
      lastDistRef.current = getTouchDist(e.touches)
    }
  }

  const handleTouchMove = (e) => {
    e.preventDefault()
    if (e.touches.length === 1 && lastTouchRef.current) {
      const dx = e.touches[0].clientX - lastTouchRef.current.x
      const dy = e.touches[0].clientY - lastTouchRef.current.y
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }))
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else if (e.touches.length === 2 && lastDistRef.current !== null) {
      const newDist = getTouchDist(e.touches)
      setScale(prev => Math.min(Math.max(prev * (newDist / lastDistRef.current), 1), 4))
      lastDistRef.current = newDist
    }
  }

  const handleTouchEnd = () => {
    lastTouchRef.current = null
    lastDistRef.current = null
    if (scale <= 1.05) {
      setScale(1)
      setOffset({ x: 0, y: 0 })
    }
  }

  const handleDoubleTap = () => {
    if (scale > 1) { setScale(1); setOffset({ x: 0, y: 0 }) }
    else setScale(2)
  }

  return (
    <div>
      <div style={{ padding: 'calc(14px + env(safe-area-inset-top,0px)) 16px 12px', borderBottom: `1px solid ${C.border}` }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: C.text, fontFamily: "'Oswald',sans-serif" }}>Camp Map</h2>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>Pinch to zoom · Double-tap to reset</p>
      </div>
      <div style={{ padding: '16px 16px calc(92px + env(safe-area-inset-bottom,0px))' }}>
        <SCard style={{ padding: 8, overflow: 'hidden' }}>
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={handleDoubleTap}
            style={{ overflow: 'hidden', borderRadius: 8, touchAction: 'none' }}
          >
            <img
              src="/camp-map.jpg"
              alt="Camp grounds map"
              draggable={false}
              style={{
                width: '100%',
                display: 'block',
                borderRadius: 8,
                transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
                transformOrigin: 'center center',
                transition: scale === 1 ? 'transform 0.3s ease' : 'none',
                userSelect: 'none',
              }}
            />
          </div>
        </SCard>
      </div>
    </div>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQPage({ onBack }) {
  const C = useC()
  const [open, setOpen] = useState(null)
  return (
    <div>
      <BackHeader title="FAQ" onBack={onBack} />
      <div style={{ padding: '16px 16px calc(92px + env(safe-area-inset-bottom,0px))' }}>
        {FAQ.map((item, i) => (
          <div key={i} style={{ background: C.surface, borderRadius: 14, border: `1px solid ${open === i ? C.accentBdr : C.border}`, marginBottom: 8, overflow: 'hidden' }}>
            <Tap onClick={() => setOpen(open === i ? null : i)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', gap: 10 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: open === i ? C.accent : C.text, flex: 1 }}>{item.q}</p>
              <ChevronLeft size={18} color={C.muted} style={{ transform: open === i ? 'rotate(-90deg)' : 'rotate(180deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
            </Tap>
            {open === i && (
              <div style={{ padding: '0 16px 14px', paddingTop: 10, fontSize: 13, color: C.muted, lineHeight: 1.6, borderTop: `1px solid ${C.border}` }}>
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── RULES ────────────────────────────────────────────────────────────────────
function RulesPage({ onBack }) {
  const C = useC()
  return (
    <div>
      <BackHeader title="Rules" onBack={onBack} />
      <div style={{ padding: '16px 16px calc(92px + env(safe-area-inset-bottom,0px))' }}>
        {RULES.map((rule, i) => (
          <SCard key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: C.accentBg, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1, fontFamily: "'Oswald',sans-serif" }}>{i + 1}</div>
            <p style={{ margin: 0, fontSize: 14, color: C.text, lineHeight: 1.55, flex: 1 }}>{rule}</p>
          </SCard>
        ))}
      </div>
    </div>
  )
}

// ─── CONTACTS ─────────────────────────────────────────────────────────────────
function ContactsPage({ onBack }) {
  const C = useC()
  return (
    <div>
      <BackHeader title="Contacts" onBack={onBack} />
      <div style={{ padding: '16px 16px calc(92px + env(safe-area-inset-bottom,0px))' }}>
        <SCard style={{ background: 'rgba(220,50,50,0.07)', border: '1px solid rgba(220,50,50,0.18)' }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C03030', fontFamily: "'Oswald',sans-serif" }}>Emergency</p>
          <p style={{ margin: 0, fontSize: 14, color: C.text }}>Call <strong>911</strong> first for any life-threatening situation, then alert Ethan.</p>
        </SCard>
        {CONTACTS.map((c, i) => (
          <SCard key={i}>
            <p style={{ margin: '0 0 2px', fontSize: 17, fontWeight: 700, color: C.text, fontFamily: "'Oswald',sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.name}</p>
            <p style={{ margin: '0 0 6px', fontSize: 13, color: C.accent }}>{c.role}</p>
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{c.note}</p>
          </SCard>
        ))}
      </div>
    </div>
  )
}

// ─── FREE TIME ────────────────────────────────────────────────────────────────
function FreeTimePage({ onBack }) {
  const C = useC()
  return (
    <div>
      <BackHeader title="Free Time" onBack={onBack} />
      <div style={{ padding: '16px 16px calc(92px + env(safe-area-inset-bottom,0px))' }}>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: C.muted }}>Activities available during unstructured time</p>
        {FREE_TIME.map((item, i) => (
          <SCard key={i} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <span style={{ fontSize: 26, flexShrink: 0 }}>{item.icon}</span>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: C.text, fontFamily: "'Oswald',sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.name}</p>
              <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{item.note}</p>
            </div>
          </SCard>
        ))}
      </div>
    </div>
  )
}

// ─── SEARCH OVERLAY ───────────────────────────────────────────────────────────
const SEARCHABLE = [
  ...FAQ.map(f         => ({ type: 'FAQ',       title: f.q,         body: f.a,                   page: 'faq',       secondary: true  })),
  ...RULES.map((r, i)  => ({ type: 'Rule',      title: `Rule ${i+1}`, body: r,                   page: 'rules',     secondary: true  })),
  ...CONTACTS.map(c    => ({ type: 'Contact',   title: c.name,      body: `${c.role} — ${c.note}`, page: 'contacts',  secondary: true  })),
  ...FREE_TIME.map(f   => ({ type: 'Free Time', title: f.name,      body: f.note,                page: 'freetime',  secondary: true  })),
  { type: 'Page', title: 'Schedule', body: 'Daily timeline rotations activities', page: 'schedule',   secondary: false },
  { type: 'Page', title: 'Map',      body: 'Camp layout directions areas',        page: 'map',        secondary: false },
  { type: 'Page', title: 'Camp Cup', body: 'Team scores Red Yellow Green Blue',   page: 'scoreboard', secondary: false },
]

function SearchOverlay({ onClose, nav }) {
  const C = useC()
  const [q, setQ] = useState('')
  const results = q.length > 1
    ? SEARCHABLE.filter(r => r.title.toLowerCase().includes(q.toLowerCase()) || r.body.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
    : []
  return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, zIndex: 100, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'calc(14px + env(safe-area-inset-top,0px)) 16px 12px', display: 'flex', gap: 10, alignItems: 'center', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={16} color={C.muted} strokeWidth={2} />
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search everything..."
            style={{ flex: 1, background: 'transparent', border: 'none', padding: '10px 0', fontSize: 16, color: C.text, outline: 'none', fontFamily: 'inherit' }}
          />
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 15, fontWeight: 600, fontFamily: 'inherit' }}>Cancel</button>
      </div>
      <div style={{ padding: '12px 16px', flex: 1, overflowY: 'auto' }}>
        {results.length > 0
          ? results.map((r, i) => (
              <Tap key={i} onClick={() => nav(r.page, r.secondary)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.06em', background: C.accentBg, padding: '2px 7px', borderRadius: 4, fontFamily: "'Oswald',sans-serif" }}>{r.type}</span>
                <p style={{ margin: '5px 0 2px', fontSize: 14, fontWeight: 600, color: C.text }}>{r.title}</p>
                <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{r.body.substring(0, 90)}{r.body.length > 90 ? '...' : ''}</p>
              </Tap>
            ))
          : q.length > 1
            ? <p style={{ color: C.muted, textAlign: 'center', marginTop: 40, fontSize: 14 }}>No results for "{q}"</p>
            : <p style={{ color: C.muted, textAlign: 'center', marginTop: 40, fontSize: 14 }}>Search schedule, FAQ, rules, contacts and more</p>
        }
      </div>
    </div>
  )
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'home',        label: 'Home',     isLogo: true  },
  { id: 'schedule',    label: 'Schedule', Icon: Calendar },
  { id: 'scoreboard',  label: 'Camp Cup', Icon: Trophy   },
  { id: 'map',         label: 'Map',      Icon: Map      },
]

function BottomNav({ page, nav }) {
  const C = useC()
  return (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: C.navBg, borderTop: `1px solid ${C.border}`, paddingBottom: 'env(safe-area-inset-bottom,0px)', display: 'flex', zIndex: 50 }}>
      {TABS.map(tab => {
        const active = page === tab.id
        return (
          <button key={tab.id} onClick={() => nav(tab.id, false)} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ height: 3, width: 20, borderRadius: 99, background: active ? C.active : 'transparent', marginBottom: 4, transition: 'background 0.2s' }} />
            {tab.isLogo
              ? <img src="/apple-touch-icon.png" alt="Home" style={{ width: 24, height: 24, borderRadius: 5, opacity: active ? 1 : 0.3, transition: 'opacity 0.2s' }} />
              : <tab.Icon size={22} strokeWidth={1.75} color={active ? C.active : C.muted} style={{ transition: 'color 0.2s' }} />
            }
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? C.active : C.muted, fontFamily: "'Oswald',sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'color 0.2s' }}>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── ADMIN — always dark, hardcoded dark theme ────────────────────────────────
function AdminLogin() {
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async e => {
    e.preventDefault(); setLoading(true); setError('')
    try { await signInWithEmailAndPassword(auth, email, pass) }
    catch { setError('Invalid email or password.'); setLoading(false) }
  }
  return (
    <div style={{ minHeight: '100vh', background: '#101813', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <p style={{ fontFamily: "'Oswald',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C8E020', marginBottom: 4 }}>NW Kids</p>
      <h1 style={{ fontFamily: "'Oswald',sans-serif", fontSize: 28, fontWeight: 700, textTransform: 'uppercase', color: '#F0EDDF', marginBottom: 2, letterSpacing: '0.04em' }}>Admin Panel</h1>
      <p style={{ fontSize: 13, color: '#7A9E8E', marginBottom: 28 }}>Sign in to manage scores and announcements</p>
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 340 }}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required style={{ display: 'block', width: '100%', marginBottom: 10, background: '#172018', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px', fontSize: 15, color: '#F0EDDF', outline: 'none', fontFamily: 'inherit' }} />
        <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Password" required style={{ display: 'block', width: '100%', marginBottom: 16, background: '#172018', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px', fontSize: 15, color: '#F0EDDF', outline: 'none', fontFamily: 'inherit' }} />
        {error && <p style={{ color: '#FF4D4D', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: 10, background: '#E05C1A', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}

function AdminDashboard({ allScores, updateScore, announcement }) {
  const [draft, setDraft] = useState(announcement || '')
  const [saving, setSaving] = useState(false)
  useEffect(() => setDraft(announcement || ''), [announcement])

  const post  = async () => { setSaving(true); await setDoc(doc(db, 'announcement', 'current'), { text: draft, active: draft.trim().length > 0 }); setSaving(false) }
  const clear = async () => { setDraft(''); await setDoc(doc(db, 'announcement', 'current'), { text: '', active: false }) }

  const ScorePanel = ({ campKey, campName }) => {
    const s = allScores[campKey] || DEFAULT_SCORES
    return (
      <div style={{ marginBottom: 20 }}>
        <p style={{ margin: '20px 0 10px', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A9E8E', fontFamily: "'Oswald',sans-serif" }}>{campName} Scores</p>
        {[...Object.entries(s)].sort(([, a], [, b]) => b - a).map(([k, score]) => {
          const t = TEAM[k]
          return (
            <div key={k} style={{ background: '#172018', borderRadius: 12, padding: '10px 14px', marginBottom: 8, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#F0EDDF', flex: 1, fontFamily: "'Oswald',sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.label}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => updateScore(campKey, k, -10)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#7A9E8E', fontSize: 22, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1 }}>-</button>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#F0EDDF', minWidth: 46, textAlign: 'center', fontFamily: "'Oswald',sans-serif" }}>{score}</span>
                <button onClick={() => updateScore(campKey, k, 10)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(224,92,26,0.40)', background: 'rgba(224,92,26,0.15)', color: '#E05C1A', fontSize: 22, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1 }}>+</button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ padding: '16px 16px 40px' }}>
      <ScorePanel campKey="west1" campName="West One" />
      <ScorePanel campKey="west2" campName="West Two" />
      <p style={{ margin: '20px 0 6px', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A9E8E', fontFamily: "'Oswald',sans-serif" }}>Announcement</p>
      <p style={{ fontSize: 12, color: '#7A9E8E', marginBottom: 10 }}>Shows as a banner on every leader home screen.</p>
      {announcement && (
        <div style={{ background: 'rgba(200,224,32,0.12)', border: '1px solid rgba(200,224,32,0.35)', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
          <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#C8E020', fontFamily: "'Oswald',sans-serif" }}>Live</p>
          <p style={{ margin: 0, fontSize: 13, color: '#F0EDDF' }}>{announcement}</p>
        </div>
      )}
      <textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="Type an announcement for all leaders..." style={{ width: '100%', background: '#172018', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#F0EDDF', outline: 'none', fontFamily: 'inherit', resize: 'vertical', minHeight: 80, marginBottom: 10 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={post} disabled={saving} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#E05C1A', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Oswald',sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {saving ? 'Saving...' : 'Post'}
        </button>
        {announcement && (
          <button onClick={clear} style={{ padding: '11px 16px', borderRadius: 10, background: '#172018', border: '1px solid rgba(255,255,255,0.08)', color: '#7A9E8E', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Clear</button>
        )}
      </div>
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const PRIMARY_PAGES = ['home', 'schedule', 'scoreboard', 'map']

export default function CampHub() {
  const [page,         setPage]         = useState('home')
  const [animClass,    setAnimClass]     = useState('tabFade')
  const [searchOpen,   setSearchOpen]    = useState(false)
  const [now,          setNow]           = useState(new Date())
  const [allScores,    setAllScores]     = useState({ west1: DEFAULT_SCORES, west2: DEFAULT_SCORES })
  const [announcement, setAnnouncement]  = useState('')
  const [user,         setUser]          = useState(null)
  const [authChecked,  setAuthChecked]   = useState(false)
  const [isAdmin,      setIsAdmin]       = useState(window.location.hash === '#admin')
  const [myTeam,       setMyTeam]        = useState(() => localStorage.getItem('leaderTeam') || null)
  const [changingTeam, setChangingTeam]  = useState(false)
  const [showSplash,   setShowSplash]    = useState(() => !sessionStorage.getItem('splashShown'))
  const [isDark,       setIsDark]        = useState(() => localStorage.getItem('theme') === 'dark')

  const theme = isDark ? DARK : LIGHT

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  useEffect(() => {
    const s = document.createElement('style')
    s.textContent = GLOBAL_CSS
    document.head.appendChild(s)
    return () => document.head.removeChild(s)
  }, [])

  useEffect(() => {
    const init = async k => {
      const ref  = doc(db, 'scores', k)
      const snap = await getDoc(ref)
      if (!snap.exists()) await setDoc(ref, DEFAULT_SCORES)
    }
    const u1 = onSnapshot(doc(db, 'scores', 'west1'), s => { if (s.exists()) setAllScores(p => ({ ...p, west1: s.data() })); else init('west1') })
    const u2 = onSnapshot(doc(db, 'scores', 'west2'), s => { if (s.exists()) setAllScores(p => ({ ...p, west2: s.data() })); else init('west2') })
    return () => { u1(); u2() }
  }, [])

  useEffect(() => {
    return onSnapshot(doc(db, 'announcement', 'current'), s => {
      if (s.exists() && s.data().active) setAnnouncement(s.data().text)
      else setAnnouncement('')
    })
  }, [])

  useEffect(() => { return onAuthStateChanged(auth, u => { setUser(u); setAuthChecked(true) }) }, [])

  useEffect(() => {
    const h = () => setIsAdmin(window.location.hash === '#admin')
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const selectTeam = k => { localStorage.setItem('leaderTeam', k); setMyTeam(k) }

  const campInfo      = getCampInfo(now)
  const currentScores = allScores[campInfo ? campInfo.campKey : 'west1']

  const nav = (newPage, isSecondary = false) => {
    const wasSecondary = !PRIMARY_PAGES.includes(page)
    if (isSecondary)       setAnimClass('slideInRight')
    else if (wasSecondary) setAnimClass('slideInLeft')
    else                   setAnimClass('tabFade')
    setPage(newPage)
  }

  const goBack = () => nav('home', false)

  const updateScore = async (campKey, team, delta) => {
    const cur = allScores[campKey] || DEFAULT_SCORES
    await setDoc(doc(db, 'scores', campKey), { ...cur, [team]: Math.max(0, (cur[team] || 0) + delta) })
  }

  // Splash
  if (showSplash && !isAdmin) {
    return (
      <ThemeCtx.Provider value={theme}>
        <SplashScreen onDone={() => { sessionStorage.setItem('splashShown', '1'); setShowSplash(false) }} />
      </ThemeCtx.Provider>
    )
  }

  // Team picker
  if (!myTeam && !isAdmin) {
    return (
      <ThemeCtx.Provider value={theme}>
        <TeamPicker onSelect={selectTeam} />
      </ThemeCtx.Provider>
    )
  }

  // Admin view — always dark, no theme context needed
  if (isAdmin) {
    if (!authChecked) return <div style={{ color: '#7A9E8E', textAlign: 'center', padding: 40 }}>Loading...</div>
    if (!user) return <AdminLogin />
    return (
      <div style={{ background: '#101813', minHeight: '100vh', color: '#F0EDDF', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
        <div style={{ padding: 'calc(14px + env(safe-area-inset-top,0px)) 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #E05C1A', background: '#101813', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C8E020', fontFamily: "'Oswald',sans-serif" }}>Admin</p>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, textTransform: 'uppercase', color: '#F0EDDF', fontFamily: "'Oswald',sans-serif", letterSpacing: '0.04em' }}>Camp Control</h1>
          </div>
          <button onClick={() => signOut(auth).then(() => window.location.hash = '')} style={{ background: '#172018', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '7px 12px', color: '#7A9E8E', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Sign Out</button>
        </div>
        <div style={{ maxWidth: 430, margin: '0 auto' }}>
          <AdminDashboard allScores={allScores} updateScore={updateScore} announcement={announcement} />
        </div>
      </div>
    )
  }

  // Leader view
  return (
    <ThemeCtx.Provider value={theme}>
      <div style={{ background: theme.bg, minHeight: '100vh', color: theme.text, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", position: 'relative', overflow: 'hidden' }}>

        {/* Header — home page only */}
        {page === 'home' && (
          <div style={{
            padding: `calc(14px + env(safe-area-inset-top,0px)) 16px 14px`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${theme.border}`,
            background: theme.bg,
            position: 'sticky', top: 0, zIndex: 10,
            backgroundImage: `repeating-linear-gradient(-45deg,${theme.headerStripe} 0px,${theme.headerStripe} 1px,transparent 1px,transparent 14px)`,
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.brand, fontFamily: "'Oswald',sans-serif", lineHeight: 1 }}>NW Kids</p>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: theme.text, fontFamily: "'Oswald',sans-serif", lineHeight: 1.1 }}>Summer Camp</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {myTeam && (
                <Tap onClick={() => setChangingTeam(true)} style={{ background: TEAM[myTeam].bg, border: `1px solid ${TEAM[myTeam].color}50`, borderRadius: 20, padding: '5px 11px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: TEAM[myTeam].color }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: TEAM[myTeam].color, fontFamily: "'Oswald',sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase' }}>{TEAM[myTeam].label}</span>
                </Tap>
              )}
              <Tap onClick={toggleTheme} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isDark ? <Sun size={17} color={theme.muted} strokeWidth={2} /> : <Moon size={17} color={theme.muted} strokeWidth={2} />}
              </Tap>
              <Tap onClick={() => setSearchOpen(true)} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={17} color={theme.muted} strokeWidth={2} />
              </Tap>
            </div>
          </div>
        )}

        {/* Page content */}
        <div key={page} style={{ animation: `${animClass} 260ms cubic-bezier(0.2,0,0,1) both` }}>
          {page === 'home'        && <HomeScreen    campInfo={campInfo} now={now} nav={nav} announcement={announcement} myTeam={myTeam} />}
          {page === 'schedule'    && <SchedulePage  campInfo={campInfo} now={now} myTeam={myTeam} />}
          {page === 'scoreboard'  && <ScoreboardPage scores={currentScores} />}
          {page === 'map'         && <MapPage />}
          {page === 'faq'         && <FAQPage       onBack={goBack} />}
          {page === 'rules'       && <RulesPage     onBack={goBack} />}
          {page === 'contacts'    && <ContactsPage  onBack={goBack} />}
          {page === 'freetime'    && <FreeTimePage  onBack={goBack} />}
        </div>

        <BottomNav page={page} nav={nav} />

        {searchOpen   && <SearchOverlay   onClose={() => setSearchOpen(false)}    nav={(p, s) => { nav(p, s); setSearchOpen(false) }} />}
        {changingTeam && <TeamChangeModal myTeam={myTeam} onSelect={selectTeam}   onClose={() => setChangingTeam(false)} />}
      </div>
    </ThemeCtx.Provider>
  )
}
