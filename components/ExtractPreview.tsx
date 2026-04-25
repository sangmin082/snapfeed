"use client";

import { Fragment, useState } from "react";
import type { ExtractResult, FeedRecord, EventRecord } from "@/lib/schema";

type Props = {
  initial: ExtractResult;
  sourcePhoto: string;
  onSaved: () => void;
};

const FEED_KINDS = ["breast_direct", "breast_pumped", "formula"] as const;
const EVENT_KINDS = ["diaper_pee", "diaper_poop", "sleep", "note"] as const;
type FeedKind = (typeof FEED_KINDS)[number];
type EventKind = (typeof EVENT_KINDS)[number];
type Kind = FeedKind | EventKind;

const KIND_LABEL: Record<Kind, string> = {
  breast_direct: "모유직수",
  breast_pumped: "유축",
  formula: "분유",
  diaper_pee: "소변",
  diaper_poop: "대변",
  sleep: "수면",
  note: "메모",
};

const isFeedKind = (k: Kind): k is FeedKind =>
  (FEED_KINDS as readonly string[]).includes(k);

type Item = {
  id: string;
  kind: Kind;
  at: string;
  end_at: string | null;
  volume_ml: number | null;
  notes: string | null;
};

let idCounter = 0;
const nextId = () => `i${++idCounter}`;

function initialItems(extract: ExtractResult): Item[] {
  const items: Item[] = [];
  for (const f of extract.feeds) {
    items.push({
      id: nextId(),
      kind: (f.feed_type ?? "breast_direct") as Kind,
      at: f.start_at,
      end_at: f.end_at,
      volume_ml: f.volume_ml,
      notes: f.notes,
    });
  }
  for (const e of extract.events) {
    const raw =
      e.details && typeof e.details === "object" && "raw" in e.details
        ? (e.details as { raw?: unknown }).raw
        : null;
    const notes =
      typeof raw === "string"
        ? raw
        : e.details
          ? JSON.stringify(e.details)
          : null;
    items.push({
      id: nextId(),
      kind: e.event_type,
      at: e.at,
      end_at: e.end_at,
      volume_ml: null,
      notes,
    });
  }
  items.sort((a, b) => a.at.localeCompare(b.at));
  return items;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

const dateFmt = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
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

function dateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return dateFmt.format(d);
}
function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return timeFmt.format(d);
}

function detailLabel(it: Item): string {
  const parts: string[] = [];
  if (isFeedKind(it.kind) && it.volume_ml != null) parts.push(`${it.volume_ml}ml`);
  if (it.end_at) {
    const start = new Date(it.at);
    const end = new Date(it.end_at);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      const mins = Math.round((end.getTime() - start.getTime()) / 60000);
      if (mins > 0) parts.push(`${mins}분`);
    }
  }
  if (it.notes) parts.push(it.notes);
  return parts.join(" · ");
}

function toFeed(item: Item): FeedRecord {
  return {
    start_at: item.at,
    end_at: item.end_at,
    volume_ml: item.volume_ml,
    feed_type: item.kind as FeedKind,
    notes: item.notes,
  };
}
function toEvent(item: Item): EventRecord {
  return {
    event_type: item.kind as EventKind,
    at: item.at,
    end_at: item.kind === "sleep" ? item.end_at : null,
    details: item.notes ? { raw: item.notes } : null,
  };
}

export function ExtractPreview({ initial, sourcePhoto, onSaved }: Props) {
  const [items, setItems] = useState<Item[]>(() => initialItems(initial));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(id: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function remove(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (editingId === id) setEditingId(null);
  }
  function addRow(kind: Kind) {
    const id = nextId();
    setItems((prev) => [
      ...prev,
      {
        id,
        kind,
        at: new Date().toISOString(),
        end_at: null,
        volume_ml: null,
        notes: null,
      },
    ]);
    setEditingId(id);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const feeds = items.filter((it) => isFeedKind(it.kind)).map(toFeed);
      const events = items.filter((it) => !isFeedKind(it.kind)).map(toEvent);
      const calls: Promise<Response>[] = [];
      if (feeds.length > 0) {
        calls.push(
          fetch("/api/feeds", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ source_photo: sourcePhoto, feeds }),
          }),
        );
      }
      if (events.length > 0) {
        calls.push(
          fetch("/api/events", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ source_photo: sourcePhoto, events }),
          }),
        );
      }
      const results = await Promise.all(calls);
      for (const r of results) {
        if (!r.ok) {
          const body = (await r.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `HTTP ${r.status}`);
        }
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  const sorted = [...items].sort((a, b) => a.at.localeCompare(b.at));
  let lastDate = "";

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">요약 ({items.length})</h2>

        {items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-neutral-500">추출된 기록이 없습니다. 아래에서 추가하세요.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-neutral-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 dark:bg-neutral-900/60 dark:text-neutral-500">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">날짜</th>
                  <th className="px-3 py-2 text-left font-medium">시각</th>
                  <th className="px-3 py-2 text-left font-medium">종류</th>
                  <th className="px-3 py-2 text-left font-medium">세부</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((it) => {
                  const dLabel = dateLabel(it.at);
                  const showDate = dLabel !== lastDate;
                  lastDate = dLabel;
                  const editing = editingId === it.id;
                  const isFeed = isFeedKind(it.kind);
                  const showEnd = isFeed || it.kind === "sleep";
                  return (
                    <Fragment key={it.id}>
                      <tr className="border-t border-gray-100 dark:border-neutral-800">
                        <td className="px-3 py-1.5 text-gray-700 whitespace-nowrap dark:text-neutral-300">
                          {showDate ? dLabel : ""}
                        </td>
                        <td className="px-3 py-1.5 tabular-nums whitespace-nowrap">
                          {timeLabel(it.at)}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap">{KIND_LABEL[it.kind]}</td>
                        <td className="px-3 py-1.5 text-gray-600 dark:text-neutral-400">{detailLabel(it)}</td>
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
                        <tr className="border-t border-gray-100 bg-gray-50/60 dark:border-neutral-800 dark:bg-neutral-900/60">
                          <td colSpan={5} className="px-3 py-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <label className="text-xs text-gray-600 dark:text-neutral-400">
                                시각
                                <input
                                  type="datetime-local"
                                  className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                                  value={toLocalInput(it.at)}
                                  onChange={(e) =>
                                    update(it.id, {
                                      at: fromLocalInput(e.target.value) ?? it.at,
                                    })
                                  }
                                />
                              </label>
                              <label className="text-xs text-gray-600 dark:text-neutral-400">
                                종류
                                <select
                                  className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                                  value={it.kind}
                                  onChange={(e) =>
                                    update(it.id, { kind: e.target.value as Kind })
                                  }
                                >
                                  <optgroup label="수유">
                                    {FEED_KINDS.map((k) => (
                                      <option key={k} value={k}>
                                        {KIND_LABEL[k]}
                                      </option>
                                    ))}
                                  </optgroup>
                                  <optgroup label="이벤트">
                                    {EVENT_KINDS.map((k) => (
                                      <option key={k} value={k}>
                                        {KIND_LABEL[k]}
                                      </option>
                                    ))}
                                  </optgroup>
                                </select>
                              </label>
                              {isFeed ? (
                                <label className="text-xs text-gray-600 dark:text-neutral-400">
                                  양 (ml)
                                  <input
                                    type="number"
                                    className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                                    value={it.volume_ml ?? ""}
                                    onChange={(e) =>
                                      update(it.id, {
                                        volume_ml:
                                          e.target.value === "" ? null : Number(e.target.value),
                                      })
                                    }
                                  />
                                </label>
                              ) : null}
                              {showEnd ? (
                                <label className="text-xs text-gray-600 dark:text-neutral-400">
                                  종료
                                  <input
                                    type="datetime-local"
                                    className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                                    value={toLocalInput(it.end_at)}
                                    onChange={(e) =>
                                      update(it.id, { end_at: fromLocalInput(e.target.value) })
                                    }
                                  />
                                </label>
                              ) : null}
                              <label className="text-xs text-gray-600 sm:col-span-2 dark:text-neutral-400">
                                메모
                                <input
                                  type="text"
                                  className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                                  value={it.notes ?? ""}
                                  onChange={(e) =>
                                    update(it.id, { notes: e.target.value || null })
                                  }
                                />
                              </label>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => remove(it.id)}
                                className="text-xs text-red-600 underline dark:text-red-400"
                              >
                                삭제
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                              >
                                완료
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addRow("breast_pumped")}
            className="rounded border border-dashed border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            + 수유
          </button>
          <button
            type="button"
            onClick={() => addRow("diaper_pee")}
            className="rounded border border-dashed border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            + 이벤트
          </button>
        </div>
      </section>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">저장 실패: {error}</p> : null}

      <button
        type="button"
        onClick={save}
        disabled={saving || items.length === 0}
        className="rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white disabled:opacity-50"
      >
        {saving ? "저장 중…" : items.length === 0 ? "저장할 항목 없음" : "저장"}
      </button>
    </div>
  );
}
