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
    var AutoMask = /** @class */ (function () {
        function AutoMask() {
        }
        Object.defineProperty(AutoMask.prototype, "value", {
            set: function (value) {
                this.element.value = this.prefix + this.reverseIfNeeded(value) + this.suffix;
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
            value = this.removeZeros(value.replace(this.accept, ''));
            return this.reverseIfNeeded(value);
        };
        AutoMask.prototype.removePrefixAndSuffix = function (value) {
            return value.replace(this.prefix, '').replace(this.suffix, '');
            // return value.substring(this.prefix.length, value.length - this.suffix.length);
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
        AutoMask.getAutoMask = function (el) {
            if (el.autoMask) {
                return el.autoMask;
            }
            var mask = new AutoMask();
            mask.dir = el.getAttribute(AttrEnum.DIRECTION) || DirectionEnum.FORWARD;
            mask.prefix = el.getAttribute(AttrEnum.PREFIX) || '';
            mask.suffix = el.getAttribute(AttrEnum.SUFFIX) || '';
            mask.pattern = mask.reverseIfNeeded(el.getAttribute(AttrEnum.PATTERN));
            mask.showMask = (el.getAttribute(AttrEnum.SHOW_MASK) + '').toLowerCase() === 'true' || false;
            mask.accept = new RegExp("[^" + (el.getAttribute(AttrEnum.ACCEPT) || '\\d') + "]", 'g');
            mask.element = el;
            mask.zeroPadEnabled = mask.pattern.indexOf('0') !== -1;
            el.maxLength = mask.pattern.length + mask.prefix.length + mask.suffix.length + 1;
            return el.autoMask = mask;
        };
        return AutoMask;
    }());
    var DOC = document, MASK_SELECTOR = "[type=\"mask\"]", EVENT = 'input';
    function main() {
        var inputs = query(MASK_SELECTOR), i = inputs.length;
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
        var mask = AutoMask.getAutoMask(el), length = mask.pattern.length, rawValue = mask.getRawValue(), value = '', newSelection, valuePos = 0;
        for (var i = 0; i < length; i++) {
            var maskChar = mask.pattern.charAt(i);
            if (isIndexOut(rawValue, valuePos)) {
                if (newSelection === void 0) {
                    newSelection = i;
                }
                if (!mask.showMask && !isZero(mask.pattern, i)) {
                    if (i === 0) {
                        return;
                    } // Fix IE11 input loop bug
                    break;
                }
                value += maskChar;
            }
            else {
                if (equals(maskChar, ['_', '0'])) {
                    value += rawValue.charAt(valuePos++);
                }
                else {
                    value += maskChar;
                }
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
    function isEmpty(str) {
        return str.length === 0;
    }
    function isIndexOut(str, index) {
        return index < 0 || index >= str.length;
    }
    function equals(str, matchesArr) {
        return matchesArr.some(function (match) { return str === match; });
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
    function query(querySelector) {
        return DOC.querySelectorAll(querySelector);
    }
    function ready(handler) {
        DOC.addEventListener('DOMContentLoaded', function () { handler(); });
    }
    ready(main);
})();
