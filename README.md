# NODE-LLM

LLMs NodeJS addon.
Run your LLM easily in nodejs or electron application.

## Usage

Before installation, make sure your device environment is able to compile c++ source code. We will use cmake-js to build a .node file.

```
npm i node-llm
```

Simple usage:

```js
import { Chat } from 'node-llm';

const chat = new Chat({
  modelPath: path.resolve(__dirname, '../llms/chatglm3-6b.q4_0.bin'),
  engine: 'chatglm',
});

const res = await chat.prompt('What is RAG?');
console.log(res);
```

Paramerters of `Chat` constructor:

- modelPath: path to the model file
- engine: engine name, currently support `chatglm` and `llama`
- systemPrompt: system prompt

Stream mode:

```js
chat.prompt('What is RAG?', {
  onmessage(msg) {
    process.stdout.write(msg);
  }
});
```

Session usage:

```js
import { Session } from 'node-llm';

const session = new Session({
  modelPath: path.resolve(__dirname, '../llms/chatglm3-6b.q4_0.bin'),
  engine: 'chatglm',
});

const res1 = await session.chat('What is RAG?');
console.log(res1);
const res2 = await session.chat('give more detail');
console.log(res2);
```

Chat in one session, you can use `chat` method times in a memory management.

Parameters of `Session` constructor:

- modelPath: path to the model file
- engine: engine name, currently support `chatglm` and `llama`
- kvPath: path to the kv storage which is used to store the history
- sessionId: session id, to recover history from the kv storage
- systemPrompt: system prompt
- temperature: temperature
- topP: top_p
- topK: top_k

`prompt` and `chat` methods have the same params:

```ts
type ChatParams = {
    temperature?: number;
    /** top_p */
    topP?: number;
    /** top_k */
    topK?: number;
    /** callback function with the answered text by LLM */
    onmessage?: (msg: string) => void;
    /** callback function when LLM answer end */
    onend?: () => void;
    /** callback function when error ocurs */
    onerror?: (e: Error) => void;
};
```


```js
const chat = new Chat({
  modelPath,
  engine,
  systemPrompt,
});

chat.prompt(prompt, {
  temperature,
  topP,
  topK,
  onmessage(str) {},
  onend() {},
  onerror(e) {},
});
```

```js
const session = new Session({
  modelPath,
  engine,
  kvPath,
  sessionId,
  systemPrompt,
  temperature,
  topK,
  topP,
});

session.chat(message, {
  temperature,
  topP,
  topK,
  onmessage(str) {},
  onend() {},
  onerror(e) {},
});
```

## Engines

- [chatglm](https://github.com/li-plus/chatglm.cpp): [ggml](https://www.modelscope.cn/models/tangshuang/chatglm3-6b-ggml/files)
- [llama](https://github.com/ggerganov/llama.cpp): [guff](https://huggingface.co/TheBloke?search_models=gguf)

## MIT License

Copyright (c) 2024 Shuang Tang

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
