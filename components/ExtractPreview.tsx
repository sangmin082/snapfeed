"use client";

import { Fragment, useEffect, useState } from "react";
import type { ExtractResult, FeedRecord, EventRecord } from "@/lib/schema";

type Props = {
  initial: ExtractResult;
  sourcePhoto: string;
  previewUrl?: string;
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

function displayLabel(kind: Kind, notes: string | null): string {
  if (kind === "note" && notes && notes.trim().startsWith("구토")) return "구토";
  return KIND_LABEL[kind];
}

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

type DateConflict = { date: string; feeds: number; events: number };

function ymdKstFromIso(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const da = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export function ExtractPreview({ initial, sourcePhoto, previewUrl, onSaved }: Props) {
  const [items, setItems] = useState<Item[]>(() => initialItems(initial));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [conflicts, setConflicts] = useState<DateConflict[] | null>(null);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [zoomed]);

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

  function uniqueDates(): string[] {
    const dates = new Set<string>();
    for (const it of items) {
      const d = ymdKstFromIso(it.at);
      if (d) dates.add(d);
    }
    return [...dates];
  }

  async function requestSave() {
    setSaving(true);
    setError(null);
    try {
      const dates = uniqueDates();
      if (dates.length > 0) {
        const res = await fetch("/api/records/check-dates", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ dates }),
        });
        if (res.ok) {
          const json = (await res.json()) as {
            counts: Record<string, { feeds: number; events: number }>;
          };
          const conflicting: DateConflict[] = dates
            .map((d) => ({
              date: d,
              feeds: json.counts[d]?.feeds ?? 0,
              events: json.counts[d]?.events ?? 0,
            }))
            .filter((c) => c.feeds > 0 || c.events > 0);
          if (conflicting.length > 0) {
            setConflicts(conflicting);
            setSaving(false);
            return;
          }
        }
      }
      await commitSave([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  }

  async function commitSave(replaceDates: string[]) {
    setSaving(true);
    setError(null);
    try {
      // Replace mode: delete existing records on the listed days first.
      for (const d of replaceDates) {
        const del = await fetch(`/api/records/day/${d}`, { method: "DELETE" });
        if (!del.ok) {
          const body = (await del.json().catch(() => ({}))) as { error?: string };
          throw new Error(`기존 ${d} 삭제 실패: ${body.error ?? del.status}`);
        }
      }

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
      setConflicts(null);
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
      {previewUrl ? (
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">원본 사진</h2>
            <span className="text-xs text-gray-500 dark:text-neutral-500">
              인식 결과와 비교해 확인하세요
            </span>
          </div>
          <button
            type="button"
            onClick={() => setZoomed(true)}
            className="group relative block overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 transition hover:border-emerald-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-700"
            aria-label="사진 크게 보기"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="업로드한 기록지"
              className="block max-h-[70vh] w-full object-contain"
            />
            <span className="pointer-events-none absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
              🔍 크게 보기
            </span>
          </button>
        </section>
      ) : null}

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
                        <td className="px-3 py-1.5 whitespace-nowrap">{displayLabel(it.kind, it.notes)}</td>
                        <td className="px-3 py-1.5 text-gray-600 dark:text-neutral-400">{detailLabel(it)}</td>
                        <td className="px-3 py-1.5 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setEditingId(editing ? null : it.id)}
                              className="text-xs text-blue-600 underline dark:text-blue-400"
                            >
                              {editing ? "닫기" : "수정"}
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(it.id)}
                              className="text-xs text-red-600 underline dark:text-red-400"
                            >
                              삭제
                            </button>
                          </div>
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
        onClick={requestSave}
        disabled={saving || items.length === 0}
        className="rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white disabled:opacity-50"
      >
        {saving ? "저장 중…" : items.length === 0 ? "저장할 항목 없음" : "저장"}
      </button>

      {zoomed && previewUrl ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="업로드한 기록지 (확대)"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[95vh] max-w-[95vw] cursor-default object-contain"
          />
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="닫기"
            className="fixed top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-xl text-gray-900 shadow-md hover:bg-white"
          >
            ×
          </button>
        </div>
      ) : null}

      {conflicts ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-neutral-900">
            <h3 className="text-base font-semibold text-gray-900 dark:text-neutral-100">
              이미 기록이 있는 날짜가 있어요
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-neutral-400">
              아래 날짜에 이미 저장된 기록이 있습니다. 어떻게 하시겠어요?
            </p>
            <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded-lg bg-gray-50 p-3 text-sm dark:bg-neutral-800">
              {conflicts.map((c) => (
                <li key={c.date} className="flex items-center justify-between">
                  <span className="font-medium tabular-nums text-gray-900 dark:text-neutral-100">
                    {c.date}
                  </span>
                  <span className="text-gray-500 dark:text-neutral-400">
                    수유 {c.feeds}건 · 이벤트 {c.events}건
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => commitSave(conflicts.map((c) => c.date))}
                className="rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                기존 삭제 후 새로 저장
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => commitSave([])}
                className="rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                기존에 추가로 더하기
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setConflicts(null)}
                className="rounded-full px-4 py-2 text-sm text-gray-500 hover:text-gray-900 disabled:opacity-50 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
