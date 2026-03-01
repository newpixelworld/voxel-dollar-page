export function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

export function blockFromSelected(selected, gridSize) {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const obj of selected) {
    const g = obj.userData?.grid;
    if (!g) continue;
    minX = Math.min(minX, g.x); minY = Math.min(minY, g.y); minZ = Math.min(minZ, g.z);
    maxX = Math.max(maxX, g.x); maxY = Math.max(maxY, g.y); maxZ = Math.max(maxZ, g.z);
  }

  if (!isFinite(minX)) return null;

  // convert corner coords (0..gridSize) to voxel cells (0..gridSize-1)
  const min = { x: clamp(Math.min(minX, maxX), 0, gridSize - 1),
                y: clamp(Math.min(minY, maxY), 0, gridSize - 1),
                z: clamp(Math.min(minZ, maxZ), 0, gridSize - 1) };

  const max = { x: clamp(Math.max(minX, maxX) - 1, 0, gridSize - 1),
                y: clamp(Math.max(minY, maxY) - 1, 0, gridSize - 1),
                z: clamp(Math.max(minZ, maxZ) - 1, 0, gridSize - 1) };

  return { min, max };
}

export function saveSelection(sel) {
  localStorage.setItem("voxel_selection", JSON.stringify(sel));
}

export function loadSelection() {
  try { return JSON.parse(localStorage.getItem("voxel_selection") || "null"); }
  catch { return null; }
}
