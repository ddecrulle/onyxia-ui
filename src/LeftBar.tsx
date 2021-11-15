import { useMemo, useState, memo } from "react";
import type { FC } from "react";
import { makeStyles, useStyles as useTheme } from "./lib/ThemeProvider";
import { Text } from "./Text/TextBase";
import { createUseGlobalState } from "powerhooks/useGlobalState";
import Divider from "@mui/material/Divider";
import type { IconProps } from "./Icon";
import { id } from "tsafe/id";
import { objectKeys } from "tsafe/objectKeys";
import { createIcon } from "./Icon";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { useDomRect } from "powerhooks/useDomRect";
import { symToStr } from "tsafe/symToStr";

export type Item<IconId extends string = string> = {
    iconId: IconId;
    label: string;
    /** Defaults to available */
    availability?: "available" | "greyed" | "not visible";
    /** Default false */
    hasDividerBelow?: boolean;
    link: {
        href: string;
        onClick?: (event: { preventDefault: () => void }) => void;
    };
};

export type LeftBarProps<IconId extends string, ItemId extends string> = {
    className?: string;
    collapsedWidth?: number;
    currentItemId?: ItemId;
    items: Record<ItemId, Item<IconId>>;
    /** Default reduce */
    reduceText?: string;
};

//TODO: The component cannot be scrolled
export function createLeftBar<IconId extends string>(params?: {
    Icon: (props: IconProps<IconId>) => ReturnType<FC>;
    persistIsPanelOpen: boolean;
}) {
    const { Icon, persistIsPanelOpen = false } = params ?? {
        "Icon": id<(props: IconProps<IconId>) => JSX.Element>(() => {
            throw new Error("never");
        }),
    };

    const { useIsCollapsed } = createUseGlobalState("isCollapsed", false, {
        "persistance": persistIsPanelOpen ? "localStorage" : false,
    });

    const iconSize = "large";

    const LeftBar = memo(
        <ItemId extends string>(props: LeftBarProps<IconId, ItemId>) => {
            const { theme } = useTheme();

            const {
                className,
                collapsedWidth = 2 * theme.iconSizesInPxByName[iconSize],
                currentItemId,
                items,
                reduceText = "reduce",
            } = props;

            const { isCollapsed, setIsCollapsed } = useIsCollapsed();

            const toggleIsCollapsedLink = useMemo(
                () =>
                    id<Item["link"]>({
                        "href": "#",
                        "onClick": event => {
                            event.preventDefault();
                            setAreTransitionEnabled(true);
                            setIsCollapsed(isCollapsed => !isCollapsed);
                        },
                    }),
                [],
            );

            const {
                ref,
                domRect: { width: wrapperWidth, height: wrapperHeight },
            } = useDomRect();

            //We don't want animations to trigger on first render.
            const [areTransitionEnabled, setAreTransitionEnabled] =
                useState(false);

            const { classes, cx } = useStyles({
                "rootWidth": isCollapsed ? collapsedWidth : wrapperWidth,
                ...(() => {
                    const paddingTopBottomFactor = 3;
                    return {
                        paddingTopBottomFactor,
                        "rootHeight":
                            wrapperHeight +
                            theme.spacing(paddingTopBottomFactor) * 2,
                    };
                })(),
                areTransitionEnabled,
            });

            return (
                <div className={cx(classes.root, className)}>
                    <nav className={classes.nav}>
                        <div ref={ref} className={classes.wrapper}>
                            <CustomButton
                                key={"toggleIsCollapsed"}
                                isCollapsed={isCollapsed}
                                collapsedWidth={collapsedWidth}
                                isCurrent={undefined}
                                iconId="chevronLeft"
                                label={reduceText}
                                hasDividerBelow={undefined}
                                link={toggleIsCollapsedLink}
                            />
                            {objectKeys(items).map(itemId => (
                                <CustomButton
                                    className={classes.button}
                                    key={itemId}
                                    isCollapsed={isCollapsed}
                                    collapsedWidth={collapsedWidth}
                                    isCurrent={itemId === currentItemId}
                                    isButtonForTogglingIsCollapsed={false}
                                    {...items[itemId]}
                                />
                            ))}
                        </div>
                    </nav>
                </div>
            );
        },
    );

    const useStyles = makeStyles<{
        rootWidth: number;
        rootHeight: number;
        paddingTopBottomFactor: number;
        areTransitionEnabled: boolean;
    }>({ "label": { LeftBar } })(
        (
            theme,
            {
                rootWidth,
                rootHeight,
                paddingTopBottomFactor,
                areTransitionEnabled,
            },
        ) => ({
            "root": {
                "borderRadius": 16,
                "boxShadow": theme.shadows[3],
                "overflow": "auto",
                "backgroundColor": theme.colors.useCases.surfaces.surface1,
            },
            "nav": {
                "width": rootWidth,
                "height": rootHeight,
                ...theme.spacing.topBottom("padding", paddingTopBottomFactor),
                "transition": areTransitionEnabled ? "width 250ms" : undefined,
                "position": "relative",
                "overflow": "hidden",
            },
            "wrapper": {
                "position": "absolute",
            },
            "button": {
                "marginTop": theme.spacing(2),
            },
        }),
    );

    const { CustomButton } = (() => {
        type Props = {
            className?: string;
            isCollapsed: boolean;
            collapsedWidth: number;
            isCurrent: boolean | undefined;
        } & Item<IconId | "chevronLeft">;

        const { Icon: InternalIcon } = createIcon({
            "chevronLeft": ChevronLeftIcon,
        });

        const CustomButton = memo((props: Props) => {
            const {
                className,
                isCollapsed,
                collapsedWidth,
                isCurrent,
                iconId,
                label,
                link,
                hasDividerBelow = false,
                availability = "available",
            } = props;

            const { theme } = useTheme();

            const {
                ref,
                domRect: { width },
            } = useDomRect();

            const { classes, cx } = useStyles({
                "collapsedWidth":
                    collapsedWidth ?? 2 * theme.iconSizesInPxByName[iconSize],
                isCollapsed,
                isCurrent,
                width,
                "isDisabled": availability === "greyed",
            });

            if (availability === "not visible") {
                return null;
            }

            return (
                <>
                    <a
                        ref={ref}
                        className={cx(classes.root, className)}
                        {...link}
                    >
                        <div className={classes.iconWrapper}>
                            <div className={classes.iconHoverBox} />
                            {(() => {
                                const className = classes.icon;

                                return iconId === "chevronLeft" ? (
                                    <InternalIcon
                                        iconId="chevronLeft"
                                        className={className}
                                        size={iconSize}
                                    />
                                ) : (
                                    <Icon
                                        iconId={iconId}
                                        className={className}
                                        size={iconSize}
                                    />
                                );
                            })()}
                        </div>
                        <div className={classes.typoWrapper}>
                            <Text typo="label 1" className={classes.typo}>
                                {label}
                            </Text>
                        </div>
                    </a>
                    {hasDividerBelow && (
                        <Divider
                            className={classes.divider}
                            variant="fullWidth"
                        />
                    )}
                </>
            );
        });

        const useStyles = makeStyles<{
            collapsedWidth: number;
            isCollapsed: boolean;
            isCurrent: boolean | undefined;
            width: number;
            isDisabled: boolean;
        }>({
            "label": `${symToStr({ LeftBar })}${symToStr({ CustomButton })}`,
        })(
            (
                theme,
                { collapsedWidth, isCollapsed, isCurrent, width, isDisabled },
                createRef,
            ) => {
                const iconHoverBox = {
                    "ref": createRef(),
                    "display": "inline-block",
                    "position": "absolute",
                    "height": "100%",
                    ...(() => {
                        const offset = collapsedWidth / 8;

                        return {
                            "left": offset,
                            "right": isCollapsed ? offset : 0,
                        };
                    })(),
                    "zIndex": 1,
                    "borderRadius": `10px ${
                        isCollapsed ? "10px 10px" : "0 0"
                    } 10px`,
                } as const;

                const typoWrapper = {
                    "ref": createRef(),
                    "paddingRight": theme.spacing(2),
                    "flex": 1,
                    "borderRadius": "0 10px 10px 0",
                    "display": "flex",
                    "alignItems": "center",
                    "marginRight": theme.spacing(5),
                } as const;

                return {
                    "root": {
                        ...(isDisabled ? { "pointerEvents": "none" } : {}),
                        "color": theme.colors.useCases.typography.textPrimary,
                        "textDecoration": "none",
                        "display": "flex",
                        "cursor": "pointer",
                        [`&:hover .${iconHoverBox.ref}`]: {
                            "backgroundColor":
                                theme.colors.useCases.surfaces.background,
                        },
                        [`&:hover .${typoWrapper.ref}`]: {
                            "backgroundColor": !isCollapsed
                                ? theme.colors.useCases.surfaces.background
                                : undefined,
                        },
                        [[".MuiSvgIcon-root", "h6"]
                            .map(
                                name =>
                                    `&${isCurrent ? "" : ":active"} ${name}`,
                            )
                            .join(", ")]: {
                            "color": theme.colors.useCases.typography.textFocus,
                        },
                    },
                    "iconWrapper": {
                        "width": collapsedWidth,
                        "textAlign": "center",
                        "position": "relative",
                        "color": isDisabled
                            ? theme.colors.useCases.typography.textDisabled
                            : undefined,
                    },

                    "icon": {
                        "position": "relative",
                        "zIndex": 2,
                        ...theme.spacing.topBottom("margin", 2),
                        ...(isCurrent !== undefined
                            ? {}
                            : {
                                  "transform": isCollapsed
                                      ? "rotate(-180deg)"
                                      : "rotate(0)",
                              }),
                        "transition": `transform 250ms`,
                    },
                    iconHoverBox,
                    typoWrapper,
                    "typo": {
                        "color": isDisabled
                            ? theme.colors.useCases.typography.textDisabled
                            : undefined,
                        "whiteSpace": "nowrap",
                    },
                    "divider": {
                        "marginTop": theme.spacing(2),
                        "borderColor":
                            theme.colors.useCases.typography.textTertiary,
                        "width":
                            (isCollapsed ? collapsedWidth : width) -
                            2 * theme.spacing(2),
                        "marginLeft": theme.spacing(2),
                        "transition": "width 250ms",
                    },
                };
            },
        );

        return { CustomButton };
    })();

    return { LeftBar };
}
