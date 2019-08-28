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

(() => {
    const   DOC: Document = document,
            MASK_PATTERN: RegExp = /^(<|>)?(\[([^\]]*)])?([^[]*)(\[([^\]]*)])?$/,
            MASK_ATTR: string = 'mask',
            MASK_SELECTOR: string = `[${MASK_ATTR}]`,
            RAW_NAME_ATTR: string = 'raw-name';

    function main() {
        let inputs: NodeListOf<Element> = query(MASK_SELECTOR);
        each(inputs, prepareInput);
    }

    function prepareInput(el: MaskElement): void {
        let rawMask: RegExpMatchArray = el.getAttribute(MASK_ATTR).match(MASK_PATTERN);
        el.autoMask = {
            direction:  rawMask[1] || '>',
            prefix:     rawMask[3] || '',
            pattern:    rawMask[4],
            suffix:     rawMask[6] || ''
        };

        if (el.autoMask.pattern === void 0) {
            console.error('Pattern not found!');
            el.removeAttribute(MASK_ATTR);
            el.setAttribute(MASK_ATTR + '-error');
        }
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
