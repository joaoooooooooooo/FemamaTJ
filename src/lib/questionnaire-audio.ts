import { definePatch, ensureReady, type AudioPatch } from "@web-kits/audio";
import { _patch as organicPatch } from "../../.web-kits/organic";

const questionnairePatch: AudioPatch = definePatch(organicPatch);

export type QuestionnaireSoundName = "delete" | "error" | "hover" | "success";

export function playQuestionnaireSound(name: QuestionnaireSoundName): void {
  void ensureReady()
    .then(() => {
      questionnairePatch.play(name);
    })
    .catch(() => {
      // Ignore blocked audio context errors; the next user gesture can unlock audio.
    });
}
