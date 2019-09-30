(function () {
    /**
     * HTML Mask Element Attributes.
     */
    var AttrEnum;
    (function (AttrEnum) {
        AttrEnum["MASK"] = "mask";
        AttrEnum["PREFIX"] = "prefix";
        AttrEnum["SUFFIX"] = "suffix";
        AttrEnum["DIRECTION"] = "dir";
        AttrEnum["ACCEPT"] = "accept";
        AttrEnum["PERSIST"] = "persist";
        AttrEnum["SHOW_MASK"] = "show-mask";
    })(AttrEnum || (AttrEnum = {}));
    /**
     * Text direction.
     */
    var DirectionEnum;
    (function (DirectionEnum) {
        DirectionEnum["FORWARD"] = "forward";
        DirectionEnum["BACKWARD"] = "backward";
    })(DirectionEnum || (DirectionEnum = {}));
    /**
     * Key pressed type.
     */
    var KeyTypeEnum;
    (function (KeyTypeEnum) {
        KeyTypeEnum["UNKNOWN"] = "unknown";
        KeyTypeEnum["BACKSPACE"] = "backspace";
        KeyTypeEnum["INVALID"] = "invalid";
        KeyTypeEnum["VALID"] = "valid";
    })(KeyTypeEnum || (KeyTypeEnum = {}));
    var DOC = document, MASK_SELECTOR = "[mask]", LEADING_ZEROS_PATTERN = /0+$/;
    /**
     * Main function. Get all HTMLMaskElements and initialize with the passed attributes.
     */
    function main() {
        var inputs = DOC.querySelectorAll(MASK_SELECTOR), i = inputs.length;
        var _loop_1 = function () {
            var el = inputs[--i];
            onInput(el);
            el.addEventListener('keydown', function () {
                el.distance = el.value.length - el.selectionStart;
            }, true);
            el.addEventListener('input', function () { onInput(el); }, true);
        };
        while (i) {
            _loop_1();
        }
    }
    /**
     * On input, update mask with the new element value.
     * @param el HTMLMaskElement
     */
    function onInput(el) {
        var mask = AutoMask.getAutoMask(el), rawValue = mask.currentValue, length = mask.pattern.length, value = '', valuePos = 0;
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
    /**
     * Verify if actual index position is greater than string size.
     * @param str String to get size.
     * @param index Actual index.
     */
    function isIndexOut(str, index) {
        return index >= str.length || index < 0;
    }
    /**
     * Verify if char is a placeholder.
     * [FIX] Fix infinite loop adding empty string to the list ('').
     * @param ch Char to be checked.
     */
    function isPlaceholder(ch) {
        return ch === '_' || ch === '0' || ch === '';
    }
    /**
     * Verify if char at index position is a zeropad. Just placeholders are elegible.
     * @param str String to get char.
     * @param index Index to be getted.
     */
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
    /**
     * Reverse string.
     * @param str String.
     */
    function reverseStr(str) {
        var rStr = "", i = str.length;
        while (i) {
            rStr += str[--i];
        }
        return rStr;
    }
    /**
     * Join the matched values or return empty string.
     * @param str Raw string.
     * @param pattern RegExp pattern.
     */
    function joinMatch(str, pattern) {
        var match = str.match(pattern);
        if (match === null) {
            return '';
        }
        return match.join('');
    }
    /**
     * On Ready function.
     * @param handler handler.
     */
    function ready(handler) {
        DOC.addEventListener('DOMContentLoaded', handler);
    }
    /**
     * On document ready, execute main function.
     */
    ready(main);
    var AutoMask = /** @class */ (function () {
        function AutoMask() {
        }
        Object.defineProperty(AutoMask.prototype, "value", {
            /**
             * Remove prefix, suffix, overflows, leading zeros, deny chars and apply direction (invert value).
             */
            get: function () {
                var value = this.removePrefixAndSuffix(this.element.value);
                // Remove overflow char. Fix maxlength zeropad bug
                if (value.length > this.pattern.length) {
                    var substrIndex = this.dir === DirectionEnum.FORWARD ? 0 : 1;
                    value = value.substr(substrIndex, this.pattern.length);
                }
                // Remove leading zeros, 
                return this.removeZeros(this.applyDir(value.replace(this.deny, '')));
            },
            /**
             * Set value restauring original direction and setting persist value if needed.
             * After, calc the new selection position.
             * @param value value.
             */
            set: function (value) {
                var oldSelection = this.selection;
                // Restaure value direction and insert prefix and suffix
                value = this.prefix + this.applyDir(value) + this.suffix;
                // Set persist value
                if (this.persist !== void 0) {
                    this.persist.element.value = joinMatch(value, this.persist.pattern);
                }
                this.element.value = value;
                this.selection = this.calcNewSelection(oldSelection);
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
        /**
         * Remove prefix and suffix.
         * @param value Value.
         */
        AutoMask.prototype.removePrefixAndSuffix = function (value) {
            value = this.removePrefix(value, this.prefix);
            value = reverseStr(this.removePrefix(reverseStr(value), reverseStr(this.suffix)));
            return value;
        };
        /**
         * Prefix removal logic (used to remove suffix too, just reverse all).
         * @param value Value to remove prefix.
         * @param prefix Prefix.
         */
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
            var positiveShift = shift === 1 ? 1 : 0, leftPrefixIndex = i + positiveShift;
            if (leftPrefixIndex !== -1 && leftPrefixIndex === value.indexOf(prefix.substr(i + 1 - positiveShift), leftPrefixIndex)) {
                return (shift === 1 ? valueChar : '') + value.substr(prefix.length + shift);
            }
            else {
                return value;
            }
        };
        /**
         * Apply direction. Reverse if needed.
         * @param str String.
         */
        AutoMask.prototype.applyDir = function (str) {
            if (this.dir !== DirectionEnum.BACKWARD) {
                return str;
            }
            return reverseStr(str);
        };
        /**
         * Remove leading zeros.
         * @param str String to remove zeros.
         */
        AutoMask.prototype.removeZeros = function (str) {
            if (!this.zeroPadEnabled) {
                return str;
            }
            return str.replace(LEADING_ZEROS_PATTERN, '');
        };
        /**
         * Calc new selection position.
         * @param oldSelection Old selection.
         */
        AutoMask.prototype.calcNewSelection = function (oldSelection) {
            if (this.dir === DirectionEnum.BACKWARD) {
                var lastSelection = this.elValue.length - (this.suffix.length > this.element.distance ? this.suffix.length : this.element.distance);
                return lastSelection;
            }
            var newSelection = oldSelection - this.prefix.length;
            // Fix selections between the prefix
            if (newSelection < 0) {
                newSelection = this.keyType === KeyTypeEnum.VALID ? 1 : 0;
            }
            // If not a valid key, then return to the last valid placeholder
            var sum;
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
        };
        /**
         *
         * @param stopValue
         */
        AutoMask.prototype.getMaxSelection = function (stopValue) {
            var length = this.pattern.length, valueLength = this.value.length;
            // If stopValue or valueLength is zero, return 0
            if (stopValue === 0 || valueLength === 0) {
                return 0;
            }
            for (var i = 1; i < length; i++) {
                if (isPlaceholder(this.pattern.charAt(i - 1))) {
                    if (--valueLength === 0 || stopValue === i) {
                        return i;
                    }
                }
            }
            return length;
        };
        /**
         * Get element attribute or default value.
         * @param attrName Attribute name.
         * @param defaultValue Default value.
         */
        AutoMask.prototype.attr = function (attrName, defaultValue) {
            return this.element.getAttribute(attrName) || defaultValue;
        };
        /**
         * Update last value and current value setting keyboard type too.
         * [TODO] Keyboard type may have some issues. Fix it.
         */
        AutoMask.prototype.updateValue = function () {
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
        };
        /**
         * Get element AutoMask object, and create if not exists.
         * @param el HTMLMaskElement
         */
        AutoMask.getAutoMask = function (el) {
            if (el.autoMask === void 0) {
                return el.autoMask = AutoMask.byElement(el);
            }
            el.autoMask.updateValue();
            return el.autoMask;
        };
        /**
         * Create AutoMask object into element and configure the mask with the element attributes.
         * @param el HTMLMaskElement.
         */
        AutoMask.byElement = function (el) {
            var mask = new AutoMask();
            mask.element = el;
            mask.dir = mask.attr(AttrEnum.DIRECTION, DirectionEnum.FORWARD);
            mask.prefix = mask.attr(AttrEnum.PREFIX, '');
            mask.suffix = mask.attr(AttrEnum.SUFFIX, '');
            mask.pattern = mask.applyDir(mask.attr(AttrEnum.MASK));
            mask.showMask = mask.attr(AttrEnum.SHOW_MASK, '').toLowerCase() === 'true' || false;
            mask.deny = new RegExp("[^" + mask.attr(AttrEnum.ACCEPT, '\\d') + "]+", 'g');
            mask.zeroPadEnabled = mask.pattern.indexOf('0') !== -1;
            mask.keyType = KeyTypeEnum.UNKNOWN;
            var persistPattern = mask.attr(AttrEnum.PERSIST), name = el.getAttribute('name');
            if (persistPattern && name) {
                var element = DOC.createElement('input');
                el.setAttribute('name', "mask-" + name);
                element.setAttribute('type', 'hidden');
                element.setAttribute('name', name);
                el.parentNode.appendChild(element);
                mask.persist = {
                    element: element,
                    pattern: new RegExp("[" + persistPattern + "]+", 'g')
                };
            }
            var length = mask.pattern.length;
            mask.maxRawLength = 0;
            for (var i = 0; i < length; i++) {
                isPlaceholder(mask.pattern.charAt(i)) && mask.maxRawLength++;
            }
            el.maxLength = mask.pattern.length + mask.prefix.length + mask.suffix.length + 1;
            mask.currentValue = mask.value;
            return mask;
        };
        return AutoMask;
    }());
})();
