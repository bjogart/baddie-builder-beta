"use strict";
const BDHIT_LO = "Brutal";
const BDHIT_MID = "Flexible";
const BDHIT_HI = "Deft";
const PLHIT_CYCLE = {};
const BDHIT_CYCLE = {};
BDHIT_CYCLE[BDHIT_LO] = BDHIT_MID;
BDHIT_CYCLE[BDHIT_MID] = BDHIT_HI;
BDHIT_CYCLE[BDHIT_HI] = BDHIT_LO;
const BDHIT_MOD = {};
BDHIT_MOD[BDHIT_LO] = -0.1;
BDHIT_MOD[BDHIT_MID] = 0;
BDHIT_MOD[BDHIT_HI] = 0.1;
const PLHIT_LO = "Wary";
const PLHIT_MID = "Calm";
const PLHIT_HI = "Hardy";
PLHIT_CYCLE[PLHIT_LO] = PLHIT_MID;
PLHIT_CYCLE[PLHIT_MID] = PLHIT_HI;
PLHIT_CYCLE[PLHIT_HI] = PLHIT_LO;
const PLHIT_MOD = {};
PLHIT_MOD[PLHIT_HI] = -0.1;
PLHIT_MOD[PLHIT_MID] = 0;
PLHIT_MOD[PLHIT_LO] = 0.1;
const DEFMUL_LO = "Raider";
const DEFMUL_MID = "Soldier";
const DEFMUL_HI = "Sentinel";
const DEFMUL_CYCLE = {};
DEFMUL_CYCLE[DEFMUL_LO] = DEFMUL_MID;
DEFMUL_CYCLE[DEFMUL_MID] = DEFMUL_HI;
DEFMUL_CYCLE[DEFMUL_HI] = DEFMUL_LO;
const DEFMUL_MOD = {};
DEFMUL_MOD[DEFMUL_LO] = 0.8;
DEFMUL_MOD[DEFMUL_MID] = 1.0;
DEFMUL_MOD[DEFMUL_HI] = 1.25;
const SIZE_TINY = 'Tiny';
const SIZE_SMALL = 'Small';
const SIZE_MEDIUM = 'Medium';
const SIZE_LARGE = 'Large';
const SIZE_HUGE = 'Huge';
const SIZE_GARGANTUAN = 'Gargantuan';
const SIZE_CYCLE = {};
SIZE_CYCLE[SIZE_TINY] = SIZE_SMALL;
SIZE_CYCLE[SIZE_SMALL] = SIZE_MEDIUM;
SIZE_CYCLE[SIZE_MEDIUM] = SIZE_LARGE;
SIZE_CYCLE[SIZE_LARGE] = SIZE_HUGE;
SIZE_CYCLE[SIZE_HUGE] = SIZE_GARGANTUAN;
SIZE_CYCLE[SIZE_GARGANTUAN] = SIZE_TINY;
const BDSIZE_TO_HD_DSIZE = {};
BDSIZE_TO_HD_DSIZE[SIZE_TINY] = 4;
BDSIZE_TO_HD_DSIZE[SIZE_SMALL] = 6;
BDSIZE_TO_HD_DSIZE[SIZE_MEDIUM] = 8;
BDSIZE_TO_HD_DSIZE[SIZE_LARGE] = 10;
BDSIZE_TO_HD_DSIZE[SIZE_HUGE] = 12;
BDSIZE_TO_HD_DSIZE[SIZE_GARGANTUAN] = 20;
const CREATURE_TYPE_HUMANOID = 'Humanoid';
const LEVEL_1 = '1';
const ACTION_1 = '1';
const FILE_VERSION = '1.0.0';
const DEFAULT_BLOCK_NAME = 'Baddie';
const BLOCK_FILE_EXT = '.baddie';
const PLAYER_HIT = 0.6;
const BADDIE_HIT = 0.6;
const HIT_INCR = 0.05;
const EXP_ROUNDS = 3;
const FRAC_OF_FREE_MOVES_SHARED_WITH_LIMITED_MOVES = 1 / 4;
const STATS = [
    { lv: -3, hp: 4.94, ac: 14, dmg: 1.81, hit: 5 },
    { lv: -2, hp: 5.41, ac: 14, dmg: 1.98, hit: 5 },
    { lv: -1, hp: 5.93, ac: 14, dmg: 2.17, hit: 5 },
    { lv: 0, hp: 6.49, ac: 14, dmg: 2.38, hit: 5 },
    { lv: 1, hp: 7.11, ac: 14, dmg: 2.6, hit: 5 },
    { lv: 2, hp: 7.51, ac: 14, dmg: 4.52, hit: 5 },
    { lv: 3, hp: 10.8, ac: 15, dmg: 6.43, hit: 6 },
    { lv: 4, hp: 13.48, ac: 16, dmg: 8.34, hit: 7 },
    { lv: 5, hp: 17.27, ac: 17, dmg: 10.25, hit: 8 },
    { lv: 6, hp: 19.53, ac: 17, dmg: 12.17, hit: 8 },
    { lv: 7, hp: 20.1, ac: 18, dmg: 14.08, hit: 8 },
    { lv: 8, hp: 21, ac: 19, dmg: 16.16, hit: 9 },
    { lv: 9, hp: 23.53, ac: 20, dmg: 18.09, hit: 11 },
    { lv: 10, hp: 26.6, ac: 20, dmg: 20.24, hit: 11 },
    { lv: 11, hp: 29.68, ac: 20, dmg: 22.2, hit: 11 },
    { lv: 12, hp: 30.08, ac: 20, dmg: 27.49, hit: 11 },
    { lv: 13, hp: 30.49, ac: 21, dmg: 29.72, hit: 12 },
    { lv: 14, hp: 33.21, ac: 21, dmg: 31.95, hit: 12 },
    { lv: 15, hp: 35.91, ac: 22, dmg: 34.18, hit: 13 },
    { lv: 16, hp: 39.79, ac: 22, dmg: 40.52, hit: 13 },
    { lv: 17, hp: 46.36, ac: 23, dmg: 43.01, hit: 14 },
    { lv: 18, hp: 50.03, ac: 23, dmg: 45.5, hit: 14 },
    { lv: 19, hp: 50.41, ac: 23, dmg: 52.05, hit: 14 },
    { lv: 20, hp: 58.18, ac: 23, dmg: 55.61, hit: 14 },
    { lv: 21, hp: 65.05, ac: 23, dmg: 62.17, hit: 14 },
    { lv: 22, hp: 72.72, ac: 23, dmg: 69.51, hit: 14 },
    { lv: 23, hp: 81.31, ac: 23, dmg: 77.71, hit: 14 },
    { lv: 24, hp: 90.9, ac: 23, dmg: 86.88, hit: 14 },
];
const MIN_LV = STATS[0].lv;
const MAX_LV = STATS[STATS.length - 1].lv;
const MIN_ELITE_TURNS = 1;
const MAX_ELITE_TURNS = 8;
const LBRAC = '[';
const RBRAC = ']';
const COLON = ':';
const IDENT = 'name';
const NUM = 'number';
const MISC = 'misc';
const LEX_RULES = {
    trivia: /^[ \t]/,
    rules: [
        { tag: LBRAC, re: /^\[/ },
        { tag: RBRAC, re: /^\]/ },
        { tag: COLON, re: /^:/ },
        { tag: IDENT, re: /^[a-z]+/i },
        { tag: NUM, re: /^[+-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)/ },
        { tag: MISC, re: /^./ },
    ],
};
const ERR_SEP = '; ';
const METRIC_PRIME = "<em>'</em>";
const EFF_SHIELD = '<img class="shieldicon" src="./res/shield.svg"/>';
const HEADER_PRIORITY_LIMIT = 0;
const HEADER_PRIORITY_ACTIONS = 1;
const HEADER_PRIORITY_CONCENTRATION = 2;
const DICE_FMT_MAX_ERR_THRES = 3;
const FMT_DIGITS = 1;
const PUNCT = /[.?!]+/;
class BlockJson {
    static fromProperties(version, params) {
        const block = new BlockJson(version);
        if (params.lv !== undefined) {
            block.lv = Opt.some(params.lv);
        }
        if (params.actionCount !== undefined) {
            block.actionCount = Opt.some(params.actionCount);
        }
        if (params.type !== undefined) {
            block.type = Opt.some(params.type);
        }
        if (params.size !== undefined) {
            block.size = Opt.some(params.size);
        }
        if (params.bdhit !== undefined) {
            block.bdhit = Opt.some(params.bdhit);
        }
        if (params.plhit !== undefined) {
            block.plhit = Opt.some(params.plhit);
        }
        if (params.defmul !== undefined) {
            block.defmul = Opt.some(params.defmul);
        }
        if (params.title !== undefined) {
            block.title = Opt.some(params.title);
        }
        if (params.hp !== undefined) {
            block.hp = Opt.some(params.hp);
        }
        if (params.ac !== undefined) {
            block.ac = Opt.some(params.ac);
        }
        if (params.mv !== undefined) {
            block.mv = Opt.some(params.mv);
        }
        if (params.str !== undefined) {
            block.str = Opt.some(params.str);
        }
        if (params.dex !== undefined) {
            block.dex = Opt.some(params.dex);
        }
        if (params.con !== undefined) {
            block.con = Opt.some(params.con);
        }
        if (params.int !== undefined) {
            block.int = Opt.some(params.int);
        }
        if (params.wis !== undefined) {
            block.wis = Opt.some(params.wis);
        }
        if (params.cha !== undefined) {
            block.cha = Opt.some(params.cha);
        }
        if (params.actions !== undefined) {
            block.actions = params.actions;
        }
        return block;
    }
    lv;
    actionCount;
    type;
    size;
    bdhit;
    plhit;
    defmul;
    title;
    hp;
    ac;
    mv;
    str;
    dex;
    con;
    int;
    wis;
    cha;
    actions;
    version;
    constructor(version) {
        this.lv = Opt.none();
        this.actionCount = Opt.none();
        this.type = Opt.none();
        this.size = Opt.none();
        this.bdhit = Opt.none();
        this.plhit = Opt.none();
        this.defmul = Opt.none();
        this.title = Opt.none();
        this.hp = Opt.none();
        this.ac = Opt.none();
        this.mv = Opt.none();
        this.str = Opt.none();
        this.dex = Opt.none();
        this.con = Opt.none();
        this.int = Opt.none();
        this.wis = Opt.none();
        this.cha = Opt.none();
        this.actions = [];
        this.version = version;
    }
    json() {
        const obj = { version: this.version, actions: this.actions };
        if (this.lv.isSome()) {
            obj['lv'] = this.lv.unwrap();
        }
        if (this.actionCount.isSome()) {
            obj['actionCount'] = this.actionCount.unwrap();
        }
        if (this.type.isSome()) {
            obj['type'] = this.type.unwrap();
        }
        if (this.size.isSome()) {
            obj['size'] = this.size.unwrap();
        }
        if (this.bdhit.isSome()) {
            obj['bdhit'] = this.bdhit.unwrap();
        }
        if (this.plhit.isSome()) {
            obj['plhit'] = this.plhit.unwrap();
        }
        if (this.defmul.isSome()) {
            obj['defmul'] = this.defmul.unwrap();
        }
        if (this.title.isSome()) {
            obj['title'] = this.title.unwrap();
        }
        if (this.hp.isSome()) {
            obj['hp'] = this.hp.unwrap();
        }
        if (this.ac.isSome()) {
            obj['ac'] = this.ac.unwrap();
        }
        if (this.mv.isSome()) {
            obj['mv'] = this.mv.unwrap();
        }
        if (this.str.isSome()) {
            obj['str'] = this.str.unwrap();
        }
        if (this.dex.isSome()) {
            obj['dex'] = this.dex.unwrap();
        }
        if (this.con.isSome()) {
            obj['con'] = this.con.unwrap();
        }
        if (this.int.isSome()) {
            obj['int'] = this.int.unwrap();
        }
        if (this.wis.isSome()) {
            obj['wis'] = this.wis.unwrap();
        }
        if (this.cha.isSome()) {
            obj['cha'] = this.cha.unwrap();
        }
        return JSON.stringify(obj);
    }
}
;
