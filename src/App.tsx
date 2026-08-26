import * as React from "react";
import { Agentation } from "agentation";
import { useSavedFlowerDrawings } from "@/features/drawings";
// @ts-expect-error JSX page module is consumed by the Vite app at runtime.
import QuestionnairePage from "./pages/Questionnaire";
// @ts-expect-error JSX page module is consumed by the Vite app at runtime.
import DrawnImagesPage from "./pages/DrawnImages";

function App() {
  const { drawings, saveDrawing } = useSavedFlowerDrawings();
  const [currentPage, setCurrentPage] = React.useState("questionnaire");

  return (
    <>
      {currentPage === "questionnaire" ? (
        <QuestionnairePage
          onSaveDrawing={saveDrawing}
          onViewSavedDrawings={() => setCurrentPage("saved-drawings")}
        />
      ) : (
        <DrawnImagesPage
          drawings={drawings}
          onBack={() => setCurrentPage("questionnaire")}
        />
      )}
      {import.meta.env.DEV ? <Agentation /> : null}
    </>
  );
}

export default App;
