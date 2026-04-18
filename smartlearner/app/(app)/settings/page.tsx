"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { User, Bell, BookOpen, Shield, Download, Trash2, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "study", label: "Study Preferences", icon: BookOpen },
  { id: "account", label: "Account", icon: Shield },
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  const [activeSection, setActiveSection] = useState("profile");
  const [displayName, setDisplayName] = useState("Learner");
  const [avatar, setAvatar] = useState("🤓");
  const [dailyReminder, setDailyReminder] = useState(true);
  const [streakWarning, setStreakWarning] = useState(true);
  const [reminderTime, setReminderTime] = useState("08:00");
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
      setAvatar(profileData.data.avatar_url || "🤓");
    }
    
    // Load local storage preferences
    const storedPrefsStr = localStorage.getItem("smartlearner_prefs");
    if (storedPrefsStr) {
      try {
        const stored = JSON.parse(storedPrefsStr);
        if (stored.dailyReminder !== undefined) setDailyReminder(stored.dailyReminder);
        if (stored.streakWarning !== undefined) setStreakWarning(stored.streakWarning);
        if (stored.reminderTime) setReminderTime(stored.reminderTime);
        if (stored.sessionSize) setSessionSize(stored.sessionSize);
        if (stored.difficulty) setDifficulty(stored.difficulty);
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
      reminderTime,
      sessionSize,
      difficulty
    }));
    toast.success("Preferences saved! ✅");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-text">Settings ⚙️</h1>
        <p className="text-text-muted mt-1">Manage your account preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all",
                  activeSection === section.id
                    ? "bg-primary-light text-primary"
                    : "text-text-muted hover:bg-surface-2 hover:text-text"
                )}
              >
                <section.icon size={16} />
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="rounded-[var(--radius-xl)] bg-surface p-6 lg:p-8 shadow-sm">
            {/* Profile */}
            {activeSection === "profile" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-text">Profile</h2>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full max-w-sm px-4 py-3 rounded-[var(--radius-full)] bg-surface-3 text-text text-sm focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-light transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Avatar
                  </label>
                  <div className="flex gap-2">
                    {["🤓", "😊", "😎", "🧑‍💻", "🎓", "🦊", "🐱", "🦉"].map((e) => (
                      <button
                        key={e}
                        onClick={() => setAvatar(e)}
                        className={cn(
                          "w-10 h-10 rounded-[var(--radius-full)] flex items-center justify-center text-lg transition-all",
                          avatar === e
                            ? "bg-primary-light ring-2 ring-primary scale-110"
                            : "bg-surface-2 hover:bg-surface-3"
                        )}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="px-6 py-2.5 rounded-[var(--radius-full)] bg-primary text-white text-sm font-bold hover:bg-primary-dim hover:shadow-glow transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
                </button>
              </div>
            )}

            {/* Notifications */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-text">Notifications</h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-text text-sm">Daily Review Reminder</p>
                      <p className="text-text-muted text-xs">Get notified when cards are due</p>
                    </div>
                    <button
                      onClick={() => setDailyReminder(!dailyReminder)}
                      className={cn(
                        "w-12 h-6 rounded-[var(--radius-full)] transition-all relative",
                        dailyReminder ? "bg-primary" : "bg-surface-3"
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-[var(--radius-full)] bg-white shadow-sm absolute top-0.5 transition-all",
                          dailyReminder ? "left-[26px]" : "left-0.5"
                        )}
                      />
                    </button>
                  </div>

                  {dailyReminder && (
                    <div>
                      <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                        Reminder Time
                      </label>
                      <input
                        type="time"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="px-4 py-2.5 rounded-[var(--radius-full)] bg-surface-3 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary-light transition-all"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-text text-sm">Streak Warning</p>
                      <p className="text-text-muted text-xs">Alert when streak is about to break</p>
                    </div>
                    <button
                      onClick={() => setStreakWarning(!streakWarning)}
                      className={cn(
                        "w-12 h-6 rounded-[var(--radius-full)] transition-all relative",
                        streakWarning ? "bg-primary" : "bg-surface-3"
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-[var(--radius-full)] bg-white shadow-sm absolute top-0.5 transition-all",
                          streakWarning ? "left-[26px]" : "left-0.5"
                        )}
                      />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSavePreferences}
                  className="px-6 py-2.5 rounded-[var(--radius-full)] bg-primary text-white text-sm font-bold hover:bg-primary-dim hover:shadow-glow transition-all active:scale-[0.98]"
                >
                  Save Preferences
                </button>
              </div>
            )}

            {/* Study Preferences */}
            {activeSection === "study" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-text">Study Preferences</h2>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Cards per Session
                  </label>
                  <div className="flex gap-3">
                    {[10, 15, 20].map((size) => (
                      <button
                        key={size}
                        onClick={() => setSessionSize(size)}
                        className={cn(
                          "px-5 py-2.5 rounded-[var(--radius-full)] text-sm font-semibold transition-all",
                          sessionSize === size
                            ? "bg-primary text-white"
                            : "bg-surface-2 text-text-muted hover:bg-surface-3"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Difficulty
                  </label>
                  <div className="flex gap-3">
                    {(["easy", "balanced", "hard"] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={cn(
                          "px-5 py-2.5 rounded-[var(--radius-full)] text-sm font-semibold transition-all capitalize",
                          difficulty === d
                            ? "bg-primary text-white"
                            : "bg-surface-2 text-text-muted hover:bg-surface-3"
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSavePreferences}
                  className="px-6 py-2.5 rounded-[var(--radius-full)] bg-primary text-white text-sm font-bold hover:bg-primary-dim hover:shadow-glow transition-all active:scale-[0.98]"
                >
                  Save Preferences
                </button>
              </div>
            )}

            {/* Account */}
            {activeSection === "account" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-text">Account</h2>

                <div className="space-y-4">
                  <button className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] bg-surface-2 text-text text-sm font-medium hover:bg-surface-3 transition-all w-full">
                    <Download size={16} />
                    Export My Data (JSON)
                  </button>

                  <button 
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] bg-surface-2 text-text-muted text-sm font-medium hover:bg-surface-3 transition-all w-full"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>

                <div className="pt-6 border-t border-border">
                  <h3 className="font-bold text-error text-sm mb-2">Danger Zone</h3>
                  <p className="text-text-muted text-xs mb-3">
                    Once you delete your account, there is no going back.
                  </p>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder='Type "DELETE" to confirm'
                    className="w-full max-w-xs px-4 py-2.5 rounded-[var(--radius-full)] bg-surface-3 text-text text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-error-light transition-all"
                  />
                  <button
                    disabled={deleteConfirm !== "DELETE"}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-full)] text-sm font-bold transition-all",
                      deleteConfirm === "DELETE"
                        ? "bg-error text-white hover:bg-error/90"
                        : "bg-surface-3 text-text-light cursor-not-allowed"
                    )}
                  >
                    <Trash2 size={14} />
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
