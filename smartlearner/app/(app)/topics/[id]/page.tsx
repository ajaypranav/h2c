"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Brain, Trash2, Edit2, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { CardType, ReviewCard } from "@/types";

function MasteryRing({ score, size = 48, strokeWidth = 4 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 80 ? "#00C896" : score >= 50 ? "#FFB800" : "#FF4757";

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-surface-2" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

const fetchTopicDetail = async (id: string) => {
  const res = await fetch(`/api/topics/${id}`);
  if (!res.ok) throw new Error("Failed to fetch topic");
  return res.json();
};

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.id as string;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["topic", topicId],
    queryFn: () => fetchTopicDetail(topicId),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-shimmer rounded-[var(--radius-xl)]" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 animate-shimmer rounded-[var(--radius-lg)]" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data?.data?.topic) {
    return (
      <div className="text-center py-20 rounded-[var(--radius-xl)] bg-surface shadow-sm">
        <p className="text-5xl mb-4">🔍</p>
        <h3 className="text-xl font-bold text-text mb-2">Topic not found</h3>
        <p className="text-text-muted mb-6">This topic may have been deleted.</p>
        <Link href="/dashboard" className="text-primary font-bold hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const topic = data.data.topic;
  const cards: ReviewCard[] = topic.review_cards || [];
  const dueCount = data.data.dueCount || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Context Bar */}
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-text-muted text-sm font-semibold hover:text-text transition-colors">
        <ChevronLeft size={16} /> Dashboard
      </Link>

      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-surface p-6 sm:p-8 shadow-sm">
        <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: topic.color }} />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pl-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl bg-surface-2 w-14 h-14 rounded-full flex items-center justify-center shadow-sm">
                {topic.emoji}
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-text">{topic.title}</h1>
                <p className="text-text-muted font-medium text-sm mt-1">
                  Created {new Date(topic.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {topic.description && (
              <p className="text-text max-w-2xl text-sm leading-relaxed mt-4">
                {topic.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 mt-6">
              <button className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors text-sm font-semibold">
                <Edit2 size={16} /> Edit Details
              </button>
              <button className="flex items-center gap-2 text-text-muted hover:text-error transition-colors text-sm font-semibold">
                <Trash2 size={16} /> Delete Topic
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-6 bg-surface-2 p-5 rounded-[var(--radius-lg)] shadow-inner">
            <div className="text-center">
              <div className="relative flex justify-center mb-1">
                <MasteryRing score={Math.round(topic.mastery_score)} size={56} strokeWidth={5} />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-text-muted">
                  {Math.round(topic.mastery_score)}%
                </span>
              </div>
              <p className="text-xs font-semibold text-text-muted">Retention</p>
            </div>
            
            <div className="w-px h-12 bg-border" />
            
            <div className="text-center">
              <p className="text-2xl font-extrabold text-text mb-1">{cards.length}</p>
              <p className="text-xs font-semibold text-text-muted">Cards</p>
            </div>
            
            <div className="w-px h-12 bg-border" />
            
            <div className="text-center">
              <p className="text-2xl font-extrabold text-secondary mb-1">{dueCount}</p>
              <p className="text-xs font-semibold text-text-muted">Due</p>
            </div>
          </div>
        </div>
      </div>

      {/* Review Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => {
            // Trigger topic-specific review in future logic
            router.push(`/review?topic=${topic.id}`);
          }}
          disabled={dueCount === 0}
          className={cn(
            "flex flex-col items-center justify-center gap-2 p-6 rounded-[var(--radius-xl)] transition-all",
            dueCount > 0 
              ? "bg-gradient-to-br from-primary to-[#8B5CF6] text-white hover:shadow-glow active:scale-[0.98] cursor-pointer"
              : "bg-surface-2 text-text-muted cursor-not-allowed border border-dashed border-border"
          )}
        >
          <Play size={24} className={cn(dueCount > 0 ? "fill-white" : "")} />
          <h3 className="font-bold text-lg">Review Due Cards</h3>
          <p className={cn("text-xs font-medium", dueCount > 0 ? "text-white/80" : "text-text-light")}>
            {dueCount} cards waiting for you
          </p>
        </button>

        <button
          onClick={() => {
            // Study all cards regardless of due status
            router.push(`/review?topic=${topic.id}&all=true`);
          }}
          className="flex flex-col items-center justify-center gap-2 p-6 rounded-[var(--radius-xl)] bg-surface text-text hover:bg-surface-2 transition-all shadow-sm active:scale-[0.98]"
        >
          <Brain size={24} className="text-primary" />
          <h3 className="font-bold text-lg">Cram Session</h3>
          <p className="text-xs font-medium text-text-muted">
            Study all {cards.length} cards without affecting SM-2
          </p>
        </button>
      </div>

      {/* Study Cards List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text flex items-center gap-2">
            <Sparkles size={20} className="text-secondary" />
            Study Cards
          </h2>
          <button className="text-sm font-semibold text-primary hover:underline">
            + Add Card
          </button>
        </div>
        
        {cards.length === 0 ? (
          <div className="text-center py-12 rounded-[var(--radius-lg)] bg-surface border border-dashed border-border">
            <p className="text-text-muted text-sm">No cards generated for this topic yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map((card, index) => (
              <div 
                key={card.id}
                className="group p-5 rounded-[var(--radius-lg)] bg-surface shadow-sm hover:shadow-md transition-shadow relative"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-xs font-bold text-text-muted shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-text text-sm mb-2">{card.front}</p>
                    <p className="text-text-muted text-sm">{card.back}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={cn(
                      "text-[10px] uppercase tracking-wider font-extrabold px-2 py-1 rounded-full",
                      card.card_type === "mcq" ? "bg-[#FFB800] text-[#845E00]" :
                      card.card_type === "cloze" ? "bg-[#00C896] text-[#005E46]" :
                      "bg-primary-light text-primary" // basic
                    )}>
                      {card.card_type}
                    </span>
                    {card.last_reviewed_at && (
                      <span className="text-[10px] font-semibold text-text-light">
                        Next: {new Date(card.next_review_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
