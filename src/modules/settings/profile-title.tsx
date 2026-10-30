import { profileTitles, type TitleId } from "./settings.logic";
import "./profile-title.css";
/** One presentation for the saved title in Settings, Sidebar and the matching leaderboard row. */
export function ProfileTitle({ id }: { id: TitleId | null | undefined }) {
  const title = profileTitles.find((item) => item.id === id);
  if (!title) return null;
  return (
    <span className="profile-title" data-title-id={title.id}>
      <span className={"profile-title-text " + title.className}>
        {title.text}
      </span>
      {"emoji" in title && (
        <>
          {" "}
          <span aria-hidden="true">{title.emoji}</span>
        </>
      )}
    </span>
  );
}
