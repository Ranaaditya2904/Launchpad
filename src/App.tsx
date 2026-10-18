import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity, ArrowDownToLine, ArrowRight, BookOpen, CalendarDays, Check, CheckCheck,
  ChevronDown, CircleHelp, Clock3, Code2, Database, Download, Flame, LayoutDashboard,
  ListChecks, LogOut, Menu, Plus, RefreshCw, Search, ShieldCheck, Sparkles, Target,
  Trash2, TrendingUp, Upload, UserRound, X
} from "lucide-react";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, type User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, firebaseConfigured, firebaseInitializationError, missingFirebaseVariables } from "./firebase";
import { initialProblems, roadmap } from "./roadmap";
import { dateOffset, dayNumber, defaultState, prettyDate, todayISO, type DayStatus, type Problem, type TrackerState } from "./types";
import { subscribeToState, saveCloudState } from "./cloud";

type View = "dashboard"|"roadmap"|"dsa"|"journal"|"analytics";
const viewTitles:Record<View,string>={dashboard:"Dashboard",roadmap:"42-Day Roadmap",dsa:"DSA Tracker",journal:"Daily Journal",analytics:"Progress & Review"};
const phases=roadmap.map(w=>({title:w.title,desc:w.subtitle}));
const taskMinutes=[90,60,45,45];
function getDay(state:TrackerState,n:number){const wi=Math.floor((n-1)/7),di=(n-1)%7;return {week:wi+1,day:di+1,...roadmap[wi].days[di]};}
function tasksFor(n:number){const x=getDay(defaultState(),n);return [
  {title:x.title,meta:x.detail,mins:90},
  {title:"CS fundamentals",meta:n<=7?"OOP and complexity":n<=14?"Complexity, SQL and REST":n<=21?"DBMS, normalization, indexes and ACID":n<=28?"OS, networking and architecture":"Interview-style recall and explanations",mins:60},
  {title:"Project / practical practice",meta:n<=7?"Draw PlacementPilot architecture":n<=21?"Practice SQL or trace a data structure":n<=28?"Trace AdyTalk or PlacementPilot end-to-end":"Practice project defense or mock interview",mins:45},
  {title:"Revision + log",meta:"Revisit a previous problem, log mistakes, plan tomorrow.",mins:45}
];}
function safeNum(v:unknown){return Number.isFinite(Number(v))?Number(v):0;}
function normalizeState(s:TrackerState|null):TrackerState{
  const base=defaultState();
  if(!s)return {...base,problems:initialProblems.map(p=>({...p}))};
  return {...base,...s,statuses:s.statuses||{},checks:s.checks||{},journal:s.journal||{},reviews:s.reviews||{},problems:Array.isArray(s.problems)?s.problems:initialProblems.map(p=>({...p})),nextId:s.nextId||1};
}
function download(name:string,content:string,type:string){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
function App(){
  const [user,setUser]=useState<User|null>(null);
  const [authReady,setAuthReady]=useState(false);
  const [view,setView]=useState<View>("dashboard");
  const [state,setState]=useState<TrackerState>(()=>({...defaultState(),problems:initialProblems.map(p=>({...p}))}));
  const [cloudReady,setCloudReady]=useState(false);
  const [saving,setSaving]=useState(false);
  const [syncError,setSyncError]=useState("");
  const [toast,setToast]=useState("");
  const [authMode,setAuthMode]=useState<"login"|"signup">("login");
  const [authError,setAuthError]=useState("");
  const [busy,setBusy]=useState(false);
  const [mobileNav,setMobileNav]=useState(false);
  const [roadSearch,setRoadSearch]=useState("");
  const [weekFilter,setWeekFilter]=useState("all");
  const [statusFilter,setStatusFilter]=useState("all");
  const [dsaSearch,setDsaSearch]=useState("");
  const [dsaCategory,setDsaCategory]=useState("all");
  const [dsaStatus,setDsaStatus]=useState("all");
  const [journalDate,setJournalDate]=useState(todayISO());
  const [expandedWeeks,setExpandedWeeks]=useState<number[]>([1,2,3,4,5,6]);
  const [editingProblem,setEditingProblem]=useState(false);
  const [problemForm,setProblemForm]=useState({name:"",category:"Arrays & Strings",difficulty:"Medium",url:"",notes:""});
  const [journalForm,setJournalForm]=useState({minutes:"240",attempted:"2",solved:"1",learned:"",blockers:"",next:""});
  const [reviewForm,setReviewForm]=useState({week:"1",confidence:"3",wins:"",weaknesses:"",adjustment:""});
  const [importText,setImportText]=useState("");
  const [showImport,setShowImport]=useState(false);
  const lastSyncedJson = useRef("");

  useEffect(()=>{if(!auth){setAuthReady(true);return;}return onAuthStateChanged(auth,u=>{setUser(u);setAuthReady(true);});},[]);
  useEffect(()=>{
    if(!user||!db){setCloudReady(false);return;}
    const firestore=db;
    setCloudReady(false);setSyncError("");
    let first=true;
    const unsub=subscribeToState(user.uid,async cloudState=>{
      if(cloudState){lastSyncedJson.current=JSON.stringify(cloudState);setState(normalizeState(cloudState));}
      else if(first){
        const profileRef=doc(firestore,"users",user.uid,"app","profile");
        const profile=await getDoc(profileRef);
        const initial=normalizeState(null);
        setState(initial);
        lastSyncedJson.current=JSON.stringify(initial);
        await saveCloudState(user.uid,initial);
        await setDoc(profileRef,{email:user.email||"",displayName:user.displayName||"",createdAt:serverTimestamp()},{merge:true});
      }
      first=false;setCloudReady(true);
    },e=>{setSyncError(e.message);setCloudReady(true);});
    return ()=>unsub();
  },[user]);
  const updateState=useCallback((updater:(prev:TrackerState)=>TrackerState)=>{
    setState(prev=>updater(prev));
  },[]);
  useEffect(()=>{
    if(!user||!db||!cloudReady)return;
    const serialized=JSON.stringify(state);
    if(serialized===lastSyncedJson.current)return;
    const timer=window.setTimeout(()=>{
      setSaving(true);
      saveCloudState(user.uid,state).then(()=>{
        lastSyncedJson.current=serialized;
        setSaving(false);setSyncError("");
      }).catch(e=>{setSaving(false);setSyncError(e.message||"Cloud save failed");});
    },350);
    return ()=>window.clearTimeout(timer);
  },[state,user,cloudReady]);
  useEffect(()=>{if(!toast)return;const t=window.setTimeout(()=>setToast(""),2500);return()=>window.clearTimeout(t);},[toast]);
  const n=dayNumber(state.startDate), todayTasks=tasksFor(n),checks=state.checks[n]||[];
  const completedDays=Object.values(state.statuses).filter(s=>s==="done").length;
  const totalMinutes=Object.values(state.journal).reduce((a,x)=>a+safeNum(x.minutes),0);
  const trackerSolved=state.problems.filter(p=>p.status==="solved").length;
  const journalSolved=Object.values(state.journal).reduce((a,x)=>a+safeNum(x.solved),0);
  const solvedCount=trackerSolved+journalSolved;
  const streak=useMemo(()=>{let count=0,d=todayISO();while(state.journal[d]&&safeNum(state.journal[d].minutes)>0){count++;d=dateOffset(d,-1);}return count;},[state.journal]);
  const categoryList=useMemo(()=>[...new Set(state.problems.map(p=>p.category))].sort(),[state.problems]);
  const current=getDay(state,n);
  const flash=(s:string)=>setToast(s);
  const go=(v:View)=>{setView(v);setMobileNav(false);window.scrollTo({top:0,behavior:"smooth"});};

  async function handleAuth(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setAuthError("");setBusy(true);
    const fd=new FormData(e.currentTarget),email=String(fd.get("email")||"").trim(),password=String(fd.get("password")||"");
    try{
      if(!auth)throw new Error("Firebase isn't configured yet. Follow README.md first.");
      if(authMode==="signup"){
        const name=String(fd.get("name")||"").trim();
        const cred=await createUserWithEmailAndPassword(auth,email,password);
        if(name)await updateProfile(cred.user,{displayName:name});
      }else await signInWithEmailAndPassword(auth,email,password);
    }catch(err){setAuthError(authMessage(err));}finally{setBusy(false);}
  }
  function authMessage(err:unknown){const code=(err as {code?:string})?.code;const msg=(err as Error)?.message||"Could not authenticate.";const map:Record<string,string>={"auth/email-already-in-use":"An account with this email already exists.","auth/invalid-credential":"Email or password is incorrect.","auth/weak-password":"Use a password with at least 6 characters.","auth/invalid-email":"Enter a valid email address.","auth/too-many-requests":"Too many attempts. Try again later.","auth/operation-not-allowed":"Enable Email/Password sign-in in Firebase Console."};return map[code||""]||msg;}
  async function handleSignOut(){if(auth)await signOut(auth);setView("dashboard");}
  function updateChecklist(i:number,checked:boolean){updateState(s=>{const arr=s.checks[n]||[];return {...s,checks:{...s.checks,[n]:checked?[...new Set([...arr,i])]:arr.filter(x=>x!==i)}}});}
  function markDayDone(){updateState(s=>({...s,statuses:{...s.statuses,[n]:"done"},checks:{...s.checks,[n]:[0,1,2,3]}}));flash(`Day ${n} marked complete.`);}
  function changeDayStatus(day:number,status:DayStatus){updateState(s=>({...s,statuses:{...s.statuses,[day]:status}}));}
  function saveJournal(e:FormEvent){e.preventDefault();updateState(s=>({...s,journal:{...s.journal,[journalDate]:{minutes:safeNum(journalForm.minutes),attempted:safeNum(journalForm.attempted),solved:safeNum(journalForm.solved),learned:journalForm.learned.trim(),blockers:journalForm.blockers.trim(),next:journalForm.next.trim()}}}));flash("Study log synced to cloud.");}
  function editJournal(date:string){const x=state.journal[date];setJournalDate(date);setJournalForm({minutes:String(x.minutes||0),attempted:String(x.attempted||0),solved:String(x.solved||0),learned:x.learned||"",blockers:x.blockers||"",next:x.next||""});go("journal");}
  function addProblem(e:FormEvent){e.preventDefault();if(!problemForm.name.trim())return;updateState(s=>({...s,nextId:s.nextId+1,problems:[{...problemForm,id:s.nextId,status:"todo"},...s.problems]}));setProblemForm({name:"",category:"Arrays & Strings",difficulty:"Medium",url:"",notes:""});setEditingProblem(false);flash("Problem added and synced.");}
  function updateProblem(id:number,patch:Partial<Problem>){updateState(s=>({...s,problems:s.problems.map(p=>p.id===id?{...p,...patch}:p)}));}
  function removeProblem(id:number){if(confirm("Remove this problem from your tracker?"))updateState(s=>({...s,problems:s.problems.filter(p=>p.id!==id)}));}
  function saveReview(e:FormEvent){e.preventDefault();const w=Number(reviewForm.week);updateState(s=>({...s,reviews:{...s.reviews,[w]:{confidence:Number(reviewForm.confidence),wins:reviewForm.wins.trim(),weaknesses:reviewForm.weaknesses.trim(),adjustment:reviewForm.adjustment.trim()}}}));flash("Weekly review synced.");}
  function exportBackup(){download("launchpad-cloud-backup.json",JSON.stringify(state,null,2),"application/json");}
  function exportCsv(){const rows=[["Problem","Category","Difficulty","Status","URL","Notes"],...state.problems.map(p=>[p.name,p.category,p.difficulty,p.status,p.url,p.notes])];download("dsa-tracker.csv",rows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n"),"text/csv");}
  function importBackup(){try{const x=JSON.parse(importText) as TrackerState;if(!x.startDate||!x.problems||!x.journal)throw new Error("Invalid backup");if(confirm("Replace your cloud tracker data with this backup?")){updateState(()=>normalizeState(x));setShowImport(false);setImportText("");flash("Backup imported to cloud.");}}catch{flash("Could not import. Choose a valid Launchpad JSON backup.");}}
  if(!authReady)return <div className="center-screen"><div className="spinner"/><p>Connecting to Launchpad…</p></div>;
  if(firebaseInitializationError)return <SetupScreen error={firebaseInitializationError}/>;
  if(!firebaseConfigured)return <SetupScreen missingVariables={missingFirebaseVariables}/>;
  if(!user)return <AuthScreen mode={authMode} setMode={setAuthMode} onSubmit={handleAuth} error={authError} busy={busy}/>;
  if(!cloudReady)return <div className="center-screen"><div className="spinner"/><p>Loading your cloud-synced progress…</p></div>;

  const navItems:{id:View;label:string;icon:typeof LayoutDashboard}[]=[
    {id:"dashboard",label:"Dashboard",icon:LayoutDashboard},{id:"roadmap",label:"42-Day Roadmap",icon:CalendarDays},{id:"dsa",label:"DSA Tracker",icon:Code2},{id:"journal",label:"Daily Journal",icon:BookOpen},{id:"analytics",label:"Progress & Review",icon:TrendingUp}
  ];
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?"mobile-open":""}`}>
      <div className="brand"><div className="brand-mark">L</div><div><b>launchpad</b><small>SDE PREP TRACKER</small></div></div>
      <div className="nav-label">WORKSPACE</div><nav className="nav">{navItems.map(item=><button key={item.id} className={view===item.id?"active":""} onClick={()=>go(item.id)}><item.icon size={18}/><span>{item.label}</span></button>)}</nav>
      <div className="sidebar-bottom"><div className="avatar"><UserRound size={16}/></div><div className="user-info"><b>{user.displayName||user.email?.split("@")[0]}</b><span>{user.email}</span></div><button className="icon-btn signout" title="Sign out" onClick={handleSignOut}><LogOut size={16}/></button></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-btn" onClick={()=>setMobileNav(!mobileNav)}><Menu size={19}/></button><div><div className="eyebrow">YOUR INTERVIEW PREPARATION WORKSPACE</div><h1>{viewTitles[view]}</h1></div></div><div className="top-actions"><div className={`sync-state ${syncError?"sync-error":saving?"sync-saving":"sync-ok"}`}><span className="sync-dot"/>{syncError?"Sync issue":saving?"Saving…":"Cloud synced"}</div><div className="date-chip">{new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})}</div></div></header>
      {syncError&&<div className="error-banner"><CircleHelp size={16}/><span>{syncError}. Check your Firestore rules and internet connection.</span></div>}
      {view==="dashboard"&&<section>
        <div className="welcome"><div><div className="kicker"><Sparkles size={13}/> YOUR SIX-WEEK SPRINT</div><h2>{n<=7?"Small steps. Strong fundamentals.":n<=14?"Build patterns, then build speed.":n<=28?"Connect concepts to real systems.":"Practice like the interview is tomorrow."}</h2><p>Consistency across DSA, CS fundamentals, project defense, and mock interviews. Track the work, not just the hours.</p></div><div className="day-pill"><strong>DAY {n}</strong><span>OF 42 DAYS</span></div><div className="welcome-orb"/></div>
        <div className="stats">
          <Stat icon={<TrendingUp size={16}/>} label="Roadmap progress" value={`${Math.round(completedDays/42*100)}%`} foot={`${completedDays} of 42 days completed`}/>
          <Stat icon={<Clock3 size={16}/>} label="Study time logged" value={`${(totalMinutes/60).toFixed(totalMinutes%60?1:0)}h`} foot="Target: 168 hours"/>
          <Stat icon={<Code2 size={16}/>} label="Problems solved" value={String(solvedCount)} foot={`${trackerSolved} marked solved in DSA tracker`}/>
          <Stat icon={<Flame size={16}/>} label="Current streak" value={`${streak} day${streak===1?"":"s"}`} foot="Days with study logged"/>
        </div>
        <div className="dashboard-grid"><div className="stack">
          <div className="panel"><div className="panel-head"><div><h3>Today's plan</h3><p>Day {n} · {current.title}</p></div><button className="text-btn" onClick={()=>go("roadmap")}>View roadmap <ArrowRight size={14}/></button></div><div className="progress-row"><span>Daily checklist</span><span>{checks.length} / 4 tasks</span></div><Progress value={checks.length/4*100}/><div className="task-list">{todayTasks.map((t,i)=><label key={i} className={`task ${checks.includes(i)?"done":""}`}><input type="checkbox" checked={checks.includes(i)} onChange={e=>updateChecklist(i,e.target.checked)}/><span className="custom-check"><Check size={12}/></span><span className="task-body"><b>{t.title}</b><small>{t.meta}</small></span><span className="minutes">{t.mins}m</span></label>)}</div><div className="panel-footer"><span className="muted">Planned study time: 4 hours</span><button className="primary" onClick={markDayDone}><CheckCheck size={15}/> Mark day complete</button></div></div>
          <div className="panel"><div className="panel-head"><div><h3>This week</h3><p>Your 7-day consistency snapshot</p></div><button className="text-btn" onClick={()=>go("analytics")}>Details <ArrowRight size={14}/></button></div><div className="week-grid">{Array.from({length:7},(_,i)=>{const no=Math.floor((n-1)/7)*7+i+1;return <div key={no} className={`week-cell ${state.statuses[no]==="done"?"done":""} ${no===n?"today":""}`}><span>{["MON","TUE","WED","THU","FRI","SAT","SUN"][i]}</span><b>{state.statuses[no]==="done"?"✓":no}</b></div>})}</div></div>
        </div><div className="stack">
          <div className="panel"><div className="panel-head"><div><h3>Quick actions</h3><p>Capture progress while it's fresh</p></div></div><div className="quick-actions"><button onClick={()=>go("journal")}><BookOpen/><b>Log today's study</b><small>Hours, wins, blockers</small></button><button onClick={()=>go("dsa")}><Code2/><b>Update DSA</b><small>Record solved problems</small></button><button onClick={()=>go("roadmap")}><ListChecks/><b>Open roadmap</b><small>Explore all 42 days</small></button><button onClick={exportBackup}><Download/><b>Export backup</b><small>Optional JSON copy</small></button></div></div>
          <div className="panel"><div className="panel-head"><div><h3>Weekly focus</h3><p>Stay focused on the current phase</p></div><span className="phase-badge">WEEK {current.week}</span></div><div className="focus-row"><div className="week-num">{String(current.week).padStart(2,"0")}</div><div><b>{phases[current.week-1].title}</b><small>{phases[current.week-1].desc}</small></div></div><div className="progress-row"><span>Week {current.week} completion</span><span>{roadmap[current.week-1].days.filter((_,i)=>state.statuses[(current.week-1)*7+i+1]==="done").length}/7 days</span></div><Progress value={roadmap[current.week-1].days.filter((_,i)=>state.statuses[(current.week-1)*7+i+1]==="done").length/7*100}/></div>
          <div className="streak-card"><div className="streak-symbol"><Flame size={23}/></div><div><b>{streak?`${streak} day${streak===1?"":"s"} in a row`:"Start your streak today"}</b><span>Log at least one study session each day.</span></div></div>
        </div></div>
      </section>}
      {view==="roadmap"&&<section className="panel page-panel"><div className="panel-head"><div><h2>Your 42-day roadmap</h2><p>Mark each day as not started, in progress, or completed.</p></div><button className="secondary" onClick={()=>{if(confirm("Reset roadmap statuses and daily checklists?"))updateState(s=>({...s,statuses:{},checks:{}}));}}><RefreshCw size={14}/> Reset statuses</button></div><div className="notice"><Clock3 size={16}/><span><b>Daily structure:</b> 90 min DSA · 60 min CS fundamentals · 45 min project practice · 30 min revision · 15 min tracking. On mock days, replace regular blocks rather than extending the day.</span></div><div className="toolbar"><div className="searchbox"><Search size={16}/><input value={roadSearch} onChange={e=>setRoadSearch(e.target.value)} placeholder="Search topics, tasks, concepts…"/></div><select value={weekFilter} onChange={e=>setWeekFilter(e.target.value)}><option value="all">All weeks</option>{roadmap.map((_,i)=><option key={i} value={String(i+1)}>Week {i+1}</option>)}</select><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">All statuses</option><option value="not">Not started</option><option value="progress">In progress</option><option value="done">Completed</option></select></div><div className="roadmap-list">{roadmap.map((week,wi)=>{const wn=wi+1;if(weekFilter!=="all"&&+weekFilter!==wn)return null;const days=week.days.map((d,di)=>({d,n:wi*7+di+1})).filter(({d,n:day})=>(!roadSearch||`${d.title} ${d.detail} ${d.tag} day ${day}`.toLowerCase().includes(roadSearch.toLowerCase()))&&(statusFilter==="all"||(state.statuses[day]||"not")===statusFilter));if(!days.length)return null;const done=week.days.filter((_,di)=>state.statuses[wi*7+di+1]==="done").length;return <div className="week-card" key={wn}><button className="week-header" onClick={()=>setExpandedWeeks(prev=>prev.includes(wn)?prev.filter(x=>x!==wn):[...prev,wn])}><span className="week-num">{String(wn).padStart(2,"0")}</span><span className="week-info"><b>Week {wn} · {week.title}</b><small>{week.subtitle}</small></span><span className="week-percent">{done}/7 complete</span>{expandedWeeks.includes(wn)?<ChevronDown size={17}/>:<ArrowRight size={16}/>}</button>{expandedWeeks.includes(wn)&&<div className="day-list">{days.map(({d,n:day})=>{const s=state.statuses[day]||"not";return <div className="day-row" key={day}><div className="day-number">DAY {day}<small>{prettyDate(dateOffset(state.startDate,day-1))}</small></div><div className="day-content"><b>{d.title}</b><span>{d.detail}</span><em className={`tag ${s==="done"?"tag-done":""}`}>{d.tag}</em></div><select aria-label={`Day ${day} status`} className="status-select" value={s} onChange={e=>changeDayStatus(day,e.target.value as DayStatus)}><option value="not">Not started</option><option value="progress">In progress</option><option value="done">Completed</option></select></div>})}</div>}</div>})}</div></section>}
      {view==="dsa"&&<section>
        <div className="panel page-panel"><div className="panel-head"><div><h2>DSA tracker</h2><p>Target: 55 carefully attempted problems across six weeks.</p></div><button className="secondary" onClick={exportCsv}><Download size={14}/> Export CSV</button></div><div className="mini-stats"><MiniStat label="Solved" value={state.problems.filter(p=>p.status==="solved").length} foot="Marked complete"/><MiniStat label="In progress" value={state.problems.filter(p=>p.status==="progress").length} foot="Currently practicing"/><MiniStat label="Revisit" value={state.problems.filter(p=>p.status==="revisit").length} foot="Needs another attempt"/></div><div className="toolbar"><div className="searchbox"><Search size={16}/><input value={dsaSearch} onChange={e=>setDsaSearch(e.target.value)} placeholder="Search problem or pattern…"/></div><select value={dsaCategory} onChange={e=>setDsaCategory(e.target.value)}><option value="all">All categories</option>{categoryList.map(c=><option key={c}>{c}</option>)}</select><select value={dsaStatus} onChange={e=>setDsaStatus(e.target.value)}><option value="all">All statuses</option><option value="todo">Not started</option><option value="progress">In progress</option><option value="solved">Solved</option><option value="revisit">Revisit</option></select></div><div className="problem-list">{state.problems.filter(p=>(!dsaSearch||`${p.name} ${p.category} ${p.notes}`.toLowerCase().includes(dsaSearch.toLowerCase()))&&(dsaCategory==="all"||p.category===dsaCategory)&&(dsaStatus==="all"||p.status===dsaStatus)).map(p=><div className="problem-row" key={p.id}><div className="problem-main"><b>{p.name} <span>· {p.difficulty}</span></b><small>{p.category}</small>{p.notes&&<p>{p.notes}</p>}{p.url&&<a href={p.url} target="_blank" rel="noreferrer">Open problem ↗</a>}</div><div className="problem-actions"><select className={`problem-status status-${p.status}`} value={p.status} onChange={e=>updateProblem(p.id,{status:e.target.value as Problem["status"]})}><option value="todo">Not started</option><option value="progress">In progress</option><option value="solved">Solved</option><option value="revisit">Revisit</option></select><button className="icon-btn danger" title="Remove problem" onClick={()=>removeProblem(p.id)}><Trash2 size={15}/></button></div></div>)}</div>{!state.problems.length&&<Empty text="No problems yet. Add your first problem below."/>}</div>
        <div className="panel"><div className="panel-head"><div><h3>Add a problem</h3><p>Add problems from your own practice or a coding sheet.</p></div><button className="icon-btn" onClick={()=>setEditingProblem(!editingProblem)}>{editingProblem?<X size={17}/>:<Plus size={17}/>}</button></div>{editingProblem&&<form className="form-grid" onSubmit={addProblem}><Field label="Problem name"><input required value={problemForm.name} onChange={e=>setProblemForm({...problemForm,name:e.target.value})} placeholder="e.g. Product of Array Except Self"/></Field><Field label="Pattern / category"><select value={problemForm.category} onChange={e=>setProblemForm({...problemForm,category:e.target.value})}>{["Arrays & Strings","Hashing","Two Pointers / Sliding Window","Binary Search","Linked Lists","Stacks & Queues","Trees & BST","Graphs","Recursion / Backtracking","Heap / Greedy","Dynamic Programming","Other"].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Difficulty"><select value={problemForm.difficulty} onChange={e=>setProblemForm({...problemForm,difficulty:e.target.value})}><option>Easy</option><option>Medium</option><option>Hard</option></select></Field><Field label="Problem link (optional)"><input type="url" value={problemForm.url} onChange={e=>setProblemForm({...problemForm,url:e.target.value})} placeholder="https://…"/></Field><Field label="Key takeaway / mistake (optional)" full><textarea value={problemForm.notes} onChange={e=>setProblemForm({...problemForm,notes:e.target.value})} placeholder="What did you learn? What should you revisit?"/></Field><div className="form-actions"><button className="primary"><Plus size={15}/> Add problem</button></div></form>}</div>
      </section>}
      {view==="journal"&&<section className="dashboard-grid journal-grid"><div className="panel page-panel"><div className="panel-head"><div><h2>Daily study journal</h2><p>Record what you actually did—not only what you planned.</p></div></div><form className="form-grid" onSubmit={saveJournal}><Field label="Date"><input type="date" required value={journalDate} onChange={e=>{setJournalDate(e.target.value);const x=state.journal[e.target.value];setJournalForm(x?{minutes:String(x.minutes),attempted:String(x.attempted),solved:String(x.solved),learned:x.learned||"",blockers:x.blockers||"",next:x.next||""}:{minutes:"240",attempted:"2",solved:"1",learned:"",blockers:"",next:""});}}/></Field><Field label="Focused study time (minutes)"><input type="number" min="0" max="1440" required value={journalForm.minutes} onChange={e=>setJournalForm({...journalForm,minutes:e.target.value})}/></Field><Field label="DSA problems attempted"><input type="number" min="0" required value={journalForm.attempted} onChange={e=>setJournalForm({...journalForm,attempted:e.target.value})}/></Field><Field label="Problems solved independently"><input type="number" min="0" required value={journalForm.solved} onChange={e=>setJournalForm({...journalForm,solved:e.target.value})}/></Field><Field label="What did I learn today?" full><textarea value={journalForm.learned} onChange={e=>setJournalForm({...journalForm,learned:e.target.value})} placeholder="Concepts understood, patterns learned, code written…"/></Field><Field label="What was difficult / what should I revisit?" full><textarea value={journalForm.blockers} onChange={e=>setJournalForm({...journalForm,blockers:e.target.value})} placeholder="Mistakes, confusing concepts, edge cases…"/></Field><Field label="Tomorrow's top priority" full><input value={journalForm.next} onChange={e=>setJournalForm({...journalForm,next:e.target.value})} placeholder="One specific task to start with"/></Field><div className="form-actions"><button className="primary"><Check size={15}/> Save daily log</button></div></form></div><div className="panel"><div className="panel-head"><div><h3>Recent journal entries</h3><p>Saved to your account</p></div></div><div className="journal-list">{Object.entries(state.journal).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,15).map(([date,x])=><div className="log-item" key={date}><div className="log-top"><b>{prettyDate(date)}</b><span>{(x.minutes/60).toFixed(1)}h · {x.solved||0} solved</span></div>{x.learned&&<p><b>Learned:</b> {x.learned}</p>}{x.blockers&&<p><b>Revisit:</b> {x.blockers}</p>}{x.next&&<p><b>Next:</b> {x.next}</p>}<button className="text-btn" onClick={()=>{setJournalDate(date);setJournalForm({minutes:String(x.minutes||0),attempted:String(x.attempted||0),solved:String(x.solved||0),learned:x.learned||"",blockers:x.blockers||"",next:x.next||""});window.scrollTo({top:0,behavior:"smooth"});}}>Edit entry</button><button className="text-btn danger-text" onClick={()=>{if(confirm("Delete this journal entry?"))updateState(s=>{const j={...s.journal};delete j[date];return {...s,journal:j};});}}>Delete</button></div>)}{!Object.keys(state.journal).length&&<Empty text="No entries yet. Save your first study session."/>}</div></div></section>}
      {view==="analytics"&&<section>
        <div className="panel page-panel"><div className="panel-head"><div><h2>Progress & weekly review</h2><p>Use the evidence to adjust your next week.</p></div><button className="secondary" onClick={exportBackup}><Download size={14}/> Export backup</button></div><div className="stats"><Stat icon={<Clock3/>} label="Study hours" value={`${(totalMinutes/60).toFixed(1)}h`} foot="of 168 planned hours"/><Stat icon={<Code2/>} label="Problems solved" value={String(solvedCount)} foot="Tracked across practice"/><Stat icon={<CalendarDays/>} label="Roadmap days" value={`${completedDays}/42`} foot="Marked completed"/><Stat icon={<BookOpen/>} label="Journal entries" value={String(Object.keys(state.journal).length)} foot="Sessions recorded"/></div><div className="panel-head section-heading"><div><h3>Topic progress</h3><p>Based on your DSA tracker statuses</p></div></div><div className="category-grid">{categoryList.map(c=>{const ps=state.problems.filter(p=>p.category===c),done=ps.filter(p=>p.status==="solved").length;return <div className="category-card" key={c}><div><b>{c}</b><span>{done}/{ps.length}</span></div><small>{ps.length?Math.round(done/ps.length*100):0}% completed</small><Progress value={ps.length?done/ps.length*100:0}/></div>})}</div></div>
        <div className="panel"><div className="panel-head"><div><h3>Weekly review</h3><p>A short reflection keeps the plan realistic.</p></div></div><form className="form-grid" onSubmit={saveReview}><Field label="Week"><select value={reviewForm.week} onChange={e=>{const w=e.target.value,r=state.reviews[+w];setReviewForm({week:w,confidence:String(r?.confidence||3),wins:r?.wins||"",weaknesses:r?.weaknesses||"",adjustment:r?.adjustment||""});}}>{roadmap.map((_,i)=><option key={i} value={i+1}>Week {i+1}</option>)}</select></Field><Field label="Confidence (1–5)"><select value={reviewForm.confidence} onChange={e=>setReviewForm({...reviewForm,confidence:e.target.value})}>{[1,2,3,4,5].map(x=><option key={x} value={x}>{x}{x===1?" — Low":x===3?" — Moderate":x===5?" — High":""}</option>)}</select></Field><Field label="What went well?" full><textarea value={reviewForm.wins} onChange={e=>setReviewForm({...reviewForm,wins:e.target.value})}/></Field><Field label="What needs more work?" full><textarea value={reviewForm.weaknesses} onChange={e=>setReviewForm({...reviewForm,weaknesses:e.target.value})}/></Field><Field label="One adjustment for next week" full><textarea value={reviewForm.adjustment} onChange={e=>setReviewForm({...reviewForm,adjustment:e.target.value})}/></Field><div className="form-actions"><button className="primary"><Check size={15}/> Save weekly review</button></div></form><div className="review-list">{Object.entries(state.reviews).sort((a,b)=>+b[0]-+a[0]).map(([w,r])=><div className="log-item" key={w}><div className="log-top"><b>Week {w} review</b><span>Confidence: {r.confidence}/5</span></div>{r.wins&&<p><b>Wins:</b> {r.wins}</p>}{r.weaknesses&&<p><b>Needs work:</b> {r.weaknesses}</p>}{r.adjustment&&<p><b>Next adjustment:</b> {r.adjustment}</p>}</div>)}</div></div>
        <div className="panel"><div className="panel-head"><div><h3>Backup and data portability</h3><p>Cloud sync is the primary storage; backups are optional.</p></div><ShieldCheck size={21} color="#19876b"/></div><p className="muted-copy">Your records are saved under your signed-in account in Cloud Firestore. Use the same account on another device to retrieve them. JSON export/import is available for an extra backup or migration.</p><div className="inline-actions"><button className="secondary" onClick={exportBackup}><Download size={14}/> Export JSON backup</button><button className="secondary" onClick={()=>setShowImport(true)}><Upload size={14}/> Import JSON backup</button><button className="secondary danger-text" onClick={async()=>{if(confirm("Permanently delete all your tracker data from Firestore? This cannot be undone.")){updateState(()=>({...defaultState(),problems:initialProblems.map(p=>({...p}))}));flash("Tracker data reset.");}}}><Trash2 size={14}/> Reset tracker data</button></div></div>
      </section>}
      <footer className="footer"><span>LAUNCHPAD · SIX-WEEK SDE PREPARATION</span><span>Built for consistent progress, one day at a time.</span></footer>
    </main>
    {showImport&&<div className="modal-backdrop" onClick={()=>setShowImport(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="panel-head"><div><h3>Import tracker backup</h3><p>This replaces the current cloud tracker data.</p></div><button className="icon-btn" onClick={()=>setShowImport(false)}><X size={17}/></button></div><textarea value={importText} onChange={e=>setImportText(e.target.value)} placeholder="Paste the contents of a Launchpad JSON backup…"/><div className="form-actions"><button className="secondary" onClick={()=>setShowImport(false)}>Cancel</button><button className="primary" onClick={importBackup}>Import to cloud</button></div></div></div>}
    {toast&&<div className="toast">{toast}</div>}
  </div>;
}
function Stat({icon,label,value,foot}:{icon:ReactNode;label:string;value:string;foot:string}){return <div className="stat"><div className="stat-top"><span>{label}</span><span className="stat-icon">{icon}</span></div><strong>{value}</strong><small>{foot}</small></div>}
function MiniStat({label,value,foot}:{label:string;value:number;foot:string}){return <div className="stat mini-stat"><div className="stat-top">{label}</div><strong>{value}</strong><small>{foot}</small></div>}
function Progress({value}:{value:number}){return <div className="progress-track"><div className="progress-fill" style={{width:`${Math.max(0,Math.min(100,value))}%`}}/></div>}
function Field({label,children,full=false}:{label:string;children:ReactNode;full?:boolean}){return <label className={`field ${full?"full":""}`}><span>{label}</span>{children}</label>}
function Empty({text}:{text:string}){return <div className="empty"><Database size={21}/><span>{text}</span></div>}
function SetupScreen({error,missingVariables}:{error?:string;missingVariables?:string[]}){return <div className="setup-screen"><div className="setup-card"><div className="brand setup-brand"><div className="brand-mark">L</div><div><b>launchpad</b><small>SDE PREP TRACKER</small></div></div><div className="setup-icon"><Database size={25}/></div><h1>{error?"Firebase initialization failed":"Connect your cloud database"}</h1><p>{error||"Launchpad is built and ready, but it needs your Firebase web configuration before accounts and cloud sync can work."}</p>{missingVariables?.length ? <p>Missing or empty environment variables: <code>{missingVariables.join(", ")}</code>. Put them in <code>.env</code> beside <code>package.json</code>, then restart Vite.</p> : null}<ol><li>Create a Firebase project and add a Web app.</li><li>Copy <code>.env.example</code> to <code>.env</code> and add the Firebase config values.</li><li>Enable Email/Password Authentication, create Firestore, and publish <code>firestore.rules</code>.</li><li>Restart <code>npm run dev</code> from the project folder.</li></ol><div className="setup-note"><ShieldCheck size={17}/><span>Firestore rules in this project restrict each user's records to their own authenticated UID.</span></div><a className="primary setup-link" href="https://console.firebase.google.com/" target="_blank" rel="noreferrer">Open Firebase Console <ArrowRight size={15}/></a><p className="setup-foot">Full instructions are in README.md. Never add a Firebase service-account private key to this frontend.</p></div></div>}
function AuthScreen({mode,setMode,onSubmit,error,busy}:{mode:"login"|"signup";setMode:(m:"login"|"signup")=>void;onSubmit:(e:FormEvent<HTMLFormElement>)=>void;error:string;busy:boolean}){return <div className="auth-screen"><div className="auth-visual"><div className="brand"><div className="brand-mark">L</div><div><b>launchpad</b><small>SDE PREP TRACKER</small></div></div><div className="visual-copy"><span className="kicker"><Sparkles size={14}/> YOUR NEXT CHAPTER STARTS HERE</span><h1>Make your next<br/>interview <em>count.</em></h1><p>One focused session at a time. Keep your roadmap, DSA practice, and reflections synced wherever you study.</p><div className="visual-metrics"><div><b>42</b><span>days</span></div><div><b>4h</b><span>daily plan</span></div><div><b>1</b><span>clear goal</span></div></div></div><div className="visual-footer">DSA · CS FUNDAMENTALS · PROJECTS · MOCKS</div></div><div className="auth-side"><div className="auth-box"><div className="mobile-auth-brand"><div className="brand-mark">L</div><b>launchpad</b></div><div className="eyebrow">{mode==="login"?"WELCOME BACK":"GET STARTED"}</div><h2>{mode==="login"?"Sign in to Launchpad":"Create your account"}</h2><p className="auth-sub">{mode==="login"?"Pick up where you left off. Your progress is waiting.":"Your study progress will sync across devices."}</p><form onSubmit={onSubmit} className="auth-form">{mode==="signup"&&<label className="field"><span>Your name</span><input name="name" placeholder="How should we call you?" autoComplete="name"/></label>}<label className="field"><span>Email address</span><input name="email" type="email" placeholder="you@example.com" autoComplete="email" required/></label><label className="field"><span>Password</span><input name="password" type="password" placeholder="At least 6 characters" autoComplete={mode==="login"?"current-password":"new-password"} minLength={6} required/></label>{error&&<div className="auth-error">{error}</div>}<button className="primary auth-submit" disabled={busy}>{busy?"Please wait…":mode==="login"?"Sign in":"Create account"} <ArrowRight size={16}/></button></form><p className="switch-auth">{mode==="login"?"New to Launchpad?":"Already have an account?"} <button onClick={()=>setMode(mode==="login"?"signup":"login")}>{mode==="login"?"Create an account":"Sign in"}</button></p><div className="secure-note"><ShieldCheck size={15}/> Your tracker is private to your signed-in account.</div></div></div></div>}
export default App;