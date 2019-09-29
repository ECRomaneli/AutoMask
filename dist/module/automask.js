"use strict";
(() => {
    let AttrEnum;
    (function (AttrEnum) {
        AttrEnum["MASK"] = "mask";
        AttrEnum["PREFIX"] = "prefix";
        AttrEnum["SUFFIX"] = "suffix";
        AttrEnum["DIRECTION"] = "dir";
        AttrEnum["ACCEPT"] = "accept";
        AttrEnum["PERSIST"] = "persist";
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
            el.addEventListener('keydown', () => {
                el.distance = el.value.length - el.selectionStart;
            }, true);
            el.addEventListener('input', () => { onInput(el); }, true);
        }
    }
    function onInput(el) {
        let mask = AutoMask.getAutoMask(el), rawValue = mask.currentValue, length = mask.pattern.length, value = '', valuePos = 0;
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
    function joinMatch(str, pattern) {
        let match = str.match(pattern);
        if (match === null) {
            return '';
        }
        return match.join('');
    }
    function ready(handler) {
        DOC.addEventListener('DOMContentLoaded', handler);
    }
    ready(main);
    class AutoMask {
        get value() {
            let value = this.removePrefixAndSuffix(this.element.value);
            if (value.length > this.pattern.length) {
                let substrIndex = this.dir === DirectionEnum.FORWARD ? 0 : 1;
                value = value.substr(substrIndex, this.pattern.length);
            }
            value = this.removeZeros(value.replace(this.deny, ''));
            return this.applyDir(value);
        }
        set value(value) {
            let oldSelection = this.selection;
            value = this.prefix + this.applyDir(value) + this.suffix;
            if (this.persist !== void 0) {
                this.persist.element.value = joinMatch(value, this.persist.pattern);
            }
            this.element.value = value;
            this.selection = this.calcNewSelection(oldSelection);
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
            let moveIndex = shift === 1 ? 1 : 0, prefixLeftIndex = i + moveIndex;
            if (prefixLeftIndex !== -1 && prefixLeftIndex === value.indexOf(prefix.substr(i + 1 - moveIndex), prefixLeftIndex)) {
                return (shift === 1 ? valueChar : '') + value.substr(prefix.length + shift);
            }
            else {
                return value;
            }
        }
        applyDir(str) {
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
                let lastSelection = this.elValue.length - (this.suffix.length > this.element.distance ? this.suffix.length : this.element.distance);
                return lastSelection;
            }
            let newSelection = oldSelection - this.prefix.length;
            // Fix selections between the prefix
            if (newSelection < 0) {
                newSelection = this.keyType === KeyTypeEnum.VALID ? 1 : 0;
            }
            // If not a valid key, then return to the last valid placeholder
            let sum;
            if (this.keyType === KeyTypeEnum.INVALID) {
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
                    if (--rawLength === 0 || stopValue === i) {
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
                this.keyType = this.deny.test(this.elValue.charAt(this.selection - 1)) ? KeyTypeEnum.INVALID : KeyTypeEnum.VALID;
            }
            else if (this.currentValue.length === this.lastValue.length - 1) {
                this.keyType = KeyTypeEnum.BACKSPACE;
            }
            else {
                this.keyType = KeyTypeEnum.UNKNOWN;
            }
            console.log(this.keyType);
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
            mask.pattern = mask.applyDir(mask.attr(AttrEnum.MASK));
            mask.showMask = mask.attr(AttrEnum.SHOW_MASK, '').toLowerCase() === 'true' || false;
            mask.deny = new RegExp(`[^${mask.attr(AttrEnum.ACCEPT, '\\d')}]+`, 'g');
            mask.zeroPadEnabled = mask.pattern.indexOf('0') !== -1;
            mask.keyType = KeyTypeEnum.UNKNOWN;
            let persistPattern = mask.attr(AttrEnum.PERSIST), name = el.getAttribute('name');
            if (persistPattern && name) {
                let element = DOC.createElement('input');
                el.setAttribute('name', `mask-${name}`);
                element.setAttribute('type', 'hidden');
                element.setAttribute('name', name);
                el.parentNode.appendChild(element);
                mask.persist = {
                    element: element,
                    pattern: new RegExp(`[${persistPattern}]+`, 'g')
                };
            }
            let length = mask.pattern.length;
            mask.maxRawLength = 0;
            for (let i = 0; i < length; i++) {
                isPlaceholder(mask.pattern.charAt(i)) && mask.maxRawLength++;
            }
            el.maxLength = mask.pattern.length + mask.prefix.length + mask.suffix.length + 1;
            mask.currentValue = mask.value;
            return mask;
        }
    }
})();
