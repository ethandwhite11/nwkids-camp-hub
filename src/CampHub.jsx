import { useState, useEffect } from 'react'
import { db, auth } from './firebase'
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg:'#0D3F2F',surface:'#154030',border:'rgba(255,255,255,0.09)',
  accent:'#E05C1A',accentBg:'rgba(224,92,26,0.15)',accentBdr:'rgba(224,92,26,0.45)',
  yellow:'#C8E020',yellowBg:'rgba(200,224,32,0.12)',yellowBdr:'rgba(200,224,32,0.40)',
  text:'#F0EDDF',muted:'#7A9E8E',mutedLight:'#9BBFAF',
  green:'#52CC96',greenBg:'rgba(82,204,150,0.12)',
  blue:'#4A90E2',purple:'#B87AFF',
}

const TEAM = {
  red:   {color:'#FF4D4D',bg:'rgba(255,77,77,0.15)',   label:'Red'},
  yellow:{color:'#FFD700',bg:'rgba(255,215,0,0.15)',   label:'Yellow'},
  green: {color:'#4CAF50',bg:'rgba(76,175,80,0.15)',   label:'Green'},
  blue:  {color:'#4A90E2',bg:'rgba(74,144,226,0.15)',  label:'Blue'},
}

const DEFAULT_SCORES = { red:0, yellow:0, green:0, blue:0 }

// ─── SCHEDULE DATA ────────────────────────────────────────────────────────────
const SCHEDULE = {
  1:[
    {time:'4:00P',label:'Check-In',emoji:'🏕️'},
    {time:'5:30P',label:'Dinner',emoji:'🍽️'},
    {time:'7:30P',label:'Orientation',emoji:'📋'},
    {time:'9:30P',label:'Flush & Brush',emoji:'🦷'},
    {time:'10:00P',label:'Lights Out',emoji:'🌙'},
  ],
  '2-3':[
    {time:'8:00A',label:'Breakfast',emoji:'🥞'},
    {time:'9:00A',label:'Cabin Clean Up',emoji:'🧹'},
    {time:'9:30A',label:'Chapel',emoji:'✝️'},
    {time:'12:00P',label:'Lunch',emoji:'🥪'},
    {time:'1:00P',label:'Rotation 1',emoji:'🔄',isRotation:true,rotNum:1},
    {time:'2:00P',label:'Rotation 2',emoji:'🔄',isRotation:true,rotNum:2},
    {time:'3:00P',label:'Rotation 3',emoji:'🔄',isRotation:true,rotNum:3},
    {time:'4:00P',label:'Rotation 4',emoji:'🔄',isRotation:true,rotNum:4},
    {time:'5:30P',label:'Dinner',emoji:'🍽️'},
    {time:'6:30P',label:'Cabin Time',emoji:'🏡'},
    {time:'7:30P',label:'Response Chapel',emoji:'✝️'},
    {time:'9:30P',label:'Flush & Brush',emoji:'🦷'},
    {time:'10:00P',label:'Lights Out',emoji:'🌙'},
  ],
  4:[
    {time:'7:30A',label:'Pack Up',emoji:'🎒'},
    {time:'8:00A',label:'Breakfast',emoji:'🥞'},
    {time:'9:00A',label:'Closing Chapel',emoji:'✝️'},
    {time:'9:30A',label:'Departure',emoji:'👋'},
  ],
}

const ROTATIONS = {
  2:{
    1:{yellow:'Lake',green:'Lake',blue:'Snack Shack',red:'Field Games'},
    2:{yellow:'Lake',green:'Lake',blue:'Field Games',red:'Snack Shack'},
    3:{yellow:'Snack Shack',green:'Field Games',blue:'Lake',red:'Lake'},
    4:{yellow:'Field Games',green:'Snack Shack',blue:'Lake',red:'Lake'},
  },
  3:{
    1:{yellow:'Snack Shack',green:'Field Games',blue:'Lake',red:'Lake'},
    2:{yellow:'Field Games',green:'Snack Shack',blue:'Lake',red:'Lake'},
    3:{yellow:'Lake',green:'Lake',blue:'Field Games',red:'Snack Shack'},
    4:{yellow:'Lake',green:'Lake',blue:'Snack Shack',red:'Field Games'},
  },
}

const FAQ = [
  {q:'What do I do if a camper gets hurt?',a:'For minor injuries, use the first aid kit in the supply cabin. For anything serious, call the nurse at ext. 105 immediately and stay with the camper until help arrives.'},
  {q:'What if a camper is homesick?',a:'Acknowledge their feelings and redirect attention to an upcoming activity. If it escalates, notify leadership. Don\'t promise calls home without checking first.'},
  {q:'Can campers use their phones?',a:'Phones are collected at check-in and returned at departure. Emergency parent contact goes through the main office only.'},
  {q:'What is the protocol for a missing camper?',a:'Do not panic in front of other campers. Quick scan of immediate area, then immediately call the camp director. Never leave your group to search alone.'},
  {q:'When is quiet time?',a:'Quiet hours are 10:00 PM to 7:30 AM. All campers should be in their cabins and settled.'},
]

const RULES = [
  'Leaders are responsible for their group at all times — know where your campers are.',
  'No camper should ever be alone with a single adult. Two-adult rule applies everywhere.',
  'Phones stay with camp leadership. Direct any camper requests to the main office.',
  'All medical needs go through the camp nurse, even minor ones.',
  'No swimming without a lifeguard present. Lake access only during scheduled rotation.',
  'Report behavioral concerns to leadership immediately — don\'t handle major issues alone.',
  'Lights Out means quiet in cabins. Stay present until campers are settled.',
  'Encourage positive competition only. Respect all team colors.',
]

const CONTACTS = [
  {name:'Ethan',role:'Kids Pastor · Camp Director',note:'Main contact for anything'},
  {name:'Camp Nurse',role:'All medical needs',note:'Ext. 105 · Main lodge'},
  {name:'Front Desk',role:'Facilities & logistics',note:'Main building entrance'},
  {name:'Security',role:'Safety emergencies',note:'Call 911 first, then notify Ethan'},
]

const FREE_TIME = [
  {icon:'🏊',name:'Lake & Swimming',note:'Open swim hours only, lifeguard must be present'},
  {icon:'🏓',name:'Ping Pong',note:'Tables in the rec hall — open all day'},
  {icon:'🎨',name:'Crafts',note:'Art supplies in Cabin B · Open 2:00–5:00 PM'},
  {icon:'🏀',name:'Basketball',note:'Court near Field B · Pick-up games welcome'},
  {icon:'📖',name:'Library / Reading',note:'Quiet room in main lodge'},
  {icon:'🎮',name:'Board Games',note:'Available at the rec hall desk'},
  {icon:'🌲',name:'Nature Trail',note:'Self-guided · Map posted at main entrance'},
]

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function parseTime(t) {
  const p=t.slice(-1);const[h,m]=t.slice(0,-1).split(':').map(Number)
  let hr=h;if(p==='P'&&h!==12)hr+=12;if(p==='A'&&h===12)hr=0
  return hr*60+(m||0)
}
function dispTime(t){return t.slice(0,-1)+(t.endsWith('A')?' AM':' PM')}

function getCampInfo(now) {
  const mo=now.getMonth()+1,d=now.getDate(),y=now.getFullYear()
  const tm=now.getHours()*60+now.getMinutes()
  if(y===2026&&mo===8){
    if(d===2)return{camp:'West One',campKey:'west1',day:1}
    if(d===3)return{camp:'West One',campKey:'west1',day:2}
    if(d===4)return{camp:'West One',campKey:'west1',day:3}
    if(d===5&&tm<parseTime('9:30A'))return{camp:'West One',campKey:'west1',day:4}
    if(d===5&&tm>=parseTime('4:00P'))return{camp:'West Two',campKey:'west2',day:1}
    if(d===6)return{camp:'West Two',campKey:'west2',day:2}
    if(d===7)return{camp:'West Two',campKey:'west2',day:3}
    if(d===8&&tm<parseTime('9:30A'))return{camp:'West Two',campKey:'west2',day:4}
  }
  return null
}

function getSchedule(day) {
  if(day===1)return SCHEDULE[1]
  if(day===2||day===3)return SCHEDULE['2-3']
  if(day===4)return SCHEDULE[4]
  return[]
}

function getCurrentActivity(sched,now) {
  const tm=now.getHours()*60+now.getMinutes()
  for(let i=0;i<sched.length;i++){
    const s=parseTime(sched[i].time),e=i<sched.length-1?parseTime(sched[i+1].time):24*60
    if(tm>=s&&tm<e)return{current:sched[i],next:sched[i+1]||null,minIn:tm-s}
  }
  if(tm<parseTime(sched[0].time))return{current:null,next:sched[0],minUntil:parseTime(sched[0].time)-tm}
  return{current:sched[sched.length-1],next:null,minIn:0}
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function SCard({children,style}){
  return <div style={{background:C.surface,borderRadius:14,border:`1px solid ${C.border}`,padding:'14px 16px',marginBottom:10,...style}}>{children}</div>
}
function SecLabel({children}){
  return <p style={{margin:'20px 0 10px',fontSize:11,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:C.muted}}>{children}</p>
}
function BackHeader({title,onBack}){
  return(
    <div style={{padding:'14px 16px',display:'flex',alignItems:'center',gap:12,borderBottom:`1px solid ${C.border}`,background:C.bg,position:'sticky',top:0,zIndex:10}}>
      <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',color:C.accent,fontSize:26,padding:0,lineHeight:1}}>‹</button>
      <h2 style={{margin:0,fontSize:18,fontWeight:700,color:C.text}}>{title}</h2>
    </div>
  )
}

// ─── NOW BANNER ───────────────────────────────────────────────────────────────
function NowBanner({campInfo,now}){
  if(!campInfo){
    const before=now<new Date('2026-08-02')
    const days=Math.ceil((new Date('2026-08-02')-now)/(1000*60*60*24))
    return(
      <SCard>
        <p style={{margin:0,fontSize:12,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:C.muted}}>Camp Status</p>
        <p style={{margin:'4px 0 0',fontSize:20,fontWeight:800,color:C.text}}>
          {before?`West One starts in ${days} days`:'Camp has wrapped. See you next year.'}
        </p>
      </SCard>
    )
  }
  const sched=getSchedule(campInfo.day)
  const{current,next,minIn,minUntil}=getCurrentActivity(sched,now)
  const rots=(campInfo.day===2||campInfo.day===3)?ROTATIONS[campInfo.day]:null
  const isRot=current?.isRotation
  return(
    <div style={{
      background:'linear-gradient(150deg,#1D5A3F 0%,#0A3025 100%)',
      borderRadius:16,padding:18,marginBottom:12,
      border:`1px solid ${C.accentBdr}`,
      backgroundImage:'repeating-linear-gradient(-45deg,rgba(255,255,255,0.02) 0px,rgba(255,255,255,0.02) 1px,transparent 1px,transparent 12px)',
    }}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <div style={{display:'flex',alignItems:'center',gap:7}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:C.green,boxShadow:`0 0 6px ${C.green}`}}/>
          <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:C.green}}>Live Now</span>
        </div>
        <span style={{fontSize:11,fontWeight:600,color:C.muted,background:C.surface,padding:'3px 10px',borderRadius:99,border:`1px solid ${C.border}`}}>
          {campInfo.camp} · Day {campInfo.day}
        </span>
      </div>
      {current?(
        <>
          <p style={{margin:'0 0 2px',fontSize:24,fontWeight:800,color:C.text,lineHeight:1.15}}>{current.emoji} {current.label}</p>
          {!isRot&&<p style={{margin:'0 0 10px',fontSize:12,color:C.muted}}>Started {minIn} min ago</p>}
          {isRot&&rots&&(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,margin:'10px 0 12px'}}>
              {Object.entries(TEAM).map(([k,t])=>(
                <div key={k} style={{background:t.bg,borderRadius:9,padding:'7px 11px',display:'flex',alignItems:'center',gap:7,border:`1px solid ${t.color}25`}}>
                  <div style={{width:9,height:9,borderRadius:'50%',background:t.color,flexShrink:0}}/>
                  <div>
                    <p style={{margin:0,fontSize:10,fontWeight:700,color:t.color,textTransform:'uppercase',letterSpacing:'0.04em'}}>{t.label}</p>
                    <p style={{margin:0,fontSize:13,fontWeight:600,color:C.text}}>{rots[current.rotNum]?.[k]||'—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {next&&(
            <div style={{borderTop:`1px solid ${C.border}`,paddingTop:8,display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:'0.06em',textTransform:'uppercase'}}>Next</span>
              <span style={{fontSize:13,fontWeight:600,color:C.mutedLight}}>{next.emoji} {next.label} · {dispTime(next.time)}</span>
            </div>
          )}
        </>
      ):(
        <p style={{margin:'4px 0 0',fontSize:18,fontWeight:700,color:C.text}}>
          {next?.emoji} {next?.label} starts in {minUntil} min
        </p>
      )}
    </div>
  )
}

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────
const CARDS=[
  {id:'schedule',emoji:'📅',label:'Schedule',sub:'Full daily timeline',wide:true},
  {id:'scoreboard',emoji:'🏆',label:'Camp Cup',sub:'Live team scores'},
  {id:'map',emoji:'🗺️',label:'Map',sub:'Camp layout'},
  {id:'faq',emoji:'❓',label:'FAQ',sub:'Common questions'},
  {id:'rules',emoji:'📋',label:'Rules',sub:'Camp guidelines'},
  {id:'contacts',emoji:'👥',label:'Contacts',sub:'Leadership team'},
  {id:'freetime',emoji:'🎯',label:'Free Time',sub:'Things to do'},
]

function HomeScreen({campInfo,now,nav,announcement}){
  return(
    <div style={{padding:'16px 16px 32px'}}>
      {announcement&&(
        <div style={{background:C.yellowBg,border:`1px solid ${C.yellowBdr}`,borderRadius:12,padding:'10px 14px',marginBottom:12,display:'flex',gap:10,alignItems:'flex-start'}}>
          <span style={{fontSize:16,flexShrink:0}}>📢</span>
          <p style={{margin:0,fontSize:14,fontWeight:600,color:C.yellow,lineHeight:1.4}}>{announcement}</p>
        </div>
      )}
      <NowBanner campInfo={campInfo} now={now}/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        {CARDS.map(card=>(
          <button key={card.id} onClick={()=>nav(card.id)} style={{
            gridColumn:card.wide?'1 / -1':'auto',
            background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,
            padding:card.wide?'16px 20px':'18px 16px',
            cursor:'pointer',textAlign:'left',
            display:card.wide?'flex':'block',alignItems:'center',gap:14,
          }}>
            <span style={{fontSize:card.wide?28:32,display:'block',marginBottom:card.wide?0:10}}>{card.emoji}</span>
            <div style={{flex:1}}>
              <p style={{margin:0,fontSize:16,fontWeight:700,color:C.text}}>{card.label}</p>
              <p style={{margin:'3px 0 0',fontSize:12,color:C.muted}}>{card.sub}</p>
            </div>
            {card.wide&&<span style={{color:C.muted,fontSize:22}}>›</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── SCHEDULE PAGE ────────────────────────────────────────────────────────────
function SchedulePage({campInfo,now,onBack}){
  const[day,setDay]=useState(campInfo?.day||2)
  const sched=getSchedule(day)
  const tm=now.getHours()*60+now.getMinutes()
  const rots=(day===2||day===3)?ROTATIONS[day]:null
  return(
    <div>
      <BackHeader title="Schedule" onBack={onBack}/>
      <div style={{padding:'12px 16px 0',display:'flex',gap:8}}>
        {[1,2,3,4].map(d=>(
          <button key={d} onClick={()=>setDay(d)} style={{
            flex:1,padding:'8px 0',borderRadius:10,
            border:`1px solid ${day===d?C.accent:C.border}`,
            background:day===d?C.accentBg:'transparent',
            color:day===d?C.accent:C.muted,
            fontWeight:day===d?700:400,fontSize:13,cursor:'pointer',fontFamily:'inherit',
          }}>Day {d}</button>
        ))}
      </div>
      {rots&&<p style={{margin:'10px 16px 0',fontSize:11,color:C.muted,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em'}}>{day===2?'Monday / Thursday':'Tuesday / Friday'} Rotation</p>}
      <div style={{padding:'12px 16px 90px'}}>
        {sched.map((item,i)=>{
          const s=parseTime(item.time),e=i<sched.length-1?parseTime(sched[i+1].time):24*60
          const isCur=campInfo?.day===day&&tm>=s&&tm<e
          const isPast=campInfo?.day===day&&tm>=e
          return(
            <div key={i} style={{display:'flex',gap:10,alignItems:'stretch'}}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',width:56,paddingTop:10,flexShrink:0}}>
                <p style={{margin:0,fontSize:11,fontWeight:600,color:isCur?C.yellow:C.muted,whiteSpace:'nowrap'}}>{dispTime(item.time)}</p>
                {i<sched.length-1&&<div style={{flex:1,width:1,background:isCur?C.accent:C.border,marginTop:5,marginBottom:4}}/>}
              </div>
              <div style={{flex:1,marginBottom:6}}>
                <div style={{background:isCur?C.accentBg:C.surface,borderRadius:12,padding:'11px 14px',border:`1px solid ${isCur?C.accentBdr:C.border}`,opacity:isPast?0.4:1}}>
                  <p style={{margin:0,fontSize:14,fontWeight:isCur?700:500,color:isCur?C.yellow:C.text}}>{item.emoji} {item.label}</p>
                  {item.isRotation&&rots&&(
                    <div style={{marginTop:8,display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
                      {Object.entries(TEAM).map(([k,t])=>(
                        <div key={k} style={{display:'flex',alignItems:'center',gap:5}}>
                          <div style={{width:7,height:7,borderRadius:'50%',background:t.color,flexShrink:0}}/>
                          <span style={{fontSize:12,color:C.muted}}>{t.label}:</span>
                          <span style={{fontSize:12,fontWeight:600,color:C.text}}>{rots[item.rotNum]?.[k]}</span>
                        </div>
                      ))}
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
function ScoreboardPage({scores,onBack}){
  const sorted=[...Object.entries(scores)].sort(([,a],[,b])=>b-a)
  const medals=['🥇','🥈','🥉','4']
  return(
    <div>
      <BackHeader title="Camp Cup" onBack={onBack}/>
      <div style={{padding:'16px 16px 90px'}}>
        <p style={{margin:'0 0 16px',fontSize:11,color:C.muted,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em'}}>Live · Updates in real time</p>
        {sorted.map(([k,score],i)=>{
          const t=TEAM[k],leading=k===sorted[0][0]&&score>0
          return(
            <div key={k} style={{background:leading?t.bg:C.surface,borderRadius:16,padding:'16px 20px',marginBottom:10,border:`1px solid ${leading?t.color+'60':C.border}`,display:'flex',alignItems:'center',gap:14}}>
              <span style={{fontSize:22,width:28,textAlign:'center'}}>{medals[i]}</span>
              <div style={{width:14,height:14,borderRadius:'50%',background:t.color,flexShrink:0}}/>
              <p style={{margin:0,fontSize:17,fontWeight:700,color:C.text,flex:1}}>{t.label} Team</p>
              <p style={{margin:0,fontSize:30,fontWeight:800,color:leading?t.color:C.text,minWidth:50,textAlign:'right'}}>{score}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── MAP ──────────────────────────────────────────────────────────────────────
function MapPage({onBack}){
  return(
    <div>
      <BackHeader title="Camp Map" onBack={onBack}/>
      <div style={{padding:'16px 16px 90px'}}>
        <SCard style={{padding:16}}>
          <svg viewBox="0 0 320 260" style={{width:'100%',height:'auto'}}>
            <rect x="8" y="8" width="145" height="75" rx="8" fill="rgba(82,204,150,0.12)" stroke="#52CC96" strokeWidth="1.5"/>
            <text x="80" y="40" textAnchor="middle" fill="#52CC96" fontSize="11" fontWeight="bold" fontFamily="system-ui">Main Lodge</text>
            <text x="80" y="58" textAnchor="middle" fill="#7A9E8E" fontSize="9" fontFamily="system-ui">Chapel · Dining · Office</text>
            <rect x="167" y="8" width="145" height="75" rx="8" fill="rgba(74,144,226,0.12)" stroke="#4A90E2" strokeWidth="1.5"/>
            <text x="239" y="40" textAnchor="middle" fill="#4A90E2" fontSize="11" fontWeight="bold" fontFamily="system-ui">Lake Area</text>
            <text x="239" y="58" textAnchor="middle" fill="#7A9E8E" fontSize="9" fontFamily="system-ui">Swimming · Waterfront</text>
            <rect x="8" y="100" width="95" height="68" rx="8" fill="rgba(224,92,26,0.12)" stroke="#E05C1A" strokeWidth="1.5"/>
            <text x="55" y="132" textAnchor="middle" fill="#E05C1A" fontSize="10" fontWeight="bold" fontFamily="system-ui">Field Games</text>
            <text x="55" y="150" textAnchor="middle" fill="#7A9E8E" fontSize="8" fontFamily="system-ui">Sports fields</text>
            <rect x="113" y="100" width="95" height="68" rx="8" fill="rgba(200,224,32,0.12)" stroke="#C8E020" strokeWidth="1.5"/>
            <text x="160" y="132" textAnchor="middle" fill="#C8E020" fontSize="10" fontWeight="bold" fontFamily="system-ui">Snack Shack</text>
            <text x="160" y="150" textAnchor="middle" fill="#7A9E8E" fontSize="8" fontFamily="system-ui">Refreshments</text>
            <rect x="218" y="100" width="94" height="68" rx="8" fill="rgba(255,77,77,0.12)" stroke="#FF4D4D" strokeWidth="1.5"/>
            <text x="265" y="132" textAnchor="middle" fill="#FF4D4D" fontSize="10" fontWeight="bold" fontFamily="system-ui">Cabins</text>
            <text x="265" y="150" textAnchor="middle" fill="#7A9E8E" fontSize="8" fontFamily="system-ui">A · B · C · D</text>
            <rect x="8" y="185" width="304" height="62" rx="8" fill="rgba(122,158,142,0.1)" stroke="rgba(122,158,142,0.3)" strokeWidth="1.5"/>
            <text x="160" y="213" textAnchor="middle" fill="#9BBFAF" fontSize="10" fontWeight="bold" fontFamily="system-ui">Rec Hall</text>
            <text x="160" y="230" textAnchor="middle" fill="#7A9E8E" fontSize="8" fontFamily="system-ui">Ping Pong · Board Games · Indoor Activities</text>
          </svg>
        </SCard>
        <p style={{fontSize:11,color:C.muted,textAlign:'center',marginTop:4}}>Placeholder — replace with actual camp map image</p>
      </div>
    </div>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQPage({onBack}){
  const[open,setOpen]=useState(null)
  return(
    <div>
      <BackHeader title="FAQ" onBack={onBack}/>
      <div style={{padding:'16px 16px 90px'}}>
        {FAQ.map((item,i)=>(
          <div key={i} style={{background:C.surface,borderRadius:14,border:`1px solid ${open===i?C.accentBdr:C.border}`,marginBottom:8,overflow:'hidden'}}>
            <button onClick={()=>setOpen(open===i?null:i)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',padding:'14px 16px',background:'none',border:'none',cursor:'pointer',textAlign:'left',gap:10,fontFamily:'inherit'}}>
              <p style={{margin:0,fontSize:14,fontWeight:600,color:open===i?C.accent:C.text,flex:1}}>{item.q}</p>
              <span style={{color:C.muted,fontSize:18,transform:open===i?'rotate(90deg)':'none',transition:'transform 0.2s',flexShrink:0}}>›</span>
            </button>
            {open===i&&<div style={{padding:'10px 16px 14px',fontSize:13,color:C.muted,lineHeight:1.6,borderTop:`1px solid ${C.border}`}}>{item.a}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── RULES ────────────────────────────────────────────────────────────────────
function RulesPage({onBack}){
  return(
    <div>
      <BackHeader title="Rules" onBack={onBack}/>
      <div style={{padding:'16px 16px 90px'}}>
        {RULES.map((rule,i)=>(
          <SCard key={i} style={{display:'flex',gap:12,alignItems:'flex-start'}}>
            <div style={{width:24,height:24,borderRadius:7,background:C.accentBg,color:C.accent,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0,marginTop:1}}>{i+1}</div>
            <p style={{margin:0,fontSize:14,color:C.text,lineHeight:1.55,flex:1}}>{rule}</p>
          </SCard>
        ))}
      </div>
    </div>
  )
}

// ─── CONTACTS ────────────────────────────────────────────────────────────────
function ContactsPage({onBack}){
  return(
    <div>
      <BackHeader title="Contacts" onBack={onBack}/>
      <div style={{padding:'16px 16px 90px'}}>
        <SCard style={{background:'rgba(255,59,48,0.08)',border:'1px solid rgba(255,59,48,0.2)'}}>
          <p style={{margin:'0 0 4px',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'#FF3B30'}}>🚨 Emergency</p>
          <p style={{margin:0,fontSize:14,color:C.text}}>Call <strong>911</strong> first for any life-threatening situation, then alert Ethan.</p>
        </SCard>
        {CONTACTS.map((c,i)=>(
          <SCard key={i}>
            <p style={{margin:'0 0 2px',fontSize:15,fontWeight:700,color:C.text}}>{c.name}</p>
            <p style={{margin:'0 0 6px',fontSize:13,color:C.accent}}>{c.role}</p>
            <p style={{margin:0,fontSize:12,color:C.muted}}>{c.note}</p>
          </SCard>
        ))}
      </div>
    </div>
  )
}

// ─── FREE TIME ────────────────────────────────────────────────────────────────
function FreeTimePage({onBack}){
  return(
    <div>
      <BackHeader title="Free Time" onBack={onBack}/>
      <div style={{padding:'16px 16px 90px'}}>
        <p style={{margin:'0 0 16px',fontSize:13,color:C.muted}}>Activities available during unstructured time</p>
        {FREE_TIME.map((item,i)=>(
          <SCard key={i} style={{display:'flex',gap:14,alignItems:'center'}}>
            <span style={{fontSize:26,flexShrink:0}}>{item.icon}</span>
            <div>
              <p style={{margin:'0 0 2px',fontSize:15,fontWeight:700,color:C.text}}>{item.name}</p>
              <p style={{margin:0,fontSize:12,color:C.muted}}>{item.note}</p>
            </div>
          </SCard>
        ))}
      </div>
    </div>
  )
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────
const SEARCHABLE=[
  ...FAQ.map(f=>({type:'FAQ',title:f.q,body:f.a,page:'faq'})),
  ...RULES.map((r,i)=>({type:'Rule',title:`Rule ${i+1}`,body:r,page:'rules'})),
  ...CONTACTS.map(c=>({type:'Contact',title:c.name,body:`${c.role} · ${c.note}`,page:'contacts'})),
  ...FREE_TIME.map(f=>({type:'Free Time',title:f.name,body:f.note,page:'freetime'})),
  {type:'Page',title:'Schedule',body:'Daily timeline rotations activities',page:'schedule'},
  {type:'Page',title:'Map',body:'Camp layout directions areas buildings',page:'map'},
  {type:'Page',title:'Camp Cup',body:'Team scores Red Yellow Green Blue points',page:'scoreboard'},
]

function SearchOverlay({onClose,nav}){
  const[q,setQ]=useState('')
  const results=q.length>1?SEARCHABLE.filter(r=>r.title.toLowerCase().includes(q.toLowerCase())||r.body.toLowerCase().includes(q.toLowerCase())).slice(0,8):[]
  return(
    <div style={{position:'fixed',inset:0,background:C.bg,zIndex:100,display:'flex',flexDirection:'column'}}>
      <div style={{padding:'14px 16px',display:'flex',gap:10,alignItems:'center',borderBottom:`1px solid ${C.border}`}}>
        <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search everything..." style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 14px',fontSize:16,color:C.text,outline:'none',fontFamily:'inherit'}}/>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,fontSize:15,fontWeight:600,fontFamily:'inherit'}}>Cancel</button>
      </div>
      <div style={{padding:'12px 16px',flex:1,overflowY:'auto'}}>
        {results.length>0?results.map((r,i)=>(
          <button key={i} onClick={()=>nav(r.page)} style={{display:'block',width:'100%',background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:'12px 14px',marginBottom:8,textAlign:'left',cursor:'pointer',fontFamily:'inherit'}}>
            <span style={{fontSize:10,fontWeight:700,color:C.accent,textTransform:'uppercase',letterSpacing:'0.06em',background:C.accentBg,padding:'2px 7px',borderRadius:4}}>{r.type}</span>
            <p style={{margin:'5px 0 2px',fontSize:14,fontWeight:600,color:C.text}}>{r.title}</p>
            <p style={{margin:0,fontSize:12,color:C.muted}}>{r.body.substring(0,90)}{r.body.length>90?'…':''}</p>
          </button>
        )):q.length>1?<p style={{color:C.muted,textAlign:'center',marginTop:40,fontSize:14}}>No results for "{q}"</p>:<p style={{color:C.muted,textAlign:'center',marginTop:40,fontSize:14}}>Type to search schedule, FAQ, rules, and more</p>}
      </div>
    </div>
  )
}

// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
function AdminLogin({onLogin}){
  const[email,setEmail]=useState('')
  const[pass,setPass]=useState('')
  const[error,setError]=useState('')
  const[loading,setLoading]=useState(false)
  const submit=async(e)=>{
    e.preventDefault()
    setLoading(true);setError('')
    try{await signInWithEmailAndPassword(auth,email,pass);onLogin()}
    catch(err){setError('Invalid email or password.');setLoading(false)}
  }
  return(
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
      <p style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:C.yellow,marginBottom:4}}>NW Kids</p>
      <h1 style={{fontFamily:"'Oswald',sans-serif",fontSize:24,fontWeight:700,textTransform:'uppercase',color:C.text,marginBottom:2}}>Admin Panel</h1>
      <p style={{fontSize:13,color:C.muted,marginBottom:28}}>Sign in to manage scores and announcements</p>
      <form onSubmit={submit} style={{width:'100%',maxWidth:340}}>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" required
          style={{display:'block',width:'100%',marginBottom:10,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:'12px 14px',fontSize:15,color:C.text,outline:'none',fontFamily:'inherit'}}/>
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password" required
          style={{display:'block',width:'100%',marginBottom:16,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:'12px 14px',fontSize:15,color:C.text,outline:'none',fontFamily:'inherit'}}/>
        {error&&<p style={{color:'#FF4D4D',fontSize:13,marginBottom:12,textAlign:'center'}}>{error}</p>}
        <button type="submit" disabled={loading} style={{width:'100%',padding:'13px',borderRadius:10,background:C.accent,border:'none',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:loading?0.6:1}}>
          {loading?'Signing in…':'Sign In'}
        </button>
      </form>
    </div>
  )
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
function AdminDashboard({allScores,campInfo,updateScore,announcement,setAnnouncementText}){
  const[draft,setDraft]=useState(announcement||'')
  const[saving,setSaving]=useState(false)

  const postAnnouncement=async()=>{
    setSaving(true)
    await setDoc(doc(db,'announcement','current'),{text:draft,active:draft.trim().length>0})
    setSaving(false)
  }
  const clearAnnouncement=async()=>{
    setDraft('')
    await setDoc(doc(db,'announcement','current'),{text:'',active:false})
  }

  const ScorePanel=({campKey,campName})=>{
    const scores=allScores[campKey]||DEFAULT_SCORES
    const sorted=[...Object.entries(scores)].sort(([,a],[,b])=>b-a)
    return(
      <div style={{marginBottom:20}}>
        <SecLabel>{campName} Scores</SecLabel>
        {sorted.map(([k,score])=>{
          const t=TEAM[k]
          return(
            <div key={k} style={{background:C.surface,borderRadius:12,padding:'10px 14px',marginBottom:8,border:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:t.color,flexShrink:0}}/>
              <p style={{margin:0,fontSize:14,fontWeight:600,color:C.text,flex:1}}>{t.label}</p>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <button onClick={()=>updateScore(campKey,k,-10)} style={{width:34,height:34,borderRadius:8,border:`1px solid ${C.border}`,background:'transparent',color:C.muted,fontSize:20,cursor:'pointer',fontFamily:'inherit',lineHeight:1}}>−</button>
                <span style={{fontSize:22,fontWeight:800,color:C.text,minWidth:44,textAlign:'center'}}>{score}</span>
                <button onClick={()=>updateScore(campKey,k,10)} style={{width:34,height:34,borderRadius:8,border:`1px solid ${C.accentBdr}`,background:C.accentBg,color:C.accent,fontSize:20,cursor:'pointer',fontFamily:'inherit',lineHeight:1}}>+</button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return(
    <div style={{padding:'16px 16px 40px'}}>
      <ScorePanel campKey="west1" campName="West One"/>
      <ScorePanel campKey="west2" campName="West Two"/>

      <SecLabel>Announcement</SecLabel>
      <p style={{fontSize:12,color:C.muted,marginBottom:10}}>Shown as a banner to all leaders on the home screen.</p>
      {announcement&&(
        <div style={{background:C.yellowBg,border:`1px solid ${C.yellowBdr}`,borderRadius:10,padding:'10px 14px',marginBottom:10}}>
          <p style={{margin:'0 0 2px',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:C.yellow}}>Currently Live</p>
          <p style={{margin:0,fontSize:13,color:C.text}}>{announcement}</p>
        </div>
      )}
      <textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Type an announcement for all leaders…"
        style={{width:'100%',background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:'12px 14px',fontSize:14,color:C.text,outline:'none',fontFamily:'inherit',resize:'vertical',minHeight:80,marginBottom:10}}/>
      <div style={{display:'flex',gap:8}}>
        <button onClick={postAnnouncement} disabled={saving} style={{flex:1,padding:'11px',borderRadius:10,background:C.accent,border:'none',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
          {saving?'Saving…':'Post Announcement'}
        </button>
        {announcement&&(
          <button onClick={clearAnnouncement} style={{padding:'11px 16px',borderRadius:10,background:C.surface,border:`1px solid ${C.border}`,color:C.muted,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function CampHub(){
  const[page,setPage]=useState('home')
  const[search,setSearch]=useState(false)
  const[now,setNow]=useState(new Date())
  const[allScores,setAllScores]=useState({west1:DEFAULT_SCORES,west2:DEFAULT_SCORES})
  const[announcement,setAnnouncement]=useState('')
  const[user,setUser]=useState(null)
  const[authChecked,setAuthChecked]=useState(false)
  const[isAdmin,setIsAdmin]=useState(window.location.hash==='#admin')

  // Real time: scores
  useEffect(()=>{
    const initIfMissing=async(campKey)=>{
      const ref=doc(db,'scores',campKey)
      const snap=await getDoc(ref)
      if(!snap.exists())await setDoc(ref,DEFAULT_SCORES)
    }
    const u1=onSnapshot(doc(db,'scores','west1'),snap=>{
      if(snap.exists())setAllScores(p=>({...p,west1:snap.data()}))
      else initIfMissing('west1')
    })
    const u2=onSnapshot(doc(db,'scores','west2'),snap=>{
      if(snap.exists())setAllScores(p=>({...p,west2:snap.data()}))
      else initIfMissing('west2')
    })
    return()=>{u1();u2()}
  },[])

  // Real time: announcement
  useEffect(()=>{
    return onSnapshot(doc(db,'announcement','current'),snap=>{
      if(snap.exists()&&snap.data().active)setAnnouncement(snap.data().text)
      else setAnnouncement('')
    })
  },[])

  // Auth state
  useEffect(()=>{
    return onAuthStateChanged(auth,u=>{setUser(u);setAuthChecked(true)})
  },[])

  // Hash detection for admin mode
  useEffect(()=>{
    const onHash=()=>setIsAdmin(window.location.hash==='#admin')
    window.addEventListener('hashchange',onHash)
    return()=>window.removeEventListener('hashchange',onHash)
  },[])

  // Clock tick
  useEffect(()=>{
    const t=setInterval(()=>setNow(new Date()),60000)
    return()=>clearInterval(t)
  },[])

  const campInfo=getCampInfo(now)
  const currentScores=allScores[campInfo?.campKey||'west1']
  const nav=(p)=>setPage(p)
  const goHome=()=>setPage('home')

  const updateScore=async(campKey,team,delta)=>{
    const cur=allScores[campKey]||DEFAULT_SCORES
    const newVal=Math.max(0,(cur[team]||0)+delta)
    await setDoc(doc(db,'scores',campKey),{...cur,[team]:newVal})
  }

  // ── Admin view ──
  if(isAdmin){
    if(!authChecked)return <div style={{color:C.muted,textAlign:'center',padding:40}}>Loading…</div>
    if(!user)return <AdminLogin onLogin={()=>{}}/>
    return(
      <div style={{background:C.bg,minHeight:'100vh',color:C.text,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>
        <div style={{padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`2px solid ${C.accent}`,background:C.bg,position:'sticky',top:0,zIndex:10}}>
          <div>
            <p style={{margin:0,fontSize:11,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:C.yellow,fontFamily:"'Oswald',sans-serif"}}>Admin</p>
            <h1 style={{margin:0,fontSize:20,fontWeight:700,textTransform:'uppercase',color:C.text,fontFamily:"'Oswald',sans-serif"}}>Camp Control</h1>
          </div>
          <button onClick={()=>signOut(auth).then(()=>window.location.hash='')} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:'7px 12px',color:C.muted,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
            Sign Out
          </button>
        </div>
        <div style={{maxWidth:430,margin:'0 auto'}}>
          <AdminDashboard allScores={allScores} campInfo={campInfo} updateScore={updateScore} announcement={announcement} setAnnouncementText={setAnnouncement}/>
        </div>
      </div>
    )
  }

  // ── Leader view ──
  return(
    <div style={{background:C.bg,minHeight:'100vh',color:C.text,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>
      {page==='home'&&(
        <div style={{
          padding:'16px 16px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',
          borderBottom:`1px solid ${C.border}`,background:C.bg,position:'sticky',top:0,zIndex:10,
          backgroundImage:'repeating-linear-gradient(-45deg,rgba(255,255,255,0.015) 0px,rgba(255,255,255,0.015) 1px,transparent 1px,transparent 14px)',
        }}>
          <div>
            <p style={{margin:0,fontSize:15,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:C.yellow,fontFamily:"'Oswald',sans-serif",lineHeight:1}}>NW Kids</p>
            <h1 style={{margin:0,fontSize:22,fontWeight:700,letterSpacing:'0.04em',textTransform:'uppercase',color:C.text,fontFamily:"'Oswald',sans-serif",lineHeight:1.1}}>Summer Camp</h1>
          </div>
          <button onClick={()=>setSearch(true)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:18}}>🔍</button>
        </div>
      )}

      {page==='home'      &&<HomeScreen campInfo={campInfo} now={now} nav={nav} announcement={announcement}/>}
      {page==='schedule'  &&<SchedulePage campInfo={campInfo} now={now} onBack={goHome}/>}
      {page==='scoreboard'&&<ScoreboardPage scores={currentScores} onBack={goHome}/>}
      {page==='map'       &&<MapPage onBack={goHome}/>}
      {page==='faq'       &&<FAQPage onBack={goHome}/>}
      {page==='rules'     &&<RulesPage onBack={goHome}/>}
      {page==='contacts'  &&<ContactsPage onBack={goHome}/>}
      {page==='freetime'  &&<FreeTimePage onBack={goHome}/>}

      {search&&<SearchOverlay onClose={()=>setSearch(false)} nav={(p)=>{nav(p);setSearch(false)}}/>}
    </div>
  )
}
