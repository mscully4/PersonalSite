export enum BreakpointKeys {
  xs = "xs",
  sm = "sm",
  md = "md",
  lg = "lg",
  xl = "xl",
}

export enum Orientation {
  WIDTH = "width",
  HEIGHT = "height",
}

export const breakpoints: Record<
  Orientation,
  Partial<Record<BreakpointKeys, number>>
> = {
  [Orientation.WIDTH]: {
    [BreakpointKeys.xs]: 0,
    [BreakpointKeys.sm]: 650,
    [BreakpointKeys.md]: 1200,
  },
  [Orientation.HEIGHT]: {
    [BreakpointKeys.xs]: 0,
    [BreakpointKeys.sm]: 450,
    [BreakpointKeys.md]: 525,
    [BreakpointKeys.lg]: 650,
    [BreakpointKeys.xl]: 800,
  },
};
