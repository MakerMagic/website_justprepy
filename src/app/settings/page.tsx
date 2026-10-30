import { SettingsPage } from "@/modules/settings/settings-page";
import { demoQuestionBank } from "@/modules/questions/question-bank.fixtures";
export const metadata = { title: "Settings | justprepy" };
/** Public frontend preview only. Never load private data until the existing auth service is implemented. */
export default function SettingsRoute() {
  return <SettingsPage profile={demoQuestionBank.profile} />;
}
