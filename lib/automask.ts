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

enum DirectionEnum {
    FORWARD = 'forward', BACKWARD = 'backward'
}

(() => {
    const   ATTR = {
                MASK: 'mask',
                PREFIX: 'prefix',
                SUFFIX: 'suffix',
                DIRECTION: 'direction'
            },
            DOC: Document = document,
            MASK_PATTERN: RegExp = /^(<|>)?(\[([^\]]*)])?([^[]*)(\[([^\]]*)])?$/,
            MASK_SELECTOR: string = `[${ATTR.MASK}]`,
            RAW_NAME_ATTR: string = 'raw-name';

    function main() {
        let inputs: NodeListOf<Element> = query(MASK_SELECTOR);
        each(inputs, (_i, el) => {
            el.addEventListener('input', () => {
                let value = el.value + '',
                    mask = el.getAttribute(ATTR.MASK),
                    direction: DirectionEnum = el.getAttribute(ATTR.DIRECTION),
                    length = mask.length,
                    prefix = el.getAttribute(ATTR.PREFIX) || '',
                    suffix = el.getAttribute(ATTR.SUFFIX) || '',
                    newValue = prefix,
                    selection = void 0;

                value = value.replace(/[\D]/g, '');
                value = removeZeros(value, direction);

                if (value.length === 0) {
                    selection = 0;
                }

                if (!direction || direction === DirectionEnum.FORWARD) {
                    let valuePos = 0;
                    for (let i = 0; i < length; i++) {
                        let char = mask.charAt(i),
                            death = valuePos >= value.length;

                        if (death && selection == void 0) {
                            selection = i;
                        }

                        if (char === '_') {
                            if (death) { break; }

                            newValue += value.charAt(valuePos++);
                            continue;
                        }

                        if (char.match(/[0-9]/)) {
                            if (death) {
                                newValue += char;
                            } else {
                                newValue += value.charAt(valuePos++);
                            }
                            continue;
                        }

                        if (death) { break; }

                        newValue += char;
                    }
                }

                newValue += el.getAttribute(ATTR.SUFFIX) || '';
                el.value = newValue;

                if (selection === void 0) {
                    el.selectionStart = el.selectionEnd = newValue.length - suffix.length;
                    return;
                }
                el.selectionStart = el.selectionEnd = selection + prefix.length;
            });
        });
    }

    function removeZeros(value: string, direction: DirectionEnum) {
        if (!direction || direction === DirectionEnum.FORWARD) {
            return value.replace(/0*$/, '');
        }
        return value.replace(/^0*/, '');
    }

    function query(querySelector: string): NodeListOf<Element> {
        return DOC.querySelectorAll(querySelector);
    }

    function createElement(tag: string): HTMLElement {
        return document.createElement(tag);
    }

    function ready(handler: Function): void {
        if (DOC.readyState !== 'loading') {
            handler();
        } else {
            DOC.addEventListener('DOMContentLoaded', () => { handler() });
        }
    }

    function each(arr: ArrayLike<any>, it: (item, index) => void): void {
        let length = arr.length;
        for (let i = 0; i < length; i++) {
            if (it.call(arr[i], i, arr[i]) === false) { break }
        }
    }

    ready(main);
}) ();
