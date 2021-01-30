import ntc from './ntc.js';

document.addEventListener('DOMContentLoaded', (event) => {
	document.querySelectorAll('pre code').forEach((block) => {
		hljs.highlightBlock(block);
	});
});

//keyup prevented the user from deleting the bullet (by adding one back right after delete), but didn't add in <li>'s on empty <ul>s, thus keydown added to check
jQuery('#colors').on('keyup keydown', function() {
	var $this = jQuery(this);
	if (! $this.html()) {
		var $li = jQuery('<li></li>');

		var sel = window.getSelection();

		var range = sel.getRangeAt(0);

		range.collapse(false);
		range.insertNode($li.get(0));
		range = range.cloneRange();
		range.selectNodeContents($li.get(0));
		range.collapse(false);
		sel.removeAllRanges();
		sel.addRange(range);

	} else {
		//are there any tags that AREN'T LIs?
		//this should only occur on a paste
		var $nonLI = $this.find(':not(li, br)');

		if ($nonLI.length) {
			$this.contents().replaceWith(function() {
				//we create a fake div, add the text, then get the html in order to strip out html code. we then clean up a bit by replacing nbsp's with real spaces
				return '<li>' + jQuery('<div />').text(jQuery(this).text()).html().replace(/&nbsp;/g, ' ') + '</li>';
			});
			//we could make this better by putting the caret at the end of the last LI, or something similar
		}
	}

});

jQuery('#colors').on('paste', e => {
	// cancel paste
	e.preventDefault();

	// get text representation of clipboard
	var text = (e.originalEvent || e).clipboardData.getData('text/plain');

	// insert text manually
	document.execCommand("insertHTML", false, text);

	jQuery('#colors').append('<li />');
	const $colors = document.getElementById('colors');
	const sel = window.getSelection();
	const range = document.createRange();
	const childNodes = $colors.childNodes;

	range.selectNodeContents(childNodes[childNodes.length - 1]);
	sel.removeAllRanges();
	sel.addRange(range);
});

const lowerCaseFirstCharacter = string => {
	if (typeof string !== 'string') return ''
	return string.charAt(0).toLowerCase() + string.slice(1)
}

const removeAllWhiteSpaces = string => {
	if (typeof string !== 'string') return ''
	return string.replaceAll(/\s/g,'')
}

const convertToValidHexCode = hexColor => {
	if (typeof hexColor !== 'string') return ''
	const firstCharacter = hexColor.charAt(0);
	if (firstCharacter === '#') return hexColor;
	return `#${hexColor}`;
}

const $convertButton = document.querySelector('#button');
const $code = document.querySelector('code');
const defaultCodeText = `:root {
    %COLORS%
}`;
$convertButton.addEventListener('click', () => {
	$code.innerHTML = defaultCodeText;
	let colors = [];
	jQuery('#colors li').each(function(i, elem) {
		colors.push(jQuery(elem).text());
	});

	const hexColorPattern = /^#+([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/;
	let cssColorVariables = {};

	colors.forEach(hexColor => {
		hexColor = convertToValidHexCode(hexColor.trim());
		if (hexColor.match(hexColorPattern)) {
			const ntcColor = ntc.name(hexColor);
			if (!ntcColor[1].includes('Invalid') && ntcColor && (Object.values(cssColorVariables).indexOf(hexColor) <= -1)) {
				let cssVariableName;
				const ntcColorFormatted = removeAllWhiteSpaces(lowerCaseFirstCharacter(ntcColor[1]));
				const cssColorVariablesKeys = Object.keys(cssColorVariables);
				const numberOfExistingVariableKey = cssColorVariablesKeys.filter(colorName => new RegExp(`${ntcColorFormatted}`).test(colorName)).length;

				if (numberOfExistingVariableKey === 0) {
					cssVariableName = `--${ntcColorFormatted}Color`;
				} else {
					cssVariableName = `--${ntcColorFormatted}${numberOfExistingVariableKey + 1}Color`;
				}
				cssColorVariables[cssVariableName] = hexColor;
			}
		}
	});

	let cssColorsVariablesText = '';
	for (const cssColorVariable in cssColorVariables) {
		const cssColorName = cssColorVariable;
		const cssColorHex = cssColorVariables[cssColorVariable];
		cssColorsVariablesText += `${cssColorName}: ${cssColorHex};\n    `;
	}

	let codeText = $code.innerText;
	codeText = codeText.replace('%COLORS%', cssColorsVariablesText);
	$code.innerText = codeText;

	hljs.highlightBlock($code);
});