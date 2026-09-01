import * as React from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
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
  FrameHeader,
  FrameTitle,
} from "@/components/ui/frame";
import {
  Dialog,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireSubmit,
} from "@/components/ui/questionnaire";
import { Button } from "@/components/ui/button";
import { TabletStage } from "@/components/ui/tablet-stage";
import { FlowerTextPreview } from "@/features/drawings/components/FlowerTextPreview";
import { getRandomFlowerVariantId } from "@/features/drawings/lib/flowerVariants";
import { useQuestionnaireForm } from "@/features/questionnaire/hooks/useQuestionnaireForm";
import { playQuestionnaireSound } from "@/lib/questionnaire-audio";
import fase1Rive from "@/assets/Fase1.riv?url";

function SquircleFrame({ children, className = "" }) {
  return (
    <div
      className={`relative flex flex-col rounded-[32px] bg-[#FBFAFA] p-4 shadow-[0_24px_60px_rgba(180,94,113,0.12)] group-data-active/questionnaire-item:[animation:questionnaire-frame-in_320ms_cubic-bezier(0.2,0,0,1)] motion-reduce:group-data-active/questionnaire-item:[animation:none] ${className}`}
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

export function QuestionnaireForm({
  onStartDrawing,
  onSubmissionComplete,
}) {
  const { getAnswers, getInitialItem, items, questions } = useQuestionnaireForm();
  const { element, isReady, triggerAnterior, triggerProxima } =
    useQuestionnaireRiveBackground();
  const initialItem = getInitialItem();
  const previousProgressPercentRef = React.useRef(0);
  const [currentItem, setCurrentItem] = React.useState(initialItem);
  const [invalidItemName, setInvalidItemName] = React.useState(null);
  const [hasStarted, setHasStarted] = React.useState(false);
  const [submissionStatus, setSubmissionStatus] = React.useState("idle");
  const [submitError, setSubmitError] = React.useState(null);
  const [flowerText, setFlowerText] = React.useState("");
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = React.useState(false);
  const [flowerVariantId] = React.useState(() => getRandomFlowerVariantId());
  const currentQuestionIndex = Math.max(
    questions.findIndex((question) => question.name === currentItem),
    0,
  );
  const currentQuestionNumber = currentQuestionIndex + 1;
  const progressPercent = (currentQuestionNumber / questions.length) * 100;
  const previousProgressPercent = previousProgressPercentRef.current;

  React.useEffect(() => {
    previousProgressPercentRef.current = progressPercent;
  }, [progressPercent]);

  React.useEffect(() => {
    if (submissionStatus !== "success") {
      return undefined;
    }

    const timeoutId = window.setTimeout(onSubmissionComplete, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [onSubmissionComplete, submissionStatus]);

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
      setInvalidItemName(null);
      playQuestionnaireSound("success");
      triggerProxima();
      return;
    }

    setInvalidItemName(currentItem);
    playQuestionnaireSound("error");
  }

  async function submitAnswers(answers) {
    setSubmitError(null);
    setSubmissionStatus("loading");

    try {
      const result = await onStartDrawing(answers, flowerVariantId);

      if (result?.error) {
        setSubmissionStatus("error");
        setSubmitError(result.error.message);
        return;
      }

      setIsSuccessDialogOpen(true);
      setSubmissionStatus("success");
    } catch {
      setSubmissionStatus("error");
      setSubmitError("Nao foi possivel enviar. Verifique sua conexao e tente novamente.");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    await submitAnswers(getAnswers(formData));
  }

  async function handleSubmitWithoutMessage(event) {
    const form = event.currentTarget.closest("form");

    if (!form) {
      return;
    }

    const formData = new FormData(form);
    formData.set("flower_text", "");
    setFlowerText("");
    await submitAnswers(getAnswers(formData));
  }

  function handleStartExperience() {
    if (hasStarted || !isReady) {
      return;
    }

    setHasStarted(true);
    triggerProxima();
  }

  return (
    <TabletStage>
      <div className="relative flex h-full w-full items-end justify-center overflow-hidden bg-[#F7F0EE] px-6 py-6">
        {element}

        {hasStarted && currentItem === "flower_text" ? (
          <div className="pointer-events-none absolute inset-x-6 top-[8%] bottom-[31%] z-[5] flex items-center justify-center sm:inset-x-10 sm:top-[7%] sm:bottom-[30%]">
            <FlowerTextPreview
              flower={{
                flowerText,
                flowerVariantId,
              }}
              unstyled
              className="w-[min(72vw,48vh,440px)] max-w-full drop-shadow-[0_22px_36px_rgba(93,61,57,0.12)]"
            />
          </div>
        ) : null}

        {!hasStarted ? (
          <button
            type="button"
            className="absolute inset-0 z-20 cursor-pointer bg-transparent"
            onClick={handleStartExperience}
          >
            <span className="sr-only">Toque para iniciar o formulario</span>
          </button>
        ) : null}

        <Questionnaire
          className={`relative w-full max-w-xl gap-6 transition-opacity duration-300 ${hasStarted ? "z-10 opacity-100" : "pointer-events-none opacity-0"}`}
          item={currentItem}
          items={items}
          onItemChange={(itemName) => {
            setCurrentItem(itemName);
            setInvalidItemName(null);
          }}
          onSubmit={handleSubmit}
        >
          {questions.map((question) => (
            <QuestionnaireItem key={question.name} name={question.name} required>
              <SquircleFrame>
                {question.type === "text" ? (
                  <div className="px-4 pt-4 sm:px-5 sm:pt-5">
                    <label className="flex flex-col gap-2 text-sm font-medium text-[#5D3D39]">
                      <QuestionnaireInput
                        id="flower-text"
                        maxLength={40}
                        value={flowerText}
                        aria-describedby="flower-text-error"
                        aria-label="Sua mensagem"
                        aria-invalid={invalidItemName === question.name}
                        autoComplete="off"
                        render={<textarea rows={3} />}
                        onChange={(event) => {
                          setFlowerText(event.target.value.toLowerCase());
                          setInvalidItemName(null);
                          setSubmitError(null);

                          if (submissionStatus === "error") {
                            setSubmissionStatus("idle");
                          }
                        }}
                        className="h-auto min-h-20 w-full resize-none rounded-xl border border-[#D8C1BC] bg-white px-4 py-3 text-base text-[#5D3D39] outline-none placeholder:text-[#9E817C] focus-visible:border-[#8E4B56] focus-visible:ring-2 focus-visible:ring-[#8E4B56]/30"
                        placeholder="Ex.: Esperança e cuidado"
                      />
                    </label>
                  </div>
                ) : null}

                <FrameHeader className="w-full px-1 pt-4 pb-4 group-data-active/questionnaire-item:[animation:questionnaire-content-in_280ms_cubic-bezier(0.2,0,0,1)] motion-reduce:group-data-active/questionnaire-item:[animation:none] sm:px-6">
                  {question.type !== "text" ? (
                    <div
                      aria-label="Questionnaire progress"
                      aria-valuemax={questions.length}
                      aria-valuemin={1}
                      aria-valuenow={currentQuestionNumber}
                      className="mb-4 h-1 w-full overflow-hidden rounded-full bg-[#F0E4E6]"
                      role="progressbar"
                    >
                      <div
                        className="h-full rounded-full bg-primary [animation:questionnaire-progress-width-in_420ms_cubic-bezier(0.2,0,0,1)] motion-reduce:[animation:none]"
                        style={{
                          "--progress-from": `${previousProgressPercent}%`,
                          "--progress-to": `${progressPercent}%`,
                          width: `${progressPercent}%`,
                        }}
                      />
                    </div>
                  ) : null}
                  <FrameTitle
                    className={
                      question.type === "text"
                        ? "text-xl leading-snug font-semibold text-foreground sm:text-2xl"
                        : "text-base leading-snug font-medium text-foreground sm:text-lg"
                    }
                  >
                    {question.question}
                  </FrameTitle>
                </FrameHeader>

                <div className="flex flex-col gap-4 px-4 pb-4 sm:px-5 sm:pb-5">
                  {question.type !== "text" ? (
                    <QuestionnaireChoices className="gap-3 group-data-active/questionnaire-item:[animation:questionnaire-content-in_360ms_cubic-bezier(0.2,0,0,1)] motion-reduce:group-data-active/questionnaire-item:[animation:none]">
                      {question.options.map((option) => (
                        <QuestionnaireChoice
                          key={option}
                          onChange={() => {
                            setInvalidItemName(null);
                            playQuestionnaireSound("hover");
                          }}
                          value={option}
                          className="rounded-xl px-4 py-3 data-checked:bg-primary-foreground hover:data-checked:bg-primary-foreground"
                        >
                          {option}
                        </QuestionnaireChoice>
                      ))}
                    </QuestionnaireChoices>
                  ) : null}

                  <div
                    aria-hidden={invalidItemName !== question.name}
                    className="overflow-hidden transition-[max-height,opacity,margin-top,translate] duration-200 ease-out motion-reduce:transition-none"
                    style={{
                      marginTop: invalidItemName === question.name ? "0px" : "-8px",
                      maxHeight: invalidItemName === question.name ? "40px" : "0px",
                      opacity: invalidItemName === question.name ? 1 : 0,
                      transform:
                        invalidItemName === question.name
                          ? "translateY(0)"
                          : "translateY(-6px)",
                    }}
                  >
                    <div
                      id={question.name === "flower_text" ? "flower-text-error" : undefined}
                      className="text-sm text-destructive"
                      role={invalidItemName === question.name ? "alert" : undefined}
                    >
                      {question.type === "text"
                        ? "Escreva uma mensagem para continuar."
                        : "Escolha uma resposta para continuar."}
                    </div>
                  </div>

                  <QuestionnaireActions className="flex gap-3">
                    {question.name !== "flower_text" ? (
                      <QuestionnairePrevious
                        className="flex-1 justify-center"
                        size="xl"
                        onClick={() => {
                          playQuestionnaireSound("delete");
                          triggerAnterior();
                        }}
                      >
                        <ChevronLeft />
                        Anterior
                      </QuestionnairePrevious>
                    ) : null}
                    <QuestionnaireNext
                      className="flex-1 justify-center"
                      size="xl"
                      onClick={handleForwardTrigger}
                    >
                      Proxima
                      <ChevronRight />
                    </QuestionnaireNext>
                    <QuestionnaireSubmit
                      className={`${question.name === "flower_text" ? "w-full" : "flex-1"} justify-center disabled:opacity-100 ${submissionStatus === "success" ? "border-primary/30 bg-primary/12 text-primary hover:bg-primary/12" : ""}`}
                      size="xl"
                      onClick={handleForwardTrigger}
                      disabled={submissionStatus === "loading" || submissionStatus === "success"}
                      variant={submissionStatus === "success" ? "secondary" : "default"}
                    >
                      {submissionStatus === "success" ? (
                        <>
                          <Check strokeWidth={2} />
                          Enviado
                        </>
                      ) : submissionStatus === "loading" ? (
                        "Enviando..."
                      ) : (
                        "Enviar"
                      )}
                    </QuestionnaireSubmit>
                  </QuestionnaireActions>
                  {question.name === "flower_text" ? (
                    <Button
                      type="button"
                      variant="link"
                      className="self-center text-[#7B5A56]"
                      disabled={submissionStatus === "loading" || submissionStatus === "success"}
                      onClick={handleSubmitWithoutMessage}
                    >
                      Enviar sem mensagem
                    </Button>
                  ) : null}
                  {question.name === "flower_text" && submitError ? (
                    <div className="text-sm text-destructive" role="alert">
                      {submitError}
                    </div>
                  ) : null}
                </div>
              </SquircleFrame>
            </QuestionnaireItem>
          ))}
        </Questionnaire>

        <Dialog open={isSuccessDialogOpen}>
          <DialogPopup
            showCloseButton={false}
            className="max-w-md rounded-[32px] border-[#D8C1BC] bg-[#FBFAFA]"
          >
            <DialogHeader className="p-8 text-center sm:p-10">
              <DialogTitle className="text-balance text-2xl leading-tight font-semibold text-[#5D3D39]">
                Obrigado, sua pesquisa foi enviada.
                <br />
                Em instantes, sua flor aparecerá no painel.
              </DialogTitle>
            </DialogHeader>
          </DialogPopup>
        </Dialog>
      </div>
    </TabletStage>
  );
}
