export function submitQuestionnaireAnswers(input: {
  answers: Record<string, FormDataEntryValue | null>;
  flowerVariantId: string;
}): Promise<{
  error: { message: string } | null;
  submissionId: string;
}>;
