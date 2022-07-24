"use strict";
const BDHIT_LO = "Brutal";
const BDHIT_DF = "Flexible";
const BDHIT_HI = "Deft";
const PLHIT_CYCLE = {};
const BDHIT_CYCLE = {};
BDHIT_CYCLE[BDHIT_LO] = BDHIT_DF;
BDHIT_CYCLE[BDHIT_DF] = BDHIT_HI;
BDHIT_CYCLE[BDHIT_HI] = BDHIT_LO;
const BDHIT_MOD = {};
BDHIT_MOD[BDHIT_LO] = -0.1;
BDHIT_MOD[BDHIT_DF] = 0;
BDHIT_MOD[BDHIT_HI] = 0.1;
const PLHIT_LO = "Wary";
const PLHIT_DF = "Calm";
const PLHIT_HI = "Hardy";
PLHIT_CYCLE[PLHIT_LO] = PLHIT_DF;
PLHIT_CYCLE[PLHIT_DF] = PLHIT_HI;
PLHIT_CYCLE[PLHIT_HI] = PLHIT_LO;
const PLHIT_MOD = {};
PLHIT_MOD[PLHIT_HI] = -0.1;
PLHIT_MOD[PLHIT_DF] = 0;
PLHIT_MOD[PLHIT_LO] = 0.1;
const DEFMUL_LO = "Raider";
const DEFMUL_DF = "Soldier";
const DEFMUL_HI = "Sentinel";
const DEFMUL_CYCLE = {};
DEFMUL_CYCLE[DEFMUL_LO] = DEFMUL_DF;
DEFMUL_CYCLE[DEFMUL_DF] = DEFMUL_HI;
DEFMUL_CYCLE[DEFMUL_HI] = DEFMUL_LO;
const DEFMUL_MOD = {};
DEFMUL_MOD[DEFMUL_LO] = 0.8;
DEFMUL_MOD[DEFMUL_DF] = 1.0;
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
const ENTRY_TEXT_DF = '<div class="entry vsp vspb act"><div class="disp" onclick="toggleEntry(this)"></div><textarea class="edit hide" onblur="toggleEntry(this)" autocomplete="off">Slam. [hit]; [dmg] bludgeoning.</textarea> </div>';
const PLAYER_HIT = 0.6;
const BADDIE_HIT = 0.6;
const HIT_INCR = 0.05;
const STATS = [
    { level: -3, hp: 14.81, ac: 14, dmg: 1.81, hit: 5 },
    { level: -2, hp: 16.23, ac: 14, dmg: 1.98, hit: 5 },
    { level: -1, hp: 17.78, ac: 14, dmg: 2.17, hit: 5 },
    { level: 0, hp: 19.47, ac: 14, dmg: 2.38, hit: 5 },
    { level: 1, hp: 21.33, ac: 14, dmg: 2.6, hit: 5 },
    { level: 2, hp: 22.53, ac: 14, dmg: 4.52, hit: 5 },
    { level: 3, hp: 32.39, ac: 15, dmg: 6.43, hit: 6 },
    { level: 4, hp: 34.74, ac: 16, dmg: 8.34, hit: 7 },
    { level: 5, hp: 57.5, ac: 17, dmg: 10.25, hit: 8 },
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
    { level: 16, hp: 109.53, ac: 22, dmg: 40.52, hit: 13 },
    { level: 17, hp: 148.94, ac: 23, dmg: 43.01, hit: 14 },
    { level: 18, hp: 150.08, ac: 23, dmg: 45.5, hit: 14 },
    { level: 19, hp: 151.22, ac: 23, dmg: 52.05, hit: 14 },
    { level: 20, hp: 174.54, ac: 23, dmg: 55.61, hit: 14 },
    { level: 21, hp: 195.14, ac: 23, dmg: 62.17, hit: 14 },
    { level: 22, hp: 218.17, ac: 23, dmg: 69.51, hit: 14 },
    { level: 23, hp: 243.92, ac: 23, dmg: 77.71, hit: 14 },
    { level: 24, hp: 272.71, ac: 23, dmg: 86.88, hit: 14 },
];
const LBRAC = '[';
const RBRAC = ']';
const QUOT = "'";
const DQUOT = '"';
const COLON = ':';
const IDENT = 'name';
const NUM = 'number';
const MISC = 'misc';
const ERR_SEP = '; ';
const DICE_FMT_MAX_ERR_THRES = 3;
const FMT_DIGITS = 1;
const METRIC_PRIME = "<em>'</em>";
const SENT_END = /[.?!]+/;
