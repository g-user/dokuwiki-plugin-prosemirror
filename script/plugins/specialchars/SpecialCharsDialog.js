import specialChars from './chars.js';

const RECENT_KEY = 'prosemirror.specialchars.recent';
const MAX_RECENT = 12;

/**
 * Read the recently used characters from the browser storage
 *
 * @return {string[]}
 */
function loadRecent() {
    try {
        const recent = JSON.parse(localStorage.getItem(RECENT_KEY));
        return Array.isArray(recent) ? recent.filter(char => typeof char === 'string').slice(0, MAX_RECENT) : [];
    } catch (e) {
        return [];
    }
}

/**
 * Remember a character as the most recently used one
 *
 * @param {string} char
 *
 * @return {void}
 */
function saveRecent(char) {
    try {
        const recent = [char, ...loadRecent().filter(c => c !== char)].slice(0, MAX_RECENT);
        localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    } catch (e) {
        // storage not available, the recent characters are a convenience only
    }
}

/**
 * Format the code point of a character like U+03A9
 *
 * @param {string} char
 *
 * @return {string}
 */
function codePoint(char) {
    const hex = char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'); // eslint-disable-line no-magic-numbers
    return `U+${hex}`;
}

/**
 * Create a dialog to select special characters and insert them into the editor
 *
 * The dialog stays open after a character was inserted, so several can be added in a row.
 * It is closed by the cancel button, the close icon, the escape key or a click next to it.
 *
 * @param {EditorView} view the editor to insert into
 * @param {function(): void} onClose called when the user wants to close the dialog; the caller then calls destroy()
 *
 * @return {{destroy: function(): void}} call destroy() to remove the dialog
 */
export default function createSpecialCharsDialog(view, onClose) {
    const lang = LANG.plugins.prosemirror;

    const $overlay = jQuery('<div class="plugin_prosemirror_specialchars_overlay">');
    const $dialog = jQuery('<div class="plugin_prosemirror_specialchars" role="dialog" aria-modal="true">')
        .attr('aria-label', lang['label:specialchars:title']);
    const $title = jQuery('<div class="specialchars_title">').text(lang['label:specialchars:title']);
    const $close = jQuery('<button type="button" class="specialchars_close">')
        .attr('title', lang['label:cancel'])
        .text('×');
    const $body = jQuery('<div class="specialchars_body">');
    const $recent = jQuery('<div class="specialchars_recent">');
    const $grid = jQuery('<div class="specialchars_grid">');
    const $previewChar = jQuery('<div class="specialchars_preview_char">');
    const $previewCode = jQuery('<div class="specialchars_preview_code">');
    const $footer = jQuery('<div class="specialchars_footer">');
    const $cancel = jQuery('<button type="button" class="button specialchars_cancel">').text(lang['label:cancel']);

    /**
     * Show a character in the preview box
     *
     * @param {string} char
     *
     * @return {void}
     */
    function preview(char) {
        $previewChar.text(char);
        $previewCode.text(char ? codePoint(char) : '');
    }

    /**
     * Remove the dialog
     *
     * @return {void}
     */
    function destroy() {
        jQuery(document).off('keydown.prosemirrorSpecialChars');
        $overlay.remove();
    }

    const close = onClose;

    /**
     * Insert the character at the cursor, replacing the current selection
     *
     * @param {string} char
     *
     * @return {void}
     */
    function insert(char) {
        const { state } = view;
        if (!state.selection.$from.parent.inlineContent) {
            return;
        }
        view.dispatch(state.tr.insertText(char).scrollIntoView());
        saveRecent(char);
        renderRecent(); // eslint-disable-line no-use-before-define
    }

    /**
     * Create the button for one character
     *
     * @param {string} char
     *
     * @return {jQuery}
     */
    function charButton(char) {
        return jQuery('<button type="button" class="specialchars_char">')
            .attr('title', codePoint(char))
            .data('char', char)
            .text(char);
    }

    function renderRecent() {
        const recent = loadRecent();
        $recent.empty().toggle(recent.length > 0);
        recent.forEach(char => $recent.append(charButton(char)));
    }

    specialChars.forEach(char => $grid.append(charButton(char)));
    renderRecent();

    const $main = jQuery('<div class="specialchars_main">').append($recent, $grid);
    const $side = jQuery('<div class="specialchars_preview">').append($previewChar, $previewCode);
    $body.append($main, $side);
    $footer.append($cancel);
    $dialog.append($title, $close, $body, $footer);
    $overlay.append($dialog);

    $dialog.on('mousedown', 'button', e => e.preventDefault());
    $dialog.on('click', '.specialchars_char', function insertChar() {
        insert(jQuery(this).data('char'));
    });
    $dialog.on('mouseover focusin', '.specialchars_char', function previewChar() {
        preview(jQuery(this).data('char'));
    });
    $dialog.on('mouseleave', '.specialchars_main', () => preview(''));
    $close.on('click', close);
    $cancel.on('click', close);
    $overlay.on('mousedown', (e) => {
        if (e.target === $overlay.get(0)) {
            close();
        }
    });
    jQuery(document).on('keydown.prosemirrorSpecialChars', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            close();
        }
    });

    jQuery('body').append($overlay);
    $grid.find('.specialchars_char').first().trigger('focus');

    return { destroy };
}
