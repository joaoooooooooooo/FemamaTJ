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
import FlowerTextsPage from "./pages/FlowerTexts";

function getPageFromPath(pathname: string) {
  if (pathname === "/tree") {
    return "tree-camera";
  }

  if (pathname === "/saved-drawings") {
    return "saved-drawings";
  }

  if (pathname === "/flower-texts") {
    return "flower-texts";
  }

  return "questionnaire";
}

function App() {
  const { clearDrawings, drawings, saveDrawing } = useSavedFlowerDrawings();
  const treeApiUrl = import.meta.env.VITE_TREE_API_URL?.trim() ?? "";
  const remoteTree = useTreeDrawings({
    enabled: Boolean(treeApiUrl),
    url: treeApiUrl,
  });
  const [currentPage, setCurrentPage] = React.useState(() => getPageFromPath(window.location.pathname));
  const treeFlowers = React.useMemo(() => {
    const flowersById = new Map();

    [...drawings, ...remoteTree.drawings].forEach((flower) => {
      flowersById.set(flower.id, flower);
    });

    return Array.from(flowersById.values()).sort((left, right) => (
      Date.parse(right.createdAt ?? "") - Date.parse(left.createdAt ?? "")
    ));
  }, [drawings, remoteTree.drawings]);

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

  const goToTree = React.useCallback(() => {
    window.history.pushState({}, "", "/tree");
    setCurrentPage("tree-camera");
  }, []);

  return (
    <>
      {currentPage === "questionnaire" ? (
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
      ) : currentPage === "flower-texts" ? (
        <FlowerTextsPage
          localFlowers={drawings}
          remoteFlowers={remoteTree.drawings}
          remoteError={remoteTree.error}
          remoteIsLoading={remoteTree.isLoading}
          remoteIsEnabled={Boolean(treeApiUrl)}
          onBack={goToQuestionnaire}
          onRefresh={remoteTree.refresh}
          onViewTree={goToTree}
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
