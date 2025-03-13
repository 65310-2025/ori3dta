/* all drawing-related functions and utilities */
import { Canvas, TPointerEventInfo, Circle } from "fabric";

// Define the Mode object
export const Mode = Object.freeze({
    ADD_LINE: "add_line",
});
export type ModeType = typeof Mode[keyof typeof Mode];

// Function to add listeners for a specific mode
export const addListenersForMode = (canvasObj: Canvas, mode: ModeType) => {
    const adderFunc = activateModeFuncs[mode];
    adderFunc(canvasObj);
};

// Function to remove listeners for a specific mode
export const removeListenersForMode = (canvasObj: Canvas, mode: ModeType) => {
    const removerFunc = deactivateModeFuncs[mode];
    removerFunc(canvasObj);
};

const activateModeFuncs = {
    'add_line': (canvasObj: Canvas) => {
        const startDrawingLineWithCanvas = startDrawingLine(canvasObj); // Use closure to hold on to canvasObj
        canvasObj.on("mouse:down", startDrawingLineWithCanvas);
    },
};

const deactivateModeFuncs = {
    'add_line': (canvasObj: Canvas) => {
        const startDrawingLineWithCanvas = startDrawingLine(canvasObj);  // Use closure to hold on to canvasObj
        canvasObj.off("mouse:down", startDrawingLineWithCanvas);
    },
};

// Function to start drawing a line
const startDrawingLine = (canvasObj: Canvas) => {
    return (eventObj: TPointerEventInfo) => {
        console.log(eventObj.scenePoint.x);
        // const point = Circle();
    };
};
