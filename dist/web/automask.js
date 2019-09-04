(function () {
    var DirectionEnum;
    (function (DirectionEnum) {
        DirectionEnum["FORWARD"] = "forward";
        DirectionEnum["BACKWARD"] = "backward";
    })(DirectionEnum || (DirectionEnum = {}));
    var AttrEnum;
    (function (AttrEnum) {
        AttrEnum["PATTERN"] = "pattern";
        AttrEnum["PREFIX"] = "prefix";
        AttrEnum["SUFFIX"] = "suffix";
        AttrEnum["DIRECTION"] = "dir";
        AttrEnum["ACCEPT"] = "accept";
        AttrEnum["SHOW_MASK"] = "show-mask";
    })(AttrEnum || (AttrEnum = {}));
    var DOC = document, MASK_SELECTOR = "[type=\"mask\"]", EVENT = 'input';
    function main() {
        var inputs = DOC.querySelectorAll(MASK_SELECTOR), i = inputs.length;
        var _loop_1 = function () {
            var el = inputs[--i];
            onInputChange(el);
            el.addEventListener(EVENT, function () { onInputChange(el); }, true);
        };
        while (i) {
            _loop_1();
        }
    }
    function onInputChange(el) {
        var mask = AutoMask.getAutoMask(el), rawValue = mask.getRawValue(), length = mask.pattern.length, value = '', valuePos = 0;
        for (var i = 0; i < length; i++) {
            var maskChar = mask.pattern.charAt(i);
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
    function some(str, it) {
        var length = str.length;
        for (var i = 0; i < length; i++) {
            if (it(str.charAt(i), i) === true) {
                return true;
            }
        }
        return false;
    }
    function isPlaceholder(maskChar) {
        return maskChar === '_' ? true : // Placeholder
            maskChar === '0' ? true : // ZeroPad
                maskChar === '' ? true : false; // EOF # Fix infinite loop
    }
    function isZero(str, index) {
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
    function ready(handler) {
        DOC.addEventListener('DOMContentLoaded', handler);
    }
    ready(main);
    var AutoMask = /** @class */ (function () {
        function AutoMask() {
        }
        Object.defineProperty(AutoMask.prototype, "value", {
            set: function (value) {
                var oldSelection = this.selection;
                this.element.value = this.prefix + this.reverseIfNeeded(value) + this.suffix;
                this.selection = this.calcNewSelection(oldSelection);
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
        AutoMask.prototype.getRawValue = function () {
            var value = this.removePrefixAndSuffix(this.element.value);
            value = this.removeZeros(value.replace(this.deny, ''));
            value = value.substr(0, this.rawTotalLength);
            return this.reverseIfNeeded(value);
        };
        AutoMask.prototype.isValidKey = function () {
            if (this.keyPressed === void 0
                || this.keyPressed === 'backspace') {
                return true;
            }
            return !this.deny.test(this.keyPressed);
        };
        AutoMask.prototype.removePrefixAndSuffix = function (value) {
            value = this.removeStrOccurences(value, this.prefix, 0);
            value = this.removeStrOccurences(value, this.suffix, value.length - this.suffix.length);
            console.log(value);
            return value;
        };
        AutoMask.prototype.removeStrOccurences = function (str, rmStr, startIndex) {
            if (str.indexOf(rmStr) === startIndex) {
                if (startIndex === 0) {
                    return str.substr(rmStr.length);
                }
                return str.substring(0, startIndex);
            }
            var length = rmStr.length, lastStrIndex = startIndex, joinArr = [];
            if (startIndex > 0) {
                joinArr.push(str.substring(0, startIndex));
            }
            for (var i = 0; i < length; i++) {
                var rmChar = rmStr.charAt(i), strIndex = startIndex + i;
                if (str.charAt(strIndex) === rmChar) {
                    lastStrIndex = strIndex + 1;
                }
                else if (str.charAt(strIndex + 1) === rmChar) {
                    joinArr.push(str.substring(lastStrIndex, strIndex + 1));
                    lastStrIndex = strIndex + 2;
                }
                else {
                    startIndex--;
                }
            }
            joinArr.push(str.substr(lastStrIndex));
            return joinArr.join('');
        };
        AutoMask.prototype.reverseIfNeeded = function (str) {
            if (this.dir !== DirectionEnum.BACKWARD) {
                return str;
            }
            var rStr = "", i = str.length;
            while (i) {
                rStr += str[--i];
            }
            return rStr;
        };
        AutoMask.prototype.removeZeros = function (value) {
            if (!this.zeroPadEnabled) {
                return value;
            }
            return value.replace(this.dir === DirectionEnum.FORWARD ? /0*$/ : /^0*/, '');
        };
        AutoMask.prototype.calcNewSelection = function (oldSelection) {
            if (this.dir === DirectionEnum.BACKWARD) {
                return this.element.value.length - this.suffix.length;
            }
            var newSelection = oldSelection - this.prefix.length;
            // Fix selections between the prefix
            if (newSelection < 1) {
                newSelection = this.keyPressed && this.keyPressed !== 'backspace' ? 1 : 0;
            }
            // If not a valid key, then return to the last valid placeholder
            var sum;
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
        };
        AutoMask.prototype.getMaxSelection = function (stopValue) {
            var length = this.pattern.length, rawLength = this.currentRawValue.length;
            if (!stopValue || !rawLength) {
                return 0;
            }
            for (var i = 1; i < length; i++) {
                if (isPlaceholder(this.pattern.charAt(i - 1))) {
                    if (--rawLength < 1 || i === stopValue) {
                        return i;
                    }
                }
            }
            return length;
        };
        AutoMask.getAutoMask = function (el) {
            if (!el.autoMask) {
                return el.autoMask = AutoMask.byElement(el);
            }
            var mask = el.autoMask;
            mask.lastRawValue = mask.currentRawValue;
            mask.currentRawValue = mask.getRawValue();
            if (mask.currentRawValue.length < mask.lastRawValue.length) {
                mask.keyPressed = 'backspace';
            }
            else {
                mask.keyPressed = el.value.charAt(mask.selection - 1);
            }
            return mask;
        };
        AutoMask.byElement = function (el) {
            var mask = new AutoMask();
            mask.dir = el.getAttribute(AttrEnum.DIRECTION) || DirectionEnum.FORWARD;
            mask.prefix = el.getAttribute(AttrEnum.PREFIX) || '';
            mask.suffix = el.getAttribute(AttrEnum.SUFFIX) || '';
            mask.pattern = mask.reverseIfNeeded(el.getAttribute(AttrEnum.PATTERN));
            mask.showMask = (el.getAttribute(AttrEnum.SHOW_MASK) + '').toLowerCase() === 'true' || false;
            mask.deny = new RegExp("[^" + (el.getAttribute(AttrEnum.ACCEPT) || '\\d') + "]", 'g');
            window['remover'] = mask.removeStrOccurences;
            mask.element = el;
            mask.zeroPadEnabled = mask.pattern.indexOf('0') !== -1;
            var length = mask.pattern.length;
            mask.rawTotalLength = 0;
            for (var i = 0; i < length; i++) {
                if (isPlaceholder(mask.pattern.charAt(i))) {
                    mask.rawTotalLength++;
                }
            }
            mask.currentRawValue = mask.getRawValue();
            el.maxLength = mask.pattern.length + mask.prefix.length + mask.suffix.length + 1;
            return mask;
        };
        return AutoMask;
    }());
})();
