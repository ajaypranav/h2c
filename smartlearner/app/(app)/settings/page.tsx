"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { User, Bell, Brain, ShieldAlert, Download, Trash2, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  const [displayName, setDisplayName] = useState("Learner");
  const [avatar, setAvatar] = useState("🎓");
  const [timezone, setTimezone] = useState("Pacific Time (PT)");
  const [dailyReminder, setDailyReminder] = useState(true);
  const [streakWarning, setStreakWarning] = useState(true);
  const [sessionSize, setSessionSize] = useState(20);
  const [difficulty, setDifficulty] = useState<"easy" | "balanced" | "hard">("balanced");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const { data: profileData } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const res = await fetch("/api/user/settings");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    }
  });

  useEffect(() => {
    if (profileData?.data) {
      setDisplayName(profileData.data.display_name || "Learner");
      setAvatar(profileData.data.avatar_url || "🎓");
    }
    
    const storedPrefsStr = localStorage.getItem("smartlearner_prefs");
    if (storedPrefsStr) {
      try {
        const stored = JSON.parse(storedPrefsStr);
        if (stored.dailyReminder !== undefined) setDailyReminder(stored.dailyReminder);
        if (stored.streakWarning !== undefined) setStreakWarning(stored.streakWarning);
        if (stored.sessionSize) setSessionSize(stored.sessionSize);
        if (stored.difficulty) setDifficulty(stored.difficulty);
        if (stored.timezone) setTimezone(stored.timezone);
      } catch (e) {
        console.error("Failed to parse stored preferences", e);
      }
    }
  }, [profileData]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { display_name: string; avatar_url: string }) => {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      toast.success("Profile saved! ✅");
    },
    onError: () => toast.error("Failed to save profile.")
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({ display_name: displayName, avatar_url: avatar });
  };

  const handleSavePreferences = () => {
    localStorage.setItem("smartlearner_prefs", JSON.stringify({
      dailyReminder,
      streakWarning,
      sessionSize,
      difficulty,
      timezone
    }));
    toast.success("Preferences saved! ✅");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <div className="space-y-8 md:space-y-12 pb-24 md:pb-12 max-w-4xl mx-auto mt-4 px-2">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-text">Settings</h1>
        <p className="text-text-muted text-lg">Manage your learning experience and account preferences.</p>
      </div>

      {/* Settings Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        
        {/* Profile Module */}
        <section className="bg-surface-2 rounded-[var(--radius-lg)] p-1 h-full shadow-sm">
          <div className="bg-surface rounded-tl-[1.8rem] rounded-bl-[1.8rem] rounded-tr-[1.8rem] rounded-br-[1.8rem] p-6 h-full flex flex-col shadow-[0_4px_20px_rgba(108,71,255,0.04)]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-primary">
                <User size={24} className="fill-[var(--color-primary)] opacity-80" />
                <h2 className="font-bold text-xl text-text">Profile</h2>
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
                className="text-xs font-bold text-primary bg-primary-light px-3 py-1.5 rounded-full hover:bg-primary-light/80 transition-colors"
                title="Save Profile"
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
            
            <div className="space-y-5 flex-1">
              <div className="space-y-2">
                <label htmlFor="displayName" className="block text-sm font-semibold text-text-muted">Display Name</label>
                <input 
                  id="displayName" 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-surface-3 text-text rounded-full px-5 py-3 border-none focus:ring-0 focus:bg-surface focus:outline focus:outline-2 focus:outline-[var(--color-primary)] outline-offset-[-2px] transition-all" 
                />
              </div>
              <div className="flex gap-4">
                <div className="space-y-2 w-1/3">
                  <label htmlFor="emoji" className="block text-sm font-semibold text-text-muted">Emoji</label>
                  <input 
                    id="emoji" 
                    type="text" 
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full bg-surface-3 text-text rounded-full px-4 py-3 text-center border-none focus:ring-0 focus:bg-surface focus:outline focus:outline-2 focus:outline-[var(--color-primary)] outline-offset-[-2px] transition-all text-xl" 
                  />
                </div>
                <div className="space-y-2 w-2/3">
                  <label htmlFor="timezone" className="block text-sm font-semibold text-text-muted">Timezone</label>
                  <select 
                    id="timezone" 
                    value={timezone}
                    onChange={(e) => { setTimezone(e.target.value); setTimeout(handleSavePreferences, 100); }}
                    className="w-full bg-surface-3 text-text rounded-full px-5 py-3 border-none focus:ring-0 focus:bg-surface focus:outline focus:outline-2 focus:outline-[var(--color-primary)] outline-offset-[-2px] transition-all appearance-none"
                  >
                    <option value="Pacific Time (PT)">Pacific Time (PT)</option>
                    <option value="Eastern Time (ET)">Eastern Time (ET)</option>
                    <option value="Central European (CET)">Central European (CET)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Study Preferences Module */}
        <section className="bg-surface-2 rounded-[var(--radius-lg)] p-1 h-full shadow-sm">
          <div className="bg-surface rounded-tl-[1.8rem] rounded-bl-[1.8rem] rounded-tr-[1.8rem] rounded-br-[1.8rem] p-6 h-full flex flex-col shadow-[0_4px_20px_rgba(108,71,255,0.04)]">
            <div className="flex items-center gap-3 mb-6 text-primary">
              <Brain size={24} className="fill-[var(--color-primary)] opacity-80" />
              <h2 className="font-bold text-xl text-text">Study Preferences</h2>
            </div>
            
            <div className="space-y-5 flex-1">
              <div className="space-y-2">
                <label htmlFor="sessionSize" className="block text-sm font-semibold text-text-muted">Default Session Size</label>
                <select 
                  id="sessionSize" 
                  value={sessionSize}
                  onChange={(e) => { setSessionSize(Number(e.target.value)); setTimeout(handleSavePreferences, 100); }}
                  className="w-full bg-surface-3 text-text rounded-full px-5 py-3 border-none focus:ring-0 focus:bg-surface focus:outline focus:outline-2 focus:outline-[var(--color-primary)] outline-offset-[-2px] transition-all appearance-none"
                >
                  <option value={10}>Micro (5-10 mins)</option>
                  <option value={20}>Standard (15-20 mins)</option>
                  <option value={30}>Deep Dive (30+ mins)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="difficulty" className="block text-sm font-semibold text-text-muted">Adaptive Difficulty</label>
                <select 
                  id="difficulty" 
                  value={difficulty}
                  onChange={(e) => { setDifficulty(e.target.value as "easy"|"balanced"|"hard"); setTimeout(handleSavePreferences, 100); }}
                  className="w-full bg-surface-3 text-text rounded-full px-5 py-3 border-none focus:ring-0 focus:bg-surface focus:outline focus:outline-2 focus:outline-[var(--color-primary)] outline-offset-[-2px] transition-all appearance-none"
                >
                  <option value="easy">Gentle Curve</option>
                  <option value="balanced">Balanced</option>
                  <option value="hard">Aggressive Scaling</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Notifications Module */}
        <section className="bg-surface-2 rounded-[var(--radius-lg)] p-1 h-full shadow-sm md:col-span-2 lg:col-span-1">
          <div className="bg-surface rounded-tl-[1.8rem] rounded-bl-[1.8rem] rounded-tr-[1.8rem] rounded-br-[1.8rem] p-6 h-full flex flex-col shadow-[0_4px_20px_rgba(108,71,255,0.04)]">
            <div className="flex items-center gap-3 mb-6 text-primary">
              <Bell size={24} className="fill-[var(--color-primary)] opacity-80" />
              <h2 className="font-bold text-xl text-text">Notifications</h2>
            </div>
            
            <div className="space-y-6 flex-1">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="font-semibold text-text">Review Reminders</h3>
                  <p className="text-sm text-text-muted">Get pinged when it&apos;s optimal to review.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={dailyReminder} onChange={() => { setDailyReminder(!dailyReminder); setTimeout(handleSavePreferences, 100); }} />
                  <div className="w-11 h-6 bg-surface-3 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="font-semibold text-text">Streak Warnings</h3>
                  <p className="text-sm text-text-muted">Alerts before you lose your daily streak.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={streakWarning} onChange={() => { setStreakWarning(!streakWarning); setTimeout(handleSavePreferences, 100); }} />
                  <div className="w-11 h-6 bg-surface-3 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Account Actions Module */}
        <section className="bg-surface-2 rounded-[var(--radius-lg)] p-1 h-full shadow-sm md:col-span-2 lg:col-span-1">
          <div className="bg-surface rounded-tl-[1.8rem] rounded-bl-[1.8rem] rounded-tr-[1.8rem] rounded-br-[1.8rem] p-6 h-full flex flex-col shadow-[0_4px_20px_rgba(108,71,255,0.04)]">
            <div className="flex items-center gap-3 mb-6 text-primary">
              <ShieldAlert size={24} className="fill-[var(--color-primary)] opacity-80" />
              <h2 className="font-bold text-xl text-text">Account</h2>
            </div>
            
            <div className="space-y-4 flex-1">
              <button 
                onClick={() => toast.success("Export started (mock)")}
                className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary-container)] text-[var(--color-primary)] font-bold py-3 px-6 rounded-full hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-sm"
              >
                <Download size={18} />
                Export My Data
              </button>

              <button 
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 bg-surface-3 text-text font-bold py-3 px-6 rounded-full hover:bg-surface-2 transition-all"
              >
                <LogOut size={18} />
                Sign Out
              </button>

              <div className="pt-2">
                <button 
                  onClick={() => {
                    const ok = window.confirm("Are you sure you want to delete your account? This cannot be undone.");
                    if (ok) toast.error("Account deletion depends on Firebase/Supabase auth setup.");
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-transparent text-error font-bold py-3 px-6 rounded-full hover:bg-[var(--color-error)]/10 transition-all"
                >
                  <Trash2 size={18} />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
