import * as cheerio from "cheerio";
import patterns from "../../constants/patterns.js";
import selectors from "../../constants/selectors.js";
import { Definition, Example, LabelledTextField, Quotation } from "../../types.js";
import { clean } from "../../utils.js";
import { EntrySectionSkeleton } from "../parser.js";

export default function parse($: cheerio.CheerioAPI, skeleton: EntrySectionSkeleton): Definition[] | undefined {
	const $root = $(skeleton.id);
	const $row = $root.parent();

	const $heading = $row.next(selectors.definitions.heading.heading);
	// const $headword = $heading.find(selectors.definitions.heading.headword);
	// const lemma = clean($headword.text());

	const $list = $heading.next(selectors.definitions.definitions.definitions.list);
	const $definitions = $list.children(selectors.definitions.definitions.definitions.definitions);
	const definitions: Definition[] = [];
	for (const definitionElement of $definitions) {
		const definition = parseDefinition($, definitionElement);
		if (definition === undefined) {
			continue;
		}

		definitions.push(definition);
	}

	return definitions;
}

function parseDefinition($: cheerio.CheerioAPI, element: cheerio.Element): Definition | undefined {
	const $root = $(element);

	let examples: Example[] | undefined;
	let quotations: Quotation[] | undefined;
	let definitions: Definition[] | undefined;

	const $exampleSection = $root.find(selectors.definitions.definitions.examples.list).first();
	if ($exampleSection.length !== 0) {
		const examples_: Example[] = [];

		const $examples = $exampleSection.children(selectors.definitions.definitions.examples.examples);
		$examples.remove();
		for (const _ of $examples) {
			// TODO(vxern): Parse examples.
		}

		if (examples_.length !== 0) {
			examples = examples_;
		}
	}

	const $quotationSection = $root.find(selectors.definitions.definitions.quotations.list).first();
	if ($quotationSection.length !== 0) {
		const quotations_: Quotation[] = [];

		const $quotations = $quotationSection.children(selectors.definitions.definitions.quotations.quotations);
		$quotations.remove();
		for (const _ of $quotations) {
			// TODO(vxern): Parse quotations.
		}

		if (quotations_.length !== 0) {
			quotations = quotations_;
		}
	}

	const $definitionSection = $root.find(selectors.definitions.definitions.definitions.list).first();
	if ($definitionSection.length !== 0) {
		const definitions_: Definition[] = [];

		const $definitions = $definitionSection.children(selectors.definitions.definitions.definitions.definitions);
		$definitions.remove();
		for (const definitionElement of $definitions) {
			const definition = parseDefinition($, definitionElement);
			if (definition === undefined) {
				continue;
			}

			definitions_.push(definition);
		}

		if (definitions_.length !== 0) {
			definitions = definitions_;
		}
	}

	$root.find('style').remove();
	const contentsRaw = clean($root.contents().text());
	const semicolonSeparated = contentsRaw.split(patterns.fieldSeparator);

	const fieldsRaw: [labels: string[] | undefined, contents: string][] = [];
	for (const sentence of semicolonSeparated) {
		const [_, labelsRaw, contents] = patterns.withPrefixedLabels.exec(sentence) ?? [];
		if (contents === undefined) {
			return undefined;
		}

		if (labelsRaw === undefined) {
			const previousField = fieldsRaw.at(-1);
			if (previousField === undefined) {
				fieldsRaw.push([undefined, contents]);
			} else {
				previousField[1] = `${previousField[1]}; ${contents}`;
			}
			continue;
		}

		const labels = labelsRaw.split(patterns.labelSeparator);
		fieldsRaw.push([labels, contents]);
	}

	const fields: LabelledTextField[] = [];
	for (const [labels, value] of fieldsRaw) {
		if (labels !== undefined) {
			fields.push({ labels, value });
		} else {
			fields.push({ value });
		}
	}

	const definition: Definition = { fields };

	if (examples !== undefined) {
		definition.examples = examples;
	}

	if (quotations !== undefined) {
		definition.quotations = quotations;
	}

	if (definitions !== undefined) {
		definition.definitions = definitions;
	}

	return definition;
}
