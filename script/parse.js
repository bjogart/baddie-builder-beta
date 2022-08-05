"use strict";
function match(s, re) {
    const m = re.exec(s);
    if (m === null) {
        return Opt.none();
    }
    const len = m[0].length;
    return Opt.some({ content: s.substring(0, len), s: s.substring(len) });
}
function* lexStr(s) {
    while (s.length > 0) {
        let preTrivia;
        const mbPreTrivia = match(s, LEX_RULES.trivia);
        if (mbPreTrivia.isSome()) {
            ({ content: preTrivia, s } = mbPreTrivia.unwrap());
        }
        else {
            preTrivia = '';
        }
        let content = null;
        let tag = null;
        for (const r of LEX_RULES.rules) {
            const m = match(s, r.re);
            if (m.isSome()) {
                tag = r.tag;
                ({ content, s } = m.unwrap());
                break;
            }
        }
        let postTrivia;
        const mbPostTrivia = match(s, LEX_RULES.trivia);
        if (mbPostTrivia.isSome()) {
            ({ content: postTrivia, s } = mbPostTrivia.unwrap());
        }
        else {
            postTrivia = '';
        }
        yield new Token(unwrapNullish(tag), preTrivia, unwrapNullish(content), postTrivia);
    }
}
function lex(text) { return new Stream(lexStr(text)); }
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
