'use client'

/* ═══ Holiday Atmosphere Effects ═════════════════════════════════════════
   Each holiday gets its own CSS particle system.
   These are PREVIEW ONLY — not yet wired into live holiday detection.
   Import HolidayAtmosphere and pass the holiday name string.
   ═════════════════════════════════════════════════════════════════════ */

/* ── Shared: night sky (reused for dark/evening holidays) ─────────────── */
const STARS = Array.from({length:22},(_,i)=>({x:(i*7.3)%92+4,y:(i*11.7)%55+30,s:1+(i%3),d:(i*0.35)%3,dur:2+i*0.28}))
function NightSky() {
  return (<>
    <style>{`@keyframes hTw{0%,100%{opacity:.2;transform:scale(1)}50%{opacity:1;transform:scale(1.5)}}`}</style>
    {STARS.map((s,i)=>(
      <div key={i} style={{position:'fixed',left:`${s.x}%`,top:`${s.y}%`,
        width:s.s*2,height:s.s*2,borderRadius:'50%',background:'white',
        animation:`hTw ${s.dur}s ease-in-out ${s.d}s infinite`,pointerEvents:'none',zIndex:8}}/>
    ))}
    <div style={{position:'fixed',right:'7%',top:'18%',width:54,height:54,borderRadius:'50%',
      background:'#FFF9C4',boxShadow:'0 0 22px 8px rgba(255,249,196,.3)',pointerEvents:'none',zIndex:8}}>
      <div style={{position:'absolute',left:12,top:14,width:12,height:12,borderRadius:'50%',background:'rgba(200,190,120,.3)'}}/>
      <div style={{position:'absolute',left:28,top:28,width:8,height:8,borderRadius:'50%',background:'rgba(200,190,120,.25)'}}/>
    </div>
  </>)
}

/* ── 1. New Year's Day 🎆 ─────────────────────────────────────────────── */
const NY_FW = Array.from({length:14},(_,i)=>({
  x:4+(i*7)%90, y:4+(i*9)%42,
  color:['#FFD700','#FF6B6B','#4ECDC4','#FF69B4','#FFA500','#DDA0DD','#98FB98'][i%7],
  delay:i*0.28, dur:1.7+(i%4)*0.3, size:40+(i%4)*22,
}))
function NewYearsAtmosphere() {
  return (<>
    <style>{`
      @keyframes nyFw{0%{opacity:0;transform:scale(0)}18%{opacity:1;transform:scale(1.35)}60%{opacity:.7}100%{opacity:0;transform:scale(.2)}}
      @keyframes nyRise{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-110px) scale(.4)}}
    `}</style>
    <NightSky/>
    {NY_FW.map((f,i)=>(
      <div key={i} style={{position:'fixed',left:`${f.x}%`,top:`${f.y}%`,
        width:f.size,height:f.size,borderRadius:'50%',
        background:`radial-gradient(circle,${f.color} 0%,${f.color}55 45%,transparent 72%)`,
        boxShadow:`0 0 ${Math.round(f.size/3)}px ${f.color}99`,
        animation:`nyFw ${f.dur}s ease-out ${f.delay}s infinite`,
        pointerEvents:'none',zIndex:9}}/>
    ))}
    {['🎆','🥂','🎉','✨','🎆','🥂'].map((e,i)=>(
      <div key={i} style={{position:'fixed',left:`${8+i*16}%`,bottom:'20%',
        fontSize:22,animation:`nyRise ${2.2+i*.2}s ease-out ${i*.55}s infinite`,
        pointerEvents:'none',zIndex:12}}>{e}</div>
    ))}
  </>)
}

/* ── 2. MLK Day 🕊️ ───────────────────────────────────────────────────── */
const DOVE_DATA = Array.from({length:6},(_,i)=>({y:12+i*11,delay:i*1.3,dur:9+i*1.2}))
const GOLD_PTS  = Array.from({length:10},(_,i)=>({x:8+i*9,y:18+i*6,delay:i*.5,dur:3+i*.25}))
function MLKAtmosphere() {
  return (<>
    <style>{`
      @keyframes doveFly{0%{opacity:0;transform:translateX(-80px)}8%{opacity:1}92%{opacity:.9}100%{opacity:0;transform:translateX(105vw)}}
      @keyframes goldFloat{0%{opacity:.85;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-85px) scale(.5)}}
    `}</style>
    <div style={{position:'fixed',inset:0,
      background:'linear-gradient(to bottom,rgba(135,206,235,.14) 0%,transparent 60%)',
      pointerEvents:'none',zIndex:7}}/>
    {DOVE_DATA.map((d,i)=>(
      <div key={i} style={{position:'fixed',top:`${d.y}%`,left:0,
        fontSize:26,animation:`doveFly ${d.dur}s linear ${d.delay}s infinite`,
        pointerEvents:'none',zIndex:11}}>🕊️</div>
    ))}
    {GOLD_PTS.map((p,i)=>(
      <div key={i} style={{position:'fixed',left:`${p.x}%`,top:`${p.y}%`,
        fontSize:13,color:'#FFD700',
        animation:`goldFloat ${p.dur}s ease-out ${p.delay}s infinite`,
        pointerEvents:'none',zIndex:10}}>✦</div>
    ))}
    <div style={{position:'fixed',left:'50%',top:'10%',transform:'translateX(-50%)',
      fontSize:36,animation:'goldFloat 4s ease-in-out .5s infinite',
      pointerEvents:'none',zIndex:11}}>✊</div>
  </>)
}

/* ── 3. Presidents' Day 🎩 ────────────────────────────────────────────── */
const PRES_STARS = Array.from({length:22},(_,i)=>({
  x:(i*11.7)%90+3, delay:i*.22, dur:3+i*.18,
  color:['#FF4136','#FFFFFF','#0074D9'][i%3], size:9+(i%3)*5,
}))
function PresidentsDayAtmosphere() {
  return (<>
    <style>{`@keyframes presDrift{0%{opacity:0;transform:translateY(-20px) rotate(0)}18%{opacity:1}82%{opacity:.7}100%{opacity:0;transform:translateY(90px) rotate(200deg)}}`}</style>
    <div style={{position:'fixed',inset:0,
      background:'linear-gradient(to bottom,rgba(0,116,217,.07) 0%,rgba(255,65,54,.05) 100%)',
      pointerEvents:'none',zIndex:7}}/>
    {PRES_STARS.map((s,i)=>(
      <div key={i} style={{position:'fixed',left:`${s.x}%`,top:'3%',
        fontSize:s.size,color:s.color,
        textShadow:s.color==='#FFFFFF'?'0 0 4px rgba(0,0,0,.4)':undefined,
        animation:`presDrift ${s.dur}s ease-in-out ${s.delay}s infinite`,
        pointerEvents:'none',zIndex:10}}>★</div>
    ))}
    <div style={{position:'fixed',right:'9%',top:'10%',
      fontSize:52,animation:'presDrift 5s ease-in-out .3s infinite',
      pointerEvents:'none',zIndex:11}}>🎩</div>
    <div style={{position:'fixed',left:'8%',top:'14%',
      fontSize:44,animation:'presDrift 6s ease-in-out 1s infinite',
      pointerEvents:'none',zIndex:11}}>🦅</div>
  </>)
}

/* ── 4. Good Friday 🌸 ────────────────────────────────────────────────── */
const PETAL_DATA = Array.from({length:20},(_,i)=>({
  x:(i*4.8)%94, delay:i*.32, dur:5.5+(i%4)*1.5,
  color:['#F8BBD9','#E1BEE7','#FFE0B2','#DCEDC8','#D1C4E9'][i%5],
  size:9+(i%3)*5,
}))
function GoodFridayAtmosphere() {
  return (<>
    <style>{`@keyframes petalFall{0%{opacity:0;transform:translateY(-25px) rotate(0)}18%{opacity:.9}82%{opacity:.6}100%{opacity:0;transform:translateY(125px) rotate(190deg) translateX(28px)}}`}</style>
    <div style={{position:'fixed',inset:0,
      background:'linear-gradient(to bottom,rgba(180,120,220,.09) 0%,rgba(255,200,100,.05) 100%)',
      pointerEvents:'none',zIndex:7}}/>
    {[0,1,2].map(i=>(
      <div key={i} style={{position:'fixed',left:`${28+i*22}%`,top:0,width:2,height:'40%',
        background:'linear-gradient(to bottom,rgba(255,215,100,.32) 0%,transparent 100%)',
        transform:`rotate(${-6+i*6}deg)`,transformOrigin:'top center',
        pointerEvents:'none',zIndex:8}}/>
    ))}
    {PETAL_DATA.map((p,i)=>(
      <div key={i} style={{position:'fixed',left:`${p.x}%`,top:0,
        width:p.size,height:p.size,borderRadius:'0 50% 50% 50%',
        background:p.color,opacity:.85,
        animation:`petalFall ${p.dur}s ease-in ${p.delay}s infinite`,
        pointerEvents:'none',zIndex:10}}/>
    ))}
    <div style={{position:'fixed',left:'50%',top:'8%',transform:'translateX(-50%)',
      fontSize:40,animation:'petalFall 6s ease-in-out 0s infinite',
      pointerEvents:'none',zIndex:11}}>🌸</div>
  </>)
}

/* ── 5. Memorial Day 🌹 ───────────────────────────────────────────────── */
const POPPY_DATA = Array.from({length:14},(_,i)=>({x:(i*7)%92,delay:i*.38,dur:6.5+(i%3)*1.2}))
function MemorialDayAtmosphere() {
  return (<>
    <style>{`@keyframes poppyFall{0%{opacity:0;transform:translateY(-20px) rotate(0)}15%{opacity:1}85%{opacity:.75}100%{opacity:0;transform:translateY(120px) rotate(130deg)}}`}</style>
    <div style={{position:'fixed',inset:0,
      background:'linear-gradient(to bottom,rgba(0,74,217,.06) 0%,rgba(255,65,54,.04) 100%)',
      pointerEvents:'none',zIndex:7}}/>
    {POPPY_DATA.map((p,i)=>(
      <div key={i} style={{position:'fixed',left:`${p.x}%`,top:'2%',
        fontSize:20,animation:`poppyFall ${p.dur}s ease-in ${p.delay}s infinite`,
        pointerEvents:'none',zIndex:10}}>🌹</div>
    ))}
    {['⭐','⭐','⭐','⭐','⭐'].map((s,i)=>(
      <div key={i} style={{position:'fixed',left:`${12+i*19}%`,top:`${8+i*6}%`,
        fontSize:16,color:'#FFD700',opacity:.65,
        animation:`poppyFall ${4.5+i*.7}s ease-in ${i*.7}s infinite`,
        pointerEvents:'none',zIndex:10}}>{s}</div>
    ))}
    <div style={{position:'fixed',right:'6%',top:'8%',fontSize:48,
      animation:'poppyFall 7s ease-in-out 0s infinite',pointerEvents:'none',zIndex:11}}>🇺🇸</div>
  </>)
}

/* ── 6. Juneteenth 🎉 ─────────────────────────────────────────────────── */
const JUN_CONF = Array.from({length:30},(_,i)=>{
  const dur=2.1+(i*.18)%1.6
  return{x:(i*3.3)%94,delay:i*.16-(dur*(i*.09)%1),dur,
    color:['#BF0000','#00843D','#FFD700','#BF0000','#00843D','#000000'][i%6],
    size:7+(i%3)*4,rect:i%4!==0}
})
function JuneteenthAtmosphere() {
  return (<>
    <style>{`@keyframes junConf{0%{opacity:1;transform:translateY(-8px) rotate(0) scaleX(1)}50%{transform:translateY(50px) rotate(180deg) scaleX(-1)}100%{opacity:0;transform:translateY(115px) rotate(360deg) scaleX(1)}}`}</style>
    <div style={{position:'fixed',inset:0,
      background:'linear-gradient(to bottom,rgba(0,132,61,.09) 0%,rgba(191,0,0,.06) 100%)',
      pointerEvents:'none',zIndex:7}}/>
    {JUN_CONF.map((c,i)=>(
      <div key={i} style={{position:'fixed',left:`${c.x}%`,top:0,
        width:c.size,height:c.rect?c.size*.45:c.size,
        borderRadius:c.rect?2:'50%',background:c.color,
        animation:`junConf ${c.dur}s ease-in ${c.delay}s infinite`,
        pointerEvents:'none',zIndex:10}}/>
    ))}
    {['✊','🎉','⭐','🎊','✊','🎉'].map((e,i)=>(
      <div key={i} style={{position:'fixed',left:`${8+i*17}%`,bottom:'18%',
        fontSize:24,animation:`junConf ${2.2+i*.25}s ease-out ${i*.45}s infinite`,
        pointerEvents:'none',zIndex:12}}>{e}</div>
    ))}
  </>)
}

/* ── 7. Independence Day 🎆 ───────────────────────────────────────────── */
const JULY4_FW = Array.from({length:16},(_,i)=>({
  x:3+(i*6.2)%92, y:3+(i*8.5)%44,
  color:['#FF0000','#FFFFFF','#0000FF','#FF6347','#FFD700','#FF4500','#FF1744','#1565C0'][i%8],
  delay:i*.22, dur:1.4+(i%5)*.3, size:40+(i%4)*26,
}))
function IndependenceDayAtmosphere() {
  return (<>
    <style>{`@keyframes july4{0%{opacity:0;transform:scale(0)}14%{opacity:1;transform:scale(1.5)}55%{opacity:.8}100%{opacity:0;transform:scale(.15)}}
      @keyframes j4Rise{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-100px)}}`}</style>
    <NightSky/>
    {JULY4_FW.map((f,i)=>(
      <div key={i} style={{position:'fixed',left:`${f.x}%`,top:`${f.y}%`,
        width:f.size,height:f.size,borderRadius:'50%',
        background:`radial-gradient(circle,${f.color} 0%,${f.color}44 50%,transparent 75%)`,
        boxShadow:`0 0 ${Math.round(f.size*.55)}px ${f.color}`,
        animation:`july4 ${f.dur}s ease-out ${f.delay}s infinite`,
        pointerEvents:'none',zIndex:9}}/>
    ))}
    {['🎆','🎇','✨','🎆','🎇','🎊','🇺🇸'].map((e,i)=>(
      <div key={i} style={{position:'fixed',left:`${4+i*14}%`,bottom:'14%',
        fontSize:22,animation:`j4Rise ${1.9+i*.18}s ease-out ${i*.35}s infinite`,
        pointerEvents:'none',zIndex:12}}>{e}</div>
    ))}
  </>)
}

/* ── 8. Labor Day 🔨 ─────────────────────────────────────────────────── */
const TOOL_DATA = Array.from({length:9},(_,i)=>({
  x:(i*11.5)%88+4, delay:i*.55, dur:7.5+(i%3)*1.8,
  emoji:['🔨','⚙️','🔧','🏗️','💪','🔩','⚒️','🛠️','🔨'][i],
}))
function LaborDayAtmosphere() {
  return (<>
    <style>{`@keyframes toolDrift{0%{opacity:0;transform:translateY(-20px) rotate(-12deg)}15%{opacity:.9}85%{opacity:.6}100%{opacity:0;transform:translateY(105px) rotate(12deg)}}`}</style>
    <div style={{position:'fixed',inset:0,
      background:'linear-gradient(180deg,rgba(100,150,220,.09) 0%,rgba(255,165,50,.06) 100%)',
      pointerEvents:'none',zIndex:7}}/>
    {/* Sun */}
    <div style={{position:'fixed',right:'8%',top:'10%',width:60,height:60,borderRadius:'50%',
      background:'radial-gradient(circle at 40% 40%,#FFE082,#FFB300)',
      boxShadow:'0 0 30px rgba(255,200,50,.5)',pointerEvents:'none',zIndex:9}}/>
    {TOOL_DATA.map((t,i)=>(
      <div key={i} style={{position:'fixed',left:`${t.x}%`,top:'5%',
        fontSize:22,animation:`toolDrift ${t.dur}s ease-in-out ${t.delay}s infinite`,
        pointerEvents:'none',zIndex:10}}>{t.emoji}</div>
    ))}
    {['🍔','🌭','🍺','🎈'].map((e,i)=>(
      <div key={i} style={{position:'fixed',left:`${18+i*22}%`,bottom:'22%',
        fontSize:26,animation:`toolDrift ${5.5+i*.8}s ease-in-out ${i*1.4}s infinite`,
        pointerEvents:'none',zIndex:11}}>{e}</div>
    ))}
  </>)
}

/* ── 9. Thanksgiving 🦃 ───────────────────────────────────────────────── */
const LEAF_DATA = Array.from({length:24},(_,i)=>({
  x:(i*4)%93, delay:i*.28, dur:5+(i%4)*1.4,
  color:['#D4500A','#E87D1E','#F5C842','#8B2500','#CD7F32','#A0522D'][i%6],
  size:10+(i%3)*5, rot:(i%2===0)?1:-1,
}))
function ThanksgivingAtmosphere() {
  return (<>
    <style>{`@keyframes leafFall{0%{opacity:0;transform:translateY(-15px) rotate(0) translateX(0)}18%{opacity:1}82%{opacity:.85}100%{opacity:0;transform:translateY(130px) rotate(230deg) translateX(28px)}}`}</style>
    <div style={{position:'fixed',inset:0,
      background:'linear-gradient(180deg,rgba(180,80,10,.09) 0%,rgba(240,160,30,.07) 100%)',
      pointerEvents:'none',zIndex:7}}/>
    {LEAF_DATA.map((l,i)=>(
      <div key={i} style={{position:'fixed',left:`${l.x}%`,top:0,
        width:l.size,height:l.size,
        borderRadius:'0 50% 50% 50%',background:l.color,opacity:.85,
        animation:`leafFall ${l.dur}s ease-in ${l.delay}s infinite`,
        pointerEvents:'none',zIndex:10}}/>
    ))}
    {['🍂','🦃','🥧','🌽','🍁'].map((e,i)=>(
      <div key={i} style={{position:'fixed',left:`${8+i*21}%`,bottom:'19%',
        fontSize:26,animation:`leafFall ${5.5+i*.9}s ease-in ${i*.7}s infinite`,
        pointerEvents:'none',zIndex:12}}>{e}</div>
    ))}
  </>)
}

/* ── 10. Christmas 🎄 ──────────────────────────────────────────────────── */
const SNOW_DATA = Array.from({length:38},(_,i)=>({
  x:(i*2.6)%95, delay:i*.14, dur:6+(i%5)*1.1,
  size:3+(i%4)*3, op:0.35+(i%3)*.2,
}))
const XMAS_LIGHTS = Array.from({length:18},(_,i)=>({
  x:i*(100/18),
  color:['#FF0000','#00CC00','#0000CC','#FFD700','#FF66AA'][i%5],
  delay:i*.15,
}))
function ChristmasAtmosphere() {
  return (<>
    <style>{`
      @keyframes snowFall{0%{opacity:0;transform:translateY(-10px) translateX(0)}14%{opacity:1}86%{opacity:.7}100%{opacity:0;transform:translateY(125px) translateX(14px)}}
      @keyframes xmasLt{0%,100%{opacity:.25;transform:scale(.55)}50%{opacity:1;transform:scale(1.3)}}
      @keyframes xmasRise{0%{opacity:.9;transform:translateY(0)}100%{opacity:0;transform:translateY(-95px)}}
    `}</style>
    <NightSky/>
    {/* Light string wire */}
    <div style={{position:'fixed',top:'calc(8% - 2px)',left:0,right:0,height:2,
      background:'rgba(160,160,160,.25)',pointerEvents:'none',zIndex:10}}/>
    {XMAS_LIGHTS.map((l,i)=>(
      <div key={i} style={{position:'fixed',top:'8%',left:`${l.x}%`,
        width:9,height:13,borderRadius:'50% 50% 60% 60%',background:l.color,
        boxShadow:`0 0 9px ${l.color},0 0 3px ${l.color}`,
        animation:`xmasLt ${1.1+(i%3)*.4}s ease-in-out ${l.delay}s infinite`,
        pointerEvents:'none',zIndex:10}}/>
    ))}
    {SNOW_DATA.map((s,i)=>(
      <div key={i} style={{position:'fixed',left:`${s.x}%`,top:0,
        width:s.size,height:s.size,borderRadius:'50%',
        background:`rgba(255,255,255,${s.op})`,
        animation:`snowFall ${s.dur}s linear ${s.delay}s infinite`,
        pointerEvents:'none',zIndex:9}}/>
    ))}
    {['🎄','❄️','🎁','⭐','🎅','🦌'].map((e,i)=>(
      <div key={i} style={{position:'fixed',left:`${5+i*18}%`,bottom:'17%',
        fontSize:26,animation:`xmasRise ${6.5+i*.8}s ease-in ${i*.6}s infinite`,
        pointerEvents:'none',zIndex:12}}>{e}</div>
    ))}
  </>)
}

/* ═══ Registry + export ═══════════════════════════════════════════════ */

export const HOLIDAY_SCENES: Array<{ name: string; emoji: string; desc: string }> = [
  { name: "New Year's Day", emoji: '🎆', desc: 'Gold & color firework bursts + champagne' },
  { name: 'MLK Day',        emoji: '🕊️', desc: 'White doves flying + golden shimmer' },
  { name: "Presidents' Day",emoji: '🎩', desc: 'Patriotic stars raining + top hat + eagle' },
  { name: 'Good Friday',    emoji: '🌸', desc: 'Soft petals falling + golden light rays' },
  { name: 'Memorial Day',   emoji: '🌹', desc: 'Red poppies falling + flag' },
  { name: 'Juneteenth',     emoji: '🎉', desc: 'Pan-African confetti + celebration emojis' },
  { name: 'Independence Day',emoji: '🎇', desc: 'Biggest fireworks — red/white/blue bursts' },
  { name: 'Labor Day',      emoji: '🔨', desc: 'Tools drifting + BBQ vibes + sunshine' },
  { name: 'Thanksgiving',   emoji: '🦃', desc: 'Autumn leaves falling + warm fall palette' },
  { name: 'Christmas',      emoji: '🎄', desc: 'Snowflakes + Christmas lights + presents' },
]

export function HolidayAtmosphere({ holiday }: { holiday: string }) {
  switch (holiday) {
    case "New Year's Day":   return <NewYearsAtmosphere />
    case 'MLK Day':          return <MLKAtmosphere />
    case "Presidents' Day":  return <PresidentsDayAtmosphere />
    case 'Good Friday':      return <GoodFridayAtmosphere />
    case 'Memorial Day':     return <MemorialDayAtmosphere />
    case 'Juneteenth':       return <JuneteenthAtmosphere />
    case 'Independence Day': return <IndependenceDayAtmosphere />
    case 'Labor Day':        return <LaborDayAtmosphere />
    case 'Thanksgiving':     return <ThanksgivingAtmosphere />
    case 'Christmas':        return <ChristmasAtmosphere />
    default:                 return null
  }
}
