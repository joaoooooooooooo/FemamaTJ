import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Alignment,
  Fit,
  Layout,
  useRive,
  useViewModel,
  useViewModelInstance,
  useViewModelInstanceTrigger,
} from "@rive-app/react-webgl2";
import {
  FrameDescription,
  FrameHeader,
  FrameTitle,
} from "@/components/ui/frame";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireError,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireSubmit,
} from "@/components/ui/questionnaire";
import { Button } from "@/components/ui/button";
import { DrawingDialog } from "@/features/drawings";
import { getRandomFlowerVariantId } from "@/features/drawings/lib/flowerVariants";
import { useQuestionnaireForm } from "@/features/questionnaire/hooks/useQuestionnaireForm";
import fase1Rive from "@/assets/Fase1.riv?url";

function SquircleFrame({ children, className = "" }) {
  return (
    <div
      className={`relative flex flex-col rounded-[32px] bg-[#FBFAFA] p-4 ${className}`}
    >
      {children}
    </div>
  );
}

function useQuestionnaireRiveBackground() {
  const { rive, RiveComponent } = useRive({
    src: fase1Rive,
    stateMachines: "Fase01",
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });
  const viewModel = useViewModel(rive, { name: "ViewModel1" });
  const viewModelInstance = useViewModelInstance(viewModel, { rive });
  const { trigger: triggerProxima } = useViewModelInstanceTrigger(
    "triggerProxima",
    viewModelInstance,
  );
  const { trigger: triggerAnterior } = useViewModelInstanceTrigger(
    "triggerAnterior",
    viewModelInstance,
  );

  return {
    triggerAnterior,
    triggerProxima,
    isReady: Boolean(viewModelInstance),
    element: (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <RiveComponent className="h-full w-full" aria-hidden="true" />
      </div>
    ),
  };
}

export function QuestionnaireForm({ onSaveDrawing, onViewSavedDrawings }) {
  const { getAnswers, getInitialItem, items, questions } = useQuestionnaireForm();
  const { element, isReady, triggerAnterior, triggerProxima } =
    useQuestionnaireRiveBackground();
  const hasFiredInitialTriggerRef = React.useRef(false);
  const [isDrawingDialogOpen, setIsDrawingDialogOpen] = React.useState(false);
  const [selectedFlowerVariantId, setSelectedFlowerVariantId] = React.useState(
    getRandomFlowerVariantId,
  );

  React.useEffect(() => {
    if (hasFiredInitialTriggerRef.current || !isReady) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      hasFiredInitialTriggerRef.current = true;
      triggerProxima();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isReady, triggerProxima]);

  function hasValidAnswer(event) {
    const item = event.currentTarget.closest('[data-slot="questionnaire-item"]');

    if (!item) {
      return false;
    }

    return Boolean(
      item.querySelector(
        '[data-slot="questionnaire-choice-input"]:checked, [data-slot="questionnaire-input"]:valid',
      ),
    );
  }

  function handleForwardTrigger(event) {
    if (hasValidAnswer(event)) {
      triggerProxima();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const answers = getAnswers(formData);

    console.log("questionnaire_answers", answers);
    setSelectedFlowerVariantId(getRandomFlowerVariantId());
    setIsDrawingDialogOpen(true);
  }

  function handleSaveDrawing(drawing) {
    onSaveDrawing(drawing);
    setIsDrawingDialogOpen(false);
    onViewSavedDrawings();
  }

  return (
    <div className="relative flex min-h-screen w-full items-end justify-center overflow-hidden bg-[#F7F0EE] px-8 py-8 sm:px-6">
      {element}

      <div className="absolute right-6 top-6 z-10">
        <Button size="lg" variant="outline" onClick={onViewSavedDrawings}>
          Saved drawings
        </Button>
      </div>

      <Questionnaire
        className="relative z-10 w-full max-w-xl gap-6"
        defaultItem={getInitialItem()}
        items={items}
        onSubmit={handleSubmit}
      >
        {questions.map((question) => (
          <QuestionnaireItem key={question.name} name={question.name} required>
            <SquircleFrame>
              <FrameHeader className="w-full px-1 pt-4 pb-4 sm:px-6">
                <FrameTitle className="text-base leading-snug font-medium text-foreground sm:text-lg">
                  {question.question}
                </FrameTitle>
                {question.description ? (
                  <FrameDescription className="mt-1 leading-relaxed text-muted-foreground">
                    {question.description}
                  </FrameDescription>
                ) : null}
              </FrameHeader>

              <div className="flex flex-col gap-6 px-4 pb-4 sm:px-5 sm:pb-5">
                <QuestionnaireChoices className="gap-3">
                  {question.options.map((option) => (
                    <QuestionnaireChoice
                      key={option}
                      value={option}
                      className="rounded-xl px-4 py-3 data-checked:bg-primary-foreground hover:data-checked:bg-primary-foreground"
                    >
                      {option}
                    </QuestionnaireChoice>
                  ))}
                </QuestionnaireChoices>

                <QuestionnaireError>
                  Escolha uma resposta para continuar.
                </QuestionnaireError>

                <QuestionnaireActions className="flex gap-3">
                  <QuestionnairePrevious
                    className="flex-1 justify-center"
                    size="xl"
                    onClick={() => triggerAnterior()}
                  >
                    <ChevronLeft />
                    Anterior
                  </QuestionnairePrevious>
                  <QuestionnaireNext
                    className="flex-1 justify-center"
                    size="xl"
                    onClick={handleForwardTrigger}
                  >
                    Proxima
                    <ChevronRight />
                  </QuestionnaireNext>
                  <QuestionnaireSubmit
                    className="flex-1 justify-center"
                    size="xl"
                    onClick={handleForwardTrigger}
                  >
                    Enviar
                  </QuestionnaireSubmit>
                </QuestionnaireActions>
              </div>
            </SquircleFrame>
          </QuestionnaireItem>
        ))}
      </Questionnaire>

      <DrawingDialog
        flowerVariantId={selectedFlowerVariantId}
        open={isDrawingDialogOpen}
        onOpenChange={setIsDrawingDialogOpen}
        onSave={handleSaveDrawing}
      />
    </div>
  );
}
