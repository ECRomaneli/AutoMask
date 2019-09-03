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

    const   DOC: Document = document,
            MASK_SELECTOR: string = `[type="mask"]`,
            EVENT: string = 'input';

    function main() {
        let inputs: NodeListOf<Element> = DOC.querySelectorAll(MASK_SELECTOR), i = inputs.length;
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
            valuePos = 0;

        for (var i = 0; i < length; i++) {
            let maskChar = mask.pattern.charAt(i);

            if (isIndexOut(rawValue, valuePos)) {
                if (!(mask.showMask || isZero(mask.pattern, i))) {
                    if (i === 0) { return; } // Fix IE11 input loop bug
                    break;
                }
                value += maskChar;
            } else {
                value += isPlaceholder(maskChar) ? rawValue.charAt(valuePos++) : maskChar;
            }
        }
        
        mask.value = value;

        if (mask.dir === DirectionEnum.BACKWARD) {
            mask.selection = el.value.length - mask.suffix.length;
        }
    }

    function isIndexOut(str: string, index: number): boolean {
        return index >= str.length || index < 0;
    }

    function isPlaceholder(maskChar: string): boolean {
        return  maskChar === '_' ? true :           // Placeholder
                maskChar === '0' ? true :           // ZeroPad
                maskChar === ''  ? true : false;    // EOF # Fix infinite loop
    }

    function isZero(str: string, index: number): boolean {
        while(!isIndexOut(str, index)) {
            let char = str.charAt(index++);
            if (char === '0') { return true; }
            if (char === '_') { return false; }
        }
        return false;
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
        public keyPressed: string;
        
        private element: AutoMaskElement;
        private lastRawValue: string;
        private currentRawValue: string;
        private zeroPadEnabled: boolean;
        private rawTotalLength: number;

        public set value(value: string) {
            let newSelection: number = this.calcNewSelection(); // Execute before change value
            this.element.value = this.prefix + this.reverseIfNeeded(value) + this.suffix;
            this.selection = newSelection;
        }

        public get selection(): number {
            return this.element.selectionStart;
        }

        public set selection(value: number) {
            this.element.selectionStart = this.element.selectionEnd = value;
        }

        public getRawValue(): string {
            let value: string = this.removePrefixAndSuffix(this.element.value);
            value = this.removeZeros(value.replace(this.deny, ''));
            value = value.substr(0, this.rawTotalLength);
            return this.reverseIfNeeded(value);
        }

        public isValidKey(): boolean {
            if (this.keyPressed === void 0 
             || this.keyPressed === 'backspace') { return true; }
            return !this.deny.test(this.keyPressed);
        }

        private removePrefixAndSuffix(value: string): string {
            return value.replace(this.prefix, '').replace(this.suffix, ''); // Fix input before prefix and after suffix
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

        private calcNewSelection(): number {
            if (this.dir === DirectionEnum.BACKWARD) {
                
            }

            let newSelection = this.selection,
                prefixAndPattern = this.prefix + this.pattern;
            
            // If not a valid key, then return to the last valid placeholder
            let sum;
            if (!this.isValidKey()) {
                newSelection--;
                sum = -1;
            } else {
                sum = this.keyPressed !== 'backspace' ? +1 : -1;
            }

            while (!isPlaceholder(prefixAndPattern.charAt(newSelection - 1))) { newSelection += sum; }
            
            // Fix positions after last input
            return this.getMaxSelection(newSelection);
        }

        private getMaxSelection(stopValue: number) {
            let prefixAndPattern = this.prefix + this.pattern,
                length = prefixAndPattern.length,
                rawLength = this.currentRawValue.length;
            if (stopValue === 0) { return 0; }
            if (rawLength === 0) { return this.prefix.length; }
            for (let i = 1; i < length; i++) {
                if (isPlaceholder(prefixAndPattern.charAt(i - 1))) {
                    if (--rawLength < 1 || i === stopValue) { return i; }
                }
            }
            return length;
        }

        public static getAutoMask(el: AutoMaskElement): AutoMask {
            if (!el.autoMask) { return el.autoMask = AutoMask.byElement(el); }
            
            let mask = el.autoMask;
            mask.lastRawValue = mask.currentRawValue;
            mask.currentRawValue = mask.getRawValue();

            if (mask.currentRawValue.length < mask.lastRawValue.length) {
                mask.keyPressed = 'backspace';
            } else {
                mask.keyPressed = el.value.charAt(mask.selection - 1);
            }

            return mask;
        }

        private static byElement(el: AutoMaskElement) {
            let mask: AutoMask = new AutoMask();
            mask.dir = <DirectionEnum> el.getAttribute(AttrEnum.DIRECTION) || DirectionEnum.FORWARD;
            mask.prefix = el.getAttribute(AttrEnum.PREFIX) || '';
            mask.suffix = el.getAttribute(AttrEnum.SUFFIX) || '';
            mask.pattern = mask.reverseIfNeeded(el.getAttribute(AttrEnum.PATTERN));
            mask.showMask = (el.getAttribute(AttrEnum.SHOW_MASK) + '').toLowerCase() === 'true' || false;
            mask.deny = new RegExp(`[^${el.getAttribute(AttrEnum.ACCEPT) || '\\d'}]`, 'g');
            
            mask.element = el;
            mask.zeroPadEnabled = mask.pattern.indexOf('0') !== -1;
            
            let length = mask.pattern.length;
            mask.rawTotalLength = 0;
            for (let i = 0; i < length; i++) {
                if (isPlaceholder(mask.pattern.charAt(i))) { mask.rawTotalLength++; }
            }

            mask.currentRawValue = mask.getRawValue();
            el.maxLength = mask.pattern.length + mask.prefix.length + mask.suffix.length + 1;
            return mask;
        }
    }
}) ();
