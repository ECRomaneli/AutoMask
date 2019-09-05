"use strict";
(() => {
    let DirectionEnum;
    (function (DirectionEnum) {
        DirectionEnum["FORWARD"] = "forward";
        DirectionEnum["BACKWARD"] = "backward";
    })(DirectionEnum || (DirectionEnum = {}));
    let AttrEnum;
    (function (AttrEnum) {
        AttrEnum["MASK"] = "mask";
        AttrEnum["PREFIX"] = "prefix";
        AttrEnum["SUFFIX"] = "suffix";
        AttrEnum["DIRECTION"] = "dir";
        AttrEnum["ACCEPT"] = "accept";
        AttrEnum["SHOW_MASK"] = "show-mask";
    })(AttrEnum || (AttrEnum = {}));
    const DOC = document, MASK_SELECTOR = `[mask]`;
    function main() {
        let inputs = DOC.querySelectorAll(MASK_SELECTOR), i = inputs.length;
        while (i) {
            let el = inputs[--i];
            onInputChange(el);
            el.addEventListener('input', () => { onInputChange(el); }, true);
        }
    }
    function onInputChange(el) {
        let mask = AutoMask.getAutoMask(el), rawValue = mask.getRawValue(), length = mask.pattern.length, value = '', valuePos = 0;
        for (var i = 0; i < length; i++) {
            let maskChar = mask.pattern.charAt(i);
            if (isIndexOut(rawValue, valuePos)) {
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
    }
    function isIndexOut(str, index) {
        return index >= str.length || index < 0;
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
        set value(value) {
            let oldSelection = this.selection;
            this.element.value = this.prefix + this.reverseIfNeeded(value) + this.suffix;
            this.selection = this.calcNewSelection(oldSelection);
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
            value = value.substr(0, this.rawTotalLength);
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
            value = this.removeStrOccurences(value, this.prefix, 0);
            value = this.removeStrOccurences(value, this.suffix, value.length - this.suffix.length - 1);
            console.log(value);
            return value;
        }
        removeStrOccurences(str, rmStr, startIndex) {
            if (str.indexOf(rmStr) === startIndex) {
                if (startIndex === 0) {
                    return str.substr(rmStr.length);
                }
                return str.substring(0, startIndex);
            }
            let length = rmStr.length, lastStrIndex = startIndex, joinArr = [];
            if (startIndex > 0) {
                joinArr.push(str.substring(0, startIndex));
            }
            let teste = startIndex ? 0 : 1;
            for (let i = 0; i < length; i++) {
                let rmChar = rmStr.charAt(i), strIndex = startIndex + i;
                if (str.charAt(strIndex + (1 - teste)) === rmChar) {
                    lastStrIndex = strIndex + 1;
                }
                else if (str.charAt(strIndex + teste) === rmChar) {
                    joinArr.push(str.substring(lastStrIndex, strIndex + 1));
                    lastStrIndex = strIndex + 2;
                    startIndex++;
                }
                else {
                    startIndex--;
                }
            }
            joinArr.push(str.substr(lastStrIndex));
            return joinArr.join('');
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
        calcNewSelection(oldSelection) {
            if (this.dir === DirectionEnum.BACKWARD) {
                return this.element.value.length - this.suffix.length;
            }
            let newSelection = oldSelection - this.prefix.length;
            // Fix selections between the prefix
            if (newSelection < 1) {
                newSelection = this.keyPressed && this.keyPressed !== 'backspace' ? 1 : 0;
            }
            // If not a valid key, then return to the last valid placeholder
            let sum;
            if (!this.isValidKey()) {
                newSelection--;
                sum = -1;
            }
            else {
                sum = this.keyPressed !== 'backspace' ? +1 : -1;
            }
            while (!isPlaceholder(this.pattern.charAt(newSelection - 1))) {
                newSelection += sum;
            }
            // Fix positions after last input
            return this.getMaxSelection(newSelection) + this.prefix.length;
        }
        getMaxSelection(stopValue) {
            let length = this.pattern.length, rawLength = this.currentRawValue.length;
            if (!stopValue || !rawLength) {
                return 0;
            }
            for (let i = 1; i < length; i++) {
                if (isPlaceholder(this.pattern.charAt(i - 1))) {
                    if (--rawLength < 1 || i === stopValue) {
                        return i;
                    }
                }
            }
            return length;
        }
        static getAutoMask(el) {
            if (!el.autoMask) {
                return el.autoMask = AutoMask.byElement(el);
            }
            let mask = el.autoMask;
            mask.lastRawValue = mask.currentRawValue;
            mask.currentRawValue = mask.getRawValue();
            if (mask.currentRawValue.length < mask.lastRawValue.length) {
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
            mask.pattern = mask.reverseIfNeeded(el.getAttribute(AttrEnum.MASK));
            mask.showMask = (el.getAttribute(AttrEnum.SHOW_MASK) + '').toLowerCase() === 'true' || false;
            mask.deny = new RegExp(`[^${el.getAttribute(AttrEnum.ACCEPT) || '\\d'}]`, 'g');
            mask.element = el;
            mask.zeroPadEnabled = mask.pattern.indexOf('0') !== -1;
            let length = mask.pattern.length;
            mask.rawTotalLength = 0;
            for (let i = 0; i < length; i++) {
                if (isPlaceholder(mask.pattern.charAt(i))) {
                    mask.rawTotalLength++;
                }
            }
            mask.currentRawValue = mask.getRawValue();
            el.maxLength = mask.pattern.length + mask.prefix.length + mask.suffix.length + 1;
            return mask;
        }
    }
})();
