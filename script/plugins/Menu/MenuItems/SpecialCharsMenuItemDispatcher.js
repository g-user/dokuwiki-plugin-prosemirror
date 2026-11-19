import AbstractMenuItemDispatcher from './AbstractMenuItemDispatcher.js';
import MenuItem from '../MenuItem.js';
import { openSpecialChars, isSpecialCharsOpen } from '../../specialchars/specialchars.js';

/**
 * Menu item opening the dialog of the specialchars plugin to insert special characters
 */
export default class SpecialCharsMenuItemDispatcher extends AbstractMenuItemDispatcher {
    static isAvailable(schema) {
        return !!schema.nodes.text;
    }

    static getMenuItem(schema) {
        if (!this.isAvailable(schema)) {
            throw new Error('Text nodes not available in schema!');
        }
        const label = LANG.plugins.prosemirror['label:specialchars'];

        return new MenuItem({
            command: openSpecialChars,
            isActive: isSpecialCharsOpen,
            render: () => jQuery('<span>')
                .addClass('menuitem')
                .append(jQuery('<span>').addClass('menuicon specialchars_icon').attr('title', label).text('Ω'))
                .get(0),
            label,
        });
    }
}
