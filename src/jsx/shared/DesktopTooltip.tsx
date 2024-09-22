import { DefaultPopoverTargetHTMLProps, Intent, Placement, PopoverClickTargetHandlers, PopoverHoverTargetHandlers, PopoverPosition, PopoverTargetProps, PopperBoundary, PopperCustomModifier, Tooltip, TooltipProps } from "@blueprintjs/core";
import { RootBoundary } from "@popperjs/core";
import { ApplyStylesModifier } from "@popperjs/core/lib/modifiers/applyStyles";
import { ArrowModifier } from "@popperjs/core/lib/modifiers/arrow";
import { ComputeStylesModifier } from "@popperjs/core/lib/modifiers/computeStyles";
import { EventListenersModifier } from "@popperjs/core/lib/modifiers/eventListeners";
import { FlipModifier } from "@popperjs/core/lib/modifiers/flip";
import { HideModifier } from "@popperjs/core/lib/modifiers/hide";
import { OffsetModifier } from "@popperjs/core/lib/modifiers/offset";
import { PopperOffsetsModifier } from "@popperjs/core/lib/modifiers/popperOffsets";
import { PreventOverflowModifier } from "@popperjs/core/lib/modifiers/preventOverflow";
import PropTypes from 'prop-types';
import { ReactNode, JSX, Ref, SyntheticEvent } from "react";
import MediaQuery from 'react-responsive'
// import { JSX } from "react/jsx-runtime";

export const DesktopTooltip = (props: JSX.IntrinsicAttributes & JSX.IntrinsicClassAttributes<Tooltip<DefaultPopoverTargetHTMLProps>> & Pick<Readonly<TooltipProps<DefaultPopoverTargetHTMLProps>>, never> & { readonly children?: ReactNode; readonly className?: string | undefined; readonly fill?: boolean | undefined; readonly intent?: Intent | undefined; readonly content?: string | JSX.Element | undefined; readonly disabled?: boolean | undefined; readonly position?: PopoverPosition | undefined; readonly transitionDuration?: number | undefined; readonly autoFocus?: boolean | undefined; readonly placement?: Placement | undefined; readonly onClose?: ((event: React.SyntheticEvent<HTMLElement>) => void) | undefined; readonly modifiers?: Partial<{ offset: Partial<Omit<Partial<OffsetModifier>, "name">>; arrow: Partial<Omit<Partial<ArrowModifier>, "name">>; applyStyles: Partial<Omit<Partial<ApplyStylesModifier>, "name">>; hide: Partial<Omit<Partial<HideModifier>, "name">>; computeStyles: Partial<Omit<Partial<ComputeStylesModifier>, "name">>; eventListeners: Partial<Omit<Partial<EventListenersModifier>, "name">>; flip: Partial<Omit<Partial<FlipModifier>, "name">>; preventOverflow: Partial<Omit<Partial<PreventOverflowModifier>, "name">>; popperOffsets: Partial<Omit<Partial<PopperOffsetsModifier>, "name">>; }> | undefined; readonly popoverRef?: Ref<HTMLElement> | undefined; readonly isOpen?: boolean | undefined; readonly compact?: boolean | undefined; readonly boundary?: PopperBoundary | undefined; readonly captureDismiss?: boolean | undefined; readonly defaultIsOpen?: boolean | undefined; readonly hoverCloseDelay?: number | undefined; readonly hoverOpenDelay?: number | undefined; readonly inheritDarkTheme?: boolean | undefined; readonly matchTargetWidth?: boolean | undefined; readonly minimal?: boolean | undefined; readonly modifiersCustom?: readonly PopperCustomModifier[] | undefined; readonly onInteraction?: ((nextOpenState: boolean, e?: SyntheticEvent<HTMLElement>) => void) | undefined; readonly openOnTargetFocus?: boolean | undefined; readonly renderTarget?: ((props: PopoverTargetProps & PopoverHoverTargetHandlers<DefaultPopoverTargetHTMLProps> & PopoverClickTargetHandlers<DefaultPopoverTargetHTMLProps>) => JSX.Element) | undefined; readonly rootBoundary?: RootBoundary | undefined; readonly popoverClassName?: string | undefined; readonly targetTagName?: keyof JSX.IntrinsicElements | undefined; readonly targetProps?: DefaultPopoverTargetHTMLProps | undefined; readonly usePortal?: boolean | undefined; readonly canEscapeKeyClose?: boolean | undefined; readonly enforceFocus?: boolean | undefined; readonly lazy?: boolean | undefined; readonly portalClassName?: string | undefined; readonly portalContainer?: HTMLElement | undefined; readonly portalStopPropagationEvents?: Array<keyof HTMLElementEventMap> | undefined; readonly onClosing?: ((node: HTMLElement) => void) | undefined; readonly onClosed?: ((node: HTMLElement) => void) | undefined; readonly onOpening?: ((node: HTMLElement) => void) | undefined; readonly onOpened?: ((node: HTMLElement) => void) | undefined; readonly interactionKind?: ("hover" | "hover-target") | undefined; } & {}) => {
    return (
        <MediaQuery minWidth={501}>
            {(matches) => matches ?
            <Tooltip {...props}>{props.children}</Tooltip> : props.children}
        </MediaQuery>
    )
}

DesktopTooltip.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.element),
        PropTypes.element.isRequired
      ]),
      options: PropTypes.object
}