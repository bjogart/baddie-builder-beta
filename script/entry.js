"use strict";
function dispatchOrErr(v, ctor) {
    return 'errors' in v ? new Err('', v.errors, '') : ctor(v);
}
function effCtor(gs, as, lbl) {
    return dispatchOrErr(Eq.fromArgs(as), eq => {
        const entry = new ConstVal(Opt.some(eq), Opt.none());
        const get = (gs) => gs.effModSum;
        const set = (gs, n) => gs.effModSum -= n;
        return new Lbl(fmtInlineHd(`${lbl}&nbsp;&#10731;`), '', new ZeroSum(gs, get, set, eq, entry, 'effective saves'));
    });
}
const TAG_PATS = [
    {
        name: 'hp',
        argPats: new Map([
            ['hp', []], ['plus', [NUM]], ['minus', [NUM]], ['times', [NUM]], ['divide', [NUM]],
            ['dcount', [NUM]], ['dsize', [NUM]], ['dplus', [NUM]], ['heal', []],
        ]),
        ctor: (_gs, as) => dispatchOrErr(Eq.fromArgs(as), eq => dispatchOrErr(DiceTemplate.fromArgs(as), temp => {
            if (temp.size.isNone()) {
                const kw = lookupKeyword('size');
                temp.size = Opt.some(unwrapNullish(SIZE_HD[kw]));
            }
            const lbl = as.get('heal') ? '' : fmtInlineHd('hp&nbsp;');
            const emph = as.get('heal') !== undefined;
            return new Lbl(lbl, '', new DiceVal(Opt.some(eq), Opt.none(), temp, emph));
        })),
    },
    {
        name: 'dmg',
        argPats: new Map([
            ['dmg', []], ['plus', [NUM]], ['minus', [NUM]], ['times', [NUM]], ['divide', [NUM]],
            ['dcount', [NUM]], ['dsize', [NUM]], ['dplus', [NUM]],
        ]),
        ctor: (_gs, as) => dispatchOrErr(Eq.fromArgs(as), eq => dispatchOrErr(DiceTemplate.fromArgs(as), temp => new DiceVal(Opt.none(), Opt.some(eq), temp, true))),
    },
    {
        name: 'hit',
        argPats: new Map([['hit', []], ['vs', [IDENT]], ['plus', [NUM]], ['minus', [NUM]]]),
        ctor: (_gs, as) => dispatchOrErr(Eq.fromArgs(as), eq => {
            const target = (as.get('vs') ?? Opt.none()).map(v => v.s).unwrapOr('ac').toLowerCase();
            return new Lbl('', ` vs. ${fmtInlineHd(target)}`, new Mod(Opt.none(), Opt.some(eq), true));
        }),
    },
    {
        name: 'uses',
        argPats: new Map([['uses', [NUM]]]),
        ctor: (_gs, as) => {
            const mbN = readNum(unwrapNullish(as.get('uses')).unwrap().content());
            const n = mbN.isSome()
                ? { val: mbN.unwrap() }
                : { errors: `unreadable number ${as.get('uses')?.unwrap()}` };
            return dispatchOrErr(n, n => new Uses(n.val));
        }
    },
    {
        name: 'ac',
        argPats: new Map([['ac', []], ['plus', [NUM]], ['minus', [NUM]]]),
        ctor: (_gs, as) => dispatchOrErr(Eq.fromArgs(as), eq => new Lbl(fmtInlineHd('ac&nbsp;'), '', new ConstVal(Opt.some(eq), Opt.none()))),
    },
    {
        name: 'mv',
        argPats: new Map([
            ['mv', []], ['walk', [NUM]], ['climb', [NUM]], ['fly', [NUM]],
            ['swim', [NUM]]
        ]),
        ctor: (_gs, as) => new Lbl(fmtInlineHd('mv&nbsp;'), '', new Mv(as)),
    },
    {
        name: 'str',
        argPats: new Map([['str', []], ['plus', [NUM]], ['minus', [NUM]]]),
        ctor: (gs, as) => effCtor(gs, as, 'str'),
    },
    {
        name: 'dex',
        argPats: new Map([['dex', []], ['plus', [NUM]], ['minus', [NUM]]]),
        ctor: (gs, as) => effCtor(gs, as, 'dex'),
    },
    {
        name: 'con',
        argPats: new Map([['con', []], ['plus', [NUM]], ['minus', [NUM]]]),
        ctor: (gs, as) => effCtor(gs, as, 'con'),
    },
    {
        name: 'int',
        argPats: new Map([['int', []], ['plus', [NUM]], ['minus', [NUM]]]),
        ctor: (gs, as) => effCtor(gs, as, 'int'),
    },
    {
        name: 'wis',
        argPats: new Map([['wis', []], ['plus', [NUM]], ['minus', [NUM]]]),
        ctor: (gs, as) => effCtor(gs, as, 'wis'),
    },
    {
        name: 'cha',
        argPats: new Map([['cha', []], ['plus', [NUM]], ['minus', [NUM]]]),
        ctor: (gs, as) => effCtor(gs, as, 'cha'),
    },
    {
        name: 'title',
        argPats: new Map([['title', []]]),
        ctor: (_gs, _as) => new Token(IDENT, '', 'Insert name here', ''),
    },
];
class Item {
    items;
    constructor(items) { this.items = items; }
    ty() { return 'item'; }
    containsErrors() { return this.items.reduce((b, it) => b || it.containsErrors(), false); }
    containsHpTags() { return this.items.reduce((b, it) => b || it.containsHpTags(), false); }
    containsDmgTags() { return this.items.reduce((b, it) => b || it.containsDmgTags(), false); }
    hp() { return this.items.flatMap(it => it.hp()); }
    ac() { return this.items.flatMap(it => it.ac()); }
    dmg() { return this.items.flatMap(it => it.dmg()); }
    hit() { return this.items.flatMap(it => it.hit()); }
    uses() {
        for (const it of this.items) {
            const u = it.uses();
            if (u.isSome()) {
                return u;
            }
        }
        return Opt.none();
    }
    fmt(ds) {
        let seenUsesTag = false;
        let pastHeader = this.items.findIndex(it => match(it.content(), PUNCT)) === -1;
        const hdFmts = [];
        const fmts = [];
        const errs = [];
        for (const it of this.items) {
            if (it.uses().isSome()) {
                if (seenUsesTag) {
                    errs.push("multiple [uses] tags in a single entry");
                }
                else {
                    seenUsesTag = true;
                }
            }
            const fmt = it.fmt(ds);
            pastHeader ? fmts.push(fmt) : hdFmts.push(fmt);
            pastHeader ||= match(fmt, PUNCT);
        }
        const containsDistributedVal = this.containsHpTags() || this.containsDmgTags();
        if (seenUsesTag && !containsDistributedVal) {
            errs.push('entry has a [uses] tag but no [hp] or [dmg] tags');
        }
        if (!seenUsesTag && containsDistributedVal) {
            errs.push('entry has [hp] or [dmg] tags but no [uses] tag');
        }
        const errorMsgs = errs.length === 0 ? '' : ` ${errs.map(fmtErr).join(ERR_SEP)}`;
        return `${fmtInlineHd(hdFmts.join(''))}${fmts.join('')}${errorMsgs}`;
    }
    content() { return this.items.map(it => it.content()).join(''); }
    triviaBefore() { return this.items[0]?.triviaBefore() ?? ''; }
    triviaAfter() { return this.items[this.items.length - 1]?.triviaAfter() ?? ''; }
}
class Tag {
    l;
    inner;
    r;
    constructor(l, inner, r) {
        this.l = l;
        this.inner = inner;
        this.r = r;
    }
    ty() { return 'tag'; }
    containsErrors() { return this.l.containsErrors() || this.inner.containsErrors() || this.r.containsErrors(); }
    containsHpTags() { return !this.containsErrors() && this.inner.containsHpTags(); }
    containsDmgTags() { return !this.containsErrors() && this.inner.containsDmgTags(); }
    hp() { return this.containsErrors() ? [] : this.inner.hp(); }
    ac() { return this.containsErrors() ? [] : this.inner.ac(); }
    dmg() { return this.containsErrors() ? [] : this.inner.dmg(); }
    hit() { return this.containsErrors() ? [] : this.inner.hit(); }
    uses() { return this.containsErrors() ? Opt.none() : this.inner.uses(); }
    fmt(ds) {
        const lWs = this.l.triviaBefore();
        const rWs = this.r.triviaAfter();
        const msg = this.containsErrors()
            ? `[${[this.l, this.inner, this.r].filter(it => it.containsErrors())
                .map(it => it.fmt(ds))
                .join(ERR_SEP)}]`
            : this.inner.fmt(ds);
        return `${lWs}${msg}${rWs}`;
    }
    content() {
        return [this.l, this.inner, this.r].reduce((s, it) => s.concat(it.content()), '');
    }
    triviaBefore() { return this.l.triviaBefore(); }
    triviaAfter() { return this.r.triviaAfter(); }
}
class Lbl {
    pre;
    entry;
    post;
    constructor(pre, post, val) { this.pre = pre; this.entry = val; this.post = post; }
    ty() { return 'lbl'; }
    containsErrors() { return this.entry.containsErrors(); }
    containsHpTags() { return this.entry.containsHpTags(); }
    containsDmgTags() { return this.entry.containsDmgTags(); }
    hp() { return this.entry.hp(); }
    ac() { return this.entry.ac(); }
    dmg() { return this.entry.dmg(); }
    hit() { return this.entry.hit(); }
    uses() { return this.entry.uses(); }
    fmt(ds) { return `${this.pre}${this.entry.fmt(ds)}${this.post}`; }
    content() { return `${this.pre}${this.entry.content()}${this.post}`; }
    triviaBefore() { return ''; }
    triviaAfter() { return this.entry.triviaAfter(); }
}
class Hide {
    entry;
    constructor(entry) { this.entry = entry; }
    ty() { return 'hide'; }
    containsErrors() { return this.entry.containsErrors(); }
    containsHpTags() { return this.entry.containsHpTags(); }
    containsDmgTags() { return this.entry.containsDmgTags(); }
    hp() { return this.entry.hp(); }
    ac() { return this.entry.ac(); }
    dmg() { return this.entry.dmg(); }
    hit() { return this.entry.hit(); }
    uses() { return this.entry.uses(); }
    fmt(ds) { this.entry.fmt(ds); return ''; }
    content() { return ''; }
    triviaBefore() { return ''; }
    triviaAfter() { return ''; }
}
class ZeroSum {
    gs;
    get;
    entry;
    obj;
    constructor(gs, get, add, eq, entry, obj) {
        this.gs = gs;
        this.get = get;
        this.entry = entry;
        this.obj = obj;
        add(gs, eq.term);
    }
    ty() { return 'eff'; }
    containsErrors() { return this.get(this.gs) !== 0; }
    containsHpTags() { return this.entry.containsHpTags(); }
    containsDmgTags() { return this.entry.containsDmgTags(); }
    hp() { return this.entry.hp(); }
    ac() { return this.entry.ac(); }
    dmg() { return this.entry.dmg(); }
    hit() { return this.entry.hit(); }
    uses() { return this.entry.uses(); }
    fmt(ds) {
        const sum = this.get(this.gs);
        if (sum === 0) {
            return this.entry.fmt(ds);
        }
        const abs = Math.abs(sum);
        const pluralS = abs === 1 ? '' : 's';
        let op;
        let prepos;
        if (sum >= 0) {
            op = 'add';
            prepos = 'to';
        }
        else {
            op = 'subtract';
            prepos = 'from';
        }
        return fmtErr(` ${op} ${abs} point${pluralS} ${prepos} ${this.obj}`);
    }
    content() { return 'zerosum'; }
    triviaBefore() { return ''; }
    triviaAfter() { return ''; }
}
class ConstVal {
    _ac;
    _hit;
    constructor(ac, hit) { this._ac = ac; this._hit = hit; }
    ty() { return 'const'; }
    containsErrors() { return false; }
    containsHpTags() { return false; }
    containsDmgTags() { return false; }
    hp() { return []; }
    ac() { return this._ac.toList(); }
    dmg() { return []; }
    hit() { return this._hit.toList(); }
    uses() { return Opt.none(); }
    fmt(ds) {
        const div = this._ac.isSome() ? ds.ac : ds.hit;
        const val = unwrapNullish(div.shift());
        return `${val}`;
    }
    content() { return 'const'; }
    triviaBefore() { return ''; }
    triviaAfter() { return ''; }
}
class Mod {
    _ac;
    _hit;
    emph;
    constructor(ac, hit, emph) {
        this._ac = ac;
        this._hit = hit;
        this.emph = emph;
    }
    ty() { return 'mod'; }
    containsErrors() { return false; }
    containsHpTags() { return false; }
    containsDmgTags() { return false; }
    hp() { return []; }
    ac() { return this._ac.toList(); }
    dmg() { return []; }
    hit() { return this._hit.toList(); }
    uses() { return Opt.none(); }
    fmt(ds) {
        const div = this._ac.isSome() ? ds.ac : ds.hit;
        const val = unwrapNullish(div.shift());
        const res = fmtMod(val);
        return this.emph ? fmtEmph(res) : res;
    }
    content() { return 'mod'; }
    triviaBefore() { return ''; }
    triviaAfter() { return ''; }
}
class DiceVal {
    _hp;
    _dmg;
    dTemplate;
    emph;
    constructor(hp, dmg, dTemp, emph) {
        this._hp = hp;
        this._dmg = dmg;
        this.dTemplate = dTemp;
        this.emph = emph;
    }
    ty() { return 'diceval'; }
    containsErrors() { return false; }
    containsHpTags() { return this._hp.isSome(); }
    containsDmgTags() { return this._dmg.isSome(); }
    hp() { return this._hp.toList(); }
    ac() { return []; }
    dmg() { return this._dmg.toList(); }
    hit() { return []; }
    uses() { return Opt.none(); }
    fmt(ds) {
        const div = this._hp.isSome() ? ds.hp : ds.dmg;
        const val = unwrapNullish(div.shift());
        if (val.isNone()) {
            return fmtErr('math error');
        }
        const dice = renderDice(val.unwrap(), this.dTemplate);
        const fmt = printDice(dice);
        let approxErr;
        if (dice.err >= DICE_FMT_MAX_ERR_THRES) {
            const abs = Math.abs(dice.diff).toFixed(FMT_DIGITS);
            const rel = dice.diff > 0 ? 'under' : 'over';
            approxErr = fmtErr(` inaccurate dice expression: average roll is ${abs} ${rel} target)`);
        }
        else {
            approxErr = '';
        }
        const res = `${fmt}${approxErr}`;
        return this.emph ? fmtEmph(res) : res;
    }
    content() { return 'dmg'; }
    triviaBefore() { return ''; }
    triviaAfter() { return ''; }
}
class Mv {
    static readTok(lbl, t, errors) {
        if (!t) {
            return Opt.none();
        }
        const s = t.unwrap().content();
        const mbNum = readNum(s);
        if (mbNum.isNone()) {
            errors.push(fmtErr(`${s} is not a valid number`));
            return Opt.none();
        }
        const num = mbNum.unwrap();
        if (num <= 0) {
            errors.push(fmtErr(`you cannot ${lbl.unwrapOr('walk')} at ${num} MV/round`));
        }
        const fmtLbl = lbl.isSome() ? `${lbl.unwrap()} ` : '';
        return Opt.some(`${fmtLbl}${mbNum.unwrap()}${METRIC_PRIME}`);
    }
    err;
    walk;
    climb;
    fly;
    swim;
    constructor(args) {
        let errors = [];
        this.walk = Mv.readTok(Opt.none(), args.get('walk'), errors).unwrapOr(`30${METRIC_PRIME}`);
        this.climb = Mv.readTok(Opt.some('climb'), args.get('climb'), errors).unwrapOr('');
        this.fly = Mv.readTok(Opt.some('fly'), args.get('fly'), errors).unwrapOr('');
        this.swim = Mv.readTok(Opt.some('swim'), args.get('swim'), errors).unwrapOr('');
        this.err = errors.join(ERR_SEP);
    }
    ty() { return 'mv'; }
    containsErrors() { return this.err.length > 0; }
    containsHpTags() { return false; }
    containsDmgTags() { return false; }
    hp() { return []; }
    ac() { return []; }
    dmg() { return []; }
    hit() { return []; }
    uses() { return Opt.none(); }
    fmt(_ds) {
        return [this.walk, this.climb, this.fly, this.swim, this.err]
            .filter(s => s.length > 0)
            .join(', ');
    }
    content() { return 'mv'; }
    triviaBefore() { return ''; }
    triviaAfter() { return ''; }
}
class Uses {
    n;
    constructor(n) { this.n = n; }
    ty() { return 'uses'; }
    containsErrors() { return this.n < 0; }
    containsHpTags() { return false; }
    containsDmgTags() { return false; }
    hp() { return []; }
    ac() { return []; }
    dmg() { return []; }
    hit() { return []; }
    uses() { return Opt.some(this.n); }
    fmt(_ds) {
        if (this.containsErrors()) {
            return fmtErr(`cannot use an action ${this.n} times`);
        }
        return '';
    }
    content() { return ''; }
    triviaBefore() { return ''; }
    triviaAfter() { return ''; }
}
class Num {
    s;
    _triviaBefore;
    _triviaAfter;
    constructor(tokens) {
        const num = tokens[0];
        const prime = tokens[1];
        if (!num) {
            throw 'invalid number parsed';
        }
        let str;
        if (!prime) {
            this._triviaBefore = num.triviaBefore();
            this._triviaAfter = num.triviaAfter();
            str = num.content();
        }
        else {
            this._triviaBefore = num.triviaBefore();
            this._triviaAfter = prime.triviaAfter();
            if (num.triviaAfter.length + prime.triviaBefore.length === 0) {
                str = `${num.content()}<em>${prime.content()}</em>`;
            }
            else {
                str = `${num.s}${num.triviaAfter}${prime.triviaBefore}${prime.s}`;
            }
        }
        this.s = `${this.triviaBefore()}${str}${this.triviaAfter()}`;
    }
    ty() { return 'num'; }
    containsErrors() { return false; }
    containsHpTags() { return false; }
    containsDmgTags() { return false; }
    hp() { return []; }
    ac() { return []; }
    dmg() { return []; }
    hit() { return []; }
    uses() { return Opt.none(); }
    fmt(_ds) { return this.content(); }
    content() { return this.s; }
    triviaBefore() { return this._triviaBefore; }
    triviaAfter() { return this._triviaAfter; }
}
class Err {
    _triviaBefore;
    msg;
    _triviaAfter;
    constructor(triviaBefore, msg, triviaAfter) {
        this._triviaBefore = triviaBefore;
        this.msg = msg;
        this._triviaAfter = triviaAfter;
    }
    ty() { return 'err'; }
    containsErrors() { return true; }
    containsHpTags() { return false; }
    containsDmgTags() { return false; }
    hp() { return []; }
    ac() { return []; }
    dmg() { return []; }
    hit() { return []; }
    uses() { return Opt.none(); }
    fmt(_ds) { return this.content(); }
    content() { return fmtErr(`${this.triviaBefore()}${this.msg}${this.triviaAfter()}`); }
    triviaBefore() { return this._triviaBefore; }
    triviaAfter() { return this._triviaAfter; }
}
class Token {
    tag;
    s;
    _triviaBefore;
    _triviaAfter;
    constructor(tag, triviaBefore, s, triviaAfter) {
        this.tag = tag;
        this._triviaBefore = triviaBefore;
        this._triviaAfter = triviaAfter;
        this.s = s === 'x' ? '&times;' : s;
    }
    ty() { return this.tag; }
    containsErrors() { return false; }
    containsHpTags() { return false; }
    containsDmgTags() { return false; }
    hp() { return []; }
    ac() { return []; }
    dmg() { return []; }
    hit() { return []; }
    uses() { return Opt.none(); }
    fmt(_ds) { return `${this.triviaBefore()}${this.s}${this.triviaAfter()}`; }
    content() { return this.s; }
    triviaBefore() { return this._triviaBefore; }
    triviaAfter() { return this._triviaAfter; }
}
function matchArgs(globals, args, pat) {
    const head = unwrapNullish(args[0]);
    const name = head.name.content();
    if (name.toLowerCase() !== pat.name) {
        return Opt.none();
    }
    const matchedArgsAndPats = args.map(arg => {
        const mbPat = pat.argPats.get(arg.name.content().toLowerCase());
        return ({ arg, pat: mbPat ? Opt.some(mbPat) : Opt.none() });
    });
    const unknownArgs = matchedArgsAndPats.filter(it => it.pat.isNone())
        .map(it => `'${it.arg.name.content()}' is not a valid argument for tag '${name}'`)
        .join(ERR_SEP);
    if (unknownArgs.length > 0) {
        return Opt.some({ err: unknownArgs });
    }
    const argsAndPats = matchedArgsAndPats.map(it => ({ arg: it.arg, pat: it.pat.unwrap() }));
    const checkedArgsAndPats = argsAndPats.map(it => {
        const arg = it.arg.arg.map(it => it.val);
        let err;
        if (arg.isSome()) {
            const a = arg.unwrap();
            if (it.pat.length > 0) {
                if (it.pat.includes(a.ty())) {
                    err = Opt.none();
                }
                else {
                    err = Opt.some(`expected ${it.pat.join(' or ')} but found '${a.content()}'`);
                }
            }
            else {
                err = Opt.some(`did not expect an argument but found '${a.content()}'`);
            }
        }
        else {
            if (it.pat.length > 0) {
                err = Opt.some(`expected ${it.pat.join(' or ')} but did not find an argument`);
            }
            else {
                err = Opt.none();
            }
        }
        return { arg: it.arg, pat: it.pat, err: err };
    });
    const dictArgs = new Map();
    const invalidArgs = [];
    checkedArgsAndPats.forEach(it => {
        if (it.err.isSome()) {
            invalidArgs.push(it.err.unwrap());
        }
        else {
            const arg = it.arg.name.content().toLowerCase();
            if (dictArgs.has(arg)) {
                invalidArgs.push(fmtErr(`'${arg}' defined more than once`));
            }
            else {
                const val = it.arg.arg.map(it => it.val);
                dictArgs.set(arg, val);
            }
        }
    });
    if (invalidArgs.length > 0) {
        return Opt.some({ err: invalidArgs.join(ERR_SEP) });
    }
    return Opt.some({ tag: pat.ctor(globals, dictArgs) });
}
function errTag(l, msg, r) {
    return new Tag(l, new Err('', msg, ''), r);
}
class EntryBuilder {
    globals;
    constructor() {
        this.globals = { effModSum: 0 };
    }
    tag(l, args, r) {
        if (args.length === 0) {
            return errTag(l, '[tag is empty]', r);
        }
        const errors = args.flatMap(tag => {
            let elems = [tag.name];
            if (tag.arg.isSome() && !tag.name.containsErrors()) {
                const { colon, val } = tag.arg.unwrap();
                elems.push(colon);
                elems.push(val);
            }
            return elems;
        }).filter(t => t.containsErrors())
            .map(t => t.content())
            .join(ERR_SEP);
        if (errors.length > 0) {
            return errTag(l, errors, r);
        }
        let mbRes = Opt.none();
        for (const pat of TAG_PATS) {
            const tag = matchArgs(this.globals, args, pat);
            if (tag.isSome()) {
                mbRes = tag;
                break;
            }
        }
        let tag;
        if (mbRes.isNone()) {
            tag = errTag(l, `${args[0]?.name.content()} is not a valid tag`, r);
        }
        else {
            const res = mbRes.unwrap();
            if ('err' in res) {
                tag = errTag(l, res.err, r);
            }
            else {
                tag = new Tag(l, res.tag, r);
            }
        }
        return tag;
    }
    num(tokens) { return new Num(tokens); }
    item(pieces) { return new Item(pieces); }
    symErr(s, exp) {
        return new Err('', `found '${s}' but expected ${exp}`, '');
    }
    eoiErr(s) { return new Err('', `reached end of text while looking for ${s}`, ''); }
}
