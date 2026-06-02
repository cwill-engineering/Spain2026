import { useEffect, useMemo, useState } from "react";
import {
  BONUS_CHALLENGES,
  CHALLENGES,
  RULES,
  STORAGE_KEY,
  SUGGESTED_PAINTINGS,
} from "./data.js";

function loadChecked() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function ChallengeItem({ id, text, hint, checked, onToggle, bonus }) {
  return (
    <li
      className={`flex gap-3 rounded-xl border px-3 py-3 transition-colors ${
        checked
          ? "border-emerald-300/60 bg-emerald-50/80 dark:border-emerald-700/50 dark:bg-emerald-950/30"
          : "border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900/50"
      }`}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={() => onToggle(id)}
        className="mt-1 size-5 shrink-0 cursor-pointer accent-[#6b1c2a]"
      />
      <label htmlFor={id} className="flex-1 cursor-pointer select-none">
        <span
          className={`block text-[0.95rem] leading-snug ${
            checked ? "text-stone-500 line-through dark:text-stone-400" : ""
          }`}
        >
          {bonus && <span className="mr-1">🔥</span>}
          {text}
        </span>
        {hint && (
          <span className="mt-1 block text-sm text-stone-500 dark:text-stone-400">
            (Hint: {hint})
          </span>
        )}
      </label>
    </li>
  );
}

export default function App() {
  const [checked, setChecked] = useState(loadChecked);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked]);

  const allIds = useMemo(
    () => [...CHALLENGES, ...BONUS_CHALLENGES].map((c) => c.id),
    []
  );

  const doneMain = CHALLENGES.filter((c) => checked[c.id]).length;
  const doneBonus = BONUS_CHALLENGES.filter((c) => checked[c.id]).length;
  const bonusPoints = doneBonus * 5;
  const total = allIds.length;
  const done = doneMain + doneBonus;
  const pct = total ? Math.round((done / total) * 100) : 0;

  function toggle(id) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function resetChecks() {
    if (!confirm("Uncheck everything? Your list stays the same.")) return;
    setChecked({});
  }

  return (
    <div className="min-h-dvh bg-[#f5efe6] text-[#1c1210] dark:bg-[#12100e] dark:text-[#f5efe6]">
      <header className="bg-gradient-to-b from-[#6b1c2a] to-[#4a121c] px-4 pb-8 pt-10 text-center text-[#f5efe6] shadow-lg">
        <p className="text-4xl" aria-hidden="true">
          🏛️
        </p>
        <h1
          className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ fontFamily: "Palatino, Georgia, serif" }}
        >
          PRADO CHALLENGE
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-[#e8d5c4]">
          Scavenger hunt at the Museo del Prado — find it in person, then check
          it off.
        </p>
        <div className="mx-auto mt-5 max-w-xs rounded-2xl bg-black/20 px-4 py-3 backdrop-blur-sm">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className="font-semibold">
              {doneMain}/{CHALLENGES.length} challenges
              {doneBonus > 0 && ` · +${bonusPoints} bonus pts`}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/25">
            <div
              className="h-full rounded-full bg-[#c9a227] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-8 px-4 py-8 pb-28">
        <section aria-labelledby="paintings-heading">
          <h2
            id="paintings-heading"
            className="text-xs font-semibold uppercase tracking-widest text-[#6b1c2a] dark:text-[#c9a227]"
          >
            Suggested paintings
          </h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Use these to guide your search through the galleries.
          </p>
          <ul className="mt-3 divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white dark:divide-stone-700 dark:border-stone-700 dark:bg-stone-900/50">
            {SUGGESTED_PAINTINGS.map((p) => (
              <li
                key={p.title}
                className="flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:items-baseline sm:justify-between"
              >
                <span className="font-medium">{p.title}</span>
                <span className="text-sm text-stone-500 dark:text-stone-400">
                  {p.artist}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="rules-heading"
          className="rounded-2xl border-2 border-[#c9a227]/40 bg-[#fff9f0] p-4 dark:border-[#c9a227]/30 dark:bg-stone-900/40"
        >
          <h2
            id="rules-heading"
            className="text-xs font-semibold uppercase tracking-widest text-[#6b1c2a] dark:text-[#c9a227]"
          >
            Rules
          </h2>
          <ul className="mt-2 space-y-1.5">
            {RULES.map((rule) => (
              <li key={rule} className="flex gap-2 text-sm leading-snug">
                <span className="text-[#6b1c2a] dark:text-[#c9a227]">•</span>
                {rule}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl bg-[#6b1c2a]/10 px-3 py-2 text-center text-sm font-semibold text-[#6b1c2a] dark:bg-[#c9a227]/15 dark:text-[#c9a227]">
            🏆 Winner picks dessert tonight.
          </p>
        </section>

        <section aria-labelledby="challenges-heading">
          <h2
            id="challenges-heading"
            className="text-xs font-semibold uppercase tracking-widest text-[#6b1c2a] dark:text-[#c9a227]"
          >
            Challenges
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {CHALLENGES.map((c) => (
              <ChallengeItem
                key={c.id}
                {...c}
                checked={!!checked[c.id]}
                onToggle={toggle}
              />
            ))}
          </ul>
        </section>

        <section aria-labelledby="bonus-heading">
          <h2
            id="bonus-heading"
            className="text-xs font-semibold uppercase tracking-widest text-[#6b1c2a] dark:text-[#c9a227]"
          >
            Bonus round
          </h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            5 points each
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {BONUS_CHALLENGES.map((c) => (
              <ChallengeItem
                key={c.id}
                {...c}
                checked={!!checked[c.id]}
                onToggle={toggle}
                bonus
              />
            ))}
          </ul>
        </section>
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-[#f5efe6]/95 px-4 py-3 backdrop-blur-md dark:border-stone-800 dark:bg-[#12100e]/95">
        <div className="mx-auto flex max-w-lg justify-center">
          <button
            type="button"
            onClick={resetChecks}
            className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 active:scale-[0.98] dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
          >
            Reset all checks
          </button>
        </div>
      </footer>
    </div>
  );
}
