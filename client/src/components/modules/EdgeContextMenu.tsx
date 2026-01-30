import React, { useEffect, useState } from "react";

import { CP, Edge, EdgeAssignment } from "../../types/cp";
import { useClickOutside } from "../hooks/clickOutside";
import "./EdgeContextMenu.css";

interface EdgeContextMenuProps {
  selection: string[];
  cp: CP | null;
  setCP: (cp: CP) => void;
  setSelection: (selection: string[]) => void;
}

const EdgeContextMenu: React.FC<EdgeContextMenuProps> = ({
  selection,
  cp,
  setCP,
  setSelection,
}) => {
  const [angle, setAngle] = useState<string>("");
  const ref = useClickOutside<HTMLDivElement>(() => setSelection([]));

  useEffect(() => {
    if (cp !== null && selection.length >= 1) {
      const edge = cp.edges.find((e: Edge) => e.id === selection[0]);
      if (edge) {
        setAngle(((edge.foldAngle / Math.PI) * 180).toFixed(1));
      }
    }
  }, [cp, selection]);

  if (selection.length < 1) {
    return (
      <div className="Edge-menu" ref={ref}>
        <div className="Edge-menu-title">
          <h3>Edit Crease</h3>
        </div>
        <p className="Edge-menu-form">No Crease Selected</p>
      </div>
    );
  }

  const edgeID = selection[0];

  const validateAngle = (angle: number) => {
    if (isNaN(angle)) {
      return false;
    }
    return Math.abs(angle) <= Math.PI;
  };

  const getNewAssignment = (e: Edge, angle: number) => {
    if (
      e.assignment !== EdgeAssignment.Mountain &&
      e.assignment !== EdgeAssignment.Valley
    ) {
      return e.assignment;
    }
    if (angle > 0) {
      return EdgeAssignment.Valley;
    }
    if (angle < 0) {
      return EdgeAssignment.Mountain;
    }
    return e.assignment;
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (cp === null) {
      return; // This should not happen
    }
    const newAngle = (Number(angle) / 180) * Math.PI;
    if (!validateAngle(newAngle)) {
      return;
    }
    const newCP = {
      ...cp,
      edges: cp.edges.map((e: Edge) =>
        e.id === edgeID
          ? {
              ...e,
              foldAngle: newAngle,
              assignment: getNewAssignment(e, newAngle),
            }
          : e,
      ),
    };
    setCP(newCP);
  };

  return (
    <div className="Edge-menu" ref={ref}>
      <div className="Edge-menu-title">
        <h3>Edit Crease</h3>
      </div>
      <form className="Edge-menu-form" onSubmit={submit}>
        <label className="Edge-menu-form-label" htmlFor="foldAngle">
          Fold Angle:
        </label>
        <input
          className="Edge-menu-form-text"
          type="text"
          id="foldAngle"
          name="foldAngle"
          value={angle}
          onChange={(e) => setAngle(e.target.value)}
        />
        <input className="Edge-menu-submit" type="submit" value="Save" />
        <input
          className="Edge-menu-close"
          type="button"
          value="Close"
          onClick={() => setSelection([])}
        />
      </form>
    </div>
  );
};

export default EdgeContextMenu;
