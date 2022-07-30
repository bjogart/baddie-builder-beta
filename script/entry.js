"use strict";
function dispatchOrErr(r, ctor) {
    return r.isErr() ? new Err('', r.unwrapErr(), '') : ctor(r.unwrap());
}
function effCtor(gs, as, lbl) {
    return dispatchOrErr(Eq.fromArgs(as), eq => {
        const get = (gs) => gs.effModSum;
        const set = (gs, n) => gs.effModSum -= n;
        const prof = (as.has('prof') ? Opt.some(-gs.prof) : Opt.some(0)).map(p => p - 14);
        const val = new DefVal(eq, prof);
        const entry = new ZeroSum(gs, get, set, eq, val, 'effective saves');
        return new Lbl(`${fmtTagHd(lbl)}&nbsp;`, '', entry);
    });
}
const TAG_PATS = [
    {
        name: 'dmg',
        argPats: new Map([
            ['dmg', []], ['plus', [NUM]], ['minus', [NUM]], ['times', [NUM]], ['divide', [NUM]],
            ['dcount', [NUM]], ['dsize', [NUM]], ['dplus', [NUM]], ['heal', []],
        ]),
        ctor: (_gs, as) => dispatchOrErr(Eq.fromArgs(as), eq => dispatchOrErr(DiceTemplate.fromArgs(as), temp => as.has('heal')
            ? new HpOrDmgVal(Opt.some(eq.modified(EXP_ROUNDS, 0)), Opt.none(), temp, false)
            : new HpOrDmgVal(Opt.none(), Opt.some(eq), temp, false))),
    },
    {
        name: 'hit',
        argPats: new Map([['hit', []], ['vs', [IDENT]], ['plus', [NUM]], ['minus', [NUM]]]),
        ctor: (_gs, as) => dispatchOrErr(Eq.fromArgs(as), eq => {
            const target = (as.get('vs') ?? Opt.none()).map(v => v.s).unwrapOr('ac').toLowerCase();
            return new Lbl('', ` vs. ${fmtTagHd(target)}`, new AcOrHitMod(Opt.none(), Opt.some(eq), true));
        }),
    },
    {
        name: 'actions',
        argPats: new Map([['actions', [NUM]], ['concentration', []]]),
        ctor: (_gs, as) => {
            const mbN = readNum(unwrapNullish(as.get('actions')).unwrap().content());
            const n = mbN.isSome()
                ? Result.ok(mbN.unwrap())
                : Result.err(`unreadable number ${as.get('actions')?.unwrap()}`);
            return dispatchOrErr(n, n => n < 0
                ? new Err('', `got '${n}' which is not a valid number of actions`, '')
                : new ActionProperties(n, as.has('concentration')));
        }
    },
    {
        name: 'hp',
        argPats: new Map([
            ['hp', []], ['plus', [NUM]], ['minus', [NUM]], ['times', [NUM]], ['divide', [NUM]],
            ['dcount', [NUM]], ['dsize', [NUM]], ['dplus', [NUM]],
        ]),
        ctor: (gs, as) => dispatchOrErr(Eq.fromArgs(as), eq => dispatchOrErr(DiceTemplate.fromArgs(as), temp => {
            if (temp.size.isNone()) {
                temp.size = Opt.some(unwrapNullish(SIZE_HD[gs.size]));
            }
            const entry = new HpOrDmgVal(Opt.some(eq), Opt.none(), temp, false);
            return new Lbl(fmtTagHd('hp&nbsp;'), '', entry);
        })),
    },
    {
        name: 'ac',
        argPats: new Map([['ac', []], ['plus', [NUM]], ['minus', [NUM]]]),
        ctor: (_gs, as) => dispatchOrErr(Eq.fromArgs(as), eq => new Lbl(fmtTagHd('ac&nbsp;'), '', new DefVal(eq, Opt.none()))),
    },
    {
        name: 'mv',
        argPats: new Map([
            ['mv', []], ['walk', [NUM]], ['climb', [NUM]], ['fly', [NUM]],
            ['swim', [NUM]]
        ]),
        ctor: (_gs, as) => new Lbl(fmtTagHd('mv&nbsp;'), '', new Mv(as)),
    },
    {
        name: 'str',
        argPats: new Map([['str', []], ['plus', [NUM]], ['minus', [NUM]], ['prof', []]]),
        ctor: (gs, as) => effCtor(gs, as, 'str'),
    },
    {
        name: 'dex',
        argPats: new Map([['dex', []], ['plus', [NUM]], ['minus', [NUM]], ['prof', []]]),
        ctor: (gs, as) => effCtor(gs, as, 'dex'),
    },
    {
        name: 'con',
        argPats: new Map([['con', []], ['plus', [NUM]], ['minus', [NUM]], ['prof', []]]),
        ctor: (gs, as) => effCtor(gs, as, 'con'),
    },
    {
        name: 'int',
        argPats: new Map([['int', []], ['plus', [NUM]], ['minus', [NUM]], ['prof', []]]),
        ctor: (gs, as) => effCtor(gs, as, 'int'),
    },
    {
        name: 'wis',
        argPats: new Map([['wis', []], ['plus', [NUM]], ['minus', [NUM]], ['prof', []]]),
        ctor: (gs, as) => effCtor(gs, as, 'wis'),
    },
    {
        name: 'cha',
        argPats: new Map([['cha', []], ['plus', [NUM]], ['minus', [NUM]], ['prof', []]]),
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
    _actionProps;
    constructor(items) {
        this.items = items;
        this._actionProps = this.items.map(it => it.actions()).filter(it => it.isSome()).map(it => it.unwrap());
    }
    ty() { return 'item'; }
    containsErrors() {
        return this.items.reduce((b, it) => b || it.containsErrors(), false)
            && this._actionProps.length <= 1;
    }
    actions() {
        return this._actionProps.length === 1 ? Opt.some(this._actionProps[0]) : Opt.none();
    }
    isLimited() { return this.items.some(it => it.isLimited()); }
    hp() { return this.items.flatMap(it => it.hp()); }
    ac() { return this.items.flatMap(it => it.ac()); }
    dmg() { return this.items.flatMap(it => it.dmg()); }
    hit() { return this.items.flatMap(it => it.hit()); }
    fmt(ds) {
        let endOfHeader = this.items.findIndex(it => match(it.content(), PUNCT));
        const hdFmts = [];
        const fmts = [];
        const errs = [];
        const actionProps = this.actions().map(ps => ps.fmt).unwrapOr('');
        this.items.forEach((it, idx) => {
            let fmt = it.fmt(ds);
            if (idx === endOfHeader && actionProps.length > 0) {
                fmt = ` ${actionProps}${fmt}`;
            }
            idx > endOfHeader ? fmts.push(fmt) : hdFmts.push(fmt);
        });
        if (this._actionProps.length > 1) {
            errs.push(`too many [actions] tags (expected 1 at most)`);
        }
        const errorMsgs = errs.length === 0 ? '' : ` ${errs.map(fmtErr).join(ERR_SEP)}`;
        return `${fmtTagHd(hdFmts.join(''))}${fmts.join('')}${errorMsgs}`;
    }
    content() { return this.items.map(it => it.content()).join(''); }
    triviaBefore() { return this.items[0]?.triviaBefore() ?? ''; }
    triviaAfter() { return this.items[this.items.length - 1]?.triviaAfter() ?? ''; }
}
class Tag {
    l;
    entry;
    r;
    constructor(l, entry, r) {
        this.l = l;
        this.entry = entry;
        this.r = r;
    }
    ty() { return 'tag'; }
    containsErrors() { return this.l.containsErrors() || this.entry.containsErrors() || this.r.containsErrors(); }
    actions() { return this.entry.actions(); }
    isLimited() { return this.entry.isLimited(); }
    hp() { return this.containsErrors() ? [] : this.entry.hp(); }
    ac() { return this.containsErrors() ? [] : this.entry.ac(); }
    dmg() { return this.containsErrors() ? [] : this.entry.dmg(); }
    hit() { return this.containsErrors() ? [] : this.entry.hit(); }
    fmt(ds) {
        const lWs = this.l.triviaBefore();
        const rWs = this.r.triviaAfter();
        const msg = this.containsErrors()
            ? `[${[this.l, this.entry, this.r].filter(it => it.containsErrors())
                .map(it => it.fmt(ds))
                .join(ERR_SEP)}]`
            : this.entry.fmt(ds);
        return `${lWs}${msg}${rWs}`;
    }
    content() {
        return [this.l, this.entry, this.r].reduce((s, it) => s.concat(it.content()), '');
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
    actions() { return this.entry.actions(); }
    isLimited() { return this.entry.isLimited(); }
    hp() { return this.entry.hp(); }
    ac() { return this.entry.ac(); }
    dmg() { return this.entry.dmg(); }
    hit() { return this.entry.hit(); }
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
    actions() { return this.entry.actions(); }
    isLimited() { return this.entry.isLimited(); }
    hp() { return this.entry.hp(); }
    ac() { return this.entry.ac(); }
    dmg() { return this.entry.dmg(); }
    hit() { return this.entry.hit(); }
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
    actions() { return this.entry.actions(); }
    isLimited() { return this.entry.isLimited(); }
    hp() { return this.entry.hp(); }
    ac() { return this.entry.ac(); }
    dmg() { return this.entry.dmg(); }
    hit() { return this.entry.hit(); }
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
class DefVal {
    _ac;
    modAdj;
    constructor(eff, prof) { this._ac = eff; this.modAdj = prof; }
    ty() { return 'defVal'; }
    containsErrors() { return false; }
    actions() { return Opt.none(); }
    isLimited() { return false; }
    hp() { return []; }
    ac() { return [this._ac]; }
    dmg() { return []; }
    hit() { return []; }
    fmt(ds) {
        const eff = unwrapNullish(ds.ac.shift());
        const mod = this.modAdj.isSome()
            ? `${fmtMod(eff + this.modAdj.unwrap())}&nbsp;${EFF_SHIELD}`
            : '';
        return `${mod}${eff}`;
    }
    content() { return 'defVal'; }
    triviaBefore() { return ''; }
    triviaAfter() { return ''; }
}
class AcOrHitMod {
    _ac;
    _hit;
    emph;
    constructor(ac, hit, emph) {
        this._ac = ac;
        this._hit = hit;
        this.emph = emph;
    }
    ty() { return 'acOrHitMod'; }
    containsErrors() { return false; }
    actions() { return Opt.none(); }
    isLimited() { return false; }
    hp() { return []; }
    ac() { return this._ac.toList(); }
    dmg() { return []; }
    hit() { return this._hit.toList(); }
    fmt(ds) {
        const div = this._ac.isSome() ? ds.ac : ds.hit;
        const val = unwrapNullish(div.shift());
        const res = fmtMod(val);
        return this.emph ? fmtBold(res) : res;
    }
    content() { return 'mod'; }
    triviaBefore() { return ''; }
    triviaAfter() { return ''; }
}
class HpOrDmgVal {
    _hp;
    _dmg;
    dTemplate;
    boldValue;
    constructor(hp, dmg, dTemp, boldValue) {
        this._hp = hp;
        this._dmg = dmg;
        this.dTemplate = dTemp;
        this.boldValue = boldValue;
    }
    ty() { return 'hpOrDmgVal'; }
    containsErrors() { return false; }
    actions() { return Opt.none(); }
    isLimited() { return false; }
    hp() { return this._hp.toList(); }
    ac() { return []; }
    dmg() { return this._dmg.toList(); }
    hit() { return []; }
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
        return this.boldValue ? fmtBold(res) : res;
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
    actions() { return Opt.none(); }
    isLimited() { return false; }
    hp() { return []; }
    ac() { return []; }
    dmg() { return []; }
    hit() { return []; }
    fmt(_ds) {
        return [this.walk, this.climb, this.fly, this.swim, this.err]
            .filter(s => s.length > 0)
            .join(', ');
    }
    content() { return 'mv'; }
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
    actions() { return Opt.none(); }
    isLimited() { return false; }
    hp() { return []; }
    ac() { return []; }
    dmg() { return []; }
    hit() { return []; }
    fmt(_ds) { return this.content(); }
    content() { return this.s; }
    triviaBefore() { return this._triviaBefore; }
    triviaAfter() { return this._triviaAfter; }
}
class ActionProperties {
    n;
    concentration;
    constructor(n, concentration) { this.n = n; this.concentration = concentration; }
    ty() { return 'actions'; }
    containsErrors() { return false; }
    actions() { return Opt.some({ nActions: this.n, fmt: this.content() }); }
    isLimited() { return false; }
    hp() { return []; }
    ac() { return []; }
    dmg() { return []; }
    hit() { return []; }
    fmt(_ds) {
        return '';
    }
    content() {
        const props = [];
        if (this.n > 1) {
            props.push(`${this.n} actions`);
        }
        if (this.concentration) {
            props.push('C');
        }
        const propsFmt = props.join(', ');
        return `(${propsFmt})`;
    }
    triviaBefore() { return ''; }
    triviaAfter() { return ''; }
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
    actions() { return Opt.none(); }
    isLimited() { return false; }
    hp() { return []; }
    ac() { return []; }
    dmg() { return []; }
    hit() { return []; }
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
    actions() { return Opt.none(); }
    isLimited() { return false; }
    hp() { return []; }
    ac() { return []; }
    dmg() { return []; }
    hit() { return []; }
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
                    err = Opt.some(`expected ${it.pat.join(' or ')} but got '${a.content()}'`);
                }
            }
            else {
                err = Opt.some(`did not expect an argument but got '${a.content()}'`);
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
    constructor(lv, size) {
        this.globals = {
            effModSum: 0,
            prof: Math.min(6, Math.max(0, Math.ceil(lv / 4) + 1)),
            size,
        };
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
        return new Err('', `got '${s}' but expected ${exp}`, '');
    }
    eoiErr(s) { return new Err('', `reached end of text while looking for ${s}`, ''); }
}
