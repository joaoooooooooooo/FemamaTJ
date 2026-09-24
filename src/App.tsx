import * as React from "react";
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

function getPageFromPath(pathname: string) {
  if (pathname === "/admin" || pathname === "/admin/") return "admin";
  if (pathname === "/tree") {
    return "tree-camera";
  }

  if (pathname === "/saved-drawings") {
    return "saved-drawings";
  }

  return "questionnaire";
}

function App() {
  const { clearDrawings, drawings, removeDrawing, saveDrawing } = useSavedFlowerDrawings();
  const treeApiUrl = import.meta.env.VITE_TREE_API_URL?.trim() ?? "";
  const remoteTree = useTreeDrawings({
    enabled: Boolean(treeApiUrl),
    url: treeApiUrl,
  });
  const [currentPage, setCurrentPage] = React.useState(() => getPageFromPath(window.location.pathname));
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
    window.location.assign("/");
  }, []);

  return (
    <>
      {currentPage === "admin" ? (
        <AdminPage
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
        />
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
