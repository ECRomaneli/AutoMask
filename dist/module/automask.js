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
    class AutoMask {
        constructor() { }
        set value(value) {
            this.element.value = this.prefix + this.reverseIfNeeded(value) + this.suffix;
        }
        get value() {
            return this.removePrefixAndSuffix(this.element.value);
        }
        get selection() {
            return this.element.selectionStart;
        }
        set selection(value) {
            this.element.selectionStart = this.element.selectionEnd = value;
        }
        getRawValue() {
            let value = this.removePrefixAndSuffix(this.element.value);
            value = this.removeZeros(value.replace(this.accept, ''));
            return this.reverseIfNeeded(value);
        }
        removePrefixAndSuffix(value) {
            return value.replace(this.prefix, '').replace(this.suffix, '');
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
            if (el.autoMask) {
                return el.autoMask;
            }
            let mask = new AutoMask();
            mask.dir = el.getAttribute(AttrEnum.DIRECTION) || DirectionEnum.FORWARD;
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
    const DOC = document, MASK_SELECTOR = `[type="mask"]`, EVENT = 'input';
    function main() {
        let inputs = query(MASK_SELECTOR), i = inputs.length;
        while (i) {
            let el = inputs[--i];
            onInputChange(el, null);
            el.addEventListener(EVENT, (e) => { onInputChange(el, e.data); }, true);
        }
    }
    function onInputChange(el, keyPressed) {
        let mask = AutoMask.getAutoMask(el), length = mask.pattern.length, rawValue = mask.getRawValue(), value = '', newSelection = mask.selection, valuePos = 0, first = false;
        while (!isPlaceholder(mask.pattern.charAt(newSelection - 1))) {
            newSelection += keyPressed === null ? -1 : +1;
        }
        for (var i = 0; i < length; i++) {
            let maskChar = mask.pattern.charAt(i);
            if (isIndexOut(rawValue, valuePos)) {
                if (first) {
                    first = true;
                    if (newSelection > i) {
                        newSelection = i;
                    }
                }
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
        if (newSelection === void 0 || mask.dir === DirectionEnum.BACKWARD) {
            mask.selection = el.value.length - mask.suffix.length;
        }
        else {
            mask.selection = newSelection + mask.prefix.length;
        }
    }
    function isIndexOut(str, index) {
        return index < 0 || index >= str.length;
    }
    function equals(str, matchesArr) {
        return matchesArr.some(match => str === match);
    }
    function isPlaceholder(maskChar) {
        return equals(maskChar, ['_', '0', '']); // Placeholder, Zero Pad, EOF
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
    function query(querySelector) {
        return DOC.querySelectorAll(querySelector);
    }
    function ready(handler) {
        DOC.addEventListener('DOMContentLoaded', () => { handler(); });
    }
    ready(main);
})();
