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
            onInputChange(el);
            el.addEventListener(EVENT, () => { onInputChange(el); }, true);
        }
    }
    function onInputChange(el) {
        let mask = AutoMask.getAutoMask(el), length = mask.pattern.length, rawValue = mask.getRawValue(), value = '', selection, _selectionStart = el.selectionStart, _selectionEnd = el.selectionEnd, valuePos = 0;
        if (isEmpty(rawValue)) {
            selection = 0;
        }
        for (var i = 0; i < length; i++) {
            let maskChar = mask.pattern.charAt(i);
            if (isIndexOut(rawValue, valuePos)) {
                if (selection === void 0) {
                    selection = i;
                    console.log(_selectionStart, _selectionEnd, i);
                }
                if (!mask.showMask && !isZero(mask.pattern, i)) {
                    // Fix IE11 input loop bug
                    if (i === 0) {
                        return;
                    }
                    break;
                }
                value += maskChar;
                continue;
            }
            value += equals(maskChar, ['_', '0']) ? rawValue.charAt(valuePos++) : maskChar;
        }
        mask.value = value;
        if (selection === void 0 || mask.dir === DirectionEnum.BACKWARD) {
            el.selectionStart = el.selectionEnd = el.value.length - mask.suffix.length;
        }
        else {
            el.selectionStart = el.selectionEnd = selection + mask.prefix.length;
        }
    }
    function isEmpty(str) {
        return str.length === 0;
    }
    function isIndexOut(str, index) {
        return index < 0 || index >= str.length;
    }
    function equals(str, matchesArr) {
        return matchesArr.some(match => str === match);
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
