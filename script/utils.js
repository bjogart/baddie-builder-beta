"use strict";
function escapeHtml(s) {
    return s.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function match(ch, re) { return ch.search(re) == 0; }
function titleToFileName(title) {
    const titleOrDefault = title.trim().length === 0 ? DEFAULT_BLOCK_NAME : title;
    const name = titleOrDefault.split(/\s+/g)
        .map(s => s.replaceAll(/[^\w]/g, ""))
        .flatMap(s => [s.charAt(0).toUpperCase(), s.substring(1).toLowerCase()])
        .join('');
    return `${name}${BLOCK_FILE_EXT}`;
}
function downloadJson(obj, filename) {
    const data = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(obj))}`;
    const downloader = document.createElement('a');
    downloader.setAttribute('href', data);
    downloader.setAttribute('download', filename);
    downloader.classList.add('hide');
    document.body.appendChild(downloader);
    downloader.click();
    downloader.remove();
}
function loadJson(callback) {
    const uploader = document.createElement('input');
    uploader.classList.add('hide');
    uploader.setAttribute('type', 'file');
    uploader.setAttribute('accept', BLOCK_FILE_EXT);
    uploader.classList.add('hide');
    uploader.onchange = () => {
        const file = unwrapNullish(unwrapNullish(uploader.files)[0]);
        const reader = new FileReader();
        reader.onloadend = () => {
            const res = reader.result;
            if (res === null || typeof res !== 'string') {
                throw `invalid file: ${res}`;
            }
            const obj = JSON.parse(res.toString());
            callback(obj);
        };
        reader.readAsText(file);
    };
    document.body.appendChild(uploader);
    uploader.click();
    uploader.remove();
}
function readNum(s) {
    const num = parseFloat(s);
    if (isNaN(num)) {
        return Opt.none();
    }
    return Opt.some(num);
}
function isInt(n) { return n === Math.trunc(n); }
function panic(msg) { throw msg; }
function unreachable() { return panic('entered unreachable code'); }
function unwrapNullish(v, msg = 'unwrap() called on null') { return v ?? panic(msg); }
function flattenOpt(opt) {
    return opt.isSome() ? opt.unwrap() : Opt.none();
}
class Opt {
    static some(v) { return new Opt({ val: v }); }
    static none() { return new Opt({}); }
    optionalValue;
    constructor(v) { this.optionalValue = v; }
    isSome() { return 'val' in this.optionalValue; }
    isNone() { return !('val' in this.optionalValue); }
    unwrap() { return this.isSome() ? this.optionalValue.val : panic('unwrap() called on none'); }
    unwrapOr(def) { return this.isSome() ? this.optionalValue.val : def; }
    map(op) { return this.isSome() ? Opt.some(op(this.optionalValue.val)) : Opt.none(); }
    toList() { return this.isSome() ? [this.optionalValue.val] : []; }
}
