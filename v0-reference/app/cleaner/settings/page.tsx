"use client"

import { useState } from "react"
import { CleanerNav } from "@/components/cleaner-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Bell, Lock, Trash2, LogOut } from "lucide-react"

export default function CleanerSettingsPage() {
  const [email, setEmail] = useState("maria.santos@email.com")
  const [phone, setPhone] = useState("+1 (512) 555-0192")
  const [saved, setSaved] = useState(false)

  const [notifs, setNotifs] = useState({
    newRequest: true,
    jobReminder: true,
    payout: true,
    marketing: false,
  })

  const toggleNotif = (key: keyof typeof notifs) => {
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="min-h-screen bg-background">
      <CleanerNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account, notifications, and security.
          </p>
        </div>

        {/* Account info */}
        <Card className="border border-border shadow-sm mb-5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Account information</CardTitle>
            <CardDescription>Your contact details used for notifications and login.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full name</label>
              <Input defaultValue="Maria Santos" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setSaved(false) }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone number</label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setSaved(false) }}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={() => setSaved(true)}>
                Save Changes
              </Button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-primary font-medium">
                  <CheckCircle2 className="size-4" />
                  Saved
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border border-border shadow-sm mb-5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-4">
              {[
                { key: "newRequest" as const, label: "New booking requests", desc: "When a client sends you a job request." },
                { key: "jobReminder" as const, label: "Job reminders", desc: "24-hour reminder before a scheduled job." },
                { key: "payout" as const, label: "Payout confirmations", desc: "When a weekly payout is sent to your account." },
                { key: "marketing" as const, label: "Tips & promotions", desc: "Platform updates, feature announcements." },
              ].map(({ key, label, desc }, i) => (
                <div key={key}>
                  {i > 0 && <Separator className="mb-4" />}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                    <button
                      onClick={() => toggleNotif(key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                        notifs[key] ? "bg-primary" : "bg-input"
                      }`}
                      role="switch"
                      aria-checked={notifs[key]}
                    >
                      <span
                        className={`pointer-events-none inline-block size-5 rounded-full bg-card shadow-sm transition-transform ${
                          notifs[key] ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border border-border shadow-sm mb-5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 flex flex-col gap-3">
            <Button variant="outline" size="sm" className="w-fit">
              Change password
            </Button>
            <p className="text-xs text-muted-foreground">
              Last password change: never. We recommend updating it periodically.
            </p>
          </CardContent>
        </Card>

        <Separator className="mb-5" />

        {/* Danger zone */}
        <div className="flex flex-col gap-3">
          <Button variant="ghost" size="sm" className="w-fit text-muted-foreground gap-2">
            <LogOut className="size-4" />
            Log out
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-fit text-destructive hover:text-destructive gap-2"
          >
            <Trash2 className="size-4" />
            Delete account
          </Button>
        </div>
      </div>
    </div>
  )
}
