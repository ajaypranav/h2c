"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Trash2, Edit2, Play, Sparkles, Plus, X, Check, Pencil, Clock, BarChart3, Award, Brain } from "lucide-react";
import { cn } from "@/lib/cn";
import { ReviewCard } from "@/types";
import toast from "react-hot-toast";

function MasteryRing({ score, size = 64, strokeWidth = 6 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#00C896" : score >= 50 ? "#FFB800" : "#FF4757";
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e2ec" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700 ease-out" />
    </svg>
  );
}

function RetentionChart() {
  const points = [160, 165, 150, 140, 145, 120, 110, 115, 90, 80, 85, 60, 50, 40];
  const w = 1000, h = 200;
  const d = points.map((y, i) => `${i === 0 ? "M" : "L"}${(i / (points.length - 1)) * w},${y}`).join(" ");
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-border-muted">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-text">Retention Rate</h3>
          <p className="text-xs text-text-muted mt-1">Based on last 14 sessions</p>
        </div>
        <span className="text-xs bg-success-light text-[#005E46] px-3 py-1.5 rounded-full font-bold">+4.2% overall</span>
      </div>
      <div className="h-40 w-full relative">
        <svg className="w-full h-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <line x1="0" x2={w} y1="0" y2="0" stroke="#e2e2ec" strokeDasharray="4" strokeWidth="1" />
          <line x1="0" x2={w} y1="100" y2="100" stroke="#e2e2ec" strokeDasharray="4" strokeWidth="1" />
          <line x1="0" x2={w} y1="200" y2="200" stroke="#e2e2ec" strokeWidth="1" />
          <defs><linearGradient id="chartGrad" x1="0%" x2="100%"><stop offset="0%" stopColor="#a391ff" /><stop offset="100%" stopColor="#5b30ee" /></linearGradient></defs>
          <path d={d} fill="none" stroke="url(#chartGrad)" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <div className="absolute -left-1 top-0 h-full flex flex-col justify-between text-[10px] text-text-light font-bold">
          <span>100%</span><span>50%</span><span>0%</span>
        </div>
      </div>
    </div>
  );
}

function getCardStatus(card: ReviewCard): { label: string; color: string; bg: string } {
  if (card.repetitions >= 5 && card.ease_factor >= 2.5) return { label: "Mastered", color: "#005b43", bg: "rgba(96,252,198,0.3)" };
  if (card.next_review_at && new Date(card.next_review_at) <= new Date()) return { label: "Due", color: "#922c00", bg: "rgba(255,196,178,0.3)" };
  return { label: "Learning", color: "#5a5b62", bg: "#dcdce7" };
}

const fetchTopicDetail = async (id: string) => {
  const res = await fetch(`/api/topics/${id}`);
  if (!res.ok) throw new Error("Failed to fetch topic");
  return res.json();
};

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const topicId = params.id as string;

  const [showAddCard, setShowAddCard] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [newHint, setNewHint] = useState("");
  const [editingTopic, setEditingTopic] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editCardFront, setEditCardFront] = useState("");
  const [editCardBack, setEditCardBack] = useState("");

  const { data, isLoading, isError } = useQuery({ queryKey: ["topic", topicId], queryFn: () => fetchTopicDetail(topicId) });

  const deleteTopic = useMutation({
    mutationFn: async () => { const res = await fetch(`/api/topics/${topicId}`, { method: "DELETE" }); if (!res.ok) throw new Error("Failed"); return res.json(); },
    onSuccess: () => { toast.success("Topic deleted"); queryClient.invalidateQueries({ queryKey: ["topics"] }); router.push("/dashboard"); },
    onError: () => toast.error("Failed to delete topic"),
  });

  const updateTopic = useMutation({
    mutationFn: async (body: Record<string, string>) => { const res = await fetch(`/api/topics/${topicId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (!res.ok) throw new Error("Failed"); return res.json(); },
    onSuccess: () => { toast.success("Topic updated"); setEditingTopic(false); queryClient.invalidateQueries({ queryKey: ["topic", topicId] }); },
    onError: () => toast.error("Failed to update topic"),
  });

  const addCard = useMutation({
    mutationFn: async () => { const res = await fetch(`/api/topics/${topicId}/cards`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ front: newFront, back: newBack, hint: newHint }) }); if (!res.ok) throw new Error("Failed"); return res.json(); },
    onSuccess: () => { toast.success("Card added!"); setShowAddCard(false); setNewFront(""); setNewBack(""); setNewHint(""); queryClient.invalidateQueries({ queryKey: ["topic", topicId] }); },
    onError: () => toast.error("Failed to add card"),
  });

  const editCard = useMutation({
    mutationFn: async (cardId: string) => { const res = await fetch(`/api/cards/${cardId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ front: editCardFront, back: editCardBack }) }); if (!res.ok) throw new Error("Failed"); return res.json(); },
    onSuccess: () => { toast.success("Card updated"); setEditingCardId(null); queryClient.invalidateQueries({ queryKey: ["topic", topicId] }); },
    onError: () => toast.error("Failed to update card"),
  });

  const deleteCard = useMutation({
    mutationFn: async (cardId: string) => { const res = await fetch(`/api/cards/${cardId}`, { method: "DELETE" }); if (!res.ok) throw new Error("Failed"); return res.json(); },
    onSuccess: () => { toast.success("Card deleted"); queryClient.invalidateQueries({ queryKey: ["topic", topicId] }); },
    onError: () => toast.error("Failed to delete card"),
  });

  if (isLoading) return (
    <div className="space-y-6">
      <div className="h-48 animate-shimmer rounded-2xl" />
      <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 animate-shimmer rounded-2xl" />)}</div>
    </div>
  );

  if (isError || !data?.data?.topic) return (
    <div className="text-center py-20 rounded-2xl bg-white shadow-sm">
      <p className="text-5xl mb-4">🔍</p>
      <h3 className="text-xl font-bold text-text mb-2">Topic not found</h3>
      <p className="text-text-muted mb-6">This topic may have been deleted.</p>
      <Link href="/dashboard" className="text-primary font-bold hover:underline">Return to Dashboard</Link>
    </div>
  );

  const topic = data.data.topic;
  const cards: ReviewCard[] = topic.review_cards || [];
  const dueCount = data.data.dueCount || 0;
  const masteredCount = data.data.masteredCount || 0;
  const avgEase = data.data.avgEase || 2.5;
  const lastReviewed = cards.find((c: ReviewCard) => c.last_reviewed_at)?.last_reviewed_at;
  const daysSinceReview = lastReviewed ? Math.floor((Date.now() - new Date(lastReviewed).getTime()) / 86400000) : null;

  return (
    <div className="space-y-8 pb-24">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-text-muted text-sm font-semibold hover:text-text transition-colors">
        <ChevronLeft size={16} /> Dashboard
      </Link>

      {/* Topic Header */}
      <section className="bg-white rounded-2xl p-8 md:p-10 relative overflow-hidden shadow-sm">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-gradient-to-br from-primary-light to-transparent rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="flex flex-col md:flex-row items-center gap-8 z-10 relative">
          <div className="text-6xl bg-[#e8e7f1] p-5 rounded-3xl shadow-sm rotate-2 shrink-0">{topic.emoji}</div>
          <div className="flex-1 text-center md:text-left">
            {editingTopic ? (
              <div className="space-y-3">
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full text-2xl font-extrabold bg-[#f0f0f9] rounded-xl px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary" />
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full bg-[#f0f0f9] rounded-xl px-4 py-2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" rows={2} />
                <div className="flex gap-2">
                  <button onClick={() => updateTopic.mutate({ title: editTitle, description: editDesc })} className="flex items-center gap-1 text-sm font-bold text-white bg-primary px-4 py-1.5 rounded-full"><Check size={14} /> Save</button>
                  <button onClick={() => setEditingTopic(false)} className="flex items-center gap-1 text-sm font-semibold text-text-muted px-4 py-1.5 rounded-full hover:bg-[#f0f0f9]"><X size={14} /> Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-text tracking-tight">{topic.title}</h2>
                  <div className="relative w-16 h-16 shrink-0">
                    <MasteryRing score={Math.round(topic.mastery_score)} size={64} strokeWidth={6} />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-text">{Math.round(topic.mastery_score)}%</span>
                  </div>
                </div>
                {topic.description && <p className="text-text-muted text-base mb-1">{topic.description}</p>}
                {daysSinceReview !== null && (
                  <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-text-muted font-semibold mt-2">
                    <Clock size={16} />
                    <span>Last reviewed {daysSinceReview === 0 ? "today" : daysSinceReview === 1 ? "yesterday" : `${daysSinceReview} days ago`}</span>
                  </div>
                )}
                <div className="flex items-center gap-4 mt-4 justify-center md:justify-start">
                  <button onClick={() => { setEditTitle(topic.title); setEditDesc(topic.description || ""); setEditingTopic(true); }} className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors text-sm font-semibold"><Edit2 size={16} /> Edit</button>
                  <button onClick={() => { if (window.confirm("Delete this topic and all its cards?")) deleteTopic.mutate(); }} className="flex items-center gap-2 text-text-muted hover:text-error transition-colors text-sm font-semibold"><Trash2 size={16} /> Delete</button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Pills */}
      <section className="flex flex-wrap gap-3">
        {[
          { icon: <Sparkles size={18} className="text-primary" />, label: `${cards.length} Total Cards` },
          { icon: <Award size={18} className="text-[#00694d]" />, label: `${masteredCount} Mastered` },
          { icon: <Clock size={18} className="text-secondary" />, label: `${dueCount} Due Today` },
          { icon: <BarChart3 size={18} className="text-primary-dim" />, label: `${avgEase.toFixed(1)} Avg Ease` },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2 bg-[#f0f0f9] px-5 py-3 rounded-full border border-border-muted shadow-sm">
            {s.icon}
            <span className="text-sm font-bold text-text">{s.label}</span>
          </div>
        ))}
      </section>

      {/* Retention Chart & Schedules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RetentionChart />
        
        {topic.review_schedules && topic.review_schedules.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-border-muted overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold text-text mb-4">Topic Retention Plan</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border-muted scrollbar-track-transparent">
              {topic.review_schedules.map((schedule: any) => {
                const date = new Date(schedule.review_date);
                const isDue = schedule.status === "pending" && date <= new Date();
                const isCompleted = schedule.status === "completed";
                
                return (
                  <div 
                    key={schedule.id} 
                    className={cn(
                      "flex-shrink-0 w-24 rounded-2xl border overflow-hidden flex flex-col shadow-sm transition-transform hover:-translate-y-1",
                      isCompleted ? "border-[#00C896] opacity-75" : 
                      isDue ? "border-[#FF4757] ring-2 ring-[#FF4757]/20" : 
                      "border-border-muted"
                    )}
                  >
                    {/* Calendar Header (Month) */}
                    <div className={cn(
                      "text-center py-1.5 text-[10px] font-bold text-white uppercase tracking-wider",
                      isCompleted ? "bg-[#00C896]" : 
                      isDue ? "bg-[#FF4757]" : 
                      "bg-primary"
                    )}>
                      {date.toLocaleString('default', { month: 'short' })} {date.getFullYear()}
                    </div>
                    
                    {/* Calendar Body (Day) */}
                    <div className={cn(
                      "flex-1 flex flex-col items-center justify-center py-3 px-2",
                      isCompleted ? "bg-[#00C896]/10" : 
                      isDue ? "bg-[#FF4757]/10" : 
                      "bg-white"
                    )}>
                      <span className={cn(
                        "text-3xl font-extrabold",
                        isCompleted ? "text-[#005E46]" : 
                        isDue ? "text-[#a63300]" : 
                        "text-text"
                      )}>
                        {date.getDate()}
                      </span>
                      <span className="text-[10px] text-text-muted font-semibold mt-1 bg-white/50 px-2 py-0.5 rounded-full">
                        Day {schedule.interval_num}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Cards Grid */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <h3 className="text-xl font-extrabold text-text">Study Cards</h3>
          <button onClick={() => setShowAddCard(!showAddCard)} className="flex items-center gap-1.5 px-4 py-2 bg-[#e2e2ec] text-primary font-bold text-sm rounded-full hover:bg-primary hover:text-white transition-all">
            <Plus size={16} /> Add Card
          </button>
        </div>

        {showAddCard && (
          <div className="p-5 rounded-2xl bg-[#f0f0f9] space-y-3 shadow-sm">
            <input value={newFront} onChange={e => setNewFront(e.target.value)} placeholder="Front (question)" className="w-full bg-white rounded-xl px-4 py-3 text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary" />
            <textarea value={newBack} onChange={e => setNewBack(e.target.value)} placeholder="Back (answer)" className="w-full bg-white rounded-xl px-4 py-3 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" rows={2} />
            <input value={newHint} onChange={e => setNewHint(e.target.value)} placeholder="Hint (optional)" className="w-full bg-white rounded-xl px-4 py-3 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <div className="flex gap-2">
              <button onClick={() => { if (newFront && newBack) addCard.mutate(); }} disabled={!newFront || !newBack || addCard.isPending} className="text-sm font-bold text-white bg-primary px-5 py-2 rounded-full hover:bg-primary-dim disabled:opacity-50">{addCard.isPending ? "Adding..." : "Add Card"}</button>
              <button onClick={() => { setShowAddCard(false); setNewFront(""); setNewBack(""); setNewHint(""); }} className="text-sm font-semibold text-text-muted px-4 py-2 rounded-full hover:bg-white">Cancel</button>
            </div>
          </div>
        )}

        {cards.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-white border border-dashed border-border">
            <p className="text-text-muted text-sm">No cards generated for this topic yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => {
              const status = getCardStatus(card);
              const isDue = status.label === "Due";
              return (
                <article key={card.id} className={cn("bg-[#f0f0f9] rounded-2xl p-5 transition-all duration-300 flex flex-col h-full group relative",
                  isDue ? "bg-white shadow-md border-l-4" : "hover:bg-white hover:shadow-md border border-border-muted"
                )} style={isDue ? { borderLeftColor: "#a63300" } : undefined}>
                  {editingCardId === card.id ? (
                    <div className="space-y-3">
                      <input value={editCardFront} onChange={e => setEditCardFront(e.target.value)} className="w-full bg-white rounded-xl px-4 py-2 text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary" />
                      <textarea value={editCardBack} onChange={e => setEditCardBack(e.target.value)} className="w-full bg-white rounded-xl px-4 py-2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" rows={2} />
                      <div className="flex gap-2">
                        <button onClick={() => editCard.mutate(card.id)} className="text-xs font-bold text-white bg-primary px-3 py-1.5 rounded-full">Save</button>
                        <button onClick={() => setEditingCardId(null)} className="text-xs font-semibold text-text-muted px-3 py-1.5 rounded-full hover:bg-[#f0f0f9]">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{ backgroundColor: status.bg, color: status.color }}>{status.label}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingCardId(card.id); setEditCardFront(card.front); setEditCardBack(card.back); }} className="p-1.5 hover:bg-[#e2e2ec] rounded-full text-text-muted hover:text-primary"><Pencil size={14} /></button>
                          <button onClick={() => { if (window.confirm("Delete this card?")) deleteCard.mutate(card.id); }} className="p-1.5 hover:bg-error-light rounded-full text-text-muted hover:text-error"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <h4 className="font-semibold text-base text-text flex-grow line-clamp-3">{card.front}</h4>
                      <div className="mt-4 pt-3 border-t border-border-muted flex justify-between items-center">
                        <span className="text-xs text-text-muted">{card.last_reviewed_at ? `Last: ${new Date(card.last_reviewed_at).toLocaleDateString()}` : "Not reviewed"}</span>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Review Now FAB */}
      {dueCount > 0 && (
        <div className="fixed bottom-8 right-8 z-50">
          <button onClick={() => router.push(`/review?topic=${topic.id}`)} className="bg-gradient-to-br from-primary to-[#8B5CF6] text-white px-8 py-5 rounded-full font-extrabold shadow-[0_16px_48px_rgba(108,71,255,0.4)] hover:-translate-y-1 hover:shadow-[0_20px_56px_rgba(108,71,255,0.5)] transition-all duration-300 flex items-center gap-3 group">
            <Play size={24} className="fill-white group-hover:scale-110 transition-transform" />
            <span className="text-lg">Review Now</span>
          </button>
        </div>
      )}
    </div>
  );
}
