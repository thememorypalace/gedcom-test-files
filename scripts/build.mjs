// Builds every file in files/ and writes manifest.json.
// Run with: node scripts/build.mjs
//
// The files are generated so that their exact bytes (character sets, line
// endings, byte order marks) are reproducible and reviewable in one place.
// All people, places and sources are invented.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = [];

const SUBM = ["0 @U1@ SUBM", "1 NAME gedcom-test-files"];

function head551(char = "UTF-8", { subm = true, version = true } = {}) {
  const lines = ["0 HEAD", "1 SOUR GEDCOM_TEST_FILES", "2 NAME gedcom-test-files"];
  if (version) lines.push("1 GEDC", "2 VERS 5.5.1", "2 FORM LINEAGE-LINKED");
  if (char) lines.push(`1 CHAR ${char}`);
  if (subm) lines.push("1 SUBM @U1@");
  return lines;
}

const head70 = ["0 HEAD", "1 GEDC", "2 VERS 7.0", "1 SOUR GEDCOM_TEST_FILES", "2 NAME gedcom-test-files"];

/** Joins lines with CRLF (the GEDCOM default) and encodes them as UTF-8. */
function utf8(lines, eol = "\r\n") {
  return Buffer.from(lines.join(eol) + eol, "utf8");
}

/** Encodes a string with a byte map for the characters above ASCII. */
function bytesWith(map, text) {
  const out = [];
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code < 0x80) out.push(code);
    else if (map[ch]) out.push(...map[ch]);
    else throw new Error(`no mapping for ${ch}`);
  }
  return Buffer.from(out);
}

// ANSEL (ANSI/NISO Z39.47) puts the combining mark BEFORE the base letter.
const ANSEL = {
  "é": [0xe2, 0x65],
  "è": [0xe1, 0x65],
  "á": [0xe2, 0x61],
  "ü": [0xe8, 0x75],
  "ö": [0xe8, 0x6f],
  "ç": [0xf0, 0x63],
  "Ł": [0xa1],
  "ł": [0xb1],
  "ø": [0xb2],
  "ß": [0xcf],
};

const CP1252 = { "é": [0xe9], "è": [0xe8], "ü": [0xfc], "ö": [0xf6], "ç": [0xe7], "ß": [0xdf], "€": [0x80], "ø": [0xf8] };

/** UTF-8 bytes read as Windows-1252 and written out as UTF-8 again: the classic "MÃ¼ller". */
function doubleEncode(s) {
  const rev = Object.fromEntries(Object.entries(CP1252).map(([k, v]) => [v[0], k]));
  return [...Buffer.from(s, "utf8")].map((b) => (b < 0x80 ? String.fromCharCode(b) : rev[b] ?? String.fromCharCode(b))).join("");
}

function add(path, bytes, entry) {
  const full = join(root, "files", path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, bytes);
  manifest.push({ file: `files/${path}`, bytes: bytes.length, ...entry });
}

// ---------------------------------------------------------------- valid

add(
  "valid/551-minimal.ged",
  utf8([...head551(), ...SUBM, "0 @I1@ INDI", "1 NAME Anna /Voorbeeld/", "1 SEX F", "1 BIRT", "2 DATE 12 MAR 1921", "0 TRLR"]),
  {
    version: "5.5.1",
    encoding: "UTF-8",
    faults: [],
    title: "Smallest useful 5.5.1 file",
    explanation: "Header with GEDC, CHAR and SUBM, one submitter, one person, trailer. A reader that fails on this file fails on everything.",
  },
);

add(
  "valid/551-family.ged",
  utf8([
    ...head551(),
    "1 DATE 17 NOV 2026",
    "1 LANG Dutch",
    ...SUBM,
    "0 @I1@ INDI",
    "1 NAME Pieter /Voorbeeld/",
    "2 GIVN Pieter",
    "2 SURN Voorbeeld",
    "1 SEX M",
    "1 BIRT",
    "2 DATE ABT 1890",
    "2 PLAC Denkdorp, Verzonnen Provincie, Belgium",
    "1 DEAT",
    "2 DATE BET 1960 AND 1965",
    "1 OCCU Baker",
    "1 FAMS @F1@",
    "0 @I2@ INDI",
    "1 NAME Hélène /Exemple/",
    "1 SEX F",
    "1 BIRT",
    "2 DATE 3 FEB 1895",
    "2 SOUR @S1@",
    "3 PAGE Entry 14",
    "1 DEAT",
    "2 DATE 21 OCT 1971",
    "1 FAMS @F1@",
    "1 NOTE Hélène kept the bakery accounts. This note is long enough to be continued",
    "2 CONC  on a second line with CONC, and it has a second paragraph",
    "2 CONT that starts on a new line with CONT.",
    "0 @I3@ INDI",
    "1 NAME Jürgen /Voorbeeld/",
    "1 SEX M",
    "1 BIRT",
    "2 DATE 7 JUL 1921",
    "1 FAMC @F1@",
    "1 FAMS @F2@",
    "0 @I4@ INDI",
    "1 NAME Erika /Mustermann/",
    "1 SEX F",
    "1 BIRT",
    "2 DATE BEF 1925",
    "1 FAMS @F2@",
    "0 @I5@ INDI",
    "1 NAME Anna /Voorbeeld/",
    "1 SEX F",
    "1 BIRT",
    "2 DATE 12 MAR 1951",
    "1 FAMC @F2@",
    "0 @F1@ FAM",
    "1 HUSB @I1@",
    "1 WIFE @I2@",
    "1 CHIL @I3@",
    "1 MARR",
    "2 DATE FROM 1919 TO 1920",
    "0 @F2@ FAM",
    "1 HUSB @I3@",
    "1 WIFE @I4@",
    "1 CHIL @I5@",
    "1 MARR",
    "2 DATE 2 MAY 1949",
    "0 @S1@ SOUR",
    "1 TITL Invented parish register of Denkdorp",
    "0 TRLR",
  ]),
  {
    version: "5.5.1",
    encoding: "UTF-8",
    faults: [],
    title: "Three generations, 5.5.1",
    explanation:
      "Five people in two families with places, a source citation, a note split with CONC and CONT, and the common date modifiers (ABT, BEF, BET AND, FROM TO). Non-ASCII names in UTF-8.",
  },
);

add(
  "valid/551-date-forms.ged",
  utf8([
    ...head551(),
    ...SUBM,
    "0 @I1@ INDI",
    "1 NAME Otto /Fictief/",
    "1 BIRT",
    "2 DATE 11 FEB 1648/9",
    "1 BAPM",
    "2 DATE @#DJULIAN@ 20 FEB 1648",
    "1 DEAT",
    "2 DATE INT 1701 (in the winter after the flood)",
    "1 BURI",
    "2 DATE (shortly after his death)",
    "1 EVEN",
    "2 TYPE Legend",
    "2 DATE 300 B.C.",
    "1 RESI",
    "2 DATE CAL 1680",
    "1 CENS",
    "2 DATE EST 1690",
    "0 TRLR",
  ]),
  {
    version: "5.5.1",
    encoding: "UTF-8",
    faults: [],
    title: "Unusual but valid 5.5.1 dates",
    explanation:
      "Dual year (1648/9), Julian calendar escape, interpreted date with phrase, a date phrase alone, B.C., CAL and EST. All valid in 5.5.1; a checker should not call them errors, and a 5.5.1 to 7.0 converter has to translate most of them.",
    knownDifferences: [
      { tool: "gedcom-tools 0.1.0", codes: ["bad_date"], note: "reports the dual year 11 FEB 1648/9 as a bad date. That is a bug in the checker, not in this file. Fixed in gedcom-tools 0.1.1." },
    ],
  },
);

add(
  "valid/70-minimal.ged",
  utf8([...head70, "0 @I1@ INDI", "1 NAME Anna /Voorbeeld/", "1 SEX F", "1 BIRT", "2 DATE 12 MAR 1921", "0 TRLR"]),
  {
    version: "7.0",
    encoding: "UTF-8",
    faults: [],
    title: "Smallest useful 7.0 file",
    explanation: "A 7.0 header has no CHAR and no SUBM requirement; the file is always UTF-8.",
  },
);

add(
  "valid/70-family.ged",
  utf8([
    ...head70,
    "1 SCHMA",
    "2 TAG _SKIN https://example.org/gedcom-test-files/_SKIN",
    "1 LANG nl",
    "0 @I1@ INDI",
    "1 NAME Pieter /Voorbeeld/",
    "1 SEX M",
    "1 BIRT",
    "2 DATE ABT 1890",
    "2 PLAC Denkdorp, Verzonnen Provincie, Belgium",
    "1 FAMS @F1@",
    "1 SNOTE @N1@",
    "1 EXID 12345",
    "2 TYPE https://example.org/invented-id",
    "0 @I2@ INDI",
    "1 NAME Hélène /Exemple/",
    "1 SEX F",
    "1 BIRT",
    "2 DATE 3 FEB 1895",
    "2 SOUR @S1@",
    "3 PAGE Entry 14",
    "1 FAMS @F1@",
    "1 NOTE @@exemple was her handle on an invented forum.",
    "2 CONT A 7.0 note continues with CONT only; CONC no longer exists.",
    "0 @I3@ INDI",
    "1 NAME Jürgen /Voorbeeld/",
    "1 SEX M",
    "1 BIRT",
    "2 DATE 7 JUL 1921",
    "1 FAMC @F1@",
    "2 PEDI BIRTH",
    "1 OBJE @O1@",
    "0 @F1@ FAM",
    "1 HUSB @I1@",
    "1 WIFE @I2@",
    "1 CHIL @I3@",
    "1 MARR",
    "2 DATE 1920",
    "3 PHRASE Spring 1920, according to the family",
    "0 @N1@ SNOTE Pieter is an invented person used in test files.",
    "0 @S1@ SOUR",
    "1 TITL Invented parish register of Denkdorp",
    "0 @O1@ OBJE",
    "1 FILE media/portrait.jpg",
    "2 FORM image/jpeg",
    "0 TRLR",
  ]),
  {
    version: "7.0",
    encoding: "UTF-8",
    faults: [],
    title: "Three people, 7.0",
    explanation:
      "Uses the 7.0 features that 5.5.1 readers often stumble over: SCHMA with an extension tag, LANG as a BCP 47 tag, SNOTE, EXID with TYPE, a value starting with an escaped @@, PEDI under FAMC, a date with PHRASE and an OBJE record with a media type.",
  },
);

// ---------------------------------------------------------------- links

add(
  "links/broken-pointer.ged",
  utf8([
    ...head551(),
    ...SUBM,
    "0 @I1@ INDI",
    "1 NAME Mira /Testa/",
    "1 FAMC @F9@",
    "0 @I2@ INDI",
    "1 NAME Lars /Testa/",
    "1 FAMS @F1@",
    "0 @F1@ FAM",
    "1 HUSB @I2@",
    "1 WIFE @I99@",
    "0 TRLR",
  ]),
  {
    version: "5.5.1",
    encoding: "UTF-8",
    faults: ["broken_pointer"],
    title: "Pointers to records that do not exist",
    explanation: "I1 points to family @F9@ and F1 points to wife @I99@; neither record exists. Typical after someone deletes records by hand or exports part of a tree.",
  },
);

add(
  "links/duplicate-ids.ged",
  utf8([
    ...head551(),
    ...SUBM,
    "0 @I1@ INDI",
    "1 NAME Mira /Testa/",
    "1 FAMS @F1@",
    "0 @I2@ INDI",
    "1 NAME Lars /Testa/",
    "1 FAMC @F1@",
    "0 @I2@ INDI",
    "1 NAME Second /Record/",
    "0 @F1@ FAM",
    "1 WIFE @I1@",
    "1 CHIL @I2@",
    "0 TRLR",
  ]),
  {
    version: "5.5.1",
    encoding: "UTF-8",
    faults: ["duplicate_id"],
    title: "Two records with the same ID",
    explanation: "@I2@ is used twice. Which one a pointer means is undefined; programs silently keep the first, keep the last, or merge them. Common when two files are pasted together.",
  },
);

add(
  "links/one-sided-link.ged",
  utf8([
    ...head551(),
    ...SUBM,
    "0 @I1@ INDI",
    "1 NAME Mira /Testa/",
    "1 FAMS @F1@",
    "0 @I2@ INDI",
    "1 NAME Lars /Testa/",
    "0 @F1@ FAM",
    "1 CHIL @I2@",
    "0 TRLR",
  ]),
  {
    version: "5.5.1",
    encoding: "UTF-8",
    faults: ["one_sided_link"],
    title: "Links that only point one way",
    explanation: "I1 says it is a spouse in F1, but F1 has no HUSB or WIFE pointing back. F1 lists I2 as a child, but I2 has no FAMC. GEDCOM 5.5.1 expects both directions; readers that follow only one side lose people.",
  },
);

add(
  "links/empty-family.ged",
  utf8([...head551(), ...SUBM, "0 @I1@ INDI", "1 NAME Mira /Testa/", "0 @F1@ FAM", "1 MARR", "2 DATE 1950", "0 TRLR"]),
  {
    version: "5.5.1",
    encoding: "UTF-8",
    faults: ["empty_family"],
    title: "A family without members",
    explanation: "F1 has a marriage but no husband, wife or children. Usually left behind after people were deleted.",
  },
);

add(
  "links/own-ancestor.ged",
  utf8([
    ...head551(),
    ...SUBM,
    "0 @I1@ INDI",
    "1 NAME Mira /Testa/",
    "1 FAMC @F1@",
    "1 FAMS @F2@",
    "0 @I2@ INDI",
    "1 NAME Lars /Testa/",
    "1 FAMS @F1@",
    "1 FAMC @F2@",
    "0 @F1@ FAM",
    "1 HUSB @I2@",
    "1 CHIL @I1@",
    "0 @F2@ FAM",
    "1 WIFE @I1@",
    "1 CHIL @I2@",
    "0 TRLR",
  ]),
  {
    version: "5.5.1",
    encoding: "UTF-8",
    faults: ["own_ancestor"],
    title: "A person who is their own ancestor",
    explanation: "Mira is Lars's child and Lars is Mira's child. Any code that walks ancestors or descendants without a visited set loops on this file.",
  },
);

// ---------------------------------------------------------------- dates

const person = (id, name, birth, death, extra = []) => {
  const l = [`0 @${id}@ INDI`, `1 NAME ${name}`];
  if (birth) l.push("1 BIRT", `2 DATE ${birth}`);
  if (death) l.push("1 DEAT", `2 DATE ${death}`);
  return [...l, ...extra];
};

add(
  "dates/invalid-calendar-dates.ged",
  utf8([
    ...head551(),
    ...SUBM,
    ...person("I1", "Mira /Testa/", "31 FEB 1900", null),
    ...person("I2", "Lars /Testa/", "30 APR 1901", "31 APR 1960"),
    ...person("I3", "Otto /Fictief/", "12/03/1921", null),
    ...person("I4", "Erika /Mustermann/", "JULY 4 1922", null),
    ...person("I5", "Jan /Voorbeeld/", "0 JAN 1923", null),
    "0 TRLR",
  ]),
  {
    version: "5.5.1",
    encoding: "UTF-8",
    faults: ["bad_date"],
    title: "Dates that do not exist or are not GEDCOM",
    explanation:
      "31 FEB, 31 APR and day 0 do not exist. 12/03/1921 is ambiguous (December or March) and not a GEDCOM date. JULY 4 1922 uses a full month name in the wrong order. 30 APR 1901 is the one valid date, as a control.",
  },
);

add(
  "dates/death-before-birth.ged",
  utf8([...head551(), ...SUBM, ...person("I1", "Mira /Testa/", "10 APR 1900", "2 FEB 1890"), "0 TRLR"]),
  {
    version: "5.5.1",
    encoding: "UTF-8",
    faults: ["death_before_birth"],
    title: "Death before birth",
    explanation: "Usually a typo in the year, or the birth date of a child entered on the parent.",
  },
);

add(
  "dates/family-chronology.ged",
  utf8([
    ...head551(),
    ...SUBM,
    ...person("I1", "Lars /Testa/", "5 MAY 1900", "1 JAN 1970", ["1 FAMS @F1@"]),
    ...person("I2", "Mira /Testa/", "6 JUN 1902", "3 MAR 1930", ["1 SEX F", "1 FAMS @F1@"]),
    ...person("I3", "Otto /Testa/", "1 JAN 1899", null, ["1 FAMC @F1@"]),
    ...person("I4", "Anna /Testa/", "2 FEB 1910", null, ["1 FAMC @F1@"]),
    ...person("I5", "Jan /Testa/", "4 APR 1935", null, ["1 FAMC @F1@"]),
    "0 @F1@ FAM",
    "1 HUSB @I1@",
    "1 WIFE @I2@",
    "1 CHIL @I3@",
    "1 CHIL @I4@",
    "1 CHIL @I5@",
    "0 TRLR",
  ]),
  {
    version: "5.5.1",
    encoding: "UTF-8",
    faults: ["child_before_parent", "parent_too_young", "born_after_mother_death"],
    title: "Children that cannot belong to these parents",
    explanation:
      "Otto (1899) is born before both parents. Anna (1910) has a father of 9 and a mother of 7. Jan (1935) is born five years after his mother died in 1930. Typical of two people with the same name merged into one.",
  },
);

add(
  "dates/too-old.ged",
  utf8([...head551(), ...SUBM, ...person("I1", "Otto /Fictief/", "1700", "1850"), "0 TRLR"]),
  {
    version: "5.5.1",
    encoding: "UTF-8",
    faults: ["too_old"],
    title: "A lifespan of 150 years",
    explanation: "Born 1700, died 1850. Mostly a father and son with the same name taken for one person.",
  },
);

// ---------------------------------------------------------------- encoding

const encLines = (char) => [
  ...head551(char),
  ...SUBM,
  "0 @I1@ INDI",
  "1 NAME Hélène /Exemple/",
  "0 @I2@ INDI",
  "1 NAME Jürgen /Müller/",
  "0 @I3@ INDI",
  "1 NAME Łucja /Przykład/",
  "0 @I4@ INDI",
  "1 NAME François /Groß/",
  "0 TRLR",
];

add("encoding/ansel.ged", bytesWith(ANSEL, encLines("ANSEL").join("\r\n") + "\r\n"), {
  version: "5.5.1",
  encoding: "ANSEL",
  faults: ["encoding_ansel"],
  title: "ANSEL with combining marks",
  explanation:
    "CHAR ANSEL, as written by older genealogy programs. In ANSEL the accent byte comes before the letter: é is 0xE2 0x65, ü is 0xE8 0x75. Ł (0xA1), ł (0xB1) and ß (0xCF) are single bytes. Decoded correctly, the names are Hélène Exemple, Jürgen Müller, Łucja Przykład and François Groß. This is not a fault in the file; checkers report it as information because many readers do not support ANSEL.",
});

add("encoding/ansel-label-utf8-bytes.ged", utf8(encLines("ANSEL")), {
  version: "5.5.1",
  encoding: "UTF-8 (labelled ANSEL)",
  faults: ["encoding_mislabeled"],
  title: "Header says ANSEL, bytes are UTF-8",
  explanation:
    "A file that was converted to UTF-8 without updating the CHAR line. A reader that trusts the header turns every accented letter into two wrong characters.",
});

add("encoding/windows-1252.ged", bytesWith(CP1252, [...encLines("ANSI").slice(0, -5), "0 @I4@ INDI", "1 NAME François /Groß/", "1 NOTE Inheritance of 100 €", "0 TRLR"].join("\r\n") + "\r\n"), {
  version: "5.5.1",
  encoding: "Windows-1252",
  faults: ["encoding_ansi"],
  title: "Windows-1252 labelled ANSI",
  explanation:
    "CHAR ANSI is not a 5.5.1 value but is common in files from Windows programs. é is the single byte 0xE9 and € is 0x80. Łucja and Przykład cannot be written in Windows-1252, so that person is left out.",
});

add("encoding/no-char-line.ged", bytesWith(CP1252, [...head551(null), ...SUBM, "0 @I1@ INDI", "1 NAME Hélène /Exemple/", "0 TRLR"].join("\r\n") + "\r\n"), {
  version: "5.5.1",
  encoding: "Windows-1252 (no CHAR line)",
  faults: ["encoding_no_char"],
  title: "No CHAR line",
  explanation: "5.5.1 requires CHAR. Without it a reader has to guess; here the bytes are Windows-1252.",
});

add("encoding/invalid-utf8.ged", bytesWith(CP1252, [...head551("UTF-8"), ...SUBM, "0 @I1@ INDI", "1 NAME Hélène /Exemple/", "0 TRLR"].join("\r\n") + "\r\n"), {
  version: "5.5.1",
  encoding: "Windows-1252 (labelled UTF-8)",
  faults: ["encoding_mislabeled"],
  title: "Header says UTF-8, bytes are not",
  explanation: "The single byte 0xE9 for é is not valid UTF-8. A strict UTF-8 decoder either fails or produces the replacement character U+FFFD.",
});

add(
  "encoding/garbled-utf8.ged",
  utf8([...head551("UTF-8"), ...SUBM, "0 @I1@ INDI", `1 NAME ${doubleEncode("Hélène")} /Exemple/`, "0 @I2@ INDI", `1 NAME Jürgen /${doubleEncode("Müller")}/`, "0 TRLR"]),
  {
    version: "5.5.1",
    encoding: "UTF-8 (double encoded)",
    faults: ["garbled_chars"],
    title: "Double-encoded UTF-8 (mojibake)",
    explanation:
      "Valid UTF-8, but the names read HÃ©lÃ¨ne and MÃ¼ller: the text was decoded as Windows-1252 and encoded to UTF-8 a second time. Jürgen is correct, as a control. The damage is reversible when every affected sequence maps back exactly.",
  },
);

add(
  "encoding/utf16le-bom.ged",
  Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(encLines("UNICODE").join("\r\n") + "\r\n", "utf16le")]),
  {
    version: "5.5.1",
    encoding: "UTF-16LE with BOM",
    faults: [],
    title: "UTF-16 little endian",
    explanation: "CHAR UNICODE with a byte order mark, as written by some Windows programs. Every ASCII character is followed by a zero byte, which breaks readers that look for 0 HEAD in the raw bytes.",
    knownDifferences: [
      { tool: "gedcom-tools 0.1.0", codes: ["encoding_no_char"], note: "decodes the file correctly but does not see the CHAR line in UTF-16. That is a bug in the checker, not in this file. Fixed in gedcom-tools 0.1.1." },
    ],
  },
);

add("encoding/utf8-bom.ged", Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), utf8(encLines("UTF-8"))]), {
  version: "5.5.1",
  encoding: "UTF-8 with BOM",
  faults: [],
  title: "UTF-8 with byte order mark",
  explanation: "Valid. The three bytes EF BB BF come before 0 HEAD; readers that compare the first line literally fail to see the header.",
});

// ---------------------------------------------------------------- structure

add("structure/missing-trlr.ged", utf8([...head551(), ...SUBM, "0 @I1@ INDI", "1 NAME Mira /Testa/"]), {
  version: "5.5.1",
  encoding: "UTF-8",
  faults: ["trlr_missing"],
  title: "No trailer",
  explanation: "The file stops without 0 TRLR, often a sign that an export or upload was cut off.",
});

add("structure/after-trlr.ged", utf8([...head551(), ...SUBM, "0 @I1@ INDI", "1 NAME Mira /Testa/", "0 TRLR", "0 @I2@ INDI", "1 NAME Lars /Testa/"]), {
  version: "5.5.1",
  encoding: "UTF-8",
  faults: ["after_trlr"],
  title: "Records after the trailer",
  explanation: "Two files glued together, or an editor that appended records at the end. Most readers stop at TRLR and lose I2.",
});

add("structure/no-version.ged", utf8([...head551("UTF-8", { version: false }), ...SUBM, "0 @I1@ INDI", "1 NAME Mira /Testa/", "0 TRLR"]), {
  version: "unknown",
  encoding: "UTF-8",
  faults: ["version_missing"],
  title: "No GEDC.VERS",
  explanation: "Without a version a reader cannot tell 5.5.1 from 7.0.",
});

add(
  "structure/level-jump.ged",
  utf8([...head551(), ...SUBM, "0 @I1@ INDI", "1 NAME Mira /Testa/", "1 BIRT", "3 DATE 1 JAN 1900", "0 TRLR"]),
  {
    version: "5.5.1",
    encoding: "UTF-8",
    faults: ["level_jump"],
    title: "A level that skips one",
    explanation: "DATE is at level 3 directly under a level 1 line. The structure is undefined; some readers attach it to BIRT, others drop it.",
  },
);

add(
  "structure/whitespace-and-line-endings.ged",
  Buffer.from(
    ["0 HEAD\r\n", "1 SOUR GEDCOM_TEST_FILES\r\n", "1 GEDC\n", "2 VERS 5.5.1\r\n", "2 FORM LINEAGE-LINKED\r\n", "1 CHAR UTF-8\r\n", "1 SUBM @U1@\n", "\r\n", "0 @U1@ SUBM\r\n", "1 NAME gedcom-test-files\r\n", "  0 @I1@ INDI\r\n", "  1 NAME Mira /Testa/\n", "\n", "0 TRLR\r\n"].join(""),
    "utf8",
  ),
  {
    version: "5.5.1",
    encoding: "UTF-8",
    faults: ["line_endings", "blank_lines", "leading_space"],
    title: "Mixed line endings, blank lines and indentation",
    explanation:
      "CRLF and LF in one file, empty lines, and lines indented with spaces. 5.5.1 allows none of the last two, but files edited by hand look like this.",
  },
);

add(
  "structure/conc-in-v7.ged",
  utf8([...head70, "0 @I1@ INDI", "1 NAME Mira /Testa/", "1 NOTE A note that is split", "2 CONC  with CONC, which 7.0 removed.", "0 TRLR"]),
  {
    version: "7.0",
    encoding: "UTF-8",
    faults: ["conc_in_v7"],
    title: "CONC in a 7.0 file",
    explanation: "CONC does not exist in 7.0. Seen in files where only the version number was changed.",
  },
);

add(
  "structure/no-head.ged",
  utf8(["0 @I1@ INDI", "1 NAME Mira /Testa/", "0 TRLR"]),
  {
    version: "unknown",
    encoding: "UTF-8",
    faults: ["head_missing"],
    title: "No header",
    explanation: "The file starts with a record. Without HEAD there is no version and no character set.",
  },
);

writeFileSync(join(root, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`${manifest.length} files written`);

// ---------------------------------------------------------------- README

const sections = [
  ["valid", "Valid files", "These should load without errors. Use them as a baseline and as round-trip input."],
  ["links", "Broken links", "Pointer problems between records."],
  ["dates", "Impossible dates", "Dates that do not exist, and dates that cannot be true together."],
  ["encoding", "Character sets", "ANSEL, Windows-1252, UTF-16 and broken UTF-8. The same four invented names appear in most of them, so the decoded result is easy to compare."],
  ["structure", "File structure", "Problems in the line structure rather than the content."],
];

const table = (dir) => {
  const rows = manifest.filter((e) => e.file.startsWith(`files/${dir}/`));
  const out = ["| File | Version | Encoding | Fault codes |", "| --- | --- | --- | --- |"];
  for (const e of rows) {
    out.push(`| [${e.file.split("/").pop()}](${e.file}) | ${e.version} | ${e.encoding} | ${e.faults.map((f) => `\`${f}\``).join(", ") || "none"} |`);
  }
  out.push("");
  for (const e of rows) {
    out.push(`**${e.file.split("/").pop()}**: ${e.title}. ${e.explanation}`);
    for (const d of e.knownDifferences ?? []) out.push(`Known difference in ${d.tool}: ${d.note}`);
    out.push("");
  }
  return out.join("\n");
};

const readme = `# GEDCOM test files

Small synthetic GEDCOM files with known faults, for testing genealogy software: parsers, importers, converters and validators.

- ${manifest.length} files, GEDCOM 5.5.1 and 7.0, most under 1 KB.
- Each file has one kind of fault (or none), described below and in [manifest.json](manifest.json).
- Every person, place and source is invented. No real family data.
- MIT licensed. Copy the files into your own test suite.

The files are generated by [scripts/build.mjs](scripts/build.mjs), so their exact bytes (character sets, byte order marks, line endings) can be reviewed and rebuilt. \`.gitattributes\` keeps Git from changing line endings in \`.ged\` files; if you copy them by other means, compare the byte counts in the manifest.

## How to use

Download a single file from the tables below, or clone the repository:

\`\`\`sh
git clone https://github.com/thememorypalace/gedcom-test-files.git
\`\`\`

\`manifest.json\` lists every file with its version, encoding, the fault codes it should trigger, and an explanation. A test can loop over it:

\`\`\`js
import manifest from "./gedcom-test-files/manifest.json" with { type: "json" };

for (const entry of manifest) {
  const result = yourParser(readFileSync(entry.file));
  // entry.faults is empty for valid files
}
\`\`\`

The fault codes are the ones used by [gedcom-tools](https://github.com/thememorypalace/gedcom-tools). Other validators name them differently; the explanations say what is wrong in plain words, so you can map them to your own codes.

## The files

${sections.map(([dir, title, intro]) => `### ${title}\n\n${intro}\n\n${table(dir)}`).join("\n")}
## Checking the descriptions

\`\`\`sh
npm install
npm test
\`\`\`

This runs every file through gedcom-tools and checks that each listed fault is reported, and that the valid files give no errors or warnings. Where gedcom-tools itself gets a file wrong, the manifest says so under \`knownDifferences\` instead of changing the file to suit the tool.

## Contributing

New cases are welcome, especially faults found in real exports from genealogy programs. Please rebuild them from invented data: never submit a file with real people in it, living or dead. Add the case to \`scripts/build.mjs\`, run \`npm run build\` and \`npm test\`, and open a pull request.

## About

Made by the small team behind [The Memory Palace](https://www.thememorypalace.ai) in Leuven, Belgium, while building the free [GEDCOM checker](https://www.thememorypalace.ai/gedcom-checker). See also [photo-date](https://github.com/thememorypalace/photo-date), a library that reads when a photo was taken.

## License

MIT. See [LICENSE](LICENSE).
`;
writeFileSync(join(root, "README.md"), readme);
