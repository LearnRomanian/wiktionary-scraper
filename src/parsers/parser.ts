import * as cheerio from "cheerio";
import partsOfSpeech from "../constants/parts-of-speech.js";
import patterns from "../constants/patterns.js";
import sections from "../constants/sections.js";
import selectors from "../constants/selectors.js";
import { ScraperOptions } from "../options.js";
import { Entry, Lemma, SectionType, Sections } from "../types.js";
import { addMissingProperties } from "../utils.js";
import parsers from "./parsers.js";

export type Parser<S extends Partial<Sections>, K extends keyof S> = (
	$: cheerio.CheerioAPI,
	sectionSkeleton: EntrySectionSkeleton,
) => S[K];

export interface EntrySectionSkeleton {
	id: string;
	name: string;
	sections: EntrySectionSkeleton[];
}

export function parse(options: ScraperOptions, $: cheerio.CheerioAPI, lemma: Lemma): Entry[] | undefined {
	const $tableOfContents = $(selectors.tableOfContents.tableOfContents).first();
	const $entries = $tableOfContents.find(selectors.tableOfContents.entries.entries(0));

	const skeletons: EntrySectionSkeleton[] = [];
	for (const entryElement of $entries) {
		const skeleton = parseSectionSkeleton($, entryElement, 1);
		if (skeleton === undefined) {
			continue;
		}

		skeletons.push(skeleton);
	}

	const skeletonForLanguage = skeletons.find((skeleton) => skeleton.name === options.lemmaLanguage);
	if (skeletonForLanguage === undefined) {
		return undefined;
	}

	return parseEntrySkeleton(options, $, skeletonForLanguage, lemma);
}

function parseSectionSkeleton(
	$: cheerio.CheerioAPI,
	section: cheerio.Element,
	depth: number,
): EntrySectionSkeleton | undefined {
	const $section = $(section);
	const $root = $section.find(selectors.tableOfContents.entries.root.root).first();
	const id = $root.attr("href");
	if (id === undefined) {
		return undefined;
	}

	const $name = $root.find(selectors.tableOfContents.entries.root.text).first();
	const name = $name.html() ?? undefined;
	if (name === undefined) {
		return undefined;
	}

	const $sections = $section.find(selectors.tableOfContents.entries.entries(depth));
	if ($sections === undefined) {
		return { id, name, sections: [] };
	}

	const sections: EntrySectionSkeleton[] = [];
	for (const sectionElement of $sections) {
		const section = parseSectionSkeleton($, sectionElement, depth + 1);
		if (section === undefined) {
			continue;
		}

		sections.push(section);
	}

	return { id, name, sections };
}

function parseEntrySkeleton(
	options: ScraperOptions,
	$: cheerio.CheerioAPI,
	skeleton: EntrySectionSkeleton,
	lemma: Lemma,
): Entry[] | undefined {
	const isMultipleEntries = skeleton.sections.some((skeleton) => {
		const [_, sectionName, sectionIndex] = patterns.sectionName.exec(skeleton.name) ?? [];
		if (sectionName === undefined) {
			return false;
		}

		const sectionType = sections[options.siteLanguage][sectionName];
		if (sectionType === undefined) {
			return false;
		}

		return sectionType === "etymology" && sectionIndex !== undefined;
	});
	if (isMultipleEntries) {
		return parseMultipleEtymologies(options, $, skeleton, lemma);
	}

	const entries = parseSingleEtymology(options, $, skeleton, lemma);
	if (entries === undefined) {
		return [];
	}

	return entries;
}

type SectionTypeTuple = [sectionType: SectionType, sectionIndex: number | undefined, skeleton: EntrySectionSkeleton];
type SectionNameTuple = [sectionName: string, skeleton: EntrySectionSkeleton];

function parseMultipleEtymologies(
	options: ScraperOptions,
	$: cheerio.CheerioAPI,
	skeleton: EntrySectionSkeleton,
	lemma: Lemma,
): Entry[] | undefined {
	const sectionsMapped = sections[options.siteLanguage];

	const skeletonWithoutEtymologySections: EntrySectionSkeleton = { id: skeleton.id, name: skeleton.name, sections: [] };

	const etymologySections: EntrySectionSkeleton[] = [];
	for (const sectionSkeleton of skeleton.sections) {
		const [_, sectionName] = patterns.sectionName.exec(sectionSkeleton.name) ?? [];
		if (sectionName === undefined) {
			continue;
		}

		const sectionType = sectionsMapped[sectionName];
		if (sectionType === undefined) {
			continue;
		}

		if (sectionType === "etymology") {
			etymologySections.push(sectionSkeleton);
		} else {
			skeletonWithoutEtymologySections.sections.push(sectionSkeleton);
		}
	}

	const topLevelEntries = parseSingleEtymology(options, $, skeletonWithoutEtymologySections, lemma);

	const entries: Entry[] = [];
	for (const etymologySection of etymologySections) {
		const etymology = parsers.etymology($, etymologySection);

		const entriesNew = parseSingleEtymology(options, $, etymologySection, lemma);
		if (entriesNew === undefined) {
			continue;
		}

		if (etymology !== undefined) {
			for (const entry of entriesNew) {
				entry.etymology = etymology;
			}
		}

		entries.push(...entriesNew);
	}

	if (topLevelEntries !== undefined) {
		if (entries.length === 0) {
			return topLevelEntries;
		}

		for (const entry of entries) {
			for (const topLevelEntry of topLevelEntries) {
				addMissingProperties(entry, topLevelEntry);
			}
		}

		return entries;
	} else {
		return entries;
	}
}

function parseSingleEtymology(
	options: ScraperOptions,
	$: cheerio.CheerioAPI,
	skeleton: EntrySectionSkeleton,
	lemma: Lemma,
): Entry[] | undefined {
	const sectionsMapped = sections[options.siteLanguage];
	const partsOfSpeechMapped = partsOfSpeech[options.siteLanguage];

	const sectionTuples: SectionTypeTuple[] = [];
	const sectionsUnrecognised: SectionNameTuple[] = [];
	for (const sectionSkeleton of skeleton.sections) {
		const [_, sectionName] = patterns.sectionName.exec(sectionSkeleton.name) ?? [];
		if (sectionName === undefined) {
			continue;
		}

		const sectionType = sectionsMapped[sectionName];
		if (sectionType === undefined) {
			sectionsUnrecognised.push([sectionName, sectionSkeleton]);
			continue;
		}

		sectionTuples.push([sectionType, undefined, sectionSkeleton]);
	}

	const entrySections: Partial<Sections> = {};
	for (const [sectionType, _, sectionSkeleton] of sectionTuples) {
		if (sectionType in entrySections) {
			continue;
		}

		const parse = parsers[sectionType];
		const section = parse($, sectionSkeleton);
		if (section === undefined) {
			continue;
		}

		// @ts-ignore: This is fine.
		entrySections[sectionType] = section;
	}

	// Find pronunciation section if it exists
	let pronunciationSkeleton: EntrySectionSkeleton | undefined;
	for (const sectionSkeleton of skeleton.sections) {
		const [_, sectionName] = patterns.sectionName.exec(sectionSkeleton.name) ?? [];
		if (sectionName === "Pronunciation" || sectionSkeleton.name === "Pronunciation" || 
		    sectionSkeleton.name.includes("Pronunciation")) {
			console.log('Found pronunciation section in TOC:', sectionSkeleton);
			pronunciationSkeleton = sectionSkeleton;
			break;
		}
	}

	// If no pronunciation section found in TOC, create a dummy one
	if (!pronunciationSkeleton) {
		console.log('No pronunciation section found in TOC, creating dummy section');
		// Create a dummy section for pronunciation
		pronunciationSkeleton = {
			id: "Pronunciation",
			name: "Pronunciation",
			sections: []
		};
	}

	// Parse pronunciation if found
	if (pronunciationSkeleton && !entrySections.pronunciation) {
		console.log('Parsing pronunciation section');
		const pronunciation = parsers.pronunciation($, pronunciationSkeleton);
		if (pronunciation) {
			console.log('Pronunciation data found, adding to entry sections');
			entrySections.pronunciation = pronunciation;
		}
	}

	const entries: Entry[] = [];
	for (const [sectionName, skeleton] of sectionsUnrecognised) {
		const partOfSpeech = partsOfSpeechMapped[sectionName];
		if (partOfSpeech === undefined) {
			continue;
		}

		const definitions = parsers.definitions($, skeleton);
		if (definitions === undefined) {
			continue;
		}

		entries.push({ ...entrySections, lemma, partOfSpeech, definitions });
	}
	return entries;
}
