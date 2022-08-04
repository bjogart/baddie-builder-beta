"use strict";
function escapeHtml(s) {
    return s.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function titleToFileName(title) {
    const trimmed = title.trim();
    const titleOrDefault = trimmed.length === 0 || trimmed == '[title]' ? DEFAULT_BLOCK_NAME : title;
    const name = titleOrDefault.split(/\s+/g)
        .map(s => s.replaceAll(/[^\w]/g, ""))
        .flatMap(s => [s.charAt(0).toUpperCase(), s.substring(1).toLowerCase()])
        .join('');
    return `${name}${BLOCK_FILE_EXT}`;
}
function downloadJson(obj, filename) {
    const data = `data:text/json;charset=utf-8,${encodeURIComponent(obj.json())}`;
    const downloader = document.createElement('a');
    downloader.setAttribute('href', data);
    downloader.setAttribute('download', filename);
    downloader.classList.add('hide');
    document.body.appendChild(downloader);
    downloader.click();
    downloader.remove();
}
function loadJson(f) {
    const uploader = document.createElement('input');
    uploader.classList.add('hide');
    uploader.setAttribute('type', 'file');
    uploader.setAttribute('accept', BLOCK_FILE_EXT);
    uploader.classList.add('hide');
    uploader.onchange = () => {
        const file = unwrapNullish(unwrapNullish(uploader.files)[0]);
        const reader = new FileReader();
        reader.onloadend = () => {
            const file = reader.result;
            let res;
            if (file === null || typeof file !== 'string') {
                res = { err: `invalid file: ${file}` };
            }
            else {
                let json;
                try {
                    json = JSON.parse(file);
                }
                catch (e) {
                    f({ err: e });
                    return;
                }
                if (!('version' in json)) {
                    f({ err: `no 'version' property in file` });
                    return;
                }
                res = { val: BlockJson.fromProperties(json.version, json) };
            }
            f(res);
        };
        reader.readAsText(file);
    };
    document.body.appendChild(uploader);
    uploader.click();
    uploader.remove();
}
function readFloat(s) {
    const num = parseFloat(s);
    if (isNaN(num)) {
        return Opt.none();
    }
    return Opt.some(num);
}
function parseNumericArgument(args, arg, asInt) {
    const val = unwrapNullish(args.get(arg));
    const s = val.unwrap().content();
    const mbN = readFloat(s);
    if (mbN.isNone()) {
        return Result.err(`invalid number for argument '${arg}': ${s}`);
    }
    const n = mbN.unwrap();
    if (asInt && !Number.isSafeInteger(n)) {
        return Result.err(`expected an integer but got ${n}`);
    }
    return Result.ok(n);
}
function isInt(n) { return n === Math.trunc(n); }
function panic(msg) { throw msg; }
function unreachable() { return panic('entered unreachable code'); }
function unwrapNullish(v, msg = 'unwrap() called on null') { return v ?? panic(msg); }
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
class Result {
    static ok(v) { return new Result({ successVal: v }); }
    static err(v) { return new Result({ errVal: v }); }
    v;
    constructor(v) { this.v = v; }
    isOk() { return 'successVal' in this.v; }
    isErr() { return 'errVal' in this.v; }
    unwrap() { return 'successVal' in this.v ? this.v.successVal : panic(`unwrap() called on err(${this.v.errVal})`); }
    unwrapErr() { return 'errVal' in this.v ? this.v.errVal : panic(`unwrap() called on ok(${this.v.successVal})`); }
}
function flattenOpt(opt) {
    return opt.isSome() ? opt.unwrap() : Opt.none();
}
function dispatchOrCollect(r, dispatch, errors) {
    if (r.isOk()) {
        dispatch(r.unwrap());
    }
    else {
        errors.push(r.unwrapErr());
    }
}
