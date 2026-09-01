import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowerTextPreview } from "@/features/drawings/components/FlowerTextPreview";

export function SavedDrawingsPage({
  drawings,
  debugInfo,
  error,
  isLoading = false,
  isRemote = false,
  onBack,
  onClearAll,
  onRefresh,
}) {
  return (
    <div className="min-h-screen bg-[#F7F0EE] px-6 py-8 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#9D7C74]">
              {isRemote ? "Arvore online" : "Flores locais"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[#5D3D39]">
              Flores salvas
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#7E5F59]">
              {isRemote
                ? "Esta pagina mostra as flores vindas do Forminit para facilitar o debug da atualizacao."
                : "Cada envio guarda uma mensagem para ser exibida dentro da flor."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isRemote ? (
              <>
                <Button size="lg" variant="outline" onClick={onRefresh}>
                  Atualizar arvore
                </Button>
                {onClearAll ? (
                  <Button size="lg" variant="outline" onClick={onClearAll}>
                    Apagar todas as flores
                  </Button>
                ) : null}
              </>
            ) : onClearAll ? (
              <Button size="lg" variant="outline" onClick={onClearAll}>
                Apagar todas as flores
              </Button>
            ) : null}
            <Button size="lg" variant="outline" onClick={onBack}>
              <ArrowLeft />
              Voltar ao formulario
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-[24px] bg-white/75 px-5 py-4 text-sm text-[#7E5F59] shadow-[0_18px_80px_rgba(93,61,57,0.08)]">
            Carregando flores da arvore...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[24px] bg-[#FFF1F0] px-5 py-4 text-sm text-destructive shadow-[0_18px_80px_rgba(93,61,57,0.08)]">
            {error}
          </div>
        ) : null}

        {isRemote && debugInfo ? (
          <div className="rounded-[24px] border border-[#E7D6D1] bg-[#FFFDFC] px-5 py-4 text-xs text-[#7E5F59] shadow-[0_18px_80px_rgba(93,61,57,0.08)]">
            <div>Pagina: {debugInfo.currentPage}</div>
            <div>API: {debugInfo.treeApiUrl || "desconectada"}</div>
            <div>Quantidade recebida: {debugInfo.drawingsCount}</div>
            <div>Primeiro ID: {debugInfo.firstDrawingId || "nenhum"}</div>
            <div>Primeiro debug: {debugInfo.firstDebugLabel || "nenhum"}</div>
          </div>
        ) : null}

        {drawings.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {drawings.map((drawing) => (
              <article
                key={drawing.id}
                className="rounded-[32px] bg-white/75 p-4 shadow-[0_18px_80px_rgba(93,61,57,0.08)]"
              >
                <FlowerTextPreview flower={drawing} />
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#5D3D39]">
                      {new Date(drawing.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-[#9D7C74]">
                      {drawing.flowerText ? "Mensagem enviada" : "Flor sem mensagem"}
                    </p>
                    {drawing.debugLabel ? (
                      <p className="mt-1 break-all text-[11px] text-[#B07B72]">
                        {drawing.debugLabel}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[32px] bg-white/75 p-10 text-center shadow-[0_18px_80px_rgba(93,61,57,0.08)]">
            <h2 className="text-xl font-semibold text-[#5D3D39]">
              Nenhuma flor salva ainda
            </h2>
            <p className="mt-2 text-sm text-[#7E5F59]">
              {isRemote
                ? "Se o worker estiver conectado, as novas flores do Forminit vao aparecer aqui."
                : "Envie o formulario com uma mensagem para ver sua flor aqui."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
