/**
 * Coerce a FormData entry into a usable Blob.
 *
 * Why this exists: in some runtimes (notably Cloudflare Workers /
 * OpenNext) a FormData entry that the spec says should be a `File`
 * arrives as a plain `Blob` with no `name`. `instanceof File` then
 * silently returns false and the upload gets dropped on the floor.
 * This duck-types on the parts we actually use.
 */
export function asUploadedBlob(
  v: FormDataEntryValue | Blob | null | undefined,
): Blob | null {
  if (v == null || typeof v === "string") return null;
  const b = v as unknown as Blob;
  if (
    typeof b.arrayBuffer !== "function" ||
    typeof b.size !== "number" ||
    b.size <= 0
  ) {
    return null;
  }
  return b;
}
