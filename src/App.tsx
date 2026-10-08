import * as React from "react";
const AnalyticsPage = React.lazy(() => import("./pages/Analytics"));
import { TREE_FLOWER_LIMIT } from "@/features/drawings/lib/tree-layout";
import { Agentation } from "agentation";
import { useSavedFlowerDrawings, useTreeDrawings } from "@/features/drawings";
// @ts-expect-error JSX page module is consumed by the Vite app at runtime.
import DrawnImagesPage from "./pages/DrawnImages";
// @ts-expect-error JSX page module is consumed by the Vite app at runtime.
import QuestionnairePage from "./pages/Questionnaire";
// @ts-expect-error JSX page module is consumed by the Vite app at runtime.
import SavedDrawingsPage from "./pages/SavedDrawings";
// @ts-expect-error JSX page module is consumed by the Vite app at runtime.
import AdminPage from "./pages/Admin";
// @ts-expect-error JSX page module is consumed by the Vite app at runtime.
import HelpPage from "./pages/Help";

function getPageFromPath(pathname: string) {
  if (pathname === "/resultados" || pathname === "/resultados/") return "analytics";
  if (pathname === "/help" || pathname === "/help/") return "help";
  if (pathname === "/admin" || pathname === "/admin/") return "admin";
  if (pathname === "/mensagem-flores" || pathname === "/mensagem-flores/") {
    return "tree-camera";
  }

  if (pathname === "/saved-drawings") {
    return "saved-drawings";
  }

  return "questionnaire";
}

function AdminPasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = React.useState("");
  const [hasError, setHasError] = React.useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password === "16425") {
      onUnlock();
      return;
    }
    setPassword("");
    setHasError(true);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F7F0EE] px-4 py-10 text-[#5D3D39]">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-[#E7D6D1] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#7E5F59] uppercase">Administração</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Acesso restrito</h1>
        <p className="mt-2 text-sm text-[#7E5F59]">Digite a senha de cinco dígitos para continuar.</p>
        <label className="mt-6 block text-sm font-medium" htmlFor="admin-password">Senha</label>
        <input
          id="admin-password"
          type="password"
          inputMode="numeric"
          pattern="[0-9]{5}"
          maxLength={5}
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => { setPassword(event.target.value.replace(/\D/g, "").slice(0, 5)); setHasError(false); }}
          className="mt-2 w-full rounded-xl border border-[#D8C1BC] bg-white px-4 py-3 text-lg tracking-[0.35em] outline-none focus-visible:ring-2 focus-visible:ring-[#B45E71]"
          aria-invalid={hasError}
          aria-describedby={hasError ? "admin-password-error" : undefined}
        />
        {hasError ? <p id="admin-password-error" role="alert" className="mt-2 text-sm text-destructive">Senha incorreta. Tente novamente.</p> : null}
        <button type="submit" className="mt-5 w-full rounded-xl bg-[#8E4B56] px-4 py-3 font-medium text-white hover:bg-[#783D47]">Entrar</button>
        <a href="/" className="mt-4 block text-center text-sm text-[#7E5F59] underline underline-offset-4">Voltar ao início</a>
      </form>
    </main>
  );
}

function App() {
  const [currentPage, setCurrentPage] = React.useState(() => getPageFromPath(window.location.pathname));
  const [isAdminUnlocked, setIsAdminUnlocked] = React.useState(false);
  const { clearDrawings, drawings, removeDrawing, saveDrawing } = useSavedFlowerDrawings();
  const treeApiUrl = import.meta.env.VITE_TREE_API_URL?.trim() ?? "";
  const remoteTree = useTreeDrawings({
    enabled: Boolean(treeApiUrl) && ["tree-camera", "admin", "saved-drawings"].includes(currentPage),
    url: treeApiUrl,
    limit: currentPage === "tree-camera" ? TREE_FLOWER_LIMIT : null,
  });
  const treeFlowers = React.useMemo(() => {
    // The online tree is authoritative, including removals made on another device.
    return [...(treeApiUrl ? remoteTree.drawings : drawings)].sort((left, right) => (
      Date.parse(right.createdAt ?? "") - Date.parse(left.createdAt ?? "")
    ));
  }, [drawings, remoteTree.drawings, treeApiUrl]);

  React.useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getPageFromPath(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const goToQuestionnaire = React.useCallback(() => {
    window.history.pushState({}, "", "/");
    setCurrentPage("questionnaire");
  }, []);

  const goHome = React.useCallback(() => {
    window.location.assign("/mensagem-flores");
  }, []);

  return (
    <>
      {currentPage === "analytics" ? (
        <React.Suspense fallback={<p role="status" className="p-8">Carregando resultados…</p>}>
          <AnalyticsPage />
        </React.Suspense>
      ) : currentPage === "help" ? (
        <HelpPage />
      ) : currentPage === "admin" ? (
        isAdminUnlocked ? <AdminPage
          drawings={treeFlowers}
          error={treeApiUrl ? remoteTree.error : null}
          isLoading={treeApiUrl ? remoteTree.isLoading : false}
          onRefresh={treeApiUrl ? remoteTree.refresh : undefined}
          onRemove={async (id: string) => {
            if (treeApiUrl) {
              const result = await remoteTree.remove(id);
              if (result.error) return result;
            }
            removeDrawing(id);
            return { error: null };
          }}
          onClearAll={async () => {
            if (treeApiUrl) {
              const result = await remoteTree.clear();
              if (result.error) return result;
            }
            clearDrawings();
            return { error: null };
          }}
        /> : <AdminPasswordGate onUnlock={() => setIsAdminUnlocked(true)} />
      ) : currentPage === "questionnaire" ? (
        <QuestionnairePage
          onStartDrawing={async (answers: Record<string, FormDataEntryValue | null>, flowerVariantId: string) => {
            const { submitQuestionnaireAnswers } = await import("@/lib/forminit-questionnaire");
            const result = await submitQuestionnaireAnswers({
              answers,
              flowerVariantId,
            });

            if (!result.error) {
              saveDrawing({
                id: result.submissionId,
                flowerText: String(answers.flower_text ?? "").toLowerCase(),
                flowerVariantId,
              });
            }

            return result;
          }}
          onSubmissionComplete={goHome}
        />
      ) : currentPage === "saved-drawings" ? (
        <SavedDrawingsPage
          drawings={treeApiUrl ? remoteTree.drawings : drawings}
          error={treeApiUrl ? remoteTree.error : null}
          isLoading={treeApiUrl ? remoteTree.isLoading : false}
          isRemote={Boolean(treeApiUrl)}
          onClearAll={treeApiUrl ? remoteTree.clear : clearDrawings}
          onRefresh={treeApiUrl ? remoteTree.refresh : undefined}
          onBack={goToQuestionnaire}
        />
      ) : (
        <DrawnImagesPage
          drawings={treeFlowers}
          error={treeApiUrl ? remoteTree.error : null}
          isLoading={treeApiUrl ? remoteTree.isLoading : false}
          isRemote={Boolean(treeApiUrl)}
          latestAddedDrawingId={remoteTree.latestDrawingId ?? treeFlowers[0]?.id}
          onClearAll={treeApiUrl ? remoteTree.clear : clearDrawings}
          onRefresh={treeApiUrl ? remoteTree.refresh : undefined}
          onBack={goToQuestionnaire}
        />
      )}
      {import.meta.env.DEV ? <Agentation /> : null}
    </>
  );
}

export default App;
