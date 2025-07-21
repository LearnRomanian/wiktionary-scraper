import { describe, it } from "mocha";
import * as Wiktionary from "../src/index.js";
import { expect } from "chai";

describe("The parser", () => {
	it("returns `undefined` for terms that do not exist.", async () => {
		const results = await Wiktionary.get("this.is.a.string.that.does.not.exist");

		expect(results).to.be.undefined;
	});

	it("returns English results for terms that do exist.", async () => {
		const results = await Wiktionary.get("o");

		expect(results).to.not.be.undefined;
	});

	it("returns results for terms in a language different to English.", async () => {
		const results = await Wiktionary.get("o", { lemmaLanguage: "Romanian" });

		expect(results).to.not.be.undefined;
	});

	it("returns `undefined` for redirects when following redirects is disabled.", async () => {
		// This would redirect to "Germany" otherwise.
		const results = await Wiktionary.get("germany");

		expect(results).to.be.undefined;
	});

	it("returns results for redirects when following redirects is enabled.", async () => {
		const results = await Wiktionary.get("a", { followRedirect: true });

		expect(results).to.not.be.undefined;
	});

	it("parses result with one etymology section and one part of speech.", async () => {
		const results = await Wiktionary.get("United Kingdom", { lemmaLanguage: "English" });

		expect(results).to.not.be.undefined;
		expect(results).to.be.of.length(1);
	});

	it("parses result with one etymology section and more than one part of speech.", async () => {
		const results = await Wiktionary.get("Haus", { lemmaLanguage: "German" });

		expect(results).to.not.be.undefined;
		expect(results).to.be.of.length(2);
	});

	it("parses result with multiple etymology sections with one or more part of speech each.", async () => {
		const results = await Wiktionary.get("a");

		expect(results).to.not.be.undefined;
		expect(results).to.be.at.of.length.at.least(13);
	});

	it("returns results for words written in other scripts than Latin.", async () => {
		const results = await Wiktionary.get("أدرك", { lemmaLanguage: "Arabic" });

		expect(results).to.not.be.undefined;
		expect(results).to.be.at.of.length.at.least(1);
	});
});
