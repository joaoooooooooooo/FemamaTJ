import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowerDrawingPreview } from "@/features/drawings/components/FlowerDrawingPreview";

export function SavedDrawingsPage({ drawings, onBack }) {
  return (
    <div className="min-h-screen bg-[#F7F0EE] px-6 py-8 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#9D7C74]">
              Saved Drawings
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[#5D3D39]">
              Flores salvas
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#7E5F59]">
              Cada desenho usa o mesmo formato JSON de strokes e fica mascarado
              dentro da flor.
            </p>
          </div>

          <Button size="lg" variant="outline" onClick={onBack}>
            <ArrowLeft />
            Voltar ao formulario
          </Button>
        </div>

        {drawings.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {drawings.map((drawing) => (
              <article
                key={drawing.id}
                className="rounded-[32px] bg-white/75 p-4 shadow-[0_18px_80px_rgba(93,61,57,0.08)]"
              >
                <FlowerDrawingPreview drawing={drawing} />
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
                      {drawing.strokes.length} stroke{drawing.strokes.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <p className="text-xs text-[#9D7C74]">
                    {drawing.width} x {drawing.height}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[32px] bg-white/75 p-10 text-center shadow-[0_18px_80px_rgba(93,61,57,0.08)]">
            <h2 className="text-xl font-semibold text-[#5D3D39]">
              Nenhum desenho salvo ainda
            </h2>
            <p className="mt-2 text-sm text-[#7E5F59]">
              Envie o formulario, desenhe na flor e salve para ver seus resultados aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
