import PokemonIv from './PokemonIv';
import i18next from 'i18next';
import embeddedBoxData from '../../embedded-box.txt?raw';

/**
 * Represents Indivisual Values (IV) of the Pokemon.
 */
class PokemonBox {
    private _entries: PokemonBoxItem[] = [];

    /**
     * Get max entry count.
     */
    static get maxEntryCount(): number {
        return 300;
    }

    /**
     * Initialize new PokemonBox object.
     * @param items Initial items.
     */
    constructor(items?: PokemonBoxItem[]) {
        this._entries = items || [];
    }

    /**
     * Get the box entries.
     */
    get items(): PokemonBoxItem[] {
        return this._entries;
    }

    /**
     * Returns whether we can add item to this box.
     */
    get canAdd(): boolean {
        return this._entries.length < PokemonBox.maxEntryCount;
    }

    /**
     * Check if readonly mode is enabled.
     */
    isReadonlyMode(): boolean {
        const result = import.meta.env.VITE_READONLY_MODE === 'true';
        console.log('🔍 [DEBUG] isReadonlyMode() - env value:', import.meta.env.VITE_READONLY_MODE, 'result:', result);
        return result;
    }

    /**
     * Add a new Pokmeon IV.
     * @param iv Pokemon IV to be added.
     * @returns Added item ID.
     */
    add(iv: PokemonIv, nickname?: string): number {
        if (this.isReadonlyMode()) {
            return -1;
        }
        if (!this.canAdd) {
            throw new Error('max entry count exceeds');
        }
        const item = new PokemonBoxItem(iv, nickname);
        this._entries = [...this._entries, item];
        return item.id;
    }

    /**
     * Remove existing item by ID.
     * @param id ID.
     */
    remove(id: number) {
        if (this.isReadonlyMode()) {
            return;
        }
        this._entries = this._entries.filter(x => x.id !== id);
    }

    /**
     * Remove all items.
     */
    removeAll() {
        this._entries = [];
    }

    /**
     * Change the item by ID.
     * @param id ID.
     * @param nickname Nickname of the pockemon.
     * @param iv New pokemon IV.
     */
    set(id: number, iv: PokemonIv, nickname?: string) {
        if (this.isReadonlyMode()) {
            return;
        }
        for (let i = 0; i < this._entries.length; i++) {
            if (this._entries[i].id === id) {
                this._entries[i] = new PokemonBoxItem(iv, nickname, id);
                this._entries = [...this._entries];
                break;
            }
        }
    }

    /**
     * Get box item by ID.
     * @param id ID.
     * @returns box item if found. undefined if not found.
     */
    getById(id: number): PokemonBoxItem|null {
        return this._entries.find(x => x.id === id) ?? null;
    }

    /**
     * Load box data from local storage or embedded data.
     */
    load() {
        try {
            console.log('🔍 [DEBUG] load() called');
            console.log('🔍 [DEBUG] VITE_READONLY_MODE:', import.meta.env.VITE_READONLY_MODE);
            console.log('🔍 [DEBUG] isReadonlyMode():', this.isReadonlyMode());
            console.log('🔍 [DEBUG] embeddedBoxData length:', embeddedBoxData.length);
            
            if (this.isReadonlyMode()) {
                // Load from embedded data
                console.log('🔍 [DEBUG] ✅ Readonly mode - loading embedded data');
                console.log('🔍 [DEBUG] embeddedBoxData length:', embeddedBoxData.length);
                console.log('🔍 [DEBUG] embeddedBoxData first 100 chars:', embeddedBoxData.substring(0, 100));
                
                const newItems: PokemonBoxItem[] = [];
                const lines = embeddedBoxData
                    .split(/\r?\n/)  // Handle both CRLF and LF
                    .map((line: string) => line.trim())  // Remove whitespace
                    .filter((line: string) => line !== '');  // Remove empty lines
                console.log('🔍 [DEBUG] Number of lines after split/filter:', lines.length);
                console.log('🔍 [DEBUG] First 3 lines:', lines.slice(0, 3));
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    console.log(`🔍 [DEBUG] Processing line ${i}: "${line.substring(0, 30)}..."`);
                    const data = this.deserializeItem(line);
                    if (data === null) {
                        console.log(`🔍 [DEBUG] ❌ Failed to deserialize line ${i}`);
                        continue;
                    }
                    console.log(`🔍 [DEBUG] ✅ Successfully deserialized line ${i}, nickname: "${data.nickname}"`);
                    newItems.push(new PokemonBoxItem(data.iv, data.nickname));
                    console.log(`🔍 [DEBUG] newItems.length is now: ${newItems.length}`);

                    if (newItems.length >= PokemonBox.maxEntryCount) {
                        break;
                    }
                }
                
                console.log('🔍 [DEBUG] Before assignment - newItems.length:', newItems.length);
                this._entries = newItems;
                console.log('🔍 [DEBUG] After assignment - this._entries.length:', this._entries.length);
                console.log('🔍 [DEBUG] Readonly mode load complete!');
            } else {
                // Load from localStorage
                console.log('🔍 [DEBUG] ❌ Entering localStorage branch (NOT readonly mode)');
                const data = localStorage.getItem("PstPokeBox");
                if (data === null) {
                    return [];
                }
                const json = JSON.parse(data);
                if (!Array.isArray(json)) {
                    return [];
                }

                const newItems: PokemonBoxItem[] = [];
                for (const item of json) {
                    if (typeof(item) !== "string") {
                        continue;
                    }
                    const data = this.deserializeItem(item);
                    if (data === null) {
                        continue;
                    }
                    newItems.push(new PokemonBoxItem(data.iv, data.nickname));

                    if (newItems.length >= PokemonBox.maxEntryCount) {
                        break;
                    }
                }
                this._entries = newItems;
            }
        } catch (error) {
            console.error('🔍 [DEBUG] Error in load():', error);
            console.warn('Failed to load Pokemon box data:', error);
            return [];
        }
        console.log('🔍 [DEBUG] load() returning, this._entries.length:', this._entries.length);
        return this._entries;
    }

    /**
     * Deserialize box item data (xxxxxxx@nickname)
     * @param text   text data.
     * @returns      parsed data.
     */
    deserializeItem(text: string): {iv: PokemonIv, nickname: string}|null {
        text = text.trim();  // Remove leading/trailing whitespace and newlines
        const index = text.indexOf("@");
        let ivPart = text;
        let nickname = "";
        if (index !== -1) {
            ivPart = text.substring(0, index);
            nickname = text.substring(index + 1);
        }
        console.log(`🔍 [DEBUG] deserializeItem - ivPart: "${ivPart}", nickname: "${nickname}"`);
        try {
            const iv = PokemonIv.deserialize(ivPart);
            console.log(`🔍 [DEBUG] deserializeItem - SUCCESS`);
            return {iv, nickname};
        }
        catch (e) {
            console.log(`🔍 [DEBUG] deserializeItem - FAILED:`, e);
            return null;
        }
    }

    /**
     * Save box data to local storage.
     */
    save() {
        if (this.isReadonlyMode()) {
            return;
        }
        localStorage.setItem("PstPokeBox", JSON.stringify(this._entries
            .map(x => x.serialize())));
    }
}

/**
 * Represents pokemon in the Pokemon box.
 */
export class PokemonBoxItem {
    private _iv: PokemonIv;
    private _nickname: string;
    private _id: number;
    private static nextId: number = 1;

    /**
     * Initialize PokemonBoxItem.
     * @param iv IV data of the pokemon.
     * @param id ID in the box.
     */
    constructor(iv: PokemonIv, nickname?: string, id?: number) {
        this._iv = iv;
        this._nickname = nickname ?? "";
        this._id = (id !== undefined ? id : PokemonBoxItem.nextId++);
    }

    /**
     * Serialize the data to string.
     * @returns Serilized string.
     */
    serialize(): string {
        const serializedIv = this._iv.serialize();
        if (this._nickname === "") {
            return serializedIv;
        }
        return serializedIv + "@" + this._nickname;
    }

    /** Get the Pokemon IV. */
    get iv(): PokemonIv { return this._iv; }

    /** Get the nickname of the Pokemon. */
    get nickname(): string { return this._nickname; }

    /** Get the ID. */
    get id(): number { return this._id; }

    /** Get the filled nickname */
    filledNickname(t: typeof i18next.t): string {
        if (this._nickname !== "") {
            return this._nickname;
        }
        return t(`pokemons.${this.iv.pokemonName}`);
    }
}

export default PokemonBox;
