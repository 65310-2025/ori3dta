import React, { useState } from "react";

import { GridSettings } from "../../types/ui";
import "./GridMenu.css";

interface GridSettingsProps {
  gridSettings: GridSettings;
  setGridSettings: React.Dispatch<React.SetStateAction<GridSettings>>;
}

const GridMenu: React.FC<GridSettingsProps> = ({
  gridSettings,
  setGridSettings,
}) => {
  const [gridSizeValue, setGridSizeValue] = useState<string>("8");

  const maxGridSize = 1024;

  const clampGridSize = (size: number) => {
    // Clamp to minimum of 1 and round to integer
    return Math.min(Math.max(1, Math.round(size)), maxGridSize);
  };

  const handleGridSizeChange = (value: string) => {
    setGridSizeValue(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      const clamped = clampGridSize(parsed);
      setGridSettings((prev: GridSettings) => {
        return { ...prev, gridSize: clamped };
      });
    }
  };

  const halveGridSize = () => {
    setGridSettings((prev: GridSettings) => {
      setGridSizeValue(String(prev.gridSize / 2));
      return { ...prev, gridSize: clampGridSize(prev.gridSize / 2) };
    });
  };

  const doubleGridSize = () => {
    setGridSettings((prev: GridSettings) => {
      setGridSizeValue(String(prev.gridSize * 2));
      return { ...prev, gridSize: clampGridSize(prev.gridSize * 2) };
    });
  };

  return (
    <div className="Grid-settings">
      <div className="Grid-settings-title">
        <h3>Grid Settings</h3>
      </div>
      <div className="Grid-settings-form">
        <label className="Grid-settings-form-label">
          <input
            type="checkbox"
            checked={gridSettings.showGrid}
            onChange={(e) =>
              setGridSettings((prev: GridSettings) => {
                return { ...prev, showGrid: e.target.checked };
              })
            }
          />
          Display Grid
        </label>
        <label className="Grid-settings-form-label">
          <input
            type="checkbox"
            checked={gridSettings.extendGrid}
            onChange={(e) =>
              setGridSettings((prev: GridSettings) => {
                return { ...prev, extendGrid: e.target.checked };
              })
            }
          />
          Extend grid
        </label>
        <label className="Grid-settings-form-label" htmlFor="gridSize"></label>
        <input
          className="Grid-settings-form-text"
          type="number"
          id="gridSize"
          name="gridSize"
          min="1"
          step="1"
          value={gridSizeValue}
          onChange={(e) => handleGridSizeChange(e.target.value)}
        />
        <div className="Grid-settings-form-actions">
          <button
            type="button"
            className="Grid-settings-form-action"
            onClick={halveGridSize}
          >
            ×½
          </button>
          <button
            type="button"
            className="Grid-settings-form-action"
            onClick={doubleGridSize}
          >
            ×2
          </button>
        </div>
      </div>
    </div>
  );
};

export default GridMenu;
