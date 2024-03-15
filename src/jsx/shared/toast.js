import { OverlayToaster, Position } from "@blueprintjs/core";
import { createRoot } from "react-dom/client";

/** Singleton toaster instance. Create separate instances for different options. */
export const AppToaster = OverlayToaster.createAsync({
    position: Position.TOP
}, {
    domRenderer: (toaster, containerElement) => createRoot(containerElement).render(toaster)
});