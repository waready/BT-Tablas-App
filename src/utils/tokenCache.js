// src/utils/tokenCache.js  (USO OPCIONAL, no recomendado por defecto)
const KEY_ALIAS = "bt_cache_key"; // solo en memoria
let _key = null;

async function getKey() {
  if (_key) return _key;
  // clave efímera por sesión; NO se persiste (se pierde al recargar)
  _key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  return _key;
}

export async function saveEncrypted(token) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey();
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(token)
  );
  const payload = {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(ct)),
  };
  sessionStorage.setItem("bt_at", JSON.stringify(payload));
}

export async function loadDecrypted() {
  const raw = sessionStorage.getItem("bt_at");
  if (!raw) return null;
  const { iv, data } = JSON.parse(raw);
  try {
    const key = await getKey();
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data)
    );
    return new TextDecoder().decode(pt);
  } catch {
    return null;
  }
}

export function clearCache() {
  sessionStorage.removeItem("bt_at");
}
