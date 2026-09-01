import { Forminit } from "forminit";

const FORM_ID = "nkxotoh64ka";
const forminit = new Forminit();

export async function submitQuestionnaireAnswers({
  answers,
  flowerVariantId,
}) {
  const debugUserId = crypto.randomUUID();
  const formData = new FormData();

  formData.append("fi-sender-userId", debugUserId);

  Object.entries(answers)
    .filter(([name, value]) => name !== "flower_text" && typeof value === "string" && value.length > 0)
    .forEach(([name, value]) => {
      formData.append(`fi-radio-${name}`, value);
    });

  formData.append("fi-text-debug_tree_value", debugUserId);
  formData.append("fi-text-flower_variant_id", flowerVariantId);
  formData.append("fi-text-flower_text", String(answers.flower_text ?? "").trim().toLowerCase());

  const result = await forminit.submit(FORM_ID, formData);

  return {
    ...result,
    submissionId: debugUserId,
  };
}
