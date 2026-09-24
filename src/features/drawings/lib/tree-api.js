export async function fetchAllTreeDrawings(url, signal) {
  const drawings = new Map();
  let latestDrawingId = null;
  let received = 0;
  for (let page = 1; ; page += 1) {
    const response = await fetch(`${url.replace(/\/$/, "")}/tree?page=${page}&size=100`, {
      headers: { Accept: "application/json" }, cache: "no-store", signal,
    });
    const result = await response.json();
    if (!response.ok || !result.success || !Array.isArray(result.drawings)) {
      throw new Error("Não foi possível carregar as flores. Tente atualizar a página.");
    }
    if (page === 1) latestDrawingId = result.latestDrawingId ?? null;
    for (const flower of result.drawings) {
      drawings.set(flower.id, {
        ...flower,
        flowerText: flower.flowerText ?? flower.flower_text ?? "",
        flowerVariantId: flower.flowerVariantId ?? flower.flower_variant_id ?? "flower-1",
      });
    }
    received += result.drawings.length;
    if (!result.drawings.length || received >= result.total || result.drawings.length < 100) break;
  }
  return { drawings: [...drawings.values()], latestDrawingId };
}

export async function deleteTreeDrawings(url, id) {
  const path = id === undefined ? "/tree" : `/tree/${encodeURIComponent(id)}`;
  const response = await fetch(`${url.replace(/\/$/, "")}${path}`, { method: "DELETE" });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error("Não foi possível excluir as flores. Tente novamente.");
  }
}
