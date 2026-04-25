"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type FeedKind = "breast_direct" | "breast_pumped" | "formula";
type EventKind = "diaper_pee" | "diaper_poop" | "sleep" | "note";
type Kind = FeedKind | EventKind;

const FEED_KINDS: FeedKind[] = ["breast_direct", "breast_pumped", "formula"];
const EVENT_KINDS: EventKind[] = ["diaper_pee", "diaper_poop", "sleep", "note"];

const KIND_LABEL: Record<Kind, string> = {
  breast_direct: "직수",
  breast_pumped: "유축",
  formula: "분유",
  diaper_pee: "소변",
  diaper_poop: "대변",
  sleep: "수면",
  note: "메모",
};

const isFeedKind = (k: Kind): k is FeedKind =>
  (FEED_KINDS as readonly string[]).includes(k);

export type FeedRow = {
  id: string;
  start_at: string;
  volume_ml: number | null;
  feed_type: FeedKind | null;
  notes: string | null;
};

export type EventRow = {
  id: string;
  at: string;
  event_type: EventKind;
  details: Record<string, unknown> | null;
};

type Item = {
  id: string;
  source: "feed" | "event";
  kind: Kind;
  at: string;
  volume_ml: number | null;
  notes: string | null;
};

function feedToItem(f: FeedRow): Item {
  return {
    id: f.id,
    source: "feed",
    kind: (f.feed_type ?? "formula") as Kind,
    at: f.start_at,
    volume_ml: f.volume_ml,
    notes: f.notes,
  };
}

function eventToItem(e: EventRow): Item {
  const raw =
    e.details && typeof e.details === "object" && "raw" in e.details
      ? (e.details as { raw?: unknown }).raw
      : null;
  const notes = typeof raw === "string" ? raw : e.details ? JSON.stringify(e.details) : null;
  return {
    id: e.id,
    source: "event",
    kind: e.event_type,
    at: e.at,
    volume_ml: null,
    notes,
  };
}

const dateFmt = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
});
const timeFmt = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function fmtDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const parts = dateFmt.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
function fmtDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return dateFmt.format(d);
}
function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return timeFmt.format(d);
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function detailText(it: Item): string {
  const parts: string[] = [];
  if (isFeedKind(it.kind) && it.volume_ml != null) parts.push(`${it.volume_ml}ml`);
  if (it.notes) parts.push(it.notes);
  return parts.join(" · ") || "—";
}

function ymdKst(iso: string): string {
  return fmtDateKey(iso);
}

export function RecordsTable({
  feeds,
  events,
}: {
  feeds: FeedRow[];
  events: EventRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDay, setConfirmDay] = useState<string | null>(null);

  const items: Item[] = [
    ...feeds.map(feedToItem),
    ...events.map(eventToItem),
  ].sort((a, b) => a.at.localeCompare(b.at));

  // Group by KST date
  const groups = new Map<string, Item[]>();
  for (const it of items) {
    const key = ymdKst(it.at);
    const list = groups.get(key) ?? [];
    list.push(it);
    groups.set(key, list);
  }
  const orderedKeys = [...groups.keys()].sort().reverse(); // recent first

  async function save(it: Item, patch: Partial<Item>) {
    setError(null);
    const url = it.source === "feed" ? `/api/feeds/${it.id}` : `/api/events/${it.id}`;
    const body =
      it.source === "feed"
        ? {
            ...(patch.at ? { start_at: patch.at } : {}),
            ...(patch.kind !== undefined ? { feed_type: patch.kind } : {}),
            ...(patch.volume_ml !== undefined ? { volume_ml: patch.volume_ml } : {}),
            ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
          }
        : {
            ...(patch.at ? { at: patch.at } : {}),
            ...(patch.kind !== undefined ? { event_type: patch.kind } : {}),
            ...(patch.notes !== undefined ? { details: patch.notes ? { raw: patch.notes } : null } : {}),
          };
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? `HTTP ${res.status}`);
      return;
    }
    setEditingId(null);
    startTransition(() => router.refresh());
  }

  async function remove(it: Item) {
    if (!confirm(`이 ${KIND_LABEL[it.kind]} 기록을 삭제하시겠습니까?`)) return;
    setError(null);
    const url = it.source === "feed" ? `/api/feeds/${it.id}` : `/api/events/${it.id}`;
    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? `HTTP ${res.status}`);
      return;
    }
    setEditingId(null);
    startTransition(() => router.refresh());
  }

  async function removeDay(dateKey: string) {
    setError(null);
    const res = await fetch(`/api/records/day/${dateKey}`, { method: "DELETE" });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? `HTTP ${res.status}`);
      return;
    }
    setConfirmDay(null);
    startTransition(() => router.refresh());
  }

  if (items.length === 0) {
    return <p className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-500">아직 기록이 없습니다.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</div>
      ) : null}
      {orderedKeys.map((dateKey) => {
        const rows = (groups.get(dateKey) ?? []).sort((a, b) =>
          b.at.localeCompare(a.at),
        );
        const firstIso = rows[0]?.at;
        const dateLabel = firstIso ? fmtDateLabel(firstIso) : dateKey;
        const feedCount = rows.filter((r) => r.source === "feed").length;
        const eventCount = rows.filter((r) => r.source === "event").length;
        const totalMl = rows.reduce((s, r) => s + (r.volume_ml ?? 0), 0);
        const isConfirming = confirmDay === dateKey;
        return (
          <section key={dateKey} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-neutral-100">{dateLabel}</h3>
                <p className="text-xs text-gray-500 dark:text-neutral-500">
                  수유 {feedCount}회{totalMl > 0 ? ` · 합계 ${totalMl}ml` : ""} · 이벤트 {eventCount}
                </p>
              </div>
              {isConfirming ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-700 dark:text-red-300">전체 삭제?</span>
                  <button
                    type="button"
                    onClick={() => removeDay(dateKey)}
                    disabled={pending}
                    className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    확인
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDay(null)}
                    className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDay(dateKey)}
                  className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
                >
                  🗑️ 날짜 전체 삭제
                </button>
              )}
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-neutral-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 dark:bg-neutral-900/60 dark:text-neutral-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">시각</th>
                    <th className="px-3 py-2 text-left font-medium">종류</th>
                    <th className="px-3 py-2 text-left font-medium">세부</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((it) => {
                    const editing = editingId === it.id;
                    const isFeed = isFeedKind(it.kind);
                    return (
                      <Fragment key={`${it.source}-${it.id}`}>
                        <tr className="border-t border-gray-100 dark:border-neutral-800">
                          <td className="px-3 py-1.5 tabular-nums whitespace-nowrap">{fmtTime(it.at)}</td>
                          <td className="px-3 py-1.5 whitespace-nowrap">{KIND_LABEL[it.kind]}</td>
                          <td className="px-3 py-1.5 text-gray-600 dark:text-neutral-400">{detailText(it)}</td>
                          <td className="px-3 py-1.5 whitespace-nowrap text-right">
                            <button
                              type="button"
                              onClick={() => setEditingId(editing ? null : it.id)}
                              className="text-xs text-blue-600 underline dark:text-blue-400"
                            >
                              {editing ? "닫기" : "수정"}
                            </button>
                          </td>
                        </tr>
                        {editing ? (
                          <EditRow
                            item={it}
                            onSave={(patch) => save(it, patch)}
                            onDelete={() => remove(it)}
                            onClose={() => setEditingId(null)}
                          />
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function EditRow({
  item,
  onSave,
  onDelete,
  onClose,
}: {
  item: Item;
  onSave: (patch: Partial<Item>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [at, setAt] = useState(toLocalInput(item.at));
  const [kind, setKind] = useState<Kind>(item.kind);
  const [volumeMl, setVolumeMl] = useState<string>(
    item.volume_ml != null ? String(item.volume_ml) : "",
  );
  const [notes, setNotes] = useState<string>(item.notes ?? "");
  const isFeed = isFeedKind(kind);
  const kindsForRow = item.source === "feed" ? FEED_KINDS : EVENT_KINDS;

  function handleSave() {
    const patch: Partial<Item> = {};
    const iso = fromLocalInput(at);
    if (iso && iso !== item.at) patch.at = iso;
    if (kind !== item.kind) patch.kind = kind;
    if (isFeed) {
      const v = volumeMl === "" ? null : Number.parseInt(volumeMl, 10);
      if ((v ?? null) !== (item.volume_ml ?? null))
        patch.volume_ml = Number.isFinite(v as number) ? (v as number) : null;
    }
    const newNotes = notes.trim() === "" ? null : notes;
    if ((newNotes ?? null) !== (item.notes ?? null)) patch.notes = newNotes;
    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }
    onSave(patch);
  }

  return (
    <tr className="border-t border-gray-100 bg-gray-50/60 dark:border-neutral-800 dark:bg-neutral-900/60">
      <td colSpan={4} className="px-3 py-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs text-gray-600 dark:text-neutral-400">
            시각
            <input
              type="datetime-local"
              className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              value={at}
              onChange={(e) => setAt(e.target.value)}
            />
          </label>
          <label className="text-xs text-gray-600 dark:text-neutral-400">
            종류
            <select
              className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              value={kind}
              onChange={(e) => setKind(e.target.value as Kind)}
            >
              {kindsForRow.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          {isFeed ? (
            <label className="text-xs text-gray-600 dark:text-neutral-400">
              양 (ml)
              <input
                type="number"
                className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                value={volumeMl}
                onChange={(e) => setVolumeMl(e.target.value)}
              />
            </label>
          ) : null}
          <label className={`text-xs text-gray-600 dark:text-neutral-400 ${isFeed ? "" : "sm:col-span-2"}`}>
            메모
            <input
              type="text"
              className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-red-600 underline dark:text-red-400"
          >
            이 기록 삭제
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              저장
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}
