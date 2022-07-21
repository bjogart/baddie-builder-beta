"use strict";
function fmtInlineHd(msg) { return `<span class="inlinehd">${msg}</span>`; }
function fmtRunIn(msg) { return `<span class="runin">${msg}</span>`; }
function fmtEmph(msg) { return `<span class="emph">${msg}</span>`; }
function fmtErr(msg) { return `<span class="err">${msg}</span>`; }
function fmtToDigits(n, digits) {
    const splits = `${n}`.split('.');
    return splits.length > 1 ? `${splits[0]}.${splits[1].substring(0, digits)}` : splits[0];
}
class Dice {
    static make(count, size, cons, diff, err) {
        return new Dice(count, size, cons, diff, err);
    }
    count;
    size;
    cons;
    diff;
    err;
    constructor(count, size, cons, diff, err) {
        this.count = count;
        this.size = size;
        this.cons = cons;
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
function printMod(mod) {
    const intMod = Math.round(mod);
    return intMod >= 0 ? `+${intMod}` : `${intMod}`;
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
    if (a.cons >= 0 && b.cons < 0) {
        return -1;
    }
    else if (b.cons >= 0 && a.cons < 0) {
        return 1;
    }
    return 0;
}
function renderDice(goal, temp) {
    const sizes = temp.size.isSome() ? [temp.size.unwrap()] : POLY_DMG_DICE;
    return sizes.reduce((best, size) => {
        const mean = size / 2 + 0.5;
        const allowance = goal - temp.plus.unwrapOr(0);
        const count = temp.count.unwrapOr(Math.floor(allowance / mean));
        const diceExp = count * mean;
        const cons = temp.plus.unwrapOr(Math.round(allowance - diceExp));
        const diff = goal - (diceExp + cons);
        const err = diff * diff;
        const die = Dice.make(count, size, cons, diff, err);
        return cmpAesthetic(best, die) <= 0 ? best : die;
    }, { count: 0, size: 0, cons: 0, diff: 0, err: Number.POSITIVE_INFINITY });
}
function diceMean(dice) {
    const meanRoll = dice.size / 2 + 0.5;
    return dice.count * meanRoll + dice.cons;
}
function printDice(dice) {
    if (dice.count === 0 || dice.size === 0) {
        return `${dice.cons}`;
    }
    const diceFmt = dice.count === 1 ? `d${dice.size}` : `${dice.count}d${dice.size}`;
    let consFmt;
    if (dice.cons === 0) {
        consFmt = '';
    }
    else if (dice.cons < 0) {
        consFmt = `${dice.cons}`;
    }
    else {
        consFmt = `+${dice.cons}`;
    }
    const avg = `${Math.trunc(diceMean(dice))}`;
    return `${avg} (${diceFmt}${consFmt})`;
}
