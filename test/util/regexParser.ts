import {
	complete,
	delimited,
	error,
	map,
	okWithValue,
	optional,
	or,
	Parser,
	preceded,
	star,
	then,
	token
} from 'prsc';

// The AST we want to parse into
export type Test = { type: 'test'; value: string };
export type Atom = Test | RegEx;
export type Quantified = Atom | { type: 'repetition'; value: Atom };
export type Seq = Quantified[];
export type RegEx = { type: 'choice'; value: Seq[] };

// Parse a single lower-case character from a-z...
const char: Parser<string> = (input, offset) => {
	if (/^[a-z]$/.test(input[offset])) {
		return okWithValue(offset + 1, input[offset]);
	}
	return error(offset, ['a-z']);
};
// ...and turn that into a Test AST node
const test: Parser<Test> = map(char, str => ({ type: 'test', value: str }));

// An Atom is either a Test or a RegEx delimited by parentheses
const atom: Parser<Atom> = or<Atom>([delimited(token('('), regexIndirect, token(')')), test]);

// A Quantified atom is an Atom optionally followed by a '*'
const quantified: Parser<Quantified> = then(atom, optional(token('*')), (atom, q) => {
	if (q === null) {
		return atom;
	}
	return { type: 'repetition', value: atom };
});

// A sequence of Quantified atoms represetns several characters to be matched in order
const seq: Parser<Seq> = star(quantified);

// A RegEx consists of one or more branches, each a Seq AST node
const regex: Parser<RegEx> = then(seq, star(preceded(token('|'), seq)), (first, rest) => ({
	type: 'choice',
	value: [first].concat(rest)
}));

// Use a wrapper function to enable atom to recursively reference regex
function regexIndirect(input: string, offset: number) {
	return regex(input, offset);
}

// Don't allow anything past the end of the regex
const completeRegex = complete(regex);

// Wrapper for convenience
export function parse(input: string): RegEx {
	const res = completeRegex(input, 0);
	if (!res.success) {
		throw new Error("Can't parse regex");
	}
	return res.value;
}
