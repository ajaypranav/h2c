"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";
import { TOPIC_EMOJIS, TOPIC_COLORS } from "@/types";
import { Sparkles, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

const loadingMessages = [
  "Reading your notes...",
  "Identifying key concepts...",
  "Creating review cards...",
  "Building your schedule...",
];

export default function NewTopicPage() {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [emoji, setEmoji] = useState("📚");
  const [color, setColor] = useState("#6C47FF");
  const [generating, setGenerating] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [success, setSuccess] = useState(false);
  const [createdTopic, setCreatedTopic] = useState<{title: string, card_count: number} | null>(null);
  const queryClient = useQueryClient();

  const handleGenerate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a topic title!");
      return;
    }

    setGenerating(true);
    setLoadingMessageIndex(0);

    // Rotate loading messages
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => {
        if (prev >= loadingMessages.length - 1) return prev;
        return prev + 1;
      });
    }, 1500);

    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          rawNotes: notes.trim() || undefined,
          emoji,
          color,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to create topic");
      }

      clearInterval(interval);
      setCreatedTopic(data.data?.topic);
      setGenerating(false);
      setSuccess(true);

      // Invalidate dashboard and topics queries so they refetch
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      toast.success("✨ Your study plan is ready!");
    } catch (err: unknown) {
      clearInterval(interval);
      setGenerating(false);
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="rounded-[var(--radius-xl)] bg-surface p-8 shadow-md text-center">
          <div className="animate-bounce-in">
            <CheckCircle2 size={64} className="text-success mx-auto mb-4" />
          </div>
          <h2 className="text-2xl font-extrabold text-text mb-2">Topic Created! 🎉</h2>
          <p className="text-text-muted text-sm mb-8">
            &quot;{createdTopic?.title || title}&quot; has been added to your learning plan.
            {createdTopic?.card_count > 0 && ` ${createdTopic.card_count} review cards are ready!`}
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-[var(--radius-full)] bg-gradient-to-r from-primary to-[#8B5CF6] text-white text-sm font-bold hover:shadow-glow transition-all active:scale-[0.98]"
            >
              Go to Dashboard
            </Link>
            <button
              onClick={() => {
                setTitle("");
                setNotes("");
                setEmoji("📚");
                setColor("#6C47FF");
                setSuccess(false);
                setCreatedTopic(null);
              }}
              className="px-6 py-3 rounded-[var(--radius-full)] bg-surface-2 text-text text-sm font-semibold hover:bg-surface-3 transition-all"
            >
              Add Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-4">
      {/* Back Button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-text-muted text-sm font-medium hover:text-text transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      <div className="rounded-[var(--radius-xl)] bg-surface p-8 shadow-md">
        <h1 className="text-2xl font-extrabold text-text mb-1">Add New Topic ✨</h1>
        <p className="text-text-muted text-sm mb-8">
          Tell us what you&apos;re learning — AI will generate your review cards.
        </p>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              What are you learning?
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Photosynthesis, React Hooks, Spanish Verbs..."
              maxLength={100}
              className="w-full px-4 py-3 text-base rounded-[var(--radius-full)] bg-surface-3 text-text placeholder:text-text-light focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-light transition-all"
            />
            <p className="text-text-light text-xs mt-1 text-right">{title.length}/100</p>
          </div>

          {/* Emoji Picker */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Pick an emoji
            </label>
            <div className="flex flex-wrap gap-2">
              {TOPIC_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "w-10 h-10 rounded-[var(--radius-full)] flex items-center justify-center text-lg transition-all",
                    emoji === e
                      ? "bg-primary-light ring-2 ring-primary scale-110"
                      : "bg-surface-2 hover:bg-surface-3"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color Swatches */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Choose a color
            </label>
            <div className="flex gap-3">
              {TOPIC_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-9 h-9 rounded-[var(--radius-full)] transition-all",
                    color === c && "ring-2 ring-offset-2 ring-text scale-110"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste your notes, a textbook excerpt, a YouTube transcript, anything — AI will do the rest. Or leave blank and we'll generate from the title."
              maxLength={5000}
              rows={6}
              className="w-full px-4 py-3 rounded-[var(--radius-lg)] bg-surface-3 text-text text-sm placeholder:text-text-light focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-light transition-all resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-text-light text-xs">
                We&apos;ll generate ~{notes.length > 500 ? 15 : 10} review cards from your {notes.length > 0 ? "notes" : "title"}
              </p>
              <p className="text-text-light text-xs">{notes.length}/5000</p>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !title.trim()}
            className={cn(
              "w-full py-3.5 rounded-[var(--radius-full)] text-sm font-bold text-white transition-all duration-200",
              "bg-gradient-to-r from-primary to-[#8B5CF6] hover:from-primary-dim hover:to-[#7C3AED]",
              "hover:shadow-glow active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
            )}
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                {loadingMessages[loadingMessageIndex]}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles size={16} />
                Generate Study Plan
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
