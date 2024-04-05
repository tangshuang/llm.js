import { Chat } from './chat.js';
import { v4 as uuid } from 'uuid';

export class Session {
    #chat = null;
    #memory = [];

    /**
     * @param {*} options
     * @param {string} options.modelPath
     * @param {string} [options.systemPrompt]
     * @param {string} [options.kvPath]
     * @param {'llama'|'chatglm'} [options.engine]
     * @param {number} [options.temperature]
     * @param {number} [options.topK]
     * @param {number} [options.topP]
     */
    constructor(options) {
        this.options = options;
    }

    async create() {
        const { modelPath, systemPrompt, kvPath, engine, sessionId } = this.options;

        const id = sessionId || uuid();
        let kv;
        if (kvPath) {
            const LevelRocketsDB = await import('level-rocksdb');
            kv = new LevelRocketsDB(kvPath);
            const memory = await kv.get(id);
            this.#memory = memory ? JSON.parse(memory) : [];
        }

        const chat = new Chat({
            modelPath,
            systemPrompt,
            engine,
        });

        const prompt = await chat.create(this.#memory);

        const ext = modelPath.split('.').pop();
        if (engine === 'llama' || (!engine && ext === 'gguf')) {
            return (message, options) => {
                const { onmessage, onend, ...others } = options || {};
                let response = '';
                const opts = {
                    ...others,
                    onmessage: (msg) => {
                        onmessage?.(msg);
                        response += msg;
                    },
                    onend: () => {
                        onend?.();
                        this.#memory.push({ prompt: message, response });
                        kv?.put(id, JSON.stringify(this.#memory));
                    },
                };
                return prompt(message, opts);
            };
        }
        else if (engine === 'chatglm' || (!engine && ext === 'bin')) {
            return (message, options) => {
                const text = [...this.#memory, { role: 'user', content: message }].map((item) => {
                    const { role, content } = item;
                    return `<|${role}|> ${content}`;
                }).join('\n');
                const { onmessage, onend, ...others } = options || {};
                let response = '';
                const opts = {
                    ...others,
                    onmessage: (msg) => {
                        onmessage?.(msg);
                        response += msg;
                    },
                    onend: () => {
                        onend?.();
                        this.#memory.push({ role: 'user', content: message }, { role: 'assistant', content: response })
                        kv?.put(id, JSON.stringify(this.#memory));
                        resolve(response);
                    },
                };
                return prompt(text, opts);
            };
        }
    }

    async chat(message, options = {}) {
        if (!this.#chat) {
            this.#chat = await this.create();
        }
        const { topP, topK, temperature } = this.options;
        return await this.#chat?.(message, { topP, topK, temperature, ...options });
    }
}

