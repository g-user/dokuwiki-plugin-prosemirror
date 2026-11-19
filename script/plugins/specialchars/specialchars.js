import { Plugin, PluginKey } from '../../../dist/prosemirror.js';
import { keydownHandler } from '../../../dist/prosemirror.js';
import createSpecialCharsDialog from './SpecialCharsDialog.js';

/** The shortcut opening the dialog. Mod is Ctrl, or Cmd on a Mac */
export const SHORTCUT = 'Mod-Shift-l';

export const specialCharsKey = new PluginKey('specialchars');

/**
 * Whether the dialog is open in the given editor state
 *
 * @param {EditorState} state
 *
 * @return {boolean}
 */
export function isSpecialCharsOpen(state) {
    const pluginState = specialCharsKey.getState(state);
    return !!pluginState && pluginState.open;
}

/**
 * Command: open the special character dialog
 *
 * It is only available where text can be entered. Without a dispatch function it just tells if it is.
 *
 * @param {EditorState} state
 * @param {function(Transaction): void} [dispatch]
 *
 * @return {boolean}
 */
export function openSpecialChars(state, dispatch) {
    if (!state.selection.$from.parent.inlineContent) return false;
    if (dispatch && !isSpecialCharsOpen(state)) {
        dispatch(state.tr.setMeta(specialCharsKey, { open: true }));
    }
    return true;
}

/**
 * Command: close the special character dialog
 *
 * @param {EditorState} state
 * @param {function(Transaction): void} [dispatch]
 *
 * @return {boolean}
 */
export function closeSpecialChars(state, dispatch) {
    if (!isSpecialCharsOpen(state)) return false;
    if (dispatch) {
        dispatch(state.tr.setMeta(specialCharsKey, { open: false }));
    }
    return true;
}

/**
 * Create the plugin to insert special characters
 *
 * Its state tells whether the dialog is open. The commands above change it, the plugin view
 * shows and removes the dialog accordingly, so the dialog also goes away with the editor.
 * The plugin also binds the SHORTCUT. It doesn't change the schema, characters are inserted as text.
 *
 * @return {Plugin}
 */
export default function specialCharsPlugin() {
    return new Plugin({
        key: specialCharsKey,
        state: {
            init: () => ({ open: false }),
            apply(tr, value) {
                const meta = tr.getMeta(specialCharsKey);
                return meta ? { open: !!meta.open } : value;
            },
        },
        props: {
            handleKeyDown: keydownHandler({ [SHORTCUT]: openSpecialChars }),
        },
        view() {
            let dialog = null;

            return {
                update(view) {
                    const open = isSpecialCharsOpen(view.state);
                    if (open && !dialog) {
                        dialog = createSpecialCharsDialog(view, () => closeSpecialChars(view.state, view.dispatch));
                    } else if (!open && dialog) {
                        dialog.destroy();
                        dialog = null;
                        view.focus();
                    }
                },
                destroy() {
                    if (dialog) {
                        dialog.destroy();
                        dialog = null;
                    }
                },
            };
        },
    });
}
