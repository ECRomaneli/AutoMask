/**
 * RAW MASK PATTERN
 * >[prefix]pattern[suffix]
 * Group 1 - Direction
 * Group 3 - Prefix
 * Group 4 - Pattern
 * Group 6 - Suffix
 */
var DirectionEnum;
(function (DirectionEnum) {
    DirectionEnum["FORWARD"] = "forward";
    DirectionEnum["BACKWARD"] = "backward";
})(DirectionEnum || (DirectionEnum = {}));
(function () {
    var ATTR = {
        MASK: 'mask',
        PREFIX: 'prefix',
        SUFFIX: 'suffix',
        DIRECTION: 'direction'
    }, DOC = document, MASK_PATTERN = /^(<|>)?(\[([^\]]*)])?([^[]*)(\[([^\]]*)])?$/, MASK_SELECTOR = "[" + ATTR.MASK + "]", RAW_NAME_ATTR = 'raw-name';
    function main() {
        var inputs = query(MASK_SELECTOR);
        each(inputs, function (_i, el) {
            el.addEventListener('input', function () {
                var value = el.value + '', mask = el.getAttribute(ATTR.MASK), direction = el.getAttribute(ATTR.DIRECTION), length = mask.length, prefix = el.getAttribute(ATTR.PREFIX) || '', suffix = el.getAttribute(ATTR.SUFFIX) || '', newValue = prefix, selection = void 0;
                value = value.replace(/[\D]/g, '');
                value = removeZeros(value, direction);
                if (value.length === 0) {
                    selection = 0;
                }
                if (!direction || direction === DirectionEnum.FORWARD) {
                    var valuePos = 0;
                    for (var i = 0; i < length; i++) {
                        var char = mask.charAt(i), death = valuePos >= value.length;
                        if (death && selection == void 0) {
                            selection = i;
                        }
                        if (char === '_') {
                            if (death) {
                                break;
                            }
                            newValue += value.charAt(valuePos++);
                            continue;
                        }
                        if (char.match(/[0-9]/)) {
                            if (death) {
                                newValue += char;
                            }
                            else {
                                newValue += value.charAt(valuePos++);
                            }
                            continue;
                        }
                        if (death) {
                            break;
                        }
                        newValue += char;
                    }
                }
                newValue += el.getAttribute(ATTR.SUFFIX) || '';
                el.value = newValue;
                if (selection === void 0) {
                    el.selectionStart = el.selectionEnd = newValue.length - suffix.length;
                    return;
                }
                el.selectionStart = el.selectionEnd = selection + prefix.length;
            });
        });
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
