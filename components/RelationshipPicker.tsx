"use client";

import { useState } from "react";

const OPTIONS = [
  "엄마",
  "아빠",
  "친할머니",
  "친할아버지",
  "외할머니",
  "외할아버지",
  "산후도우미",
];

export function RelationshipPicker({
  required = true,
  defaultValue = "",
}: {
  required?: boolean;
  defaultValue?: string;
}) {
  const initialIsCustom = defaultValue !== "" && !OPTIONS.includes(defaultValue);
  const [choice, setChoice] = useState(
    initialIsCustom ? "기타" : defaultValue || "",
  );
  const [custom, setCustom] = useState(initialIsCustom ? defaultValue : "");
  const value = choice === "기타" ? custom : choice;

  return (
    <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-neutral-300">
      아이와의 관계
      <div className="flex flex-col gap-2">
        <select
          required={required}
          value={choice}
          onChange={(e) => {
            setChoice(e.target.value);
            if (e.target.value !== "기타") setCustom("");
          }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 focus:border-pink-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        >
          <option value="" disabled>
            선택해주세요
          </option>
          {OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          <option value="기타">기타 (직접 입력)</option>
        </select>
        {choice === "기타" ? (
          <input
            required={required}
            type="text"
            maxLength={20}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="예: 이모, 고모, 친구 등"
            className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 focus:border-pink-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />
        ) : null}
      </div>
      <input type="hidden" name="relationship" value={value} />
    </label>
  );
}
