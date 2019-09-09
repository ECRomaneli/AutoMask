<h1 align='center'>AutoMask</h1>
<p align='center'>
    Auto mask your inputs without setting JavaScript
</p>
<p align='center'>
<img src="https://img.shields.io/npm/v/automask.svg" alt="module version">&nbsp;
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="GitHub license">&nbsp;
    <img src="https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat" alt="contributions welcome">
</p>

## Instable version
        This version is below version 1.0.0 and some unexpected behaviors may occur.

## Install

```
npm i automask
```

or just import the javascript into **/dist/web/** into your web project.

## Import
### Module
Just import with require and use:
```typescript
require('automask')
``` 

### Web
Download script into **/dist/web/** folder and import normally:
```html
<script type="text/javascript" src="automask.min.js"/>
```

## Usage
All settings are usable on HTML and works on IE11+ browsers.

```html
<!-- MAC Address -->
<input mask="__:__:__:__:__:__" accept="0-9A-Fa-f" />

<!-- show the empty mask -->
<input mask="__:__:__:__:__:__" accept="0-9A-Fa-f" show-mask="true" />

<!-- Percentage -->
<input mask="__0,0" dir="backward" suffix="%" />

<!-- Money -->
<input  mask="___.__0,00" dir="backward" prefix="$ " />
```

## Settings

All AutoMask settings are enabled with HTML. Just set the attribute and use.

- `mask` to define your pattern;
- `prefix` to set an prefix;
- `suffix` to set an suffix;
- `show-mask` to set whether or not to display the mask;
- `accept` Regular Expression for accepted characters (default is only numbers);
- **[BETA]** `dir` to set fill direction;
- **[FUTURE]** `persist` Regular Expression to set what characters submit on form.

### Mask

The mask accepts all characters and have only two special characters, the `_` and `0`.
These characters are where your value will stay, and the `0` will works like an zero pad (for example, to pad the money or percentage).

### Dir

The `dir` set the completion direction. Accept two values, `backward` and `forward`. The default value is `forward`.

## Author

- Created and maintained by [Emerson C. Romaneli](https://github.com/ECRomaneli) (@ECRomaneli).

## License

[MIT License](https://github.com/ECRomaneli/AutoMask/blob/master/LICENSE)
