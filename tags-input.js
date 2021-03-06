var SEPERATOR = ',';

var BACKSPACE = 8,
	TAB = 9,
	ENTER = 13,
	LEFT = 37,
	RIGHT = 39,
	DELETE = 46,
	COMMA = 188;

module.exports = function tagsInput(originalInput) {
	function createElement(type, name, text, attributes) {
		var el = document.createElement(type);
		if (name) {
			el.className = name;
		}
		if (text) {
			el.textContent = text;
		}
		for ( var attributeName in attributes ) {
			el.setAttribute('data-'+attributeName, attributes[attributeName]);
		}
		return el;
	}

	function $(selector, all) {
		return base['querySelector'+(all?'All':'')](selector);
	}

	function getLastElement(nodeList){
		if ( nodeList ) {
			return nodeList[nodeList.length - 1];
		}
		return null;
	}

	// Get value of everything entered thus far - both existing tags and new input.
	function getValue() {
		// Tags
		var tagValues = Array.prototype.map.call($('.tag', true), function(tag) {
				return tag.textContent;
			}),
			// In progress input
			inProgress = base.input.value;
		if (inProgress) {
			tagValues.push(inProgress);
		}
		return tagValues.join(SEPERATOR);
	}

	function save() {
		originalInput.value = getValue();
		originalInput.dispatchEvent(new Event('change'));
	}

	// text:String data entered by user in input element OR existing element value when loading
	// Return true if we needed to add at least one tag
	function addTags(text) {

		var addedATag = false;
		// Add multiple tags if necessary, eg if the user pastes in data with SEPERATOR already in it.
		var newTagTexts = text.split(SEPERATOR);

		newTagTexts.forEach(function(newTagText){
			newTagText = newTagText.trim();
			// Ignore if newTagText is empty
			if ( ! ( newTagText ) ) {
				return;
			}
			// For duplicates, briefly highlight the existing tag
			if ( ! originalInput.getAttribute('duplicates') ) {
				var existingTag = $('[data-tag="'+newTagText+'"]');
				if (existingTag) {
					existingTag.classList.add('dupe');
					setTimeout(function(){
						existingTag.classList.remove('dupe');
					}, 100);
					return;
				}
			}
			var tagElement = createElement('span', 'tag', newTagText, {tag: newTagText});
			base.insertBefore(tagElement, base.input);
			addedATag = true;
		});
		return addedATag;
	}

	function select(el) {
		var selectedTag = $('.selected');
		if (selectedTag) {
			selectedTag.classList.remove('selected');
		}
		if (el) {
			el.classList.add('selected');
		}
	}

	function setInputWidth() {
		if ( ! base.offsetWidth) {
			return;
		}
		var lastTag = getLastElement($('.tag', true));
		base.input.style.width = Math.max(
			base.offsetWidth-(lastTag?(lastTag.offsetLeft+lastTag.offsetWidth):5)-5,
			base.offsetWidth/4
		) + 'px';
	}

	function savePartialInput() {
		if ( addTags(base.input.value) ) {
			base.input.value = '';
			save();
			setInputWidth();
		}
	}

	function refocus(e) {
		if (e.target.classList.contains('tag')) {
			select(e.target);
		}
		if (e.target===base.input) {
			select();
			return;
		}
		base.input.focus();
		e.preventDefault();
		return false;
	}

	var base = createElement('div', 'tags-input'),
		sib = originalInput.nextSibling;

	originalInput.parentNode[sib?'insertBefore':'appendChild'](base, sib);

	originalInput.style.cssText = 'position:absolute;left:0;top:-99px;width:1px;height:1px;opacity:0.01;';
	originalInput.tabIndex = -1;

	base.input = createElement('input', null, null, {
		'type': 'text',
		'placeholder': originalInput.placeholder,
		'pattern': originalInput.pattern,
		'spellcheck': originalInput.spellcheck,
		'autocorrect': originalInput.autocorrect,
		'autocapitalize': originalInput.autocapitalize,
		'autosuggest': originalInput.autocapitalize
	});
	base.appendChild(base.input);

	delete originalInput.pattern;
	originalInput.addEventListener('focus', function() {
		base.input.focus();
	});

	base.input.addEventListener('focus', function() {
		base.classList.add('focus');
		select();
	});

	base.input.addEventListener('blur', function() {
		base.classList.remove('focus');
		select();
		savePartialInput();
	});

	base.input.addEventListener('keydown', function(e) {
		var key = e.keyCode || e.which,
			selectedTag = $('.tag.selected'),
			pos = this.selectionStart===this.selectionEnd && this.selectionStart,
			lastTag = getLastElement($('.tag', true));

		setInputWidth();

		if (key===ENTER || key===COMMA || key===TAB) {
			if (!this.value && key!==COMMA) {
				return;
			}
			savePartialInput();
		}
		else if (key===DELETE && selectedTag) {
			if (selectedTag.nextSibling!==base.input) {
				select(selectedTag.nextSibling);
			}
			base.removeChild(selectedTag);
			setInputWidth();
			save();
		}
		else if (key===BACKSPACE) {
			if (selectedTag) {
				select(selectedTag.previousSibling);
				base.removeChild(selectedTag);
				setInputWidth();
				save();
			}
			else if (lastTag && pos===0) {
				select(lastTag);
			}
			else {
				return;
			}
		}
		else if (key===LEFT) {
			if (selectedTag) {
				if (selectedTag.previousSibling) {
					select(selectedTag.previousSibling);
				}
			}
			else if (pos!==0) {
				return;
			}
			else {
				select(lastTag);
			}
		}
		else if (key===RIGHT) {
			if (!selectedTag) {
				return;
			}
			select(selectedTag.nextSibling);
		}
		else {
			// If there are no tags yet, update the original input as the user types -
			// so that users who only want one thing don't have to enter commas
			if ( ! $('.tag', true).length ) {
				// Wait one tick (ie 0) so the key gets added to the input
				setTimeout(function(){
					originalInput.value = getValue();
					originalInput.dispatchEvent(new Event('input'));
				}, 0);

			}
			return select();
		}
		e.preventDefault();
		return false;
	});

	base.input.addEventListener('paste', function(e) {
		// Wait one tick (ie 0) so base.input gets filled from the paste, then save it.
		setTimeout(function(){
			savePartialInput();
		}, 0);
	});

	base.addEventListener('mousedown', refocus);
	base.addEventListener('touchstart', refocus);

	// Add tags for existing values
	addTags(originalInput.value);
	setInputWidth();
};
