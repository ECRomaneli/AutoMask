/**
 * RAW MASK PATTERN
 * >[prefix]pattern[suffix]
 * Group 1 - Direction
 * Group 3 - Prefix
 * Group 4 - Pattern
 * Group 6 - Suffix
 */

(() => {

    enum DirectionEnum {
        FORWARD = 'forward', BACKWARD = 'backward'
    }

    enum AttrEnum {
        PATTERN = 'pattern', PREFIX = 'prefix', SUFFIX= 'suffix', DIRECTION= 'direction'
    }
    
    interface AutoMask {
        direction: DirectionEnum;
        prefix: string;
        suffix: string;
        pattern: string;
        value: string;
    }

    function isEmpty(str: string): boolean {
        return str.length === 0;
    }

    function isIndexOut(str: string, index: number): boolean {
        return index < 0 || index >= str.length;
    }

    function equals(str: string, matchesArr: Array<string>): boolean {
        return matchesArr.some(match => str === match);
    }

    function reverse(str: string): string {
        var newString = "";
        for (var i = str.length - 1; i >= 0; i--) {
            newString += str[i];
        }
        return newString;
    }

    function getAutoMask(el: HTMLInputElement): AutoMask {
        let value = el.value + '',
            direction: DirectionEnum = <DirectionEnum> el.getAttribute(AttrEnum.DIRECTION) || DirectionEnum.FORWARD;
        value = removeZeros(value.replace(/\D/g, ''), direction);

        return <AutoMask> {
            direction: direction,
            prefix: el.getAttribute(AttrEnum.PREFIX) || '',
            suffix: el.getAttribute(AttrEnum.SUFFIX) || '',
            pattern: el.getAttribute(AttrEnum.PATTERN),
            value: value
        };
    }

    const   DOC: Document = document,
            MASK_SELECTOR: string = `[type="mask"]`,
            EVENT: string = 'input';

    function main() {
        let inputs: NodeListOf<Element> = query(MASK_SELECTOR);
        each(inputs, (_i, el) => { el.addEventListener(EVENT, () => { onInputChange(el); }); });
    }

    function onInputChange(el) {
        let mask = getAutoMask(el),
            length = mask.pattern.length,
            value = '',
            selection,
            valuePos = 0;

        if (isEmpty(mask.value)) { selection = 0; }

        if (mask.direction === DirectionEnum.BACKWARD) {
            mask.pattern = reverse(mask.pattern);
            mask.value = reverse(mask.value);
        } 

        for (let i = 0; i < length; i++) {
            let maskChar = mask.pattern.charAt(i);

            if (isIndexOut(mask.value, valuePos)) {
                if (selection === void 0) { selection = i; }
                if (maskChar !== '0' && !isZero(mask.pattern, i)) { break; }
                value += maskChar;
                continue;
            }

            value += equals(maskChar, ['_', '0']) ? mask.value.charAt(valuePos++) : maskChar;
        }

        if (mask.direction === DirectionEnum.BACKWARD) {
            value = reverse(value);
        }

        el.value = mask.prefix + value + mask.suffix;

        if (selection === void 0 || mask.direction === DirectionEnum.BACKWARD) {
            el.selectionStart = el.selectionEnd = el.value.length - mask.suffix.length;
        } else {
            el.selectionStart = el.selectionEnd = selection + mask.prefix.length;
        }
    }

    function isZero(str: string, index: number): boolean {
        while(!isIndexOut(str, index)) {
            let char = str.charAt(index++);
            if (char === '0') { return true; }
            if (char === '_') { return false; }
        }
        return false;
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
