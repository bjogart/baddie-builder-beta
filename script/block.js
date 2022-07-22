"use strict";
function level(it) {
    let s = unwrapNullish(it.textContent);
    return parseInt(s);
}
function decrLv(it) {
    const lvEl = unwrapNullish(it.parentElement?.querySelector('#lv'));
    const lv = level(lvEl);
    if (lv > STATS[0].level) {
        lvEl.textContent = `${lv - 1}`;
        refresh();
    }
}
function incrLv(it) {
    const lvEl = unwrapNullish(it.parentElement?.querySelector('#lv'));
    const lv = level(lvEl);
    if (lv < STATS[STATS.length - 1].level) {
        lvEl.textContent = `${lv + 1}`;
        refresh();
    }
}
function lookupKeywordAndMod(id, map = {}) {
    const elem = unwrapNullish(document.getElementById(id), `no '#${id}' pane`);
    const kw = unwrapNullish(elem.firstChild?.textContent);
    return unwrapNullish(map[kw], `no such keyword: '${kw}'`);
}
function entries() { return document.getElementsByClassName('entry'); }
function cycleKeywords(it, cycle) {
    const kwEl = unwrapNullish(it.firstChild);
    const kw = unwrapNullish(kwEl.textContent);
    const next = unwrapNullish(cycle[kw], `index does not contain '${kw}`);
    kwEl.textContent = next;
    refresh();
}
function newEntry() {
    const node = document.createElement('div');
    node.classList.add('entry');
    node.innerHTML = ENTRY_TEXT_DF;
    return node.firstChild;
}
function appendEntry(entryChild) {
    unwrapNullish(entryChild.parentElement).insertBefore(newEntry(), entryChild);
    refresh();
}
function toggleEntry(entryChild) {
    const parent = unwrapNullish(entryChild.parentElement);
    const toDisp = unwrapNullish(parent.querySelector('.edit'), "entry has no '.edit' pane")
        .classList.toggle('hide');
    unwrapNullish(parent.querySelector('.disp'), "entry has no '.disp' pane")
        .classList.toggle('hide');
    if (toDisp) {
        refresh();
    }
}
function entryMarkupTextContent(entry) {
    const pane = unwrapNullish(entry.querySelector('.edit'), "entry has no '.edit' pane");
    let s = pane.value ?? '';
    if (s.trim().length === 0) {
        if (entry.id.length > 0) {
            s = `[${entry.id}]`;
        }
        else {
            s = '';
        }
    }
    return s;
}
function writeEntryDisp(entry, text) {
    const pane = unwrapNullish(entry.querySelector('.disp'), "entry has no '.edit' pane");
    pane.innerHTML = text;
}
function fmtTitle() {
    const entry = unwrapNullish(document.getElementById('title'));
    const text = unwrapNullish(entry.textContent);
    const splits = text.split(/\s+/);
    splits.reverse();
    unwrapNullish(entry.querySelector('.disp')).replaceChildren(...splits.map(s => {
        const sp = document.createElement('span');
        sp.innerText = s;
        sp.innerText += ' ';
        sp.style.whiteSpace = 'pre-wrap';
        return sp;
    }));
}
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
function refresh() {
    const lvEl = unwrapNullish(document.getElementById("lv"), "no '#lv' pane");
    const { hp, ac, dmg, hit } = budget(level(lvEl), lookupKeywordAndMod('defmul', DEFMUL_MOD), lookupKeywordAndMod('plhit', PLHIT_MOD), lookupKeywordAndMod('bdhit', BDHIT_MOD));
    const builder = new EntryBuilder();
    const entryElems = entries();
    const entriesAndParse = Array.from(entryElems)
        .map(it => {
        const str = entryMarkupTextContent(it);
        const mbParse = str.trim().length === 0
            ? Opt.none() : Opt.some(parse(str, builder));
        return { entry: it, parse: mbParse };
    });
    const hpEqs = entriesAndParse.flatMap(it => it.parse.map(e => e.hp()).unwrapOr([]));
    const acEqs = entriesAndParse.flatMap(it => it.parse.map(e => e.ac()).unwrapOr([]));
    const dmgEqs = entriesAndParse.map(it => it.parse.map(e => e.dmg()).unwrapOr([]));
    const hitEqs = entriesAndParse.flatMap(it => it.parse.map(e => e.hit()).unwrapOr([]));
    const hpDiv = divideDistributable(hpEqs, hp);
    const acDiv = divideTerm(acEqs, ac);
    const hitDiv = divideTerm(hitEqs, hit);
    const entriesParseAndDivs = entriesAndParse.map(it => ({
        entry: it.entry,
        parse: it.parse,
        divs: { hp: hpDiv, ac: acDiv, dmg: divideDistributable(dmgEqs.shift(), dmg), hit: hitDiv }
    }));
    const entriesToUpdate = [];
    entriesParseAndDivs.forEach(it => {
        if (it.parse.isNone()) {
            it.entry.remove();
        }
        else {
            entriesToUpdate.push(it);
        }
    });
    entriesToUpdate.forEach(it => writeEntryDisp(it.entry, it.parse.unwrap().fmt(it.divs)));
    fmtTitle();
}
