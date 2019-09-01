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
        var mask = getAutoMask(el), length = mask.pattern.length, value = mask.prefix, selection = void 0, valuePos = 0;
        if (isEmpty(mask.value)) {
            selection = 0;
        }
        if (mask.direction === DirectionEnum.FORWARD) {
            for (var i = 0; i < length; i++) {
                var maskChar = mask.pattern.charAt(i);
                if (isIndexOut(mask.value, valuePos)) {
                    if (selection === void 0) {
                        selection = i;
                    }
                    if (maskChar !== '0') {
                        break;
                    }
                    value += maskChar;
                    continue;
                }
                value += equals(maskChar, ['_', '0']) ? mask.value.charAt(valuePos++) : maskChar;
            }
        }
        el.value = value + mask.suffix;
        if (selection === void 0) {
            el.selectionStart = el.selectionEnd = value.length - mask.suffix.length;
        }
        else {
            el.selectionStart = el.selectionEnd = selection + mask.prefix.length;
        }
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
