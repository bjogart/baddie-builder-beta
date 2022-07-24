"use strict";
function escapeHtml(s) {
    return s.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function match(ch, re) { return ch.search(re) == 0; }
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
