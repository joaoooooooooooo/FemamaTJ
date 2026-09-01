import { ArrowLeft, RefreshCw, Trees } from "lucide-react";
import { Button } from "@/components/ui/button";

function TextList({ emptyMessage, flowers }) {
  if (!flowers.length) {
    return (
      <p className="rounded-2xl bg-[#F7F0EE] px-4 py-5 text-sm text-[#7B5A56]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {flowers.map((flower) => (
        <li
          key={flower.id}
          className="rounded-2xl bg-[#F7F0EE] px-4 py-4 text-[#5D3D39]"
        >
          <p className="break-words text-lg font-medium">
            {flower.flowerText || "(sem flower_text)"}
          </p>
          <p className="mt-1 text-xs text-[#9D7C74]">
            {flower.createdAt
              ? new Date(flower.createdAt).toLocaleString("pt-BR")
              : "Data indisponivel"}
          </p>
        </li>
      ))}
    </ol>
  );
}

export default function FlowerTexts({
  localFlowers,
  onBack,
  onRefresh,
  onViewTree,
  remoteError,
  remoteFlowers,
  remoteIsEnabled,
  remoteIsLoading,
}) {
  return (
    <main className="min-h-screen bg-[#F7F0EE] px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#B76E79] uppercase">
              Debug de envio
            </p>
            <h1 className="mt-2 text-3xl font-medium tracking-[-0.03em] text-[#5D3D39]">
              Flower text
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#7B5A56]">
              Esta pagina mostra o texto recebido em cada etapa da submissao.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" variant="outline" onClick={onBack}>
              <ArrowLeft />
              Voltar ao formulario
            </Button>
            <Button size="lg" variant="outline" onClick={onViewTree}>
              <Trees />
              Ver arvore
            </Button>
          </div>
        </header>

        <div className="grid gap-6">
          <section className="rounded-[28px] bg-white/85 p-5 shadow-[0_18px_60px_rgba(93,61,57,0.08)] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#5D3D39]">
                  Recebido no navegador
                </h2>
                <p className="mt-1 text-sm text-[#7B5A56]">
                  Confirma que o formulario foi enviado por este dispositivo.
                </p>
              </div>
              <span className="rounded-full bg-[#F7F0EE] px-3 py-1 text-xs font-medium text-[#7B5A56]">
                {localFlowers.length}
              </span>
            </div>
            <TextList
              flowers={localFlowers}
              emptyMessage="Nenhum flower_text foi enviado neste navegador."
            />
          </section>

          <section className="rounded-[28px] bg-white/85 p-5 shadow-[0_18px_60px_rgba(93,61,57,0.08)] sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#5D3D39]">
                  Recebido pela Tree API
                </h2>
                <p className="mt-1 text-sm text-[#7B5A56]">
                  Atualiza automaticamente quando o webhook recebe uma nova submissao.
                </p>
              </div>
              <Button
                size="lg"
                variant="outline"
                onClick={onRefresh}
                disabled={!remoteIsEnabled || remoteIsLoading}
              >
                <RefreshCw />
                {remoteIsLoading ? "Atualizando..." : "Atualizar agora"}
              </Button>
            </div>

            <div aria-live="polite" role="status" className="sr-only">
              {remoteIsLoading
                ? "Atualizando flower texts."
                : `${remoteFlowers.length} flower texts recebidos pela Tree API.`}
            </div>

            {!remoteIsEnabled ? (
              <p className="mb-4 rounded-2xl bg-[#FFF1F0] px-4 py-4 text-sm text-[#8E4B56]" role="alert">
                Tree API desconectada. Configure VITE_TREE_API_URL para testar o webhook.
              </p>
            ) : null}

            {remoteError ? (
              <p className="mb-4 rounded-2xl bg-[#FFF1F0] px-4 py-4 text-sm text-[#8E4B56]" role="alert">
                {remoteError}
              </p>
            ) : null}

            <TextList
              flowers={remoteFlowers}
              emptyMessage={
                remoteIsLoading
                  ? "Buscando novas submissoes..."
                  : "A Tree API ainda nao recebeu nenhum flower_text."
              }
            />
          </section>
        </div>
      </div>
    </main>
  );
}
