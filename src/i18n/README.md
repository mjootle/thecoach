# Translations

English is the base language. Every other language overrides it key by key, and
anything missing falls back to English — so a partial translation is safe to ship.

## Files

```
en.json      base language — the source of truth for all interface text
es fr de it pt nl pl .json   translations (currently metadata only)
strings.js   GENERATED from the .json files — this is what the app loads
i18n.js      the runtime (detection, merge, fallback, plurals, dates)
```

`strings.js` exists because the app loads with plain `<script>` tags and has to work
offline from a single file, where `fetch()` of a .json cannot be relied on. It is the
same arrangement as `drills.json` → `drills.data.js`.

**Edit the .json files. Regenerate `strings.js` afterwards, or the app shows stale text.**

## Adding a translation

Copy the shape of `en.json` into the target file and translate the values. Keys and
nesting must match. You do not need every key — omit what you have not done yet and
English shows instead. The language selector in Settings displays a coverage figure
per language, computed from the key count.

`$meta` is required: `locale`, `name` (the language's own name, shown in the
selector), `englishName`.

## Plurals

Counted strings are objects of plural categories, selected with `Intl.PluralRules`:

```json
"drills": { "one": "{n} drill", "other": "{n} drills" }
```

Languages with more categories add them by name — Polish, for example, takes `one`,
`few`, `many` and `other`. Only `other` is required.

## Placeholders

`{n}`, `{name}`, `{date}` and similar are substituted at runtime. Keep them intact;
they may be reordered to suit the sentence.

## `$search`

`$search` is not display text. It holds the words the search box matches against —
number words, "against"/"v", warm-up synonyms, and equipment tokens. Each language
supplies its own vocabulary rather than a literal translation, and only matters once
drill content exists in that language.

## Drill content

Interface text and drill content are separate. Drill content is translated in place:
any drill or category in `drills.json` may carry an `i18n` block keyed by locale.

```json
{
  "num": "1.1",
  "name": "Free-movement jog",
  "setup": "Players jog freely inside the area…",
  "i18n": {
    "es": { "name": "Trote libre", "setup": "Los jugadores trotan…" }
  }
}
```

Fields absent from the block fall back to the base English field, so a drill can be
partly translated. The app reads content through `I18N.content(drill, 'name')`.
Regenerate `drills.data.js` after editing `drills.json`.
