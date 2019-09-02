"use strict";
(() => {
    let DirectionEnum;
    (function (DirectionEnum) {
        DirectionEnum["FORWARD"] = "forward";
        DirectionEnum["BACKWARD"] = "backward";
    })(DirectionEnum || (DirectionEnum = {}));
    let AttrEnum;
    (function (AttrEnum) {
        AttrEnum["PATTERN"] = "pattern";
        AttrEnum["PREFIX"] = "prefix";
        AttrEnum["SUFFIX"] = "suffix";
        AttrEnum["DIRECTION"] = "dir";
        AttrEnum["ACCEPT"] = "accept";
        AttrEnum["SHOW_MASK"] = "show-mask";
    })(AttrEnum || (AttrEnum = {}));
    const DOC = document, MASK_SELECTOR = `[type="mask"]`, EVENT = 'input';
    function main() {
        let inputs = DOC.querySelectorAll(MASK_SELECTOR), i = inputs.length;
        while (i) {
            let el = inputs[--i];
            onInputChange(el);
            el.addEventListener(EVENT, () => { onInputChange(el); }, true);
        }
    }
    function onInputChange(el) {
        let mask = AutoMask.getAutoMask(el), length = mask.pattern.length, rawValue = mask.getRawValue(), newSelection = mask.selection, value = '', valuePos = 0;
        if (!mask.isValidKey()) {
            newSelection--;
        }
        else {
            while (!isPlaceholder(mask.pattern.charAt(newSelection - 1))) {
                newSelection += mask.keyPressed !== 'backspace' ? +1 : -1;
            }
        }
        for (var i = 0; i < length; i++) {
            let maskChar = mask.pattern.charAt(i);
            if (isIndexOut(rawValue, valuePos)) {
                if (newSelection > i) {
                    newSelection = i;
                } // Fix position after last input
                if (!(mask.showMask || isZero(mask.pattern, i))) {
                    if (i === 0) {
                        return;
                    } // Fix IE11 input loop bug
                    break;
                }
                value += maskChar;
            }
            else {
                value += isPlaceholder(maskChar) ? rawValue.charAt(valuePos++) : maskChar;
            }
        }
        mask.value = value;
        if (mask.dir === DirectionEnum.BACKWARD) {
            console.log(newSelection, el.value.length - mask.suffix.length);
            mask.selection = el.value.length - mask.suffix.length;
        }
        else {
            mask.selection = newSelection + mask.prefix.length;
        }
    }
    function isIndexOut(str, index) {
        return index < 0 || index >= str.length;
    }
    function isPlaceholder(maskChar) {
        return maskChar === '_' ? true : // Placeholder
            maskChar === '0' ? true : // ZeroPad
                maskChar === '' ? true : false; // EOF # Fix infinite loop
    }
    function isZero(str, index) {
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
    function ready(handler) {
        DOC.addEventListener('DOMContentLoaded', handler);
    }
    ready(main);
    class AutoMask {
        constructor() { }
        set value(value) {
            this.element.value = this.prefix + this.reverseIfNeeded(value) + this.suffix;
        }
        get selection() {
            return this.element.selectionStart;
        }
        set selection(value) {
            this.element.selectionStart = this.element.selectionEnd = value;
        }
        getRawValue() {
            let value = this.removePrefixAndSuffix(this.element.value);
            value = this.removeZeros(value.replace(this.deny, ''));
            return this.reverseIfNeeded(value);
        }
        isValidKey() {
            if (this.keyPressed === void 0
                || this.keyPressed === 'backspace') {
                return true;
            }
            return !this.deny.test(this.keyPressed);
        }
        removePrefixAndSuffix(value) {
            return value.replace(this.prefix, '').replace(this.suffix, ''); // Fix input before prefix and after suffix
            // return value.substring(this.prefix.length, value.length - this.suffix.length);
        }
        reverseIfNeeded(str) {
            if (this.dir !== DirectionEnum.BACKWARD) {
                return str;
            }
            let rStr = "", i = str.length;
            while (i) {
                rStr += str[--i];
            }
            return rStr;
        }
        removeZeros(value) {
            if (!this.zeroPadEnabled) {
                return value;
            }
            return value.replace(this.dir === DirectionEnum.FORWARD ? /0*$/ : /^0*/, '');
        }
        static getAutoMask(el) {
            if (!el.autoMask) {
                return el.autoMask = AutoMask.byElement(el);
            }
            let mask = el.autoMask;
            mask.lastRawValue = mask.currentRawValue;
            mask.currentRawValue = mask.getRawValue();
            if (mask.lastRawValue.length > mask.currentRawValue.length) {
                mask.keyPressed = 'backspace';
            }
            else {
                mask.keyPressed = el.value.charAt(mask.selection - 1);
            }
            return mask;
        }
        static byElement(el) {
            let mask = new AutoMask();
            mask.dir = el.getAttribute(AttrEnum.DIRECTION) || DirectionEnum.FORWARD;
            mask.prefix = el.getAttribute(AttrEnum.PREFIX) || '';
            mask.suffix = el.getAttribute(AttrEnum.SUFFIX) || '';
            mask.pattern = mask.reverseIfNeeded(el.getAttribute(AttrEnum.PATTERN));
            mask.showMask = (el.getAttribute(AttrEnum.SHOW_MASK) + '').toLowerCase() === 'true' || false;
            mask.deny = new RegExp(`[^${el.getAttribute(AttrEnum.ACCEPT) || '\\d'}]`, 'g');
            mask.element = el;
            mask.zeroPadEnabled = mask.pattern.indexOf('0') !== -1;
            mask.currentRawValue = mask.getRawValue();
            el.maxLength = mask.pattern.length + mask.prefix.length + mask.suffix.length + 1;
            return mask;
        }
    }
})();
