/**
 * RAW MASK PATTERN
 * >[prefix]pattern[suffix]
 * Group 1 - Direction
 * Group 3 - Prefix
 * Group 4 - Pattern
 * Group 6 - Suffix
 */
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
        AttrEnum["DIRECTION"] = "direction";
    })(AttrEnum || (AttrEnum = {}));
    function isEmpty(str) {
        return str.length === 0;
    }
    function isIndexOut(str, index) {
        return index < 0 || index >= str.length;
    }
    function equals(str, matchesArr) {
        return matchesArr.some(function (match) { return str === match; });
    }
    function reverse(str) {
        var newString = "";
        for (var i = str.length - 1; i >= 0; i--) {
            newString += str[i];
        }
        return newString;
    }
    function getAutoMask(el) {
        var value = el.value + '', direction = el.getAttribute(AttrEnum.DIRECTION) || DirectionEnum.FORWARD;
        value = removeZeros(value.replace(/\D/g, ''), direction);
        return {
            direction: direction,
            prefix: el.getAttribute(AttrEnum.PREFIX) || '',
            suffix: el.getAttribute(AttrEnum.SUFFIX) || '',
            pattern: el.getAttribute(AttrEnum.PATTERN),
            value: value
        };
    }
    var DOC = document, MASK_SELECTOR = "[type=\"mask\"]", EVENT = 'input';
    function main() {
        var inputs = query(MASK_SELECTOR);
        each(inputs, function (_i, el) { el.addEventListener(EVENT, function () { onInputChange(el); }); });
    }
    function onInputChange(el) {
        var mask = getAutoMask(el), length = mask.pattern.length, value = '', selection, valuePos = 0;
        if (isEmpty(mask.value)) {
            selection = 0;
        }
        if (mask.direction === DirectionEnum.BACKWARD) {
            mask.pattern = reverse(mask.pattern);
            mask.value = reverse(mask.value);
        }
        for (var i = 0; i < length; i++) {
            var maskChar = mask.pattern.charAt(i);
            if (isIndexOut(mask.value, valuePos)) {
                if (selection === void 0) {
                    selection = i;
                }
                if (maskChar !== '0' && !isZero(mask.pattern, i)) {
                    break;
                }
                value += maskChar;
                continue;
            }
            value += equals(maskChar, ['_', '0']) ? mask.value.charAt(valuePos++) : maskChar;
        }
        if (mask.direction === DirectionEnum.BACKWARD) {
            value = reverse(value);
        }
        el.value = mask.prefix + value + mask.suffix;
        if (selection === void 0 || mask.direction === DirectionEnum.BACKWARD) {
            el.selectionStart = el.selectionEnd = el.value.length - mask.suffix.length;
        }
        else {
            el.selectionStart = el.selectionEnd = selection + mask.prefix.length;
        }
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
    function removeZeros(value, direction) {
        if (!direction || direction === DirectionEnum.FORWARD) {
            return value.replace(/0*$/, '');
        }
        return value.replace(/^0*/, '');
    }
    function query(querySelector) {
        return DOC.querySelectorAll(querySelector);
    }
    function createElement(tag) {
        return document.createElement(tag);
    }
    function ready(handler) {
        if (DOC.readyState !== 'loading') {
            handler();
        }
        else {
            DOC.addEventListener('DOMContentLoaded', function () { handler(); });
        }
    }
    function each(arr, it) {
        var length = arr.length;
        for (var i = 0; i < length; i++) {
            if (it.call(arr[i], i, arr[i]) === false) {
                break;
            }
        }
    }
    ready(main);
})();
