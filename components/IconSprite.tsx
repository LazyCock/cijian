import { iconSprite } from "./icon-sprite";

export function IconSprite() {
  return <div aria-hidden="true" dangerouslySetInnerHTML={{ __html: iconSprite }} />;
}
