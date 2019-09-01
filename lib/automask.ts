(() => {
    enum DirectionEnum {
        FORWARD = 'forward', BACKWARD = 'backward'
    }

    enum AttrEnum {
        PATTERN = 'pattern', 
        PREFIX = 'prefix',
        SUFFIX = 'suffix', 
        DIRECTION = 'dir',
        ACCEPT = 'accept',
        SHOW_MASK = 'show-mask'
    }

    interface AutoMaskElement extends HTMLInputElement {
        autoMask?: AutoMask
    }

    class AutoMask {
        public dir: DirectionEnum;
        public prefix: string;
        public suffix: string;
        public pattern: string;
        public showMask: boolean;
        public accept: RegExp;

        private element: AutoMaskElement;
        private zeroPadEnabled: boolean;
        private constructor () {}

        public set value(value: string) {
            this.element.value = this.prefix + this.reverseIfNeeded(value) + this.suffix;
        }

        public getRawValue(): string {
            let value: string = this.removePrefixAndSuffix(this.element.value);
            value = this.removeZeros(value.replace(this.accept, ''));
            return this.reverseIfNeeded(value);
        }

        private removePrefixAndSuffix(value: string): string {
            return value.replace(this.prefix, '').replace(this.suffix, '');
            // return value.substring(this.prefix.length, value.length - this.suffix.length);
        }

        private reverseIfNeeded(str: string): string {
            if (this.dir !== DirectionEnum.BACKWARD) { return str; }
            let rStr = "", i = str.length;
            while (i) { rStr += str[--i]; }
            return rStr;
        }

        private removeZeros(value: string): string {
            if (!this.zeroPadEnabled) { return value; }
            return value.replace(this.dir === DirectionEnum.FORWARD ? /0*$/ : /^0*/, '');
        }

        public static getAutoMask(el: AutoMaskElement): AutoMask {
            if (el.autoMask) { return el.autoMask; }

            let mask: AutoMask = new AutoMask();
            mask.dir = <DirectionEnum> el.getAttribute(AttrEnum.DIRECTION) || DirectionEnum.FORWARD;
            mask.prefix = el.getAttribute(AttrEnum.PREFIX) || '';
            mask.suffix = el.getAttribute(AttrEnum.SUFFIX) || '';
            mask.pattern = mask.reverseIfNeeded(el.getAttribute(AttrEnum.PATTERN));
            mask.showMask = (el.getAttribute(AttrEnum.SHOW_MASK) + '').toLowerCase() === 'true' || false;
            mask.accept = new RegExp(`[^${el.getAttribute(AttrEnum.ACCEPT) || '\\d'}]`, 'g');
            
            mask.element = el;
            mask.zeroPadEnabled = mask.pattern.indexOf('0') !== -1;

            el.maxLength = mask.pattern.length + mask.prefix.length + mask.suffix.length + 1;
            return el.autoMask = mask;
        }
    }

    const   DOC: Document = document,
            MASK_SELECTOR: string = `[type="mask"]`,
            EVENT: string = 'input';

    function main() {
        let inputs: NodeListOf<Element> = query(MASK_SELECTOR), i = inputs.length;
        while (i) {
            let el: AutoMaskElement = <AutoMaskElement> inputs[--i];
            onInputChange(el);
            el.addEventListener(EVENT, () => { onInputChange(el); }, true);
        }
    }

    function onInputChange(el: AutoMaskElement) {
        let mask = AutoMask.getAutoMask(el),
            length = mask.pattern.length,
            rawValue = mask.getRawValue(),
            value = '',
            newSelection,
            oldSelection = el.selectionStart,
            valuePos = 0;

        if (isEmpty(rawValue)) { newSelection = 0; }

        for (var i = 0; i < length; i++) {
            let maskChar = mask.pattern.charAt(i);

            if (isIndexOut(rawValue, valuePos)) {
                if (newSelection === void 0) {
                    newSelection = i;
                    console.log(oldSelection, i);
                }
                if (!mask.showMask && !isZero(mask.pattern, i)) {
                    // Fix IE11 input loop bug
                    if (i === 0) { return; }
                    break;
                }
                value += maskChar;
                continue;
            }

            value += equals(maskChar, ['_', '0']) ? rawValue.charAt(valuePos++) : maskChar;
        }
        
        mask.value = value;

        if (newSelection === void 0 || mask.dir === DirectionEnum.BACKWARD) {
            el.selectionStart = el.selectionEnd = el.value.length - mask.suffix.length;
        } else {
            el.selectionStart = el.selectionEnd = newSelection + mask.prefix.length;
        }
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

    function isZero(str: string, index: number): boolean {
        while(!isIndexOut(str, index)) {
            let char = str.charAt(index++);
            if (char === '0') { return true; }
            if (char === '_') { return false; }
        }
        return false;
    }

    function query(querySelector: string): NodeListOf<Element> {
        return DOC.querySelectorAll(querySelector);
    }

    function ready(handler: Function): void {
        DOC.addEventListener('DOMContentLoaded', () => { handler(); });
    }

    ready(main);
}) ();
