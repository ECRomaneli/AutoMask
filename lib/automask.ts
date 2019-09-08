(() => {
    
    enum AttrEnum {
        MASK = 'mask', 
        PREFIX = 'prefix',
        SUFFIX = 'suffix', 
        DIRECTION = 'dir',
        ACCEPT = 'accept',
        SHOW_MASK = 'show-mask'
    }
    
    enum DirectionEnum {
        FORWARD = 'forward', BACKWARD = 'backward'
    }

    enum KeyTypeEnum {
        UNKNOWN = 'unknown', BACKSPACE = 'backspace', INVALID = 'invalid', VALID = 'valid'
    }

    interface AutoMaskElement extends HTMLInputElement { autoMask?: AutoMask }

    const DOC: Document = document, MASK_SELECTOR: string = `[mask]`;

    function main() {
        let inputs: NodeListOf<Element> = DOC.querySelectorAll(MASK_SELECTOR), i = inputs.length;
        while (i) {
            let el: AutoMaskElement = <AutoMaskElement> inputs[--i];
            onInput(el);
            el.addEventListener('input', () => { onInput(el); }, true);
        }
    }

    function onInput(el: AutoMaskElement): void {
        let mask = AutoMask.getAutoMask(el),
            rawValue = mask.value,
            length = mask.pattern.length,
            value = '',
            valuePos = 0;

        for (var i = 0; i < length; i++) {
            let maskChar = mask.pattern.charAt(i);

            if (isIndexOut(rawValue, valuePos)) {
                if (!(mask.showMask || isZeroPad(mask.pattern, i))) { break; }
                value += maskChar;
            } else {
                value += isPlaceholder(maskChar) ? rawValue.charAt(valuePos++) : maskChar;
            }
        }

        mask.value = value;
    }

    function isIndexOut(str: string, index: number): boolean {
        return index >= str.length || index < 0;
    }

    function isPlaceholder(ch: string): boolean {
        return  ch === '_' || ch === '0' || ch === ''; // # Fix infinite loop
    }

    function isZeroPad(str: string, index: number): boolean {
        while(!isIndexOut(str, index)) {
            let char = str.charAt(index++);
            if (char === '0') { return true; }
            if (char === '_') { return false; }
        }
        return false;
    }

    function isZero(_a: any, _b?: any): boolean {
        for (let i = 0; i < length; i++) {
            if (arguments[i] === 0) { return true; }
        }
        return false;
    }

    function reverseStr(str: string) {
        let rStr = "", i = str.length;
        while (i) { rStr += str[--i]; }
        return rStr;
    }

    function ready(handler: EventListenerOrEventListenerObject): void {
        DOC.addEventListener('DOMContentLoaded', handler);
    }

    ready(main);

    class AutoMask {
        public dir: DirectionEnum;
        public prefix: string;
        public suffix: string;
        public pattern: string;
        public showMask: boolean;
        public deny: RegExp;
        public keyType: KeyTypeEnum;
        
        private element: AutoMaskElement;
        private lastValue: string;
        private currentValue: string;
        private zeroPadEnabled: boolean;
        private rawTotalLength: number;

        public get value(): string {
            let value: string = this.removePrefixAndSuffix(this.element.value);
            value = this.removeZeros(value.replace(this.deny, '')).substr(0, this.rawTotalLength);
            return this.reverseIfNeeded(value);
        }

        public set value(value: string) {
            let oldSelection = this.selection;
            //if (this.lastValue !== this.currentValue) {
                this.element.value = this.prefix + this.reverseIfNeeded(value) + this.suffix;
                this.selection = this.calcNewSelection(oldSelection);
            //}
        }

        public get elValue(): string {
            return this.element.value;
        }

        public set elValue(value: string) {
            this.element.value = value;
        }

        public get selection(): number {
            return this.element.selectionStart;
        }

        public set selection(value: number) {
            this.element.selectionStart = this.element.selectionEnd = value;
        }

        private removePrefixAndSuffix(value: string): string {
            value = this.removePrefix(value, this.prefix);
            value = reverseStr(this.removePrefix(reverseStr(value), reverseStr(this.suffix)));
            // console.log(value);
            return value;
        }

        public removePrefix(value: string, prefix: string) {
            if (value.indexOf(prefix) === 0) { return value.substr(prefix.length); }
            let length = prefix.length, shift = 0, valueChar;

            for (var i = 0; i < length; i++) {
                let prefixChar = prefix.charAt(i);
                valueChar = value.charAt(i);

                if (prefixChar !== valueChar) {  
                    shift = prefixChar === value.charAt(i + 1) ? +1 : -1;
                    break;
                }
            }
            let prefixLeftIndex = i + shift;
            if (prefixLeftIndex !== -1 && prefixLeftIndex === value.indexOf(prefix.substr(i), prefixLeftIndex)) {
                return (shift === 1 ? valueChar : '') + value.substr(prefix.length + shift);
            } else {
                return value;
            }
        }

        private reverseIfNeeded(str: string): string {
            if (this.dir !== DirectionEnum.BACKWARD) { return str; }
            return reverseStr(str);
        }

        private removeZeros(value: string): string {
            if (!this.zeroPadEnabled) { return value; }
            return value.replace(this.dir === DirectionEnum.FORWARD ? /0*$/ : /^0*/, '');
        }

        private calcNewSelection(oldSelection: number): number {
            if (this.dir === DirectionEnum.BACKWARD) {
                return this.currentValue.length - this.suffix.length;
            }

            let newSelection = oldSelection - this.prefix.length;

            // Fix selections between the prefix
            if (newSelection < 1) { newSelection = this.keyType === KeyTypeEnum.BACKSPACE ? 0 : 1; } 

            // If not a valid key, then return to the last valid placeholder
            let sum;
            if (this.keyType === KeyTypeEnum.INVALID) {
                newSelection--;
                sum = -1;
            } else {
                sum = this.keyType === KeyTypeEnum.BACKSPACE ? -1 : +1;
            }

            while (!isPlaceholder(this.pattern.charAt(newSelection - 1))) { newSelection += sum; }
            
            // Fix positions after last input
            return this.getMaxSelection(newSelection) + this.prefix.length;
        }

        private getMaxSelection(stopValue: number) {
            let length = this.pattern.length,
                rawLength = this.value.length;

            // If stopValue or rawLength is zero, so return 0
            if (isZero(stopValue, rawLength)) { return 0; }

            for (let i = 1; i < length; i++) {
                if (isPlaceholder(this.pattern.charAt(i - 1))) {
                    if (isZero(--rawLength) || stopValue === i) { return i; }
                }
            }

            return length;
        }

        private attr(attrName: string, defaultValue?: any): any {
            return this.element.getAttribute(attrName)|| defaultValue;
        }

        public updateValue(): void {
            this.lastValue = this.currentValue;
            this.currentValue = this.value;

            if (this.currentValue.length === this.lastValue.length + 1) {
                this.keyType = this.deny.test(this.element.value.charAt(this.selection - 1)) ? KeyTypeEnum.INVALID : KeyTypeEnum.VALID;
            } else if (this.currentValue.length === this.lastValue.length - 1) {
                this.keyType = KeyTypeEnum.BACKSPACE;
            } else {
                this.keyType = KeyTypeEnum.UNKNOWN;
            }            
        }

        public static getAutoMask(el: AutoMaskElement): AutoMask {
            if (el.autoMask === void 0) { return el.autoMask = AutoMask.byElement(el); }
            el.autoMask.updateValue();
            return el.autoMask;
        }

        private static byElement(el: AutoMaskElement) {
            let mask: AutoMask = new AutoMask();
            mask.element = el;
            mask.dir = <DirectionEnum> mask.attr(AttrEnum.DIRECTION, DirectionEnum.FORWARD);
            mask.prefix = mask.attr(AttrEnum.PREFIX, '');
            mask.suffix = mask.attr(AttrEnum.SUFFIX, '');
            mask.pattern = mask.reverseIfNeeded(mask.attr(AttrEnum.MASK));
            mask.showMask = mask.attr(AttrEnum.SHOW_MASK, '').toLowerCase() === 'true' || false;
            mask.deny = new RegExp(`[^${mask.attr(AttrEnum.ACCEPT, '\\d')}]`, 'g');
            mask.zeroPadEnabled = mask.pattern.indexOf('0') !== -1;
            mask.keyType = KeyTypeEnum.UNKNOWN;
            
            let length = mask.pattern.length;
            mask.rawTotalLength = 0;
            for (let i = 0; i < length; i++) { isPlaceholder(mask.pattern.charAt(i)) && mask.rawTotalLength++; }

            el.maxLength = mask.pattern.length + mask.prefix.length + mask.suffix.length + 1;
            mask.currentValue = mask.value;
            return mask;
        }
    }
}) ();
