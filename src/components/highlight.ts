/* Realce de sintaxe simples para ABAP, CDS, BDL, DDL e DCL. Devolve HTML escapado. */

const ABAP_KW = new Set(
  'ABSTRACT ADD ALIASES ALIGN ALL AND APPEND APPENDING AS ASCENDING ASSIGNING AT AUTHORITY-CHECK AVG BASE BEGIN BINARY BY CASE CAST CATCH CHANGING CHECK CLASS CLASS-DATA CLASS-METHODS CLEANUP CLEAR COMMIT COMPONENTS CONSTANTS CONSTRUCTOR CONTINUE CONV CORRESPONDING COUNT CREATE DATA DATE DECIMALS DEFAULT DEFINITION DELETE DESCENDING DISTINCT DIV DO DURATION ELSE ELSEIF END END-OF-DEFINITION ENDCASE ENDCLASS ENDDO ENDIF ENDLOOP ENDMETHOD ENDTRY ENDWHILE ENTITIES ENTITY EQ EXACT EXCEPT EXCEPTION EXIT EXPORTING FAILED FIELD FIELD-SYMBOL FIELD-SYMBOLS FIELDS FINAL FIND FIRST FOR FROM GROUP HASHED HAVING ID IF IMPLEMENTATION IMPORTING IN INCLUDE INHERITING INITIAL INNER INSERT INSTANCE INTERFACE INTERFACES INTO IS JOIN KEY LEFT LENGTH LIKE LINE LINES LOOP MAPPING MAX METHOD METHODS MIN MOD MODIFY NEW NO NON-UNIQUE NOT NUMBER OBJECT OCCURRENCES OF OFFSET ON OPTIONAL OR ORDER OTHERS OUTER PAD PCRE PRIVATE PROTECTED PUBLIC RAISE RAISING READ READ-ONLY REDEFINITION REF REFERENCE REPORTED RESPONSE RESULT RESULTS RETURNING RIGHT RISK LEVEL ROLLBACK ROWS SECTION SELECT SET SHORT SINGLE SORT SORTED STANDARD STATIC SUM TABLE TESTING THEN TIMES TO TRANSPORTING TRY TYPE TYPES UNIQUE UP UPDATE USER USING VALUE WHEN WHERE WHILE WIDTH WITH HARMLESS BOUND ISO UPPER CENTER'.split(' '),
);
const CDS_KW = new Set(
  'define view entity as select from key association to on where group by having case when then else end cast with parameters annotate extend table not null grant aspect role managed implementation in class unique strict persistent lock master authorization etag create update delete field readonly numbering determination validation modify save action result instance and or inner join left outer of projection root composition redefine service expose provider contract use alias'.split(' '),
);
const ABAP_TYPES = new Set('i int8 p c n d t string xstring decfloat34 decfloat16 f abap_bool'.split(' '));
const TOKEN_RE =
  /(^\*.*$)|("[^\n]*$)|(\/\/[^\n]*$)|(\/\*[\s\S]*?\*\/)|('(?:[^'\n]|'')*')|(`(?:[^`\n]|``)*`)|(\|(?:[^|\\\n]|\\.)*\|)|(@[A-Za-z][\w.]*)|(\bsy-\w+)|(\$(?:projection|parameters|session)[\w.]*)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_/][\w/]*(?:-[A-Za-z]+)*)/gm;

export const esc = (s: unknown) =>
  String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Linguagens tratadas como CDS (palavras-chave em minúsculas). */
export const isCdsLang = (lang?: string) => !!lang && !/^abap$/i.test(lang);

export function highlight(code: string, lang = 'ABAP'): string {
  const cds = isCdsLang(lang);
  let out = '';
  let last = 0;
  let prev = '';
  const span = (cls: string, m: string) => `<span class="hl-${cls}">${esc(m)}</span>`;
  code.replace(TOKEN_RE, (m, star, q, sl, ml, s1, s2, tpl, ann, sy, dol, num, word, off: number) => {
    out += esc(code.slice(last, off));
    last = off + m.length;
    if (star || q || sl || ml) out += span('c', m);
    else if (s1 || s2) out += span('s', m);
    else if (tpl) out += span('t', m);
    else if (ann || dol || sy) out += span('a', m);
    else if (num) out += span('n', m);
    else if (word) {
      let cls = '';
      if (cds) {
        if (CDS_KW.has(word.toLowerCase()) && word === word.toLowerCase()) cls = 'k';
      } else if (ABAP_KW.has(word)) cls = 'k';
      else if (ABAP_TYPES.has(word) && /^(TYPE|CONV|EXACT|OF)$/.test(prev)) cls = 'a';
      out += cls ? span(cls, m) : esc(m);
      prev = word;
    } else out += esc(m);
    return m;
  });
  return out + esc(code.slice(last));
}

/** Realce linha a linha (para destacar linhas executadas). */
export const highlightLines = (code: string, lang?: string) => code.split('\n').map(l => highlight(l, lang));
