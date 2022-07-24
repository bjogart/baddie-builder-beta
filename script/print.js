"use strict";
function fmtInlineHd(msg) { return `<span class="inlinehd">${msg}</span>`; }
function fmtRunIn(msg) { return `<span class="runin">${msg}</span>`; }
function fmtEmph(msg) { return `<span class="emph">${msg}</span>`; }
function fmtErr(msg) { return `<span class="err">${msg}</span>`; }
class Dice {
    static make(count, size, plus, diff, err) {
        return new Dice(count, size, plus, diff, err);
    }
    count;
    size;
    plus;
    diff;
    err;
    constructor(count, size, cons, diff, err) {
        this.count = count;
        this.size = size;
        this.plus = cons;
        this.err = err;
        this.diff = diff;
    }
}
class DiceTemplate {
    static empty() { return new DiceTemplate(Opt.none(), Opt.none(), Opt.none()); }
    static fromArgs(args) {
        let val;
        const errors = [];
        let dice = DiceTemplate.empty();
        val = args.get('dcount');
        if (val) {
            const n = readNum(val.unwrap().content()).unwrap();
            if (!isInt(n)) {
                errors.push(fmtErr(`you cannot roll ${n} dice`));
            }
            dice.count = Opt.some(n);
        }
        val = args.get('dsize');
        if (val) {
            const n = readNum(val.unwrap().content()).unwrap();
            if (n <= 0 || !isInt(n)) {
                errors.push(fmtErr(`no such thing as a d${n}`));
            }
            dice.size = Opt.some(n);
        }
        val = args.get('dplus');
        if (val) {
            const n = readNum(val.unwrap().content()).unwrap();
            if (!isInt(n)) {
                errors.push(fmtErr(`${n} should be a whole number`));
            }
            dice.plus = Opt.some(n);
        }
        return errors.length > 0 ? { errors: errors.join(ERR_SEP) } : dice;
    }
    count;
    size;
    plus;
    constructor(count, size, plus) {
        this.count = count;
        this.size = size;
        this.plus = plus;
    }
}
const POLY_DMG_DICE = [6, 8, 4, 10, 12];
function fmtMod(mod) {
    return mod >= 0 ? `+${mod}` : `${mod}`;
}
function cmpAesthetic(a, b) {
    if (a.count > 0 && b.count === 0) {
        return -1;
    }
    else if (b.count > 0 && a.count === 0) {
        return 1;
    }
    const dErr = a.err - b.err;
    if (dErr !== 0) {
        return dErr;
    }
    if (a.plus >= 0 && b.plus < 0) {
        return -1;
    }
    else if (b.plus >= 0 && a.plus < 0) {
        return 1;
    }
    return 0;
}
function renderDice(goal, template) {
    const sizes = template.size.isSome() ? [template.size.unwrap()] : POLY_DMG_DICE;
    return sizes.reduce((best, size) => {
        const mean = size / 2 + 0.5;
        const plusConstr = template.plus.unwrapOr(0);
        const allowance = goal - plusConstr;
        const spaceForPlus = template.plus.isSome() ? 0 : 1;
        let count;
        if (template.count.isNone()) {
            const unrounded = allowance / (mean + spaceForPlus);
            count = plusConstr === 0 ? Math.round(unrounded) : Math.floor(unrounded);
        }
        else {
            count = template.count.unwrap();
        }
        const diceExp = count * mean;
        const plus = template.plus.unwrapOr(Math.round(allowance - diceExp));
        const diff = goal - (diceExp + plus);
        const err = diff * diff;
        const die = Dice.make(count, size, plus, diff, err);
        return cmpAesthetic(best, die) <= 0 ? best : die;
    }, { count: 0, size: 0, plus: 0, diff: 0, err: Number.POSITIVE_INFINITY });
}
function diceMean(dice) {
    const meanRoll = dice.size / 2 + 0.5;
    return dice.count * meanRoll + dice.plus;
}
function printDice(dice) {
    if (dice.count === 0 || dice.size === 0) {
        return `${dice.plus}`;
    }
    const diceFmt = dice.count === 1 ? `d${dice.size}` : `${dice.count}d${dice.size}`;
    let consFmt;
    if (dice.plus === 0) {
        consFmt = '';
    }
    else if (dice.plus < 0) {
        consFmt = `${dice.plus}`;
    }
    else {
        consFmt = `+${dice.plus}`;
    }
    const avg = `${Math.trunc(diceMean(dice))}`;
    return `${avg} (${diceFmt}${consFmt})`;
}
