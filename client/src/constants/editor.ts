import deleteIcon from "../assets/icons/eraser.svg";
import drawIcon from "../assets/icons/pencil_snapping.svg";
import selectIcon from "../assets/icons/protractor.svg";
import changeMvIcon from "../assets/icons/switch_mv.svg";
import { Mode, MvMode } from "../types/ui";

export const CIRCLE_RADIUS = 0.015;

export const DRAW_SNAP_TOLERANCE_PX = 20;
export const DRAW_PREVIEW_DOT_RADIUS_PX = 4;

export const modeKeys = [" ", "q", "w", "e"] as const;
export const mvKeys = ["a", "s", "d", "f"] as const;

export const modeMap: Record<string, Mode> = {
  " ": Mode.Drawing,
  q: Mode.Selecting,
  w: Mode.Deleting,
  e: Mode.ChangeMV,
};

export const mvMap: Record<string, MvMode> = {
  a: MvMode.Mountain,
  s: MvMode.Valley,
  d: MvMode.Border,
  f: MvMode.Aux,
};

export const modeIcons: Record<Mode, string> = {
  [Mode.Drawing]: drawIcon,
  [Mode.Selecting]: selectIcon,
  [Mode.Deleting]: deleteIcon,
  [Mode.ChangeMV]: changeMvIcon,
};
