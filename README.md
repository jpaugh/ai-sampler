A collection of AI demos I've worked on

# Arcane Sword Maker

An incremental game concept that grew from the bemusing idea that the
power of a weapon in an RPG is generally correlated to the length of its
name. It's hosted on itch.io. Please [check it out][asm-hosted]!

With this project, I experimented with vibe coding, employing an
AI-assisted rapid-prototyping methodology via Github Copilot, and
learned a number of things from this experiement. I found, for instance,
that a validation pipeline is essential to ensure consistency and
quality. There is no stronger way to communicate with AI than a failing
test suite.

I also experimented with a mixture of premium and free tier LLM
requests, and while I could control for code quality of the less
powerful free model, I could not convince it to make equally sensible
decisions, or to carry out more complex operations without my
intervention.

While the initial idea had some humor, the game loop itself is a bit
tedious. That left me with a fun and expensive hobby which burns through
credits like crazy, and meanwhile had no realistic profit opportunity.

I guess I'm not quite ready to rake in my millions as an indie game dev.
:-)

## Validation Pipeline

As part of the Arcane Sword Maker project, I developed a validation
pipeline to ensure minimum quality standards for AI code, and also to
ensure that regressions were not introduced by new changes.

You'll find that within the `scripts` section of Arcane Sword Maker's
[package.json](/arcane-sword-maker/package.json).

```json
    "validate": "pnpm comment-check && pnpm lint && pnpm tsc --noEmit && pnpm build && pnpm playwright test"
```

It includes a [comment check][comment-check] (a custom script to remove any
comments created by AI), a lint check, a type-check via `tsc`. It also
builds the project and runs integration tests.

By making use of a custom agent in VSCode (which is, essetially, a
system prompt combined with a series of access restrictions), I
convinced the AI to run the validation pipeline after each of its
changes, and automatically fix any relevant issues before completing.

This helped catch a lot of recurring issues in the AI code, and in turn
protected my time as a reviewer of the AI's work product.

# RAG

AI researchers have a bad habit of using opaque jargon to describe
simple programmatic tasks! (I'm sure their mothers are appropriately
impressed.) The [RAG](/rag) project helped me understand
retrieval-augmented generation and semantic search. This code was
largely copied from a [tutorial][RAG tutorial], manually and
painstakingly, and is not solely my own work.

To use it, grab a PDF (perhaps [this white-paper from Intel][sample
pdf]), preferably a dense and inscrutable one, and run this command to
ask questions about it:

```
python ./main.py path/to/my.pdf "What does it all mean?"
```

You will also need to install the dependencies shown below. On first run, it will download a ~7 GB LLM model from https://huggingface.co/, and will then run an LLM locally on your computer to answer all your questions about the document. Subsequent runs will used a cached copy of the model.

Note that the speed it runs at can vary widely depending on whether your
GPU is supported or not. However, it does maintain a cache of LLM
output (under the `ry.abu.gy` folder in your cache dir), so you may get
the same response back more quickly.

## Sample output

```
$ time nix-shell --run 'python ./main.py ~/Downloads/performance-quickpath-architecture-paper.pdf "Which processor architectures are supported?"'
Query: Which processor architectures are supported?
Sources ('/home/jpaugh/Downloads/performance-quickpath-architecture-paper.pdf',)
Paths right now:
Compiling RAG prompt...
Compiling embeddings: 0it [00:00, ?it/s]
Prompt cache key 04085cd11cbdc9d34c5021887f6180a469a88e9bb3353e65b8134ec5ea9b52a0
Generating results for query {'role': 'user', 'content': 'Which processor architectures are supported?'}...
Answer: The supported processor architectures include x86, ARM, and PowerPC. These architectures are widely used across various devices and systems, from personal computers and smartphones to servers and embedded systems. Each architecture has its own set of features and capabilities, catering to different performance, power consumption, and cost requirements.

real    0m3.015s
user    0m1.905s
sys     0m0.497s
```

## Dependencies

- python3
- accelerate
- appdirs
- pandas
- sentence-transformers
- torch
- tqdm
- transformers

[asm-hosted]: https://creativecraving.itch.io/arcane-sword-maker
[sample pdf]: https://www.intel.in/content/dam/doc/white-paper/performance-quickpath-architecture-paper.pdf
[RAG tutorial]: https://towardsai.net/p/l/the-complete-guide-to-implementing-rag-locally-no-cloud-or-frameworks-are-required
[comment-check]:/arcane-sword-maker/comment-check.cjs

