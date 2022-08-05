"use strict";
function parseCounter(it) {
    const toggler = it.parentElement?.parentElement?.previousSibling;
    if (toggler && toggler.classList.contains('off')) {
        return 1;
    }
    let s = unwrapNullish(it.innerHTML);
    return parseInt(s.replaceAll('\u2212', '-'));
}
function adjCounter(it, by, min, max) {
    const el = unwrapNullish(it.parentElement?.querySelector('.val'));
    const val = parseCounter(el);
    const newVal = val + by;
    if (newVal >= min && newVal <= max) {
        el.innerHTML = fmtCounter(newVal);
        refresh();
        return newVal;
    }
    else {
        return val;
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
function newEntry(initialText = 'Slam. [hit], [dmg] bludgeoning.') {
    const entry = Object.assign(document.createElement('div'), {
        innerHTML: `<div class="entry medbr action">
<div class="disp" onclick="toggleEntry(this)"></div>
<div class="edit hide" contenteditable onblur="toggleEntry(this)" autocomplete="off">${initialText}</div>
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
function toggleButton(toggler) {
    const b = unwrapNullish(toggler.previousSibling, "toggler without '.fold'");
    if (b.style.maxWidth) {
        b.style.maxWidth = '';
    }
    else {
        b.style.maxWidth = b.scrollWidth + 'px';
    }
    toggler.classList.toggle('off');
    refresh();
}
function adjEliteCounter(toggler, adj) {
    const res = adjCounter(toggler, adj, MIN_ELITE_TURNS, MAX_ELITE_TURNS);
    if (res === 1 || res === 2 && Math.sign(adj) > 0) {
        toggleButton(toggler);
    }
}
function entryMarkupTextContent(entry) {
    const pane = unwrapNullish(entry.querySelector('.edit'), "entry has no '.edit' pane");
    let s = pane.innerText;
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
    if (text.trim().length === 0) {
        text = fmtErr('Empty block');
    }
    const pane = unwrapNullish(entry.querySelector('.disp'), "entry has no '.disp' pane");
    pane.innerHTML = text;
}
function rewrapTitle() {
    const entry = unwrapNullish(document.getElementById('title'));
    const text = unwrapNullish(entry.innerText);
    const splits = text.split(/\s+/);
    splits.reverse();
    unwrapNullish(entry.querySelector('.disp')).replaceChildren(...splits.map(s => {
        const sp = Object.assign(document.createElement('span'), { innerText: `${s} ` });
        sp.style.whiteSpace = 'pre-wrap';
        return sp;
    }));
}
function saveEntries(button) {
    let err = false;
    const data = Array.from(entries())
        .map(it => ({ id: it.id, classes: it.classList, text: entryMarkupTextContent(it) }))
        .filter(it => it.text.length > 0);
    const lv = unwrapNullish(document.getElementById('lv')).textContent;
    if (lv !== null) {
        data.push({ id: 'lv', text: lv });
    }
    const actionCount = unwrapNullish(document.getElementById('actionCount')).textContent;
    if (actionCount !== null) {
        data.push({ id: 'actionCount', text: actionCount });
    }
    const type = unwrapNullish(document.getElementById('type')?.querySelector('.edit')).innerText;
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
    const obj = new BlockJson(FILE_VERSION);
    for (const it of data) {
        if (it.id in obj) {
            obj[it.id] = Opt.some(it.text);
        }
        else if (it.classes && it.classes.contains('action')) {
            obj.actions.push(it.text);
        }
        else {
            console.error(`cannot save property: {id:${it.id},text:${it.text}}`);
            err ||= true;
        }
    }
    if (err) {
        button.classList.add('buttonerror');
        return;
    }
    const pane = unwrapNullish(document.getElementById('title')?.querySelector('.edit'));
    const title = pane.innerText.trim();
    const filename = titleToFileName(title);
    downloadJson(obj, filename);
}
function loadEntries(button) {
    loadJson(obj => {
        let err = Opt.none();
        if ('err' in obj) {
            err = Opt.some(obj.err);
        }
        else {
            const json = obj.val;
            if (json.version !== FILE_VERSION) {
                err = Opt.some(`invalid version '${json['version']}'(expected '${FILE_VERSION}')`);
            }
            else {
                const lv = json.lv.unwrapOr(LEVEL_1);
                unwrapNullish(document.getElementById('lv')).textContent = lv;
                const actionCount = json.actionCount.unwrapOr(ACTION_1);
                const actionCountPane = unwrapNullish(document.getElementById('actionCount'));
                actionCountPane.textContent = actionCount;
                const actionCountToggler = unwrapNullish(actionCountPane.parentElement?.parentElement?.nextSibling);
                if (actionCount === ACTION_1 && !actionCountToggler.classList.contains('off')
                    || actionCount !== ACTION_1 && actionCountToggler.classList.contains('off')) {
                    toggleButton(actionCountToggler);
                }
                const type = json.type.unwrapOr(CREATURE_TYPE_HUMANOID);
                unwrapNullish(document.getElementById('type')?.querySelector('.edit')).innerText = type;
                const size = json.size.unwrapOr(SIZE_MEDIUM);
                unwrapNullish(document.getElementById('size')?.firstChild).textContent = size;
                const bdhit = json.bdhit.unwrapOr(BDHIT_MID);
                unwrapNullish(document.getElementById('bdhit')?.firstChild).textContent = bdhit;
                const plhit = json.plhit.unwrapOr(PLHIT_MID);
                unwrapNullish(document.getElementById('plhit')?.firstChild).textContent = plhit;
                const defmul = json.defmul.unwrapOr(DEFMUL_MID);
                unwrapNullish(document.getElementById('defmul')?.firstChild).textContent = defmul;
                const namedEntries = ['title', 'hp', 'ac', 'mv', 'str', 'dex', 'con', 'int', 'wis', 'cha'];
                for (const id of namedEntries) {
                    const edit = unwrapNullish(document.getElementById(id)?.querySelector('.edit'), `no '${id}' pane, or invalid substructure`);
                    edit.innerText = json[id].unwrapOr('');
                }
                const actionPane = unwrapNullish(document.getElementById('actions'), "no '#actions' pane");
                actionPane.replaceChildren(unwrapNullish(actionPane.firstChild), ...json.actions.map(newEntry), unwrapNullish(actionPane.lastChild));
            }
            refresh();
        }
        if (err.isSome()) {
            console.error(err.unwrap());
            button.classList.add('buttonerror');
        }
    });
}
function resetButtonErrors() {
    for (const it of document.getElementsByClassName('buttonerror')) {
        it.classList.remove('buttonerror');
    }
}
function refresh() {
    const lvEl = unwrapNullish(document.getElementById("lv"), "no '#lv' pane");
    const lv = parseCounter(lvEl);
    const actionEl = unwrapNullish(document.getElementById("actionCount"), "no '#actionCount' pane");
    const eliteCount = parseCounter(actionEl);
    const b = budget(parseCounter(lvEl), unwrapNullish(DEFMUL_MOD[lookupKeyword('defmul')]), unwrapNullish(PLHIT_MOD[lookupKeyword('plhit')]), unwrapNullish(BDHIT_MOD[lookupKeyword('bdhit')]));
    const builder = new EntryBuilder(lv, lookupKeyword('size'));
    const entryElems = entries();
    const entriesAndParse = Array.from(entryElems).map(it => {
        const str = entryMarkupTextContent(it);
        const mbParse = str.trim().length === 0 ? Opt.none() : Opt.some(parse(str, builder));
        return { entry: it, parse: mbParse };
    });
    const eqsAndEntry = [];
    for (const it of entriesAndParse) {
        if (it.parse.isNone()) {
            it.entry.remove();
            continue;
        }
        const parse = it.parse.unwrap();
        const isHp = it.entry.id === 'hp';
        const actionCount = it.entry.classList.contains('action') ? parse.actions().unwrapOr(1) : 0;
        const usageLimit = parse.limit();
        const localHpEqs = parse.hp();
        const localAcEqs = parse.ac();
        const localDmgEqs = parse.dmg();
        const localHitEqs = parse.hit();
        let globalHpEq;
        let globalDmgEq;
        if (isHp) {
            globalHpEq = Eq.default();
            globalDmgEq = Eq.empty();
        }
        else if (actionCount > 0) {
            globalHpEq = localHpEqs.length === 0 ? Eq.empty() : Eq.default();
            globalDmgEq = localDmgEqs.length === 0 ? Eq.empty() : Eq.default();
        }
        else {
            globalHpEq = Eq.empty();
            globalDmgEq = Eq.empty();
        }
        eqsAndEntry.push({
            parse, isHp, actionCount, usageLimit,
            globalHpEq, globalDmgEq,
            localHpEqs, localAcEqs, localDmgEqs, localHitEqs,
            entry: it.entry,
        });
    }
    const errors = validateActions(eqsAndEntry, eliteCount);
    adjustGlobalEqsByValueType(eqsAndEntry);
    adjustLocalEqsByValueType(eqsAndEntry);
    adjustEqsForElite(eqsAndEntry, eliteCount);
    adjustEqsForUsageLimits(eqsAndEntry, eliteCount);
    const budgets = distributeGlobalBudget(eqsAndEntry, b);
    for (const it of eqsAndEntry) {
        const budget = budgets.shift();
        const divs = distributeLocalBudget(it, budget);
        unwrapNullish(errors.shift()).forEach(err => divs.errors.push(err));
        const fmt = it.parse.fmt(divs);
        writeEntryDisp(it.entry, fmt);
    }
    rewrapTitle();
    resetButtonErrors();
}
