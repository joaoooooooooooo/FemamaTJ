import * as React from "react";
import { ArrowLeft, Flower2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogClose, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogPopup, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FlowerTextPreview } from "@/features/drawings/components/FlowerTextPreview";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data não informada" : dateFormatter.format(date);
}

export default function AdminPage({ drawings, error, isLoading, onRemove, onClearAll, onRefresh }) {
  const [pending, setPending] = React.useState(null);
  const [actionError, setActionError] = React.useState(null);
  const [notice, setNotice] = React.useState("");
  const [isResetOpen, setIsResetOpen] = React.useState(false);
  const headingRef = React.useRef(null);
  const busyRef = React.useRef(false);

  async function removeFlowers(flower) {
    if (busyRef.current) return;
    busyRef.current = true;
    setPending(flower ? { id: flower.id } : { all: true });
    setActionError(null);
    setNotice("");
    try {
      const result = await (flower ? onRemove(flower.id) : onClearAll());
      if (result?.error) throw new Error(result.error);
      setNotice(flower ? "Flor excluída." : "Todas as flores foram excluídas. O painel está pronto para novos envios.");
      setIsResetOpen(false);
      if (flower) headingRef.current?.focus();
    } catch {
      setActionError("Não foi possível excluir. Verifique a conexão e tente novamente.");
    } finally {
      busyRef.current = false;
      setPending(null);
    }
  }

  return (
    <main className="min-h-dvh bg-[#F7F0EE] px-4 py-6 text-[#5D3D39] sm:px-8 sm:py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <nav aria-label="Navegação" className="flex flex-wrap gap-3">
          <Button variant="outline" render={<a href="/" />}><ArrowLeft aria-hidden="true" />Voltar ao início</Button>
          <Button variant="outline" render={<a href="/tree" />}>Ver painel de flores</Button>
        </nav>

        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#7E5F59] uppercase">Administração</p>
            <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Flores recebidas</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#7E5F59]">Acompanhe os envios e remova flores do painel. As mais recentes aparecem primeiro.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {onRefresh ? <Button size="lg" variant="outline" disabled={Boolean(pending) || isLoading} onClick={onRefresh}>
              <RefreshCw aria-hidden="true" />Atualizar
            </Button> : null}
            <AlertDialog open={isResetOpen} onOpenChange={(open) => { if (!busyRef.current) { setIsResetOpen(open); setActionError(null); } }}>
              <AlertDialogTrigger render={<Button size="lg" variant="destructive-outline" className="text-[#9F2940]" disabled={Boolean(pending) || !drawings.length} />}>
                <Trash2 aria-hidden="true" />Excluir todas as flores
              </AlertDialogTrigger>
              <AlertDialogPopup bottomStickOnMobile={false} finalFocus={headingRef}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir todas as flores?</AlertDialogTitle>
                  <AlertDialogDescription>Todas as flores atuais serão removidas do painel. Essa ação não pode ser desfeita. Novos envios continuarão aparecendo normalmente.</AlertDialogDescription>
                </AlertDialogHeader>
                {actionError ? <p role="alert" className="px-6 pb-4 text-sm text-destructive">{actionError}</p> : null}
                <AlertDialogFooter>
                  <AlertDialogClose render={<Button variant="outline" disabled={Boolean(pending)} />}>Cancelar</AlertDialogClose>
                  <Button variant="destructive" className="border-[#9F2940] bg-[#9F2940] hover:bg-[#862237]" disabled={Boolean(pending)} onClick={() => removeFlowers()}>
                    {pending?.all ? "Excluindo…" : "Excluir todas as flores"}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogPopup>
            </AlertDialog>
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D8C1BC] pb-4">
          <p className="font-medium">{drawings.length === 1 ? "1 flor recebida" : `${drawings.length} flores recebidas`}</p>
          {onRefresh ? <p className="text-sm text-[#7E5F59]">Atualização automática</p> : null}
        </div>
        <p role="status" className={notice ? "rounded-2xl bg-white px-5 py-4 text-sm" : "sr-only"}>{notice}</p>
        {error || (actionError && !isResetOpen) ? <p role="alert" className="rounded-2xl border border-destructive/20 bg-white px-5 py-4 text-sm text-destructive">{actionError || error}</p> : null}

        {isLoading && !drawings.length ? (
          <p role="status" className="py-16 text-center text-[#7E5F59]">Carregando flores…</p>
        ) : drawings.length ? (
          <section aria-label="Flores recebidas" className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,250px),1fr))] gap-6">
            {drawings.map((flower) => (
              <article key={flower.id} aria-label={`Flor: ${flower.flowerText || "sem mensagem"}`} className="flex min-w-0 flex-col rounded-3xl border border-[#E7D6D1] bg-[#FBFAFA] p-4">
                <FlowerTextPreview flower={flower} className="bg-[#F7F0EE]" />
                <div className="flex flex-1 flex-col gap-3 px-1 pt-5">
                  <h2 className="break-words text-base font-medium">{flower.flowerText || "Flor sem mensagem"}</h2>
                  <p className="text-sm text-[#7E5F59]">{formatDate(flower.createdAt)}</p>
                  <p className="break-all text-xs leading-5 text-[#7E5F59]">Registro: {flower.id}</p>
                  <Button className="mt-auto w-full text-[#9F2940]" size="lg" variant="destructive-outline" disabled={Boolean(pending)} onClick={() => removeFlowers(flower)} aria-label={`Excluir flor: ${flower.flowerText || flower.id}`}>
                    <Trash2 aria-hidden="true" />{pending?.id === flower.id ? "Excluindo…" : "Excluir flor"}
                  </Button>
                </div>
              </article>
            ))}
          </section>
        ) : !error ? (
          <div className="rounded-3xl border border-dashed border-[#D8C1BC] px-6 py-16 text-center">
            <Flower2 aria-hidden="true" className="mx-auto mb-4 size-10 text-[#B76E79]" />
            <h2 className="text-xl font-semibold">Nenhuma flor no painel</h2>
            <p className="mt-2 text-sm text-[#7E5F59]">As flores aparecerão aqui conforme a pesquisa receber novos envios.</p>
            <Button className="mt-6" variant="outline" render={<a href="/" />}>Abrir pesquisa</Button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
