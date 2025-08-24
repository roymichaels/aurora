let dataKey: Uint8Array | null = null;

export function setDataKey(key: Uint8Array) {
  dataKey = key;
}

export function getDataKey() {
  return dataKey;
}
