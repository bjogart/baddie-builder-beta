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
function lookupKeyword(id) {
    const elem = unwrapNullish(document.getElementById(id), `no '#${id}' pane`);
    return unwrapNullish(elem.firstChild?.textContent);
}
function entries() { return document.getElementsByClassName('entry'); }
function cycleKeywords(it, cycle) {
    const kwEl = unwrapNullish(it.firstChild);
    const kw = unwrapNullish(kwEl.textContent);
    const next = unwrapNullish(cycle[kw], `index does not contain '${kw}`);
    kwEl.textContent = next;
    refresh();
}
function newEntry(initialText = '[uses: 1] Slam. [hit]; [dmg] bludgeoning.') {
    const entry = Object.assign(document.createElement('div'), {
        innerHTML: `<div class="entry medbr act">
<div class="disp" onclick="toggleEntry(this)">
</div><textarea class="edit hide" onblur="toggleEntry(this)" autocomplete="off">${initialText}</textarea>
</div>`
    }).firstChild;
    return entry;
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
    let s = pane.value;
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
    const pane = unwrapNullish(entry.querySelector('.disp'), "entry has no '.disp' pane");
    pane.innerHTML = text;
}
function computeNormVectors(entriesAndParse) {
    const usageTags = entriesAndParse
        .flatMap(it => flattenOpt(it.parse.map(it => it.uses().map(uses => ({
        uses, hasHp: it.containsHpTags(), hasDmg: it.containsDmgTags()
    })))));
    const [hpTotalUseCount, dmgTotalUseCount, dmgUsageTagCount] = usageTags.reduce((res, c) => {
        if (c.isSome()) {
            const { uses, hasHp, hasDmg } = c.unwrap();
            if (hasHp) {
                res[0] += uses;
            }
            if (hasDmg && uses > 0) {
                res[1] += uses;
                res[2] += 1;
            }
        }
        return res;
    }, [0, 0, 0]);
    return {
        vectors: usageTags.map(c => c.map(c => [
            c.uses / hpTotalUseCount,
            c.uses * dmgUsageTagCount / dmgTotalUseCount,
        ])),
        errors: [{ lbl: 'hp', val: hpTotalUseCount - 1 }, { lbl: 'damage', val: dmgTotalUseCount }]
            .filter(it => it.val > MAX_USES)
            .map(it => ` out of ${it.lbl} uses (max. ${MAX_USES})`)
    };
}
function appendErrors(errors, entries) {
    const errEntries = errors.map(err => new Err('', err, ''));
    for (let idx = entries.length - 1; idx >= 0; idx--) {
        const entry = unwrapNullish(entries[idx]);
        if (entry.parse.isSome()) {
            const it = entry.parse.unwrap();
            for (const err of errEntries) {
                it.items.push(err);
            }
            return;
        }
    }
}
function rewrapTitle() {
    const entry = unwrapNullish(document.getElementById('title'));
    const text = unwrapNullish(entry.textContent);
    const splits = text.split(/\s+/);
    splits.reverse();
    unwrapNullish(entry.querySelector('.disp')).replaceChildren(...splits.map(s => {
        const sp = Object.assign(document.createElement('span'), { innerText: `${s} ` });
        sp.style.whiteSpace = 'pre-wrap';
        return sp;
    }));
}
function saveEntries() {
    const data = Array.from(entries())
        .map(it => ({ id: it.id, text: entryMarkupTextContent(it) }))
        .filter(it => it.text.length > 0);
    const lv = unwrapNullish(document.getElementById('lv')).textContent;
    if (lv !== null) {
        data.push({ id: 'lv', text: lv });
    }
    const type = unwrapNullish(document.getElementById('type')?.querySelector('.edit')).value;
    data.push({ id: 'type', text: type });
    const size = lookupKeyword('size');
    if (size !== null) {
        data.push({ id: 'size', text: size });
    }
    ;
    const bdhit = lookupKeyword('bdhit');
    if (bdhit !== null) {
        data.push({ id: 'bdhit', text: bdhit });
    }
    ;
    const plhit = lookupKeyword('plhit');
    if (plhit !== null) {
        data.push({ id: 'plhit', text: plhit });
    }
    ;
    const defmul = lookupKeyword('defmul');
    if (defmul !== null) {
        data.push({ id: 'defmul', text: defmul });
    }
    ;
    const obj = { version: FILE_VERSION, actions: [] };
    for (const it of data) {
        if (it.id.length > 0) {
            obj[it.id] = it.text;
        }
        else {
            obj.actions.push(it.text);
        }
    }
    const pane = unwrapNullish(document.getElementById('title')?.querySelector('.edit'));
    const title = pane.value;
    const filename = titleToFileName(title);
    downloadJson(obj, filename);
}
function loadEntries() {
    loadJson(obj => {
        if (!('version' in obj) || obj['version'] !== FILE_VERSION) {
            throw `invalid version '${obj['version']}'(expected '${FILE_VERSION}')`;
        }
        const lv = obj['lv'] ?? LEVEL_1;
        unwrapNullish(document.getElementById('lv')).textContent = lv;
        const type = obj['type'] ?? CREATURE_TYPE_HUMANOID;
        unwrapNullish(document.getElementById('type')?.querySelector('.edit')).value = type;
        const size = obj['size'] ?? SIZE_MEDIUM;
        unwrapNullish(document.getElementById('size')?.firstChild).textContent = size;
        const bdhit = obj['bdhit'] ?? BDHIT_MID;
        unwrapNullish(document.getElementById('bdhit')?.firstChild).textContent = bdhit;
        const plhit = obj['plhit'] ?? PLHIT_MID;
        unwrapNullish(document.getElementById('plhit')?.firstChild).textContent = plhit;
        const defmul = obj['defmul'] ?? DEFMUL_MID;
        unwrapNullish(document.getElementById('defmul')?.firstChild).textContent = defmul;
        const namedEntries = ['title', 'hp', 'ac', 'mv', 'str', 'dex', 'con', 'int', 'wis', 'cha'];
        for (const id of namedEntries) {
            const edit = unwrapNullish(document.getElementById(id)?.querySelector('.edit'), `no '${id}' pane, or invalid substructure`);
            edit.value = obj[id] ?? '';
        }
        const actionPane = unwrapNullish(document.getElementById('actions'), "no '#actions' pane");
        for (const c of actionPane.children) {
            if (c.id.length === 0)
                actionPane.removeChild(c);
        }
        const actions = obj['actions'] ?? [];
        for (const a of actions) {
            actionPane.appendChild(newEntry(a));
        }
        refresh();
    });
}
function refresh() {
    const lvEl = unwrapNullish(document.getElementById("lv"), "no '#lv' pane");
    const { hp, ac, dmg, hit } = budget(level(lvEl), unwrapNullish(DEFMUL_MOD[lookupKeyword('defmul')]), unwrapNullish(PLHIT_MOD[lookupKeyword('plhit')]), unwrapNullish(BDHIT_MOD[lookupKeyword('bdhit')]));
    const builder = new EntryBuilder();
    const entryElems = entries();
    const entriesAndParse = Array.from(entryElems).map(it => {
        const str = entryMarkupTextContent(it);
        const mbParse = str.trim().length === 0 ? Opt.none() : Opt.some(parse(str, builder));
        return { entry: it, parse: mbParse };
    });
    const { vectors: normVecs, errors: normErrors } = computeNormVectors(entriesAndParse);
    if (normErrors.length > 0) {
        appendErrors(normErrors, entriesAndParse);
    }
    for (const it of entriesAndParse) {
        const mbNorms = unwrapNullish(normVecs.shift());
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
        const norms = mbNorms.unwrapOr([0, 0]);
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
