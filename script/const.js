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
const SIZE_HD = {};
SIZE_HD[SIZE_TINY] = 4;
SIZE_HD[SIZE_SMALL] = 6;
SIZE_HD[SIZE_MEDIUM] = 8;
SIZE_HD[SIZE_LARGE] = 10;
SIZE_HD[SIZE_HUGE] = 12;
SIZE_HD[SIZE_GARGANTUAN] = 20;
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
const STATS = [
    { level: -3, hp: 14.81, ac: 14, dmg: 1.81, hit: 5 },
    { level: -2, hp: 16.23, ac: 14, dmg: 1.98, hit: 5 },
    { level: -1, hp: 17.78, ac: 14, dmg: 2.17, hit: 5 },
    { level: 0, hp: 19.47, ac: 14, dmg: 2.38, hit: 5 },
    { level: 1, hp: 21.33, ac: 14, dmg: 2.6, hit: 5 },
    { level: 2, hp: 22.53, ac: 14, dmg: 4.52, hit: 5 },
    { level: 3, hp: 32.39, ac: 15, dmg: 6.43, hit: 6 },
    { level: 4, hp: 40.43, ac: 16, dmg: 8.34, hit: 7 },
    { level: 5, hp: 51.81, ac: 17, dmg: 10.25, hit: 8 },
    { level: 6, hp: 58.6, ac: 17, dmg: 12.17, hit: 8 },
    { level: 7, hp: 60.31, ac: 18, dmg: 14.08, hit: 8 },
    { level: 8, hp: 63.01, ac: 19, dmg: 16.16, hit: 9 },
    { level: 9, hp: 70.59, ac: 20, dmg: 18.09, hit: 11 },
    { level: 10, hp: 79.81, ac: 20, dmg: 20.24, hit: 11 },
    { level: 11, hp: 89.04, ac: 20, dmg: 22.2, hit: 11 },
    { level: 12, hp: 90.25, ac: 20, dmg: 27.49, hit: 11 },
    { level: 13, hp: 91.47, ac: 21, dmg: 29.72, hit: 12 },
    { level: 14, hp: 99.63, ac: 21, dmg: 31.95, hit: 12 },
    { level: 15, hp: 107.73, ac: 22, dmg: 34.18, hit: 13 },
    { level: 16, hp: 122.67, ac: 22, dmg: 40.52, hit: 13 },
    { level: 17, hp: 139.09, ac: 23, dmg: 43.01, hit: 14 },
    { level: 18, hp: 150.08, ac: 23, dmg: 45.5, hit: 14 },
    { level: 19, hp: 151.22, ac: 23, dmg: 52.05, hit: 14 },
    { level: 20, hp: 174.54, ac: 23, dmg: 55.61, hit: 14 },
    { level: 21, hp: 195.14, ac: 23, dmg: 62.17, hit: 14 },
    { level: 22, hp: 218.17, ac: 23, dmg: 69.51, hit: 14 },
    { level: 23, hp: 243.92, ac: 23, dmg: 77.71, hit: 14 },
    { level: 24, hp: 272.71, ac: 23, dmg: 86.88, hit: 14 },
];
const MIN_LV = STATS[0].level;
const MAX_LV = STATS[STATS.length - 1].level;
const MIN_ELITE_TURNS = 1;
const MAX_ELITE_TURNS = 8;
const LBRAC = '[';
const RBRAC = ']';
const QUOT = "'";
const DQUOT = '"';
const COLON = ':';
const IDENT = 'name';
const NUM = 'number';
const MISC = 'misc';
const ERR_SEP = '; ';
const METRIC_PRIME = "<em>'</em>";
const EFF_SHIELD = '<img class="shieldicon" src="./res/shield.svg"/>';
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
