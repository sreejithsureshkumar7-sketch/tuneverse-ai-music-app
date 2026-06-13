import React, {useEffect, useState} from 'react';
import { createRoot } from 'react-dom/client';
import { Play, Pause, Upload, Sparkles, Search } from 'lucide-react';



const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App(){
  const [songs,setSongs]=useState([]),[q,setQ]=useState(''),[current,setCurrent]=useState(null),[playing,setPlaying]=useState(false);
  const [aiText,setAiText]=useState('sad love songs'),[mood,setMood]=useState('');
  const [form,setForm]=useState({title:'',artist:'',language:'Tamil',mood:'Happy'});
  const [audio,setAudio]=useState(null),[cover,setCover]=useState(null);

  const load=()=>fetch(`${API}/api/songs?q=${q}`).then(r=>r.json()).then(setSongs).catch(()=>setSongs([]));
  useEffect(()=>{load()},[]);
  const rec=async()=>{const r=await fetch(`${API}/api/ai/recommend`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:aiText})}); const d=await r.json(); setMood(d.detectedMood); setSongs(d.songs)};
  const upload=async(e)=>{e.preventDefault(); const fd=new FormData(); Object.entries(form).forEach(([k,v])=>fd.append(k,v)); fd.append('isLicensed','true'); if(audio)fd.append('audio',audio); if(cover)fd.append('cover',cover); const r=await fetch(`${API}/api/songs`,{method:'POST',body:fd}); if(!r.ok){alert((await r.json()).message);return} setForm({title:'',artist:'',language:'Tamil',mood:'Happy'}); setAudio(null); setCover(null); load(); alert('Song uploaded')};
  return <div className="app">
    <aside><h1>TuneVerse <span>AI</span></h1><p>Premium style music app demo</p><button onClick={rec}><Sparkles/> AI Playlist</button><small>Upload only owned/licensed songs.</small></aside>
    <main>
      <section className="hero"><h2>All Songs, Playlists & AI Mood Music</h2><div className="search"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search song / artist"/><button onClick={load}>Search</button></div></section>
      <section className="grid">
        <div className="card"><h3>AI Recommendation</h3><input value={aiText} onChange={e=>setAiText(e.target.value)} placeholder="Ex: study focus songs"/><button onClick={rec}>Generate</button>{mood&&<p>Detected mood: <b>{mood}</b></p>}</div>
        <form className="card" onSubmit={upload}><h3><Upload/> Upload Song</h3><input placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/><input placeholder="Artist" value={form.artist} onChange={e=>setForm({...form,artist:e.target.value})} required/><select value={form.language} onChange={e=>setForm({...form,language:e.target.value})}><option>Tamil</option><option>English</option><option>Hindi</option></select><select value={form.mood} onChange={e=>setForm({...form,mood:e.target.value})}><option>Happy</option><option>Sad</option><option>Study</option><option>Workout</option></select><label>Audio file</label><input type="file" accept="audio/*" onChange={e=>setAudio(e.target.files[0])} required/><label>Cover image</label><input type="file" accept="image/*" onChange={e=>setCover(e.target.files[0])}/><button>Upload Licensed Song</button></form>
      </section>
      <h3>Songs</h3><div className="songs">{songs.map(s=><div className="song" key={s._id}><img src={s.coverUrl||'https://placehold.co/90x90/1db954/ffffff?text=TV'} /><div><b>{s.title}</b><p>{s.artist} • {s.language} • {s.mood}</p></div><button onClick={()=>{setCurrent(s);setPlaying(true)}}><Play/></button></div>)}</div>
    </main>
    {current&&<footer><button onClick={()=>setPlaying(!playing)}>{playing?<Pause/>:<Play/>}</button><div><b>{current.title}</b><p>{current.artist}</p></div><audio src={current.audioUrl} controls autoPlay={playing}/></footer>}
  </div>
}
createRoot(document.getElementById('root')).render(<App/>);
