/* all d\rawing-related functions and utilities */
import { Canvas, TEvent } from "fabric";

export const Mode = Object.freeze({
    ADD_LINE: "add_line",
});
export type ModeType = typeof Mode[keyof typeof Mode];

export const addListenersForMode = (canvasObj: Canvas, mode: ModeType) => {
    const adderFunc = activateModeFuncs[mode]
    adderFunc(canvasObj);
};

export const removeListenersForMode = (canvasObj: Canvas, mode: ModeType) => {
    const removerFunc = deactivateModeFuncs[mode]
    removerFunc(canvasObj);
};

const activateModeFuncs = {
    'add_line': (canvasObj: Canvas) => {
        canvasObj.on("mouse:down", startDrawingLine)
    },
}

const deactivateModeFuncs = {
    'add_line': (canvasObj: Canvas) => {
        canvasObj.off("mouse:down", startDrawingLine)
    },
}

const startDrawingLine = (e: TEvent) => {
    // TODO: implement
}
