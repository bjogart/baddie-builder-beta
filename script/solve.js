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
    static fromArgs(args) {
        const eq = new Eq();
        const errors = [];
        let val;
        let n;
        val = args.get('plus');
        if (val) {
            n = readNum(val.unwrap().content()).unwrap();
            eq.addTerm(n);
        }
        val = args.get('minus');
        if (val) {
            n = readNum(val.unwrap().content()).unwrap();
            eq.addTerm(-n);
        }
        val = args.get('times');
        if (val) {
            n = readNum(val.unwrap().content()).unwrap();
            eq.addFact(n);
        }
        val = args.get('divide');
        if (val) {
            n = readNum(val.unwrap().content()).unwrap();
            if (n === 0) {
                errors.push(fmtErr('division by 0'));
            }
            else {
                eq.addFact(1 / n);
            }
        }
        val = args.get('uses');
        if (val) {
            n = readNum(val.unwrap().content()).unwrap();
            if (n === 0) {
                eq.weight = 0;
            }
            else {
                eq.addWeight(1 / n);
            }
        }
        return errors.length > 0 ? { errors: errors.join(ERR_SEP) } : eq;
    }
    weight;
    fact;
    term;
    constructor() { this.weight = 1; this.fact = 1; this.term = 0; }
    addTerm(term) { this.term += term; }
    addWeight(weight) { this.weight *= weight; }
    addFact(fact) { this.fact *= fact; }
}
function divideDistributable(eqs, budget) {
    const norm = eqs.reduce((res, eq) => res + eq.weight, 0);
    return eqs.map(eq => {
        const inv = eq.weight / norm;
        return isNaN(inv) || !isFinite(inv)
            ? Opt.none()
            : Opt.some((inv * budget - eq.term) / eq.fact);
    });
}
function divideTerm(eqs, rhs) {
    return eqs.map(eq => rhs - eq.term);
}
