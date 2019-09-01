"use strict";
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
    DirectionEnum["LEFT"] = "left";
    DirectionEnum["RIGHT"] = "right";
})(DirectionEnum || (DirectionEnum = {}));
(() => {
    const ATTR = {
        MASK: 'mask',
        PREFIX: 'prefix',
        SUFFIX: 'suffix',
        DIRECTION: 'direction'
    }, DOC = document, MASK_PATTERN = /^(<|>)?(\[([^\]]*)])?([^[]*)(\[([^\]]*)])?$/, MASK_SELECTOR = `[${ATTR}]`, RAW_NAME_ATTR = 'raw-name';
    function main() {
        let inputs = query(MASK_SELECTOR);
        each(inputs, (el, _i) => {
            el.addEventListener('change', () => {
                let value = el.value + '', mask = el.getAttribute(ATTR.MASK), direction = el.getAttribute(ATTR.DIRECTION), length = mask.length, newValue = el.getAttribute(ATTR.PREFIX) || '';
                if (direction && direction === DirectionEnum.LEFT) {
                    let valuePos = 0;
                    for (let i = 0; i < length; i++) {
                        let char = mask.charAt(i), death = valuePos >= value.length;
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
            });
        });
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
            DOC.addEventListener('DOMContentLoaded', () => { handler(); });
        }
    }
    function each(arr, it) {
        let length = arr.length;
        for (let i = 0; i < length; i++) {
            if (it.call(arr[i], i, arr[i]) === false) {
                break;
            }
        }
    }
    ready(main);
})();
