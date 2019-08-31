/**
 * RAW MASK PATTERN
 * >[prefix]pattern[suffix]
 * Group 1 - Direction
 * Group 3 - Prefix
 * Group 4 - Pattern
 * Group 6 - Suffix
 */
interface AutoMask {
    direction: string;
    prefix: string;
    pattern: string;
    suffix: string;
}
interface MaskElement extends Element {
    autoMask: AutoMask;
}
declare enum DirectionEnum {
    LEFT = "left",
    RIGHT = "right"
}
