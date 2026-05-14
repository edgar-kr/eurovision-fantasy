import React, { useState, useEffect, useMemo } from 'react';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { 
  Plus, 
  Trash2, 
  Trophy, 
  Users, 
  Globe, 
  Share2, 
  Check, 
  RefreshCw, 
  LogOut, 
  Crown, 
  Music, 
  Star,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  ListOrdered,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';
import { db, auth, appId } from './firebase';
import { SessionData, Participant, Vote } from './types';

// Standard Eurovision point scale
const POINT_SCALE = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

// Helper to handle both old number format and new Vote object format
const normalizeVote = (v: any): Vote | null => {
  if (!v) return null;
  if (typeof v === 'number') return { value: v, type: 'mandatory' };
  return v as Vote;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [newCountry, setNewCountry] = useState('');
  const [newParticipant, setNewParticipant] = useState('');
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [resultsTab, setResultsTab] = useState<'overview' | 'advanced'>('overview');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

  // Voting Rule Logic
  const votingRules = useMemo(() => {
    const countryCount = sessionData?.countries.length || 0;
    const sets = countryCount > 20 ? 2 : 1;
    const mandatorySlots = sets * 10;
    const jokerSlots = Math.max(0, countryCount - mandatorySlots);
    return { sets, mandatorySlots, jokerSlots };
  }, [sessionData]);

  const ballotStats = useMemo(() => {
    if (!myParticipantId || !sessionData) return { mandatory: {}, jokerCount: 0 };
    const myVotes = sessionData.votes[myParticipantId] || {};
    const stats: { mandatory: { [key: number]: number }, jokerCount: number } = {
      mandatory: {},
      jokerCount: 0
    };
    
    Object.values(myVotes).forEach(v => {
      const nv = normalizeVote(v);
      if (nv?.type === 'mandatory') {
        stats.mandatory[nv.value] = (stats.mandatory[nv.value] || 0) + 1;
      } else if (nv?.type === 'joker') {
        stats.jokerCount++;
      }
    });
    return stats;
  }, [myParticipantId, sessionData]);

  const isAdmin = useMemo(() => {
    return user && sessionData?.adminId === user.uid;
  }, [user, sessionData]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth failed:", err);
      }
    };
    initAuth();
    
    const unsubscribeAuth = onAuthStateChanged(auth, (currUser) => {
      setUser(currUser);
    });

    const params = new URLSearchParams(window.location.search);
    const sId = params.get('session');
    if (sId) setSessionId(sId);

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!sessionId || !user) return;

    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SessionData;
        setSessionData(data);
        
        // Auto-restore participant session if the user already claimed a slot
        if (user && !myParticipantId) {
          const mySlot = data.participants.find(p => p.claimedBy === user.uid);
          if (mySlot) {
            setMyParticipantId(mySlot.id);
          }
        }
      } else {
        // Initialize new session if it doesn't exist
        const initialData: SessionData = {
          id: sessionId,
          adminId: user.uid,
          countries: ["Sweden", "Finland", "Ukraine", "Norway", "United Kingdom"],
          participants: [],
          votes: {}, // { [participantId]: { [countryName]: score } }
          createdAt: new Date().toISOString()
        };
        setDoc(docRef, initialData);
      }
    }, (error) => console.error("Firestore Error:", error));

    return () => unsubscribe();
  }, [sessionId, user]);

  const createNewGame = () => {
    const id = Math.random().toString(36).substring(2, 9);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('session', id);
    window.location.href = newUrl.toString();
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addCountry = async () => {
    if (!newCountry.trim() || !sessionId || !sessionData) return;
    const name = newCountry.trim();
    
    if (sessionData.countries.some(c => c.toLowerCase() === name.toLowerCase())) {
      alert("This country is already in the list!");
      return;
    }

    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId);
    await updateDoc(docRef, {
      countries: arrayUnion(name)
    });
    setNewCountry('');
  };

  const moveCountry = async (index: number, direction: 'up' | 'down') => {
    if (!sessionId || !sessionData) return;
    const newCountries = [...sessionData.countries];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newCountries.length) return;
    
    [newCountries[index], newCountries[targetIndex]] = [newCountries[targetIndex], newCountries[index]];
    
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId);
    await updateDoc(docRef, { countries: newCountries });
  };

  const removeCountry = async (country: string) => {
    if (!sessionId) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId);
    await updateDoc(docRef, {
      countries: arrayRemove(country)
    });
  };

  const addParticipant = async () => {
    if (!newParticipant.trim() || !sessionId || !sessionData) return;
    const name = newParticipant.trim();

    if (sessionData.participants.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      alert("This participant is already in the list!");
      return;
    }

    const pId = Math.random().toString(36).substring(2, 7);
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId);
    const newP: Participant = { id: pId, name: name, claimedBy: null };
    await updateDoc(docRef, {
      participants: arrayUnion(newP)
    });
    setNewParticipant('');
  };

  const claimSlot = async (pId: string) => {
    if (!sessionId || !user || !sessionData) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId);
    const updatedParticipants = sessionData.participants.map((p) => 
      p.id === pId ? { ...p, claimedBy: user.uid } : p
    );
    await updateDoc(docRef, { participants: updatedParticipants });
    setMyParticipantId(pId);
  };

  const releaseSlot = async () => {
    if (!sessionId || !myParticipantId || !sessionData) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId);
    const updatedParticipants = sessionData.participants.map((p) => 
      p.id === myParticipantId ? { ...p, claimedBy: null } : p
    );
    await updateDoc(docRef, { participants: updatedParticipants });
    setMyParticipantId(null);
  };

  const castVote = async (country: string, score: number, type: 'mandatory' | 'joker' = 'mandatory') => {
    if (!myParticipantId || !sessionId || !sessionData) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId);
    
    const currentBallot = { ...(sessionData.votes[myParticipantId] || {}) };
    
    // If setting a score (not clearing)
    if (score > 0) {
      if (type === 'mandatory') {
        const count = ballotStats.mandatory[score] || 0;
        // If we already reached the limit for this point value in this ballot
        if (count >= votingRules.sets) {
          // If this country was already using this mandatory score, we are toggling it OFF
          const existing = normalizeVote(currentBallot[country]);
          if (existing?.type === 'mandatory' && existing.value === score) {
            delete currentBallot[country];
          } else {
            // Otherwise, we don't allow adding more than the set limit
            return;
          }
        } else {
          currentBallot[country] = { value: score, type };
        }
      } else {
        // Joker Type
        if (ballotStats.jokerCount >= votingRules.jokerSlots) {
          // Only allow if we are changing the value of an existing Joker for THIS country
          const existing = normalizeVote(currentBallot[country]);
          if (existing?.type !== 'joker') return;
        }
        currentBallot[country] = { value: score, type };
      }
    } else {
      delete currentBallot[country];
    }

    await updateDoc(docRef, {
      [`votes.${myParticipantId}`]: currentBallot
    });
  };

  const results = useMemo(() => {
    if (!sessionData) return [];
    const totals: { [key: string]: number } = {};
    sessionData.countries.forEach(c => totals[c] = 0);

    Object.values(sessionData.votes).forEach((userVotes) => {
      Object.entries(userVotes).forEach(([country, vote]) => {
        const v = normalizeVote(vote);
        if (v && totals[country] !== undefined) {
          totals[country] += v.value;
        }
      });
    });

    return Object.entries(totals)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score);
  }, [sessionData]);

  const globalTop10 = useMemo(() => results.slice(0, 10).map(r => r.name), [results]);

  if (!sessionId) {
    return (
      <div className="min-h-screen text-white flex flex-col items-center justify-center p-6 space-y-8">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/30 animate-pulse">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-6xl font-black tracking-tighter bg-gradient-to-br from-white via-indigo-200 to-slate-500 bg-clip-text text-transparent">
            FANTASY<br />EUROVISION
          </h1>
          <p className="text-slate-400 text-lg max-w-md mx-auto">
            Host the ultimate watch party. Real-time voting, live leaderboards, and zero math required.
          </p>
        </div>
        <button 
          onClick={createNewGame}
          className="group relative bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 px-12 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(79,70,229,0.4)]"
        >
          <span className="flex items-center gap-3 text-xl">
            CREATE NEW SESSION <Plus className="w-6 h-6" />
          </span>
        </button>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-indigo-300 font-medium animate-pulse">Syncing with the Cloud...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-200 font-sans flex flex-col">
      <header className="sticky top-0 z-50 bg-slate-950/60 backdrop-blur-xl border-b border-white/5 p-3 md:p-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors lg:flex hidden items-center justify-center text-indigo-400"
              title={isSettingsOpen ? "Hide Sidebar" : "Show Sidebar"}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 md:p-2 rounded-xl shadow-lg flex items-center justify-center">
              <span className="font-black text-white text-xs">E26</span>
            </div>
            <div>
              <h1 className="font-black tracking-tight text-lg md:text-xl">EURO PARTY</h1>
              <div className="flex items-center gap-2">
                <p className="text-[9px] md:text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Live Session: {sessionId}</p>
                {isAdmin && (
                  <span className="text-[8px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter border border-amber-500/20">ADMIN</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={copyInviteLink}
              className={`flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all border ${copied ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-slate-800/80 hover:bg-slate-700 border-white/5'}`}
            >
              {copied ? <Check className="w-3 h-3 md:w-4 md:h-4 text-green-400" /> : <Share2 className="w-3 h-3 md:w-4 md:h-4" />}
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
            <button 
              onClick={() => setShowResults(!showResults)}
              className={`px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-black transition-all flex items-center gap-2 shadow-lg ${showResults ? 'bg-indigo-600 text-white' : 'bg-white text-slate-950 hover:bg-indigo-50'}`}
            >
              <Trophy className="w-3 h-3 md:w-4 md:h-4" />
              <span>{showResults ? 'CLOSE' : 'WINNER'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={`
            fixed inset-y-0 left-0 z-40 w-80 bg-slate-950/40 backdrop-blur-2xl border-r border-white/5 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
            ${isSettingsOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'}
          `}
        >
          <div className="h-full flex flex-col p-6 space-y-8 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between lg:hidden">
              <h2 className="text-lg font-black tracking-tight">MANAGEMENT</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>

            {isAdmin && (
              <div className="bg-white/5 rounded-3xl border border-white/5 p-6 backdrop-blur-sm">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                  <span className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-indigo-500" /> Nations
                  </span>
                  <span className="bg-slate-800 text-indigo-400 px-2 py-1 rounded-lg text-[10px] font-bold">
                    {sessionData.countries.length}
                  </span>
                </h3>
                <div className="space-y-2 mb-6 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-indigo-500/20">
                  {sessionData.countries.map((c: string, idx: number) => (
                    <div key={c} className="flex items-center justify-between bg-slate-800/40 px-4 py-2 rounded-xl group hover:bg-slate-800/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-600 w-4">{idx + 1}</span>
                        <span className="font-semibold text-sm">{c}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveCountry(idx, 'up')} disabled={idx === 0} className="text-slate-500 hover:text-indigo-400 disabled:opacity-10 p-1.5"><ChevronUp className="w-4 h-4" /></button>
                        <button onClick={() => moveCountry(idx, 'down')} disabled={idx === sessionData.countries.length - 1} className="text-slate-500 hover:text-indigo-400 disabled:opacity-10 p-1.5"><ChevronDown className="w-4 h-4" /></button>
                        <button onClick={() => removeCountry(c)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1.5 ml-1"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCountry()}
                    placeholder="Add country..." 
                    className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 flex-1 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                  />
                  <button onClick={addCountry} className="bg-indigo-600 hover:bg-indigo-500 p-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white/5 rounded-3xl border border-white/5 p-6 backdrop-blur-sm">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-indigo-500" /> Party Guests
                </span>
                <span className="bg-slate-800 text-indigo-400 px-2 py-1 rounded-lg text-[10px] font-bold">
                  {sessionData.participants.length}
                </span>
              </h3>
              <div className="space-y-2 mb-6">
                {sessionData.participants.map((p: Participant) => (
                  <div key={p.id} className="flex items-center justify-between bg-slate-800/40 px-4 py-3 rounded-xl border border-transparent hover:border-indigo-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${p.claimedBy ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-600'}`} />
                      <span className={`font-bold ${p.id === myParticipantId ? 'text-indigo-400' : ''}`}>{p.name}</span>
                    </div>
                    {!p.claimedBy && !myParticipantId ? (
                      <button 
                        disabled={!user}
                        onClick={() => claimSlot(p.id)}
                        className={`text-xs font-black tracking-wider uppercase px-4 py-2 rounded-xl shadow-lg transition-all active:scale-95 ${!user ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'}`}
                      >
                        {user ? 'JOIN' : '...'}
                      </button>
                    ) : p.claimedBy === user?.uid && (
                      <span className="text-xs bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-lg font-black uppercase">YOU</span>
                    )}
                  </div>
                ))}
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <input 
                    value={newParticipant}
                    onChange={(e) => setNewParticipant(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                    placeholder="Friend's name..." 
                    className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 flex-1 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                  />
                  <button onClick={addParticipant} className="bg-indigo-600 hover:bg-indigo-500 p-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
            
            {/* Mobile Sidebar Toggle */}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="lg:hidden w-full flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-white/5 text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
            >
              <span className="flex items-center gap-3">
                <Menu className="w-4 h-4 text-indigo-500" /> Management
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Results Podium Overlay */}
            {showResults && (
              <section className="bg-slate-950/40 backdrop-blur-3xl border border-indigo-500/30 rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8 lg:p-12 animate-in fade-in zoom-in duration-500 shadow-2xl relative overflow-hidden mb-12">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                  <h2 className="text-2xl md:text-3xl font-black flex items-center gap-3 md:gap-4">
                    <Crown className="w-8 h-8 md:w-10 md:h-10 text-yellow-400" />
                    STANDINGS
                  </h2>

                  <div className="flex bg-slate-950/50 p-1 rounded-2xl border border-white/5">
                    <button 
                      onClick={() => setResultsTab('overview')}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${resultsTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <ListOrdered className="w-4 h-4" /> OVERVIEW
                    </button>
                    <button 
                      onClick={() => setResultsTab('advanced')}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${resultsTab === 'advanced' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <LayoutGrid className="w-4 h-4" /> ADVANCED
                    </button>
                  </div>
                </div>

                {resultsTab === 'overview' ? (
                  <div className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                      {results.slice(0, 3).map((res, idx) => (
                        <div key={res.name} className={`relative p-6 md:p-8 rounded-3xl border transition-all duration-700 ${idx === 0 ? 'bg-yellow-500/10 border-yellow-500/50 md:scale-110 shadow-[0_0_50px_rgba(234,179,8,0.15)] order-1 md:order-2' : idx === 1 ? 'bg-slate-400/10 border-slate-400/30 order-2 md:order-1 md:mt-8' : 'bg-orange-700/10 border-orange-700/30 order-3 md:mt-12'}`}>
                          <div className="text-4xl md:text-5xl mb-3 md:mb-4">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</div>
                          <div className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-1 md:mb-2">{res.name}</div>
                          <div className="text-3xl md:text-4xl font-black text-indigo-400">{res.score} <span className="text-xs md:text-sm font-bold text-slate-500 uppercase">pts</span></div>
                          {idx === 0 && <Star className="absolute -top-2 -right-2 md:-top-3 md:-right-3 w-6 h-6 md:w-8 md:h-8 text-yellow-400 fill-yellow-400 animate-spin-slow" />}
                        </div>
                      ))}
                    </div>
                    
                    <div className="max-w-2xl mx-auto overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40">
                       <table className="w-full text-left border-collapse">
                         <thead>
                           <tr className="bg-slate-950/50">
                             <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Rank</th>
                             <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Country</th>
                             <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Points</th>
                           </tr>
                         </thead>
                         <tbody>
                           {results.slice(0, 10).map((res, idx) => (
                             <tr key={res.name} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                               <td className="p-4 font-black text-slate-500">#{idx + 1}</td>
                               <td className="p-4 font-bold uppercase tracking-tight">{res.name}</td>
                               <td className="p-4 font-black text-indigo-400 text-right">{res.score} PTS</td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-3xl border border-white/5 bg-slate-900/40">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-slate-950/50">
                          <th className="sticky left-0 z-20 bg-slate-950 p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-r border-white/5">Country</th>
                          {sessionData.participants.map(p => {
                            const userVotes = sessionData.votes[p.id] || {};
                            const userTop10 = Object.entries(userVotes)
                              .map(([name, v]) => ({ name, value: normalizeVote(v)?.value || 0 }))
                              .sort((a,b) => b.value - a.value)
                              .slice(0, 10)
                              .map(v => v.name);
                            const matchCount = userTop10.filter(name => globalTop10.includes(name)).length;

                            return (
                              <th key={p.id} className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-center min-w-[120px]">
                                <div className="flex flex-col items-center gap-1">
                                  <span>{p.name}</span>
                                  <span className="bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded text-[8px] flex items-center gap-1 border border-green-500/20">
                                    <Check className="w-2 h-2" /> {matchCount}/10 MATCH
                                  </span>
                                </div>
                              </th>
                            );
                          })}
                          <th className="p-4 text-[10px] font-black text-indigo-500 uppercase tracking-widest border-b border-white/5 text-center bg-indigo-500/5">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessionData.countries.map(country => {
                          const total = results.find(r => r.name === country)?.score || 0;
                          const isGlobalTop10 = globalTop10.includes(country);
                          const globalRank = results.findIndex(r => r.name === country) + 1;

                          return (
                            <tr key={country} className={`border-b border-white/5 hover:bg-white/5 transition-colors group ${isGlobalTop10 ? 'bg-amber-500/[0.03]' : ''}`}>
                              <td className={`sticky left-0 z-10 group-hover:bg-slate-800 p-4 font-bold uppercase text-xs border-r border-white/5 flex items-center gap-3 ${isGlobalTop10 ? 'bg-amber-950/20 text-amber-200' : 'bg-slate-900/60'}`}>
                                {isGlobalTop10 && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
                                <span className="flex-1 truncate">{country}</span>
                                {isGlobalTop10 && <span className="text-[8px] font-black opacity-40">#{globalRank}</span>}
                              </td>
                              {sessionData.participants.map(p => {
                                const vote = normalizeVote(sessionData.votes[p.id]?.[country]);
                                const userVotes = Object.values(sessionData.votes[p.id] || {});
                                const sortedValues = userVotes.map(v => normalizeVote(v)?.value || 0).sort((a,b) => b-a);
                                const topThreshold = sortedValues[9] || 0;
                                const isTop = vote && vote.value > 0 && vote.value >= topThreshold;

                                return (
                                  <td key={p.id} className={`p-4 text-center text-sm font-black transition-all ${isTop ? 'bg-indigo-600/20 text-indigo-300 ring-1 ring-inset ring-indigo-500/30' : 'text-slate-600'}`}>
                                    {vote?.value || '—'}
                                  </td>
                                );
                              })}
                              <td className={`p-4 text-center font-black bg-indigo-500/5 ${isGlobalTop10 ? 'text-amber-500' : 'text-indigo-400'}`}>{total}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* Voting Matrix Panel */}
            <div className="w-full">
              {!myParticipantId ? (
                <div className="bg-indigo-900/10 border-2 border-dashed border-indigo-500/20 rounded-[3rem] p-16 text-center h-full flex flex-col items-center justify-center space-y-6 backdrop-blur-sm">
                  <div className="bg-slate-900/50 p-6 rounded-3xl shadow-xl">
                    <Users className="w-16 h-16 text-indigo-500 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">READY TO VOTE?</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">Click "JOIN" on your name in the guest list to start assigning your Eurovision points!</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/30 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-xl">
                  <div className="p-6 md:p-8 border-b border-white/5 bg-slate-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20 uppercase text-white">
                        {sessionData.participants.find((p) => p.id === myParticipantId)?.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-black tracking-tight uppercase">Your Ballot</h3>
                        <p className="text-xs text-indigo-400 font-bold tracking-widest uppercase">Voting as {sessionData.participants.find((p) => p.id === myParticipantId)?.name}</p>
                      </div>
                    </div>
                    <button 
                      onClick={releaseSlot}
                      className="group flex items-center gap-2 text-slate-500 hover:text-red-400 font-bold text-xs transition-all bg-slate-800/40 px-3 py-2 rounded-xl border border-white/5"
                    >
                      <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                      <span className="hidden xs:inline">Sign Out</span>
                    </button>
                  </div>

                  <div className="p-6 md:p-8 border-b border-white/5 bg-slate-950/10 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                          <span>Mandatory Points ({votingRules.sets} set{votingRules.sets > 1 ? 's' : ''})</span>
                          <span>{Object.values(ballotStats.mandatory).reduce((a, b) => a + b, 0)} / {votingRules.mandatorySlots} USED</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {POINT_SCALE.map(pt => {
                             const count = ballotStats.mandatory[pt] || 0;
                             const isFullyUsed = count >= votingRules.sets;
                             return (
                              <div 
                                key={pt} 
                                className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center transition-all border ${isFullyUsed ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400 shadow-lg shadow-indigo-500/10' : 'bg-slate-900/60 border-white/5 text-slate-700'}`}
                              >
                                <span className="text-[10px] font-black">{pt}</span>
                                {votingRules.sets > 1 && (
                                  <div className="flex gap-0.5 mt-0.5">
                                    {[...Array(votingRules.sets)].map((_, i) => (
                                      <div key={i} className={`w-1 h-1 rounded-full ${i < count ? 'bg-indigo-400' : 'bg-slate-800'}`} />
                                    ))}
                                  </div>
                                )}
                              </div>
                             );
                          })}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                          <span>Joker Slots</span>
                          <span className={ballotStats.jokerCount >= votingRules.jokerSlots ? 'text-amber-500' : ''}>
                            {ballotStats.jokerCount} / {votingRules.jokerSlots} USED
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {votingRules.jokerSlots > 0 ? (
                            [...Array(votingRules.jokerSlots)].map((_, i) => (
                              <div key={i} className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${i < ballotStats.jokerCount ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-lg shadow-amber-500/10' : 'bg-slate-900/60 border-white/5 text-slate-700'}`}>
                                <Star className={`w-4 h-4 ${i < ballotStats.jokerCount ? 'fill-amber-500' : ''}`} />
                              </div>
                            ))
                          ) : (
                            <p className="text-[10px] text-slate-600 font-bold italic uppercase tracking-tighter">Add countries to enable Jokers</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Show</span>
                        <select 
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(parseInt(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="bg-slate-800/60 text-[10px] font-black p-1.5 rounded-lg border border-white/5 outline-none text-indigo-400"
                        >
                          <option value="10">10</option>
                          <option value="20">20</option>
                          <option value="999">ALL</option>
                        </select>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Countries</span>
                      </div>

                      <div className="flex items-center gap-4">
                         <button 
                           disabled={currentPage === 1}
                           onClick={() => setCurrentPage(prev => prev - 1)}
                           className="p-2 bg-slate-800/60 rounded-xl disabled:opacity-20 hover:text-indigo-400 transition-colors border border-white/5"
                         >
                           <ChevronLeft className="w-4 h-4" />
                         </button>
                         <span className="text-[10px] font-black text-indigo-400 tracking-widest uppercase">Page {currentPage} of {Math.ceil(sessionData.countries.length / pageSize)}</span>
                         <button 
                           disabled={currentPage >= Math.ceil(sessionData.countries.length / pageSize)}
                           onClick={() => setCurrentPage(prev => prev + 1)}
                           className="p-2 bg-slate-800/60 rounded-xl disabled:opacity-20 hover:text-indigo-400 transition-colors border border-white/5"
                         >
                           <ChevronRight className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950/40">
                          <th className="p-4 md:p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5">Country</th>
                          <th className="p-4 md:p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5">Mandatory Rank</th>
                          {votingRules.jokerSlots > 0 && (
                            <th className="p-4 md:p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 text-center">Joker</th>
                          )}
                          <th className="p-4 md:p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 text-center">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessionData.countries
                          .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                          .map((country: string) => {
                          const myVotes = sessionData.votes[myParticipantId!] || {};
                          const currentVote = normalizeVote(myVotes[country]);
                          const isJokerMode = currentVote?.type === 'joker';

                          return (
                            <tr key={country} className="border-b border-white/5 hover:bg-indigo-500/5 transition-all group">
                              <td className="p-4 md:p-6 font-black text-base md:text-lg group-hover:text-indigo-300 transition-colors uppercase tracking-tight">{country}</td>
                              <td className="p-4 md:p-6">
                                <div className="flex flex-wrap gap-1.5 md:gap-2">
                                  {POINT_SCALE.map(pt => {
                                    const usageCount = ballotStats.mandatory[pt] || 0;
                                    const isSelected = !isJokerMode && currentVote?.value === pt;
                                    const isFullyUsed = usageCount >= votingRules.sets;
                                    
                                    return (
                                      <button
                                        key={pt}
                                        onClick={() => castVote(country, pt, 'mandatory')}
                                        className={`
                                          w-11 h-11 md:w-10 md:h-10 rounded-xl text-sm font-black transition-all relative
                                          ${isSelected ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-500/40 ring-2 ring-white/20' : 
                                            (isFullyUsed && !isSelected) ? 'bg-slate-800/30 text-slate-700 opacity-20 cursor-not-allowed' : 
                                            'bg-slate-800/60 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 border border-white/5'}
                                        `}
                                      >
                                        {pt}
                                        {votingRules.sets > 1 && !isSelected && (
                                          <span className="absolute -top-1 -right-1 bg-slate-700 text-[8px] w-4 h-4 rounded-full flex items-center justify-center border border-white/10">
                                            {votingRules.sets - usageCount}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </td>
                              {votingRules.jokerSlots > 0 && (
                                <td className="p-4 md:p-6 text-center">
                                  <select 
                                    value={isJokerMode ? currentVote.value : 0}
                                    onChange={(e) => castVote(country, parseInt(e.target.value), 'joker')}
                                    disabled={!isJokerMode && ballotStats.jokerCount >= votingRules.jokerSlots}
                                    className={`bg-slate-800/60 text-xs font-black p-2 rounded-lg border outline-none transition-all ${isJokerMode ? 'border-amber-500 text-amber-500' : 'border-white/5 text-slate-500 disabled:opacity-20'}`}
                                  >
                                    <option value="0">OFF</option>
                                    {POINT_SCALE.map(pt => (
                                      <option key={pt} value={pt}>{pt} PTS</option>
                                    ))}
                                  </select>
                                </td>
                              )}
                              <td className="p-4 md:p-6 text-center">
                                {currentVote && currentVote.value > 0 ? (
                                  <div className="inline-flex flex-col items-center gap-1">
                                    <span className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-black shadow-inner flex items-center gap-1.5 ${isJokerMode ? 'bg-amber-500/20 text-amber-500' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                      {isJokerMode && <Star className="w-3 h-3 fill-amber-500" />}
                                      {currentVote.value}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-700 text-sm font-bold tracking-widest">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
