"use strict";
function fmtTagHd(msg) { return `<span class="taghd">${msg}</span>`; }
function fmtBold(msg) { return `<strong>${msg}</strong>`; }
function fmtErr(msg) { return `<span class="err">${msg}</span>`; }
function fmtCounter(lv) { return lv >= 0 ? `${lv}` : `&minus;${Math.abs(lv)}`; }
function fmtMod(mod) { return mod >= 0 ? `+${mod}` : `&minus;${Math.abs(mod)}`; }
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
    static make(count, size, plusOrWeight) { return new DiceTemplate(count, size, plusOrWeight); }
    static empty() { return new DiceTemplate(Opt.none(), Opt.none(), Result.err(1)); }
    static fromArgs(args, init) {
        const errors = [];
        const dice = init.unwrapOr(DiceTemplate.empty());
        if (args.has('dcount')) {
            dispatchOrCollect(parseNumericArgument(args, 'dcount', true), n => {
                if (n >= 0) {
                    dice.count = Opt.some(n);
                }
                else {
                    errors.push(`cannot roll a negative number of dice`);
                }
            }, errors);
        }
        if (args.has('dsize')) {
            dispatchOrCollect(parseNumericArgument(args, 'dsize', true), n => {
                if (n > 0) {
                    dice.size = Opt.some(n);
                }
                else {
                    errors.push(`no such thing as a d${n}`);
                }
            }, errors);
        }
        if (args.has('dplus')) {
            dispatchOrCollect(parseNumericArgument(args, 'dplus', true), n => {
                dice.plus = Opt.some(n);
                dice.plusWeight = Opt.none();
            }, errors);
        }
        return errors.length > 0 ? Result.err(errors.join(ERR_SEP)) : Result.ok(dice);
    }
    count;
    size;
    plus;
    plusWeight;
    constructor(count, size, plusOrWeight) {
        this.count = count;
        this.size = size;
        if (plusOrWeight.isOk()) {
            this.plus = Opt.some(plusOrWeight.unwrap());
            this.plusWeight = Opt.none();
        }
        else {
            this.plus = Opt.none();
            this.plusWeight = Opt.some(plusOrWeight.unwrapErr());
        }
    }
}
const POLY_DMG_DICE = [6, 8, 10, 4, 12];
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
        const spaceForPlus = template.plus.isSome() ? 0 : template.plusWeight.unwrap();
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
    const countFmt = dice.count < 0 ? `&minus;${Math.abs(dice.count)}` : `${dice.count}`;
    const diceFmt = `${countFmt}d${dice.size}`;
    let consFmt;
    if (dice.plus === 0) {
        consFmt = '';
    }
    else if (dice.plus < 0) {
        consFmt = `&minus;${Math.abs(dice.plus)}`;
    }
    else {
        consFmt = `+${dice.plus}`;
    }
    const avg = `${Math.trunc(diceMean(dice))}`;
    return `${avg} (${diceFmt}${consFmt})`;
}
