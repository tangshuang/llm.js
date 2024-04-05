export class Chat {
    /**
     * @param {*} options
     * @param {string} options.modelPath
     * @param {string} [options.systemPrompt]
     * @param {'llama'|'chatglm'} [options.engine]
     */
    constructor(options) {
        this.options = options;
    }

    async create(conversationHistory) {
        const { modelPath, systemPrompt, engine } = this.options;
        const ext = modelPath.split('.').pop();
        if (engine === 'llama' || (!engine && ext === 'gguf')) {
            const { LlamaModel, LlamaContext, LlamaChatSession } = await import('node-llama-cpp');
            const model = new LlamaModel({ modelPath });
            const context = new LlamaContext({ model });
            const session = new LlamaChatSession({ conversationHistory, context, systemPrompt });
            // @ts-ignore
            return async (message, options) => {
                const {
                    temperature,
                    topK,
                    topP,
                    onmessage,
                    onend,
                    onerror,
                } = options || {};
                try {
                    await session.prompt(message, {
                        temperature,
                        topK,
                        topP,
                        onToken(chunk) {
                            const tokens = context.decode(chunk);
                            onmessage?.(tokens);
                        },
                    });
                }
                catch (e) {
                    onerror?.(e);
                }
                finally {
                    onend?.();
                }
            };
        }
        else if (engine === 'chatglm' || (!engine && ext === 'bin')) {
            const { chat } = await import('chatglmjs');
            return (message, options) => {
                let prompt = '';
                if (systemPrompt) {
                    prompt += `<|system|> ${systemPrompt}\n`;
                }
                if (message.indexOf('<|') === 0) {
                    prompt += message;
                }
                else {
                    prompt += `<|user|> ${message}\n`;
                }
                const { topK: top_k, topP: top_p, ...others } = options || {};
                return chat({
                    ...others,
                    top_k,
                    top_p,
                    prompt,
                    model_bin_path: modelPath,
                });
            };
        }
    }

    async prompt(message, options) {
        const chat = await this.create();
        return await chat?.(message, options);
    }
}