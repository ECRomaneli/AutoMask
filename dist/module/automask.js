"use strict";
(() => {
    let AttrEnum;
    (function (AttrEnum) {
        AttrEnum["MASK"] = "mask";
        AttrEnum["PREFIX"] = "prefix";
        AttrEnum["SUFFIX"] = "suffix";
        AttrEnum["DIRECTION"] = "dir";
        AttrEnum["ACCEPT"] = "accept";
        AttrEnum["SHOW_MASK"] = "show-mask";
    })(AttrEnum || (AttrEnum = {}));
    let DirectionEnum;
    (function (DirectionEnum) {
        DirectionEnum["FORWARD"] = "forward";
        DirectionEnum["BACKWARD"] = "backward";
    })(DirectionEnum || (DirectionEnum = {}));
    let KeyTypeEnum;
    (function (KeyTypeEnum) {
        KeyTypeEnum["UNKNOWN"] = "unknown";
        KeyTypeEnum["BACKSPACE"] = "backspace";
        KeyTypeEnum["INVALID"] = "invalid";
        KeyTypeEnum["VALID"] = "valid";
    })(KeyTypeEnum || (KeyTypeEnum = {}));
    const DOC = document, MASK_SELECTOR = `[mask]`;
    function main() {
        let inputs = DOC.querySelectorAll(MASK_SELECTOR), i = inputs.length;
        while (i) {
            let el = inputs[--i];
            onInput(el);
            el.addEventListener('input', () => { onInput(el); }, true);
        }
    }
    function onInput(el) {
        let mask = AutoMask.getAutoMask(el), rawValue = mask.value, length = mask.pattern.length, value = '', valuePos = 0;
        for (var i = 0; i < length; i++) {
            let maskChar = mask.pattern.charAt(i);
            if (isIndexOut(rawValue, valuePos)) {
                if (!(mask.showMask || isZeroPad(mask.pattern, i))) {
                    break;
                }
                value += maskChar;
            }
            else {
                value += isPlaceholder(maskChar) ? rawValue.charAt(valuePos++) : maskChar;
            }
        }
        mask.value = value;
    }
    function isIndexOut(str, index) {
        return index >= str.length || index < 0;
    }
    function isPlaceholder(ch) {
        return ch === '_' || ch === '0' || ch === ''; // # Fix infinite loop
    }
    function isZeroPad(str, index) {
        while (!isIndexOut(str, index)) {
            let char = str.charAt(index++);
            if (char === '0') {
                return true;
            }
            if (char === '_') {
                return false;
            }
        }
        return false;
    }
    function reverseStr(str) {
        let rStr = "", i = str.length;
        while (i) {
            rStr += str[--i];
        }
        return rStr;
    }
    function ready(handler) {
        DOC.addEventListener('DOMContentLoaded', handler);
    }
    ready(main);
    class AutoMask {
        get value() {
            let value = this.removePrefixAndSuffix(this.element.value);
            value = this.removeZeros(value.replace(this.deny, '')).substr(0, this.rawTotalLength);
            return this.reverseIfNeeded(value);
        }
        set value(value) {
            let oldSelection = this.selection;
            //if (this.lastValue !== this.currentValue) {
            this.element.value = this.prefix + this.reverseIfNeeded(value) + this.suffix;
            this.selection = this.calcNewSelection(oldSelection);
            //}
        }
        get elValue() {
            return this.element.value;
        }
        set elValue(value) {
            this.element.value = value;
        }
        get selection() {
            return this.element.selectionStart;
        }
        set selection(value) {
            this.element.selectionStart = this.element.selectionEnd = value;
        }
        removePrefixAndSuffix(value) {
            value = this.removePrefix(value, this.prefix);
            value = reverseStr(this.removePrefix(reverseStr(value), reverseStr(this.suffix)));
            // console.log(value);
            return value;
        }
        removePrefix(value, prefix) {
            if (value.indexOf(prefix) === 0) {
                return value.substr(prefix.length);
            }
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
            }
            else {
                return value;
            }
        }
        reverseIfNeeded(str) {
            if (this.dir !== DirectionEnum.BACKWARD) {
                return str;
            }
            return reverseStr(str);
        }
        removeZeros(value) {
            if (!this.zeroPadEnabled) {
                return value;
            }
            return value.replace(this.dir === DirectionEnum.FORWARD ? /0*$/ : /^0*/, '');
        }
        calcNewSelection(oldSelection) {
            if (this.dir === DirectionEnum.BACKWARD) {
                return this.currentValue.length - this.suffix.length;
            }
            let newSelection = oldSelection - this.prefix.length;
            // Fix selections between the prefix
            if (newSelection < 1) {
                newSelection = this.keyType === KeyTypeEnum.BACKSPACE ? 0 : 1;
            }
            // If not a valid key, then return to the last valid placeholder
            let sum;
            if (this.keyType === KeyTypeEnum.INVALID) {
                newSelection--;
                sum = -1;
            }
            else {
                sum = this.keyType === KeyTypeEnum.BACKSPACE ? -1 : +1;
            }
            while (!isPlaceholder(this.pattern.charAt(newSelection - 1))) {
                newSelection += sum;
            }
            // Fix positions after last input
            return this.getMaxSelection(newSelection) + this.prefix.length;
        }
        getMaxSelection(stopValue) {
            let length = this.pattern.length, rawLength = this.value.length;
            // If stopValue or rawLength is zero, so return 0
            if (stopValue === 0 || rawLength === 0) {
                return 0;
            }
            for (let i = 1; i < length; i++) {
                if (isPlaceholder(this.pattern.charAt(i - 1))) {
                    if (rawLength === 1 || stopValue === i) {
                        return i;
                    }
                }
            }
            return length;
        }
        attr(attrName, defaultValue) {
            return this.element.getAttribute(attrName) || defaultValue;
        }
        updateValue() {
            this.lastValue = this.currentValue;
            this.currentValue = this.value;
            if (this.currentValue.length === this.lastValue.length + 1) {
                this.keyType = this.deny.test(this.element.value.charAt(this.selection - 1)) ? KeyTypeEnum.INVALID : KeyTypeEnum.VALID;
            }
            else if (this.currentValue.length === this.lastValue.length - 1) {
                this.keyType = KeyTypeEnum.BACKSPACE;
            }
            else {
                this.keyType = KeyTypeEnum.UNKNOWN;
            }
        }
        static getAutoMask(el) {
            if (el.autoMask === void 0) {
                return el.autoMask = AutoMask.byElement(el);
            }
            el.autoMask.updateValue();
            return el.autoMask;
        }
        static byElement(el) {
            let mask = new AutoMask();
            mask.element = el;
            mask.dir = mask.attr(AttrEnum.DIRECTION, DirectionEnum.FORWARD);
            mask.prefix = mask.attr(AttrEnum.PREFIX, '');
            mask.suffix = mask.attr(AttrEnum.SUFFIX, '');
            mask.pattern = mask.reverseIfNeeded(mask.attr(AttrEnum.MASK));
            mask.showMask = mask.attr(AttrEnum.SHOW_MASK, '').toLowerCase() === 'true' || false;
            mask.deny = new RegExp(`[^${mask.attr(AttrEnum.ACCEPT, '\\d')}]`, 'g');
            mask.zeroPadEnabled = mask.pattern.indexOf('0') !== -1;
            mask.keyType = KeyTypeEnum.UNKNOWN;
            let length = mask.pattern.length;
            mask.rawTotalLength = 0;
            for (let i = 0; i < length; i++) {
                isPlaceholder(mask.pattern.charAt(i)) && mask.rawTotalLength++;
            }
            el.maxLength = mask.pattern.length + mask.prefix.length + mask.suffix.length + 1;
            mask.currentValue = mask.value;
            return mask;
        }
    }
})();
