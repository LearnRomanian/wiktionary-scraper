import * as cheerio from "cheerio";
import selectors from "../../constants/selectors.js";
import { AudioFile, Pronunciation, Transcription } from "../../types.js";
import { EntrySectionSkeleton } from "../parser.js";

export default function parse($: cheerio.CheerioAPI, section: EntrySectionSkeleton): Partial<Pronunciation> | undefined {
	console.log('Pronunciation parser called with section:', section);
	// Find the pronunciation section
	let $section;

	// Try to find by ID (handle both with and without # prefix)
	const sectionId = section.id.startsWith('#') ? section.id : `#${section.id}`;
	console.log('Looking for pronunciation section with ID:', sectionId);
	$section = $(`[id="${sectionId.replace('#', '')}"]`).parent();

	if (!$section.length) {
		console.log('Section not found by ID, trying to find by heading text');
		// Try all heading levels (h2, h3, h4) since pronunciation might be at different levels
		$section = $("h2, h3, h4").filter((_, el) => {
			const text = $(el).text().trim();
			return text === "Pronunciation" || text.includes("Pronunciation");
		}).parent();
	}

	if (!$section.length) {
		console.log('Still no pronunciation section found, trying direct search');
		// Last resort: look for any pronunciation section
		$section = $("#Pronunciation").parent();
	}

	if (!$section.length) {
		console.log('Pronunciation section not found');
		return undefined;
	}
	console.log('Pronunciation section found:', $section.html()?.substring(0, 100));

	// Get the list of pronunciation items
	let $list = $section.next(selectors.pronunciation.list);

	// If no list found immediately after the section heading, try looking within the section
	if (!$list.length) {
		console.log('No pronunciation list found after section, looking within section');
		$list = $section.find(selectors.pronunciation.list).first();
	}

	// If still no list found, try looking for any ul after any pronunciation heading
	if (!$list.length) {
		console.log('Still no pronunciation list found, trying broader search');
		$list = $("h2, h3, h4").filter((_, el) => {
			const text = $(el).text().trim();
			return text === "Pronunciation" || text.includes("Pronunciation");
		}).next("ul");
	}

	if (!$list.length) {
		console.log('No pronunciation list found');
		return undefined;
	}

	console.log('Pronunciation list found with items:', $list.find('li').length);

	// Initialize pronunciation components
	const transcriptions: Transcription[] = [];
	const audioFiles: AudioFile[] = [];
	const rhymes: string[] = [];
	const homophones: string[] = [];
	const hyphenation: string[] = [];

	// Process each list item
	$list.find(selectors.pronunciation.item).each((_, item) => {
		const $item = $(item);
		const itemText = $item.text();

		// Find all IPA transcriptions
		$item.find(selectors.pronunciation.ipa).each((_, ipaElement) => {
			const ipaValue = $(ipaElement).text();
			if (ipaValue) {
				// Try to determine the dialect/language from the context
				let value = "English";
				const itemContent = $item.html() || "";
				if (itemContent.includes("US") || itemContent.includes("American")) {
					value = "American English";
				} else if (itemContent.includes("UK") || itemContent.includes("British")) {
					value = "British English";
				} else if (itemContent.includes("Australia")) {
					value = "Australian English";
				}

				transcriptions.push({
					system: "IPA",
					key: value,
					value: ipaValue,
				});
			}
		});

		// Find audio files
		$item.find(selectors.pronunciation.audio).each((_, audioElement) => {
			const $audio = $(audioElement);
			const $source = $audio.find(selectors.pronunciation.source);
			const src = $source.attr("src");
			if (src) {
				// Extract labels if available
				const labels: string[] = [];
				if (itemText.includes("US") || itemText.includes("American")) {
					labels.push("US");
				} else if (itemText.includes("UK") || itemText.includes("British")) {
					labels.push("UK");
				} else if (itemText.includes("Australia")) {
					labels.push("Australia");
				}

				audioFiles.push({
					value: src,
					labels: labels.length > 0 ? labels : undefined,
				});
			}
		});

		// Extract rhymes
		if (itemText.includes("Rhymes:")) {
			const rhymeMatch = itemText.match(/Rhymes:\s*(.+)/);
			if (rhymeMatch && rhymeMatch[1]) {
				const rhymeValues = rhymeMatch[1].split(",").map(r => r.trim());
				rhymes.push(...rhymeValues);
			}
		}

		// Extract homophones
		if (itemText.includes("Homophones:")) {
			const homophoneMatch = itemText.match(/Homophones:\s*(.+)/);
			if (homophoneMatch && homophoneMatch[1]) {
				const homophoneValues = homophoneMatch[1].split(",").map(h => h.trim());
				homophones.push(...homophoneValues);
			}
		}

		// Extract hyphenation
		if (itemText.includes("Hyphenation:")) {
			const hyphenationMatch = itemText.match(/Hyphenation:\s*(.+)/);
			if (hyphenationMatch && hyphenationMatch[1]) {
				const hyphenationValues = hyphenationMatch[1].split(",").map(h => h.trim());
				hyphenation.push(...hyphenationValues);
			}
		}
	});

	// Build the pronunciation object with only non-empty arrays
	const result: Partial<Pronunciation> = {};

	if (transcriptions.length > 0) result.transcriptions = transcriptions;
	if (audioFiles.length > 0) result.audioFiles = audioFiles;
	if (rhymes.length > 0) result.rhymes = rhymes;
	if (homophones.length > 0) result.homophones = homophones;
	if (hyphenation.length > 0) result.hyphenation = hyphenation;

	console.log('Pronunciation result:', JSON.stringify(result, null, 2));
	return Object.keys(result).length > 0 ? result : undefined;
}