"use strict";
function budget(lv, defMul, playerHitMod, baddieHitMod) {
    const entry = STATS.reduce((prev, cur) => Math.abs(prev.level - lv) <= Math.abs(cur.level - lv) ? prev : cur);
    const endurance = entry.hp / PLAYER_HIT * defMul;
    const playerHit = PLAYER_HIT - playerHitMod;
    const hp = endurance * playerHit;
    const ac = entry.ac + (playerHitMod / HIT_INCR);
    const ferocity = entry.dmg * BADDIE_HIT * (1.0 / defMul);
    const baddieHit = BADDIE_HIT + baddieHitMod;
    const dmg = ferocity / baddieHit;
    const hit = entry.hit + (baddieHitMod / HIT_INCR);
    return { hp, ac, dmg, hit };
}
class Eq {
    static make() { return new Eq(); }
    static fromArgs(args) {
        const eq = new Eq();
        const errors = [];
        let val;
        let n;
        val = args.get('plus');
        if (val) {
            n = readNum(val.unwrap().content()).unwrap();
            eq.term += n;
        }
        val = args.get('minus');
        if (val) {
            n = readNum(val.unwrap().content()).unwrap();
            eq.term -= n;
        }
        val = args.get('times');
        if (val) {
            n = readNum(val.unwrap().content()).unwrap();
            eq.fact *= n;
        }
        val = args.get('divide');
        if (val) {
            n = readNum(val.unwrap().content()).unwrap();
            if (n === 0) {
                errors.push(fmtErr('division by 0'));
            }
            else {
                eq.fact /= n;
            }
        }
        return errors.length > 0 ? { errors: errors.join(ERR_SEP) } : eq;
    }
    fact;
    term;
    constructor() { this.fact = 1; this.term = 0; }
}
function distribute(eqs, budget) {
    return eqs.map(eq => {
        const res = (budget - eq.term) / eq.fact / eqs.length;
        return isNaN(res) || !isFinite(res) ? Opt.none() : Opt.some(res);
    });
}
