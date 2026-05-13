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
  Star 
} from 'lucide-react';
import { db, auth, appId } from './firebase';
import { SessionData, Participant } from './types';

// Standard Eurovision point scale
const POINT_SCALE = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [newCountry, setNewCountry] = useState('');
  const [newParticipant, setNewParticipant] = useState('');
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showResults, setShowResults] = useState(false);

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
        setSessionData(docSnap.data() as SessionData);
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
    if (!newCountry.trim() || !sessionId) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId);
    await updateDoc(docRef, {
      countries: arrayUnion(newCountry.trim())
    });
    setNewCountry('');
  };

  const removeCountry = async (country: string) => {
    if (!sessionId) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId);
    await updateDoc(docRef, {
      countries: arrayRemove(country)
    });
  };

  const addParticipant = async () => {
    if (!newParticipant.trim() || !sessionId) return;
    const pId = Math.random().toString(36).substring(2, 7);
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId);
    const newP: Participant = { id: pId, name: newParticipant.trim(), claimedBy: null };
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

  const castVote = async (country: string, score: number) => {
    if (!myParticipantId || !sessionId || !sessionData) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId);
    
    const currentVotes = { ...(sessionData.votes[myParticipantId] || {}) };
    
    // Rule: Each vote (1-12) can be used only once.
    // If this score was already used elsewhere, clear that country's vote.
    Object.keys(currentVotes).forEach(key => {
      if (currentVotes[key] === score) delete currentVotes[key];
    });

    // Update with new score
    if (score === 0) {
      delete currentVotes[country];
    } else {
      currentVotes[country] = score;
    }

    await updateDoc(docRef, {
      [`votes.${myParticipantId}`]: currentVotes
    });
  };

  const results = useMemo(() => {
    if (!sessionData) return [];
    const totals: { [key: string]: number } = {};
    sessionData.countries.forEach(c => totals[c] = 0);

    Object.values(sessionData.votes).forEach((userVotes) => {
      Object.entries(userVotes).forEach(([country, score]) => {
        if (totals[country] !== undefined) {
          totals[country] += score;
        }
      });
    });

    return Object.entries(totals)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score);
  }, [sessionData]);

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 space-y-8">
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-indigo-300 font-medium animate-pulse">Syncing with the Cloud...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 font-sans">
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 p-3 md:p-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="bg-indigo-600 p-2 md:p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <Music className="w-4 h-4 md:w-5 md:h-5 text-white" />
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
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all border border-white/5"
            >
              {copied ? <Check className="w-3 h-3 md:w-4 md:h-4 text-green-400" /> : <Share2 className="w-3 h-3 md:w-4 md:h-4" />}
              <span className="hidden xs:inline">{copied ? 'Copied!' : 'Invite'}</span>
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

      <main className="max-w-7xl mx-auto p-3 md:p-4 lg:p-8 space-y-8 md:space-y-12">
        
        {/* Results Podium Overlay */}
        {showResults && (
          <section className="bg-gradient-to-br from-indigo-950/50 via-slate-900/80 to-purple-950/30 border border-indigo-500/30 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 text-center animate-in fade-in zoom-in duration-500 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
            <h2 className="text-2xl md:text-4xl font-black mb-8 md:mb-12 flex items-center justify-center gap-3 md:gap-4">
              <Crown className="w-8 h-8 md:w-10 md:h-10 text-yellow-400" />
              THE FINAL STANDINGS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12">
              {results.slice(0, 3).map((res, idx) => (
                <div key={res.name} className={`relative p-6 md:p-8 rounded-3xl border transition-all duration-700 ${idx === 0 ? 'bg-yellow-500/10 border-yellow-500/50 md:scale-110 shadow-[0_0_50px_rgba(234,179,8,0.15)] order-1 md:order-2' : idx === 1 ? 'bg-slate-400/10 border-slate-400/30 order-2 md:order-1 md:mt-8' : 'bg-orange-700/10 border-orange-700/30 order-3 md:mt-12'}`}>
                  <div className="text-4xl md:text-5xl mb-3 md:mb-4">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</div>
                  <div className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-1 md:mb-2">{res.name}</div>
                  <div className="text-3xl md:text-4xl font-black text-indigo-400">{res.score} <span className="text-xs md:text-sm font-bold text-slate-500 uppercase">pts</span></div>
                  {idx === 0 && <Star className="absolute -top-2 -right-2 md:-top-3 md:-right-3 w-6 h-6 md:w-8 md:h-8 text-yellow-400 fill-yellow-400 animate-spin-slow" />}
                </div>
              ))}
            </div>
            
            <div className="max-w-xl mx-auto space-y-3">
               {results.slice(3).map((res, idx) => (
                 <div key={res.name} className="flex items-center justify-between bg-slate-900/50 px-6 py-3 rounded-2xl border border-white/5">
                   <div className="flex items-center gap-4">
                     <span className="text-slate-500 font-bold text-sm">#{idx + 4}</span>
                     <span className="font-bold uppercase tracking-wide">{res.name}</span>
                   </div>
                   <span className="font-black text-indigo-400">{res.score} pts</span>
                 </div>
               ))}
            </div>
          </section>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Settings Panel */}
          <div className="space-y-6">
            <div className="bg-slate-900/50 rounded-3xl border border-white/5 p-6 backdrop-blur-sm">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                <Globe className="w-4 h-4 text-indigo-500" /> Competing Nations
              </h3>
              <div className="space-y-2 mb-6 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-indigo-500/20">
                {sessionData.countries.map((c: string) => (
                  <div key={c} className="flex items-center justify-between bg-slate-800/40 px-4 py-3 rounded-xl group hover:bg-slate-800/60 transition-colors">
                    <span className="font-semibold">{c}</span>
                    {isAdmin && (
                      <button onClick={() => removeCountry(c)} className="text-slate-500 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-all p-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <input 
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCountry()}
                    placeholder="Add a country..." 
                    className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 flex-1 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                  />
                  <button onClick={addCountry} className="bg-indigo-600 hover:bg-indigo-500 p-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="bg-slate-900/50 rounded-3xl border border-white/5 p-6 backdrop-blur-sm">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                <Users className="w-4 h-4 text-indigo-500" /> Party Guests
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

          {/* Voting Matrix Panel */}
          <div className="lg:col-span-2">
            {!myParticipantId ? (
              <div className="bg-indigo-900/10 border-2 border-dashed border-indigo-500/20 rounded-[3rem] p-16 text-center h-full flex flex-col items-center justify-center space-y-6">
                <div className="bg-slate-900 p-6 rounded-3xl shadow-xl">
                  <Users className="w-16 h-16 text-indigo-500 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">READY TO VOTE?</h3>
                  <p className="text-slate-500 max-w-sm mx-auto">Click "JOIN" on your name in the guest list to start assigning your Eurovision points!</p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/30 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-sm">
                <div className="p-8 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20 uppercase">
                      {sessionData.participants.find((p) => p.id === myParticipantId)?.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight uppercase">Your Ballot</h3>
                      <p className="text-xs text-indigo-400 font-bold tracking-widest uppercase">Voting as {sessionData.participants.find((p) => p.id === myParticipantId)?.name}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setMyParticipantId(null)}
                    className="group flex items-center gap-2 text-slate-500 hover:text-white font-bold text-sm transition-all bg-slate-800/50 px-4 py-2 rounded-xl border border-white/5"
                  >
                    <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Sign Out
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/50">
                        <th className="p-4 md:p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5">Country</th>
                        <th className="p-4 md:p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5">Points Assignment</th>
                        <th className="p-4 md:p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 text-center">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionData.countries.map((country: string) => {
                        const myVotes = sessionData.votes[myParticipantId!] || {};
                        const currentScore = myVotes[country] || 0;

                        return (
                          <tr key={country} className="border-b border-white/5 hover:bg-indigo-500/5 transition-all group">
                            <td className="p-4 md:p-6 font-black text-base md:text-lg group-hover:text-indigo-300 transition-colors uppercase tracking-tight">{country}</td>
                            <td className="p-4 md:p-6">
                              <div className="flex flex-wrap gap-1.5 md:gap-2">
                                {POINT_SCALE.map(pt => {
                                  const isUsed = Object.values(myVotes).includes(pt);
                                  const isSelected = currentScore === pt;
                                  
                                  return (
                                    <button
                                      key={pt}
                                      onClick={() => castVote(country, isSelected ? 0 : pt)}
                                      className={`
                                        w-11 h-11 md:w-10 md:h-10 rounded-xl text-sm font-black transition-all
                                        ${isSelected ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-500/40 ring-2 ring-white/20' : 
                                          isUsed ? 'bg-slate-800/50 text-slate-700 opacity-30 cursor-not-allowed' : 
                                          'bg-slate-800 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 border border-white/5'}
                                      `}
                                    >
                                      {pt}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="p-4 md:p-6 text-center">
                              {currentScore > 0 ? (
                                <div className="inline-flex flex-col items-center">
                                  <span className="bg-indigo-500/20 text-indigo-400 px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-black shadow-inner">
                                    {currentScore} PTS
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

                <div className="p-8 bg-slate-950/40 border-t border-white/5">
                  <div className="flex flex-wrap items-center gap-6 text-xs font-bold uppercase tracking-widest text-slate-500">
                    <div className="flex gap-2">
                      {POINT_SCALE.map(pt => (
                        <div 
                          key={pt} 
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all ${Object.values(sessionData.votes[myParticipantId!] || {}).includes(pt) ? 'bg-green-500/10 border-green-500/40 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'bg-slate-900 border-white/5 text-slate-700'}`}
                        >
                          {pt}
                        </div>
                      ))}
                    </div>
                    <span className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      Assign each point value exactly once
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
