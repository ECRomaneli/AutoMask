(function () {
    var AttrEnum;
    (function (AttrEnum) {
        AttrEnum["MASK"] = "mask";
        AttrEnum["PREFIX"] = "prefix";
        AttrEnum["SUFFIX"] = "suffix";
        AttrEnum["DIRECTION"] = "dir";
        AttrEnum["ACCEPT"] = "accept";
        AttrEnum["SHOW_MASK"] = "show-mask";
    })(AttrEnum || (AttrEnum = {}));
    var DirectionEnum;
    (function (DirectionEnum) {
        DirectionEnum["FORWARD"] = "forward";
        DirectionEnum["BACKWARD"] = "backward";
    })(DirectionEnum || (DirectionEnum = {}));
    var KeyTypeEnum;
    (function (KeyTypeEnum) {
        KeyTypeEnum["UNKNOWN"] = "unknown";
        KeyTypeEnum["BACKSPACE"] = "backspace";
        KeyTypeEnum["INVALID"] = "invalid";
        KeyTypeEnum["VALID"] = "valid";
    })(KeyTypeEnum || (KeyTypeEnum = {}));
    var DOC = document, MASK_SELECTOR = "[mask]";
    function main() {
        var inputs = DOC.querySelectorAll(MASK_SELECTOR), i = inputs.length;
        var _loop_1 = function () {
            var el = inputs[--i];
            onInput(el);
            el.addEventListener('input', function () { onInput(el); }, true);
        };
        while (i) {
            _loop_1();
        }
    }
    function onInput(el) {
        var mask = AutoMask.getAutoMask(el), rawValue = mask.value, length = mask.pattern.length, value = '', valuePos = 0;
        for (var i = 0; i < length; i++) {
            var maskChar = mask.pattern.charAt(i);
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
            var char = str.charAt(index++);
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
        var rStr = "", i = str.length;
        while (i) {
            rStr += str[--i];
        }
        return rStr;
    }
    function ready(handler) {
        DOC.addEventListener('DOMContentLoaded', handler);
    }
    ready(main);
    var AutoMask = /** @class */ (function () {
        function AutoMask() {
        }
        Object.defineProperty(AutoMask.prototype, "value", {
            get: function () {
                var value = this.removePrefixAndSuffix(this.element.value);
                value = this.removeZeros(value.replace(this.deny, '')).substr(0, this.rawTotalLength);
                return this.reverseIfNeeded(value);
            },
            set: function (value) {
                var oldSelection = this.selection;
                //if (this.lastValue !== this.currentValue) {
                this.element.value = this.prefix + this.reverseIfNeeded(value) + this.suffix;
                this.selection = this.calcNewSelection(oldSelection);
                //}
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AutoMask.prototype, "elValue", {
            get: function () {
                return this.element.value;
            },
            set: function (value) {
                this.element.value = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AutoMask.prototype, "selection", {
            get: function () {
                return this.element.selectionStart;
            },
            set: function (value) {
                this.element.selectionStart = this.element.selectionEnd = value;
            },
            enumerable: true,
            configurable: true
        });
        AutoMask.prototype.removePrefixAndSuffix = function (value) {
            value = this.removePrefix(value, this.prefix);
            value = reverseStr(this.removePrefix(reverseStr(value), reverseStr(this.suffix)));
            // console.log(value);
            return value;
        };
        AutoMask.prototype.removePrefix = function (value, prefix) {
            if (value.indexOf(prefix) === 0) {
                return value.substr(prefix.length);
            }
            var length = prefix.length, shift = 0, valueChar;
            for (var i = 0; i < length; i++) {
                var prefixChar = prefix.charAt(i);
                valueChar = value.charAt(i);
                if (prefixChar !== valueChar) {
                    shift = prefixChar === value.charAt(i + 1) ? +1 : -1;
                    break;
                }
            }
            var prefixLeftIndex = i + shift;
            if (prefixLeftIndex !== -1 && prefixLeftIndex === value.indexOf(prefix.substr(i), prefixLeftIndex)) {
                return (shift === 1 ? valueChar : '') + value.substr(prefix.length + shift);
            }
            else {
                return value;
            }
        };
        AutoMask.prototype.reverseIfNeeded = function (str) {
            if (this.dir !== DirectionEnum.BACKWARD) {
                return str;
            }
            return reverseStr(str);
        };
        AutoMask.prototype.removeZeros = function (value) {
            if (!this.zeroPadEnabled) {
                return value;
            }
            return value.replace(this.dir === DirectionEnum.FORWARD ? /0*$/ : /^0*/, '');
        };
        AutoMask.prototype.calcNewSelection = function (oldSelection) {
            if (this.dir === DirectionEnum.BACKWARD) {
                return this.currentValue.length - this.suffix.length;
            }
            var newSelection = oldSelection - this.prefix.length;
            // Fix selections between the prefix
            if (newSelection < 1) {
                newSelection = this.keyType === KeyTypeEnum.BACKSPACE ? 0 : 1;
            }
            // If not a valid key, then return to the last valid placeholder
            var sum;
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
        };
        AutoMask.prototype.getMaxSelection = function (stopValue) {
            var length = this.pattern.length, rawLength = this.value.length;
            // If stopValue or rawLength is zero, so return 0
            if (stopValue === 0 || rawLength === 0) {
                return 0;
            }
            for (var i = 1; i < length; i++) {
                if (isPlaceholder(this.pattern.charAt(i - 1))) {
                    if (--rawLength === 0 || stopValue === i) {
                        return i;
                    }
                }
            }
            return length;
        };
        AutoMask.prototype.attr = function (attrName, defaultValue) {
            return this.element.getAttribute(attrName) || defaultValue;
        };
        AutoMask.prototype.updateValue = function () {
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
        };
        AutoMask.getAutoMask = function (el) {
            if (el.autoMask === void 0) {
                return el.autoMask = AutoMask.byElement(el);
            }
            el.autoMask.updateValue();
            return el.autoMask;
        };
        AutoMask.byElement = function (el) {
            var mask = new AutoMask();
            mask.element = el;
            mask.dir = mask.attr(AttrEnum.DIRECTION, DirectionEnum.FORWARD);
            mask.prefix = mask.attr(AttrEnum.PREFIX, '');
            mask.suffix = mask.attr(AttrEnum.SUFFIX, '');
            mask.pattern = mask.reverseIfNeeded(mask.attr(AttrEnum.MASK));
            mask.showMask = mask.attr(AttrEnum.SHOW_MASK, '').toLowerCase() === 'true' || false;
            mask.deny = new RegExp("[^" + mask.attr(AttrEnum.ACCEPT, '\\d') + "]", 'g');
            mask.zeroPadEnabled = mask.pattern.indexOf('0') !== -1;
            mask.keyType = KeyTypeEnum.UNKNOWN;
            var length = mask.pattern.length;
            mask.rawTotalLength = 0;
            for (var i = 0; i < length; i++) {
                isPlaceholder(mask.pattern.charAt(i)) && mask.rawTotalLength++;
            }
            el.maxLength = mask.pattern.length + mask.prefix.length + mask.suffix.length + 1;
            mask.currentValue = mask.value;
            return mask;
        };
        return AutoMask;
    }());
})();
