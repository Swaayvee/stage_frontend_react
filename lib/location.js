export function normalizeLocationText(value) {
  return String(value || "")
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .trim();
}

export function formatFrenchPhone(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 10)
    .replace(/(\d{2})(?=\d)/g, "$1 ")
    .trim();
}

export function departmentCodeFromPostalCode(postalCode) {
  const code = String(postalCode || "").replace(/\D/g, "");
  if (!/^\d{5}$/.test(code)) return "";
  if (code.startsWith("97") || code.startsWith("98")) return code.slice(0, 3);
  if (code.startsWith("20")) return "";
  return code.slice(0, 2);
}

export function parseAddressSuggestion(item) {
  const postalCode = String(item?.zipcode || item?.zipcodes?.[0] || "");
  return {
    address: normalizeLocationText(item?.fulltext || item?.label || ""),
    street: normalizeLocationText(item?.street || ""),
    city: normalizeLocationText(item?.city || ""),
    postalCode,
    cityCode: String(item?.citycode || item?.cityCode || ""),
    departmentCode: String(
      item?.depcode || item?.departmentcode || departmentCodeFromPostalCode(postalCode)
    ),
    longitude: Number.isFinite(Number(item?.x)) ? Number(item.x) : null,
    latitude: Number.isFinite(Number(item?.y)) ? Number(item.y) : null,
  };
}

export function uniqueBy(items, keySelector) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keySelector(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
