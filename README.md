A lightweight scraper to fetch information about words in various languages from Wiktionary.

## Table of contents

- [Table of contents](#table-of-contents)
- [Usage](#usage)
- [Completeness](#completeness)
    - [Features](#features)
    - [Section support](#section-support)
    - [Recognised parts of speech](#recognised-parts-of-speech)
        - [Parts of speech](#parts-of-speech)
        - [Morphemes](#morphemes)
        - [Symbols](#symbols)
        - [Phrases](#phrases)
        - [Han characters and language-specific varieties](#han-characters-and-language-specific-varieties)
        - [Other](#other)
        - [Explicitly disallowed parts of speech](#explicitly-disallowed-parts-of-speech)
        - [Library additions](#library-additions)


## Usage

To start using the scraper, first install it using the following command:

```shell
npm install wiktionary-scraper
```

The simplest way of using the scraper is as follows:

```ts
import * as Wiktionary from "wiktionary-scraper";

const results = await Wiktionary.get("word");
```

You can change the language of the target word by setting the `lemmaLanguage`:

```ts
import * as Wiktionary from "wiktionary-scraper";

const results = await Wiktionary.get('o', {
  lemmaLanguage: "Romanian",
});
```

You can specify if redirects should be followed by setting `followRedirects` to `true`:

```ts
import * as Wiktionary from "wiktionary-scraper";

// Redirects to and returns results for "Germany".
const results = await Wiktionary.get('germany', {
  followRedirects: true,
});
```

By default, the `User-Agent` header used in requests is filled in using a default value mentioning `wiktionary-scraper`.

To remove it, set `userAgent` to `undefined`.

If you want to change it, specify `userAgent`:

```ts
import * as Wiktionary from "wiktionary-scraper";

const results = await Wiktionary.get('word', {
  userAgent: "Your App (https://example.com)",
});
```

You can also parse HTML of the website directly, bypassing the fetch step.

ℹ️ Notice that, as opposed to `get()`, `parse()` is synchronous:

```ts
import * as Wiktionary from "wiktionary-scraper";

const results = Wiktionary.parse(html);
```

## Completeness

This library currently only supports the English version of Wiktionary.

#### Features

- Parses both single- and multiple-etymology entries.
- Recognises standard, non-standard and some explicitly disallowed parts of speech, as defined [here](https://en.wiktionary.org/wiki/Wiktionary:Entry_layout#Part_of_speech). In total, there are 60+ recognised parts of speech, which should cover the vast majority of definitions.
  - Note, however, that it is very possible that the library will fail to recognise certain niche, non-standard parts of speech. Should you come across any, please post an issue.

#### Section support

- [ ] Description
- [ ] Glyph origin
- [x] Etymology
- [x] Pronunciation
- [ ] Production
- [x] Definitions
- [ ] Usage notes
- [ ] Reconstruction notes
- [ ] _Inflection sections_:
  - [ ] Inflection
  - [ ] Conjugation
  - [ ] Declension
- [ ] Mutation
- [ ] Quotations
- [ ] Alternative forms
- [ ] Alternative reconstructions
- [ ] _Relations_:
  - [ ] Synonyms
  - [ ] Antonyms
  - [ ] Hypernyms
  - [ ] Hyponyms
  - [ ] Meronyms
  - [ ] Holonyms
  - [ ] Comeronyms
  - [ ] Troponyms
  - [ ] Parasynonyms
  - [ ] Coordinate terms
  - [ ] Derived terms
  - [ ] Related terms
- [ ] Translations
- [ ] Trivia
- [ ] See also
- [ ] References
- [ ] Further reading
- [ ] Anagrams
- [ ] Examples

#### Recognised parts of speech

###### Parts of speech

- Adjective
- Adverb
- Ambiposition
- Article
- Circumposition
- Classifier
- Conjunction
- Contraction
- Counter
- Determiner
- Ideophone
- Interjection
- Noun
- Numeral
- Participle
- Particle
- Postposition
- Preposition
- Pronoun
- Proper noun
- Verb

###### Morphemes

- Circumfix
- Combining form
- Infix
- Interfix
- Prefix
- Root
- Suffix

###### Symbols

- Diacritical mark
- Letter
- Ligature
- Number
- Punctuation mark
- Syllable
- Symbol

###### Phrases

- Phrase
- Proverb
- Prepositional phrase

###### Han characters and language-specific varieties

- Han character
- Hanzi
- Kanji
- Hanja

###### Other

- Romanization
- Logogram
- Determinative

###### Explicitly disallowed parts of speech

You know, just in case somebody didn't follow the rules on Wiktionary.

- Abbreviation
- Acronym
- Initialism
- Cardinal-number
- Ordinal-number
- Cardinal-numeral
- Ordinal-numeral
- Clitic
- Gerund
- Idiom

###### Library additions

- Adposition
- Affix
- Character