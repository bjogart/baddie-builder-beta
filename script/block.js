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
            if (entry.id === 'hp') {
                s += ' [uses: 1]';
            }
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
function rewrapTitle() {
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
function refresh() {
    const lvEl = unwrapNullish(document.getElementById("lv"), "no '#lv' pane");
    const { hp, ac, dmg, hit } = budget(level(lvEl), lookupKeywordAndMod('defmul', DEFMUL_MOD), lookupKeywordAndMod('plhit', PLHIT_MOD), lookupKeywordAndMod('bdhit', BDHIT_MOD));
    const builder = new EntryBuilder();
    const entryElems = entries();
    const entriesAndParse = Array.from(entryElems).map(it => {
        const str = entryMarkupTextContent(it);
        const mbParse = str.trim().length === 0 ? Opt.none() : Opt.some(parse(str, builder));
        return { entry: it, parse: mbParse };
    });
    const usageTags = entriesAndParse.flatMap(it => flattenOpt(it.parse.map(it => it.uses().map(uses => ({
        uses,
        hasHp: it.containsHpTags(),
        hasDmg: it.containsDmgTags(),
    })))));
    const [hpTotalUseCount, dmgTotalUseCount, dmgUsageTagCount] = usageTags.reduce((res, c) => {
        if (c.isSome()) {
            const { uses, hasHp, hasDmg } = c.unwrap();
            if (hasHp) {
                res[0] += uses;
                res[2] += 1;
            }
            if (hasDmg) {
                res[1] += uses;
                res[3] += 1;
            }
        }
        return res;
    }, [0, 0, 0, 0]);
    const normVecs = usageTags.map(c => c.map(c => [
        c.uses / hpTotalUseCount,
        c.uses * dmgUsageTagCount / dmgTotalUseCount
    ]));
    for (const it of entriesAndParse) {
        if (it.parse.isNone()) {
            it.entry.remove();
            continue;
        }
        const parse = it.parse.unwrap();
        const hpEqs = parse.hp();
        const acEqs = parse.ac();
        const dmgEqs = parse.dmg();
        const hitEqs = parse.hit();
        acEqs.forEach(eq => eq.fact /= acEqs.length);
        hitEqs.forEach(eq => eq.fact /= hitEqs.length);
        const norms = unwrapNullish(normVecs.shift()).unwrapOr([0, 0]);
        const hpNorm = unwrapNullish(norms[0]);
        const dmgNorm = unwrapNullish(norms[1]);
        const divs = {
            hp: distribute(hpEqs, hp * hpNorm),
            ac: distribute(acEqs, ac).map(opt => opt.unwrap()),
            dmg: distribute(dmgEqs, dmg * dmgNorm),
            hit: distribute(hitEqs, hit).map(opt => opt.unwrap()),
        };
        const fmt = it.parse.unwrap().fmt(divs);
        writeEntryDisp(it.entry, fmt);
    }
    rewrapTitle();
}
