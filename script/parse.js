"use strict";
function lex(text) {
    return new Stream(lexStr(text));
}
function* lexStr(str) {
    let pos = 0;
    while (pos < str.length) {
        let triviaBefore = chompWhile(str, pos, isTrivia);
        pos += triviaBefore.length;
        let tag;
        let s;
        if (str.startsWith('[', pos)) {
            tag = LBRAC;
            s = str.charAt(pos);
        }
        else if (str.startsWith(']', pos)) {
            tag = RBRAC;
            s = str.charAt(pos);
        }
        else if (str.startsWith(':', pos)) {
            tag = COLON;
            s = str.charAt(pos);
        }
        else if (str.startsWith('&quot;', pos)) {
            tag = DQUOT;
            s = str.substring(pos, pos + 6);
        }
        else if (str.startsWith("&#039;", pos)) {
            tag = QUOT;
            s = str.substring(pos, pos + 6);
        }
        else if (isAlpha(str.charAt(pos))) {
            tag = IDENT;
            s = chompWhile(str, pos, isAlpha);
        }
        else if (isDigit(str.charAt(pos))) {
            tag = NUM;
            s = chompWhile(str, pos, isDigit);
        }
        else if ((str.startsWith('+', pos) || str.startsWith('-', pos)) && isDigit(str.charAt(pos + 1))) {
            tag = NUM;
            s = str.charAt(pos).concat(chompWhile(str, pos + 1, isDigit));
        }
        else {
            tag = MISC;
            s = str.charAt(pos);
        }
        pos += s.length;
        let triviaAfter = chompWhile(str, pos, isTrivia);
        pos += triviaAfter.length;
        yield new Token(tag, triviaBefore, s, triviaAfter);
    }
}
const TRIVIA = /[ \t\r\n]/;
function isTrivia(ch) { return match(ch, TRIVIA); }
const ALPHA = /[a-z]/i;
function isAlpha(ch) { return match(ch, ALPHA); }
const DIGIT = /[0-9]/;
function isDigit(ch) { return match(ch, DIGIT); }
function chompWhile(s, start, pred) {
    let end = start;
    for (; pred(s.charAt(end)); end += 1) { }
    return s.substring(start, end);
}
class Stream {
    gen;
    _head;
    consumed;
    constructor(gen) {
        this.gen = gen;
        this._head = this.gen.next();
        this.consumed = [];
    }
    head() { return this._head.done ? Opt.none() : Opt.some(this._head.value); }
    chomp() {
        if (this._head.done) {
            return false;
        }
        const tok = this._head.value;
        this._head = this.gen.next();
        this.consumed.push(tok);
        return true;
    }
    chompIf(pred) {
        const t = this.head();
        if (t.isSome()) {
            const t2 = t.unwrap();
            const shouldEat = pred(t2);
            if (shouldEat) {
                this.chomp();
            }
            return shouldEat;
        }
        else {
            return false;
        }
    }
    chompWhile(pred) {
        let ateAny = false;
        while (this.chompIf(pred)) {
            ateAny = true;
        }
        return ateAny;
    }
    consume() { const ts = this.consumed; this.consumed = []; return ts; }
    consumeOne() { return this.consume()[0] ?? panic('unable to consume exactly 1 item'); }
}
function isArgVal(t) {
    return t.tag === NUM || t.tag === IDENT;
}
function arg(s, b) {
    let name;
    s.chomp();
    name = s.consumeOne();
    if (name.tag !== IDENT) {
        s.chompWhile(t => t.tag !== RBRAC);
        s.consume();
        return { name: b.symErr(name.s, 'the name of an argument'), arg: Opt.none() };
    }
    let arg;
    if (s.chompIf(t => t.tag === COLON)) {
        const colon = s.consumeOne();
        let val;
        if (s.chompIf(isArgVal)) {
            val = s.consumeOne();
        }
        else {
            const unchomped = s.head();
            s.chompWhile(t => t.tag !== RBRAC);
            s.consume();
            if (unchomped.isSome()) {
                val = b.symErr(unchomped.unwrap().s, 'argument');
            }
            else {
                val = b.eoiErr(NUM);
            }
        }
        arg = Opt.some({ colon, val });
    }
    else {
        arg = Opt.none();
    }
    return { name, arg };
}
function tag(s, b) {
    s.chomp();
    const ldelim = s.consumeOne();
    let args = [];
    for (let head = s.head(); Opt.some(head) && head.unwrap().tag !== RBRAC; head = s.head()) {
        args.push(arg(s, b));
    }
    const rdelim = s.chomp() ? s.consumeOne() : b.eoiErr(RBRAC);
    return b.tag(ldelim, args, rdelim);
}
function n(s, b) {
    s.chomp();
    s.chompIf(t => t.tag === QUOT || t.tag === DQUOT);
    return b.num(s.consume());
}
function startsTag(token) { return token.tag === LBRAC; }
function startsNum(token) { return token.tag === NUM; }
function parse(str, b) {
    const s = lex(escapeHtml(str));
    const pieces = [];
    for (let head = s.head(); head.isSome(); head = s.head()) {
        let piece;
        const h = head.unwrap();
        if (startsTag(h)) {
            piece = tag(s, b);
        }
        else if (startsNum(h)) {
            piece = n(s, b);
        }
        else {
            s.chomp();
            piece = s.consumeOne();
        }
        pieces.push(piece);
    }
    return b.item(pieces);
}
