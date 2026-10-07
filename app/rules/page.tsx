"use client";

import { Button, Card, Badge, EmptyState, ListRow } from "@/components/ui";

export default function RulesPage() {
  const gameModes = [
    { title: "Single Player vs AI", subtitle: "Select difficulty on root page '/'. Easy places randomly, Medium blocks threats, Hard uses minimax for perfect play.", tone: "brand" as const },
    { title: "Pass & Play", subtitle: "Toggle local mode on '/'. Turn indicator updates per cell click. Reset board clears grid but preserves session score.", tone: "neutral" as const },
  ];

  const standardRules = [
    { title: "Grid & Symbols", subtitle: "3×3 matrix. Tow Truck icon [data-testid='cell-*-x'] starts first. Service Sedan icon [data-testid='cell-*-o'] responds." },
    { title: "Win Conditions", subtitle: "Align three identical symbols horizontally, vertically, or diagonally. Victory modal triggers immediately upon completion." },
    { title: "Draw Handling", subtitle: "Full board without alignment results in a draw. Lower difficulties prevent endless minimax loops for casual retention." },
  ];

  const rewardsFlow = [
    { title: "Member ID Bonus", subtitle: "Navigate to '/rewards', enter mock ID 'AAA-8820-99', and click 'Enter AAA Member ID' to receive +500 points." },
    { title: "Theme Unlocks", subtitle: "Click 'Unlock' on 'Neon Highway Theme' (costs 300 pts). Balance deducts automatically. Button state shifts to 'Equip Theme'." },
    { title: "Theme Application", subtitle: "Click 'Equip Theme'. Return to '/' to verify '#game-board' applies CSS class 'theme-neon' across the session." },
  ];

  const roadsideTrivia = [
    { title: "Tire Pressure Maintenance", subtitle: "Check monthly when cold. Underinflation increases blowout probability by 25% and reduces fuel efficiency." },
    { title: "Emergency Breakdown Protocol", subtitle: "Pull fully off roadway. Activate hazards. Remain seated with seatbelt fastened until assistance arrives." },
    { title: "Battery Jump Start Sequence", subtitle: "Positive to positive terminal. Negative to unpainted chassis ground. Never cross-connect directly to dead battery." },
  ];

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e6e9ef] font-sans selection:bg-[#4f8cff]/30">
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <header className="space-y-2 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <Badge tone="brand">Documentation</Badge>
            <span className="font-mono text-sm text-[#4f8cff]">v1.0.4</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#e6e9ef]">AAA Roadside XO — Rules & Reference</h1>
          <p className="text-base text-white/60 max-w-2xl">
            Complete operational guidelines, gameplay mechanics, rewards integration, and verified roadside safety protocols.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[#e6e9ef] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4f8cff]"></span>
            Match Modes
          </h2>
          <Card className="bg-[#14171c] border border-white/10 p-4 space-y-3">
            {gameModes.map((mode, i) => (
              <ListRow key={i} title={mode.title} subtitle={mode.subtitle} trailing={<Badge tone={mode.tone}>{mode.tone === "brand" ? "Active" : "Local"}</Badge>} />
            ))}
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[#e6e9ef] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4f8cff]"></span>
            Standard Ruleset
          </h2>
          <Card className="bg-[#14171c] border border-white/10 p-4 space-y-3">
            {standardRules.map((rule, i) => (
              <ListRow key={i} title={rule.title} subtitle={rule.subtitle} />
            ))}
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[#e6e9ef] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4f8cff]"></span>
            Rewards & Theme Integration
          </h2>
          <Card className="bg-[#14171c] border border-white/10 p-4 space-y-3">
            {rewardsFlow.map((flow, i) => (
              <ListRow key={i} title={flow.title} subtitle={flow.subtitle} />
            ))}
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[#e6e9ef] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4f8cff]"></span>
            Roadside Safety Trivia
          </h2>
          <Card className="bg-[#14171c] border border-white/10 p-4 space-y-3">
            {roadsideTrivia.length > 0 ? (
              roadsideTrivia.map((item, i) => (
                <ListRow key={i} title={item.title} subtitle={item.subtitle} />
              ))
            ) : (
              <EmptyState title="No Trivia Available" message="Safety protocols are currently loading." description="Check your connection or refresh the application." />
            )}
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[#e6e9ef] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4f8cff]"></span>
            System Notes & Edge Cases
          </h2>
          <Card className="bg-[#14171c] border border-white/10 p-4 space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-white/70">
                <span className="font-mono text-[#4f8cff]">storage_key:</span>{" "}
                <code className="bg-black/40 px-1.5 py-0.5 rounded text-xs font-mono text-white/80">lastmile:aaa-tic-tac:profiles</code>
              </p>
              <p className="text-sm text-white/70">
                <span className="font-mono text-[#4f8cff]">record_schema:</span>{" "}
                <code className="bg-black/40 px-1.5 py-0.5 rounded text-xs font-mono text-white/80">{"{ id: string; title: string; notes: string; createdAt: string }"}</code>
              </p>
              <p className="text-sm text-white/70">
                <span className="font-mono text-[#4f8cff]">edge_handling:</span>{" "}
                <span className="text-white/60">Empty states render purposeful placeholders. Text exceeding 200 characters wraps safely. Failed actions display inline errors without breaking navigation. Browser-localStorage clears reset progress gracefully.</span>
              </p>
            </div>
            <div className="pt-2 border-t border-white/10 flex justify-end">
              <Button variant="outline" size="sm">Back to Dashboard</Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}