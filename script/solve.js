"use strict";
function budget(lv, defMul, playerHitMod, baddieHitMod) {
    const entry = STATS.reduce((prev, cur) => Math.abs(prev.lv - lv) <= Math.abs(cur.lv - lv) ? prev : cur);
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
    static empty() { return new Eq(0, 0); }
    static default() { return new Eq(1, 0); }
    static make(fact, term) { return new Eq(fact, term); }
    static fromArgs(args, asInts) {
        const eq = Eq.default();
        const errors = [];
        if (args.has('plus')) {
            dispatchOrCollect(parseNumericArgument(args, 'plus', asInts), n => eq.term += n, errors);
        }
        if (args.has('minus')) {
            dispatchOrCollect(parseNumericArgument(args, 'minus', asInts), n => eq.term -= n, errors);
        }
        if (args.has('times')) {
            dispatchOrCollect(parseNumericArgument(args, 'times', asInts), n => eq.fact *= n, errors);
        }
        if (args.has('divide')) {
            dispatchOrCollect(parseNumericArgument(args, 'divide', asInts), n => { if (n !== 0) {
                eq.fact /= n;
            }
            else {
                errors.push('division by 0');
            } }, errors);
        }
        return errors.length > 0 ? Result.err(errors.join(ERR_SEP)) : Result.ok(eq);
    }
    fact;
    term;
    constructor(fact, term) { this.fact = fact; this.term = term; }
}
function distribute(eqs, budget) {
    return eqs.map(eq => {
        const res = (budget - eq.term) / eq.fact / eqs.length;
        return isNaN(res) || !isFinite(res) ? Opt.none() : Opt.some(res);
    });
}
function validateActions(allEntries, eliteCount) {
    const actions = allEntries.filter(it => it.actionCount > 0);
    const limitedMoves = actions.filter(it => it.usageLimit.isSome());
    const hasFreeMoves = actions.length - limitedMoves.length > 0;
    const limitedMovesUseCount = limitedMoves.reduce((acc, it) => acc + it.usageLimit.unwrap(), 0);
    const expLiveCount = eliteCount * EXP_ROUNDS;
    return allEntries.map(it => {
        const errors = [];
        if (it.actionCount > eliteCount) {
            errors.push(`this move uses too many actions (maximum is ${eliteCount})`);
        }
        if (it.usageLimit.isSome()) {
            if (it.usageLimit.isSome() && limitedMovesUseCount >= expLiveCount) {
                errors.push(`baddie is expected to take around ${expLiveCount} actions, and it has ${limitedMovesUseCount} moves with limited uses; include at least one move without a usage limit`);
            }
            else if (!hasFreeMoves) {
                errors.push(`baddie has no moves without limited uses; include at least one move without a usage limit`);
            }
        }
        return errors;
    });
}
function adjustGlobalEqsByValueType(allEntries) {
    const hasHealingMoves = allEntries.some(it => it.actionCount > 0 && it.localHpEqs.length > 0);
    if (hasHealingMoves) {
        unwrapNullish(allEntries.find(it => it.isHp)).globalHpEq.fact /= (EXP_ROUNDS - 1);
    }
    else {
        unwrapNullish(allEntries.find(it => it.isHp)).globalHpEq.fact /= EXP_ROUNDS;
    }
}
function adjustLocalEqsByValueType(allEntries) {
    allEntries.forEach(it => {
        it.localAcEqs.forEach(eq => eq.fact /= it.localAcEqs.length);
        it.localHitEqs.forEach(eq => eq.fact /= it.localHitEqs.length);
    });
}
function adjustEqsForElite(allEntries, eliteCount) {
    unwrapNullish(allEntries.find(it => it.isHp)).globalHpEq.fact /= eliteCount;
    allEntries.filter(it => it.actionCount > 0).forEach(it => {
        it.globalHpEq.fact /= it.actionCount;
        it.globalDmgEq.fact /= it.actionCount;
    });
}
function adjustEqsForUsageLimits(allEntries, eliteCount) {
    const actions = allEntries.filter(it => it.actionCount > 0);
    const usageCounts = actions.map(it => it.usageLimit.map(l => l * it.actionCount));
    const limitedMoveCount = usageCounts.reduce((acc, it) => acc + it.unwrapOr(0), 0);
    if (limitedMoveCount > 0) {
        const totalMoveCount = EXP_ROUNDS * eliteCount;
        const freeMoveCount = totalMoveCount - limitedMoveCount;
        const sharedPower = freeMoveCount * FRAC_OF_FREE_MOVES_SHARED_WITH_LIMITED_MOVES;
        const limitDistrib = distribute(usageCounts.filter(it => it.isSome()).map(c => Eq.make(c.unwrap(), 0)), 1);
        actions.map(it => {
            const f = it.usageLimit.isSome()
                ? unwrapNullish(limitDistrib.shift()).unwrap() * sharedPower
                : -FRAC_OF_FREE_MOVES_SHARED_WITH_LIMITED_MOVES;
            it.globalHpEq.fact /= 1 + f;
            it.globalDmgEq.fact /= 1 + f;
            return 1 + f;
        });
    }
}
function distributeGlobalBudget(allEntries, budget) {
    const hpEqs = [];
    const dmgEqs = [];
    for (const it of allEntries) {
        hpEqs.push(it.globalHpEq);
        dmgEqs.push(it.globalDmgEq);
    }
    const hpDistrib = distribute(hpEqs, budget.hp * hpEqs.length).map(it => it.unwrapOr(0));
    const dmgDistrib = distribute(dmgEqs, budget.dmg * dmgEqs.length).map(it => it.unwrapOr(0));
    const bs = [];
    for (let i = 0; i < allEntries.length; i++) {
        bs.push({
            hp: hpDistrib.shift(),
            ac: budget.ac,
            dmg: dmgDistrib.shift(),
            hit: budget.hit,
        });
    }
    return bs;
}
function distributeLocalBudget(entry, budget) {
    const optHps = distribute(entry.localHpEqs, budget.hp);
    const optDmgs = distribute(entry.localDmgEqs, budget.dmg);
    const ac = distribute(entry.localAcEqs, budget.ac).map(opt => opt.unwrap());
    const hit = distribute(entry.localHitEqs, budget.hit).map(opt => opt.unwrap());
    const errors = [];
    if (optHps.some(it => it.isNone())) {
        errors.push('division by 0 in hit point distribution');
    }
    if (optDmgs.some(it => it.isNone())) {
        errors.push('division by 0 in damage distribution');
    }
    return {
        ac, hit, errors,
        hp: optHps.map(it => it.unwrap()),
        dmg: optDmgs.map(it => it.unwrap()),
    };
}
