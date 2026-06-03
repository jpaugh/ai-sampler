A collection of AI demos I've worked on


# Arcane Sword Maker

An incremental game that grew from the bemusing idea that the power of a
weapon in an RPG is generally correlated to the length of its name.

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

It includes a [comment check] (which is a custom script to remove any
comments created by AI), a lint check, a type-check via `tsc`. It also
builds the project and runs integration tests.

[comment check](/arcane-sword-maker/comment-check.cjs)

By making use of a custom agent in VSCode (which is, essetially, a
system prompt combined with a series of access restrictions), I
convinced the AI to run the validation pipeline after each of its
changes, and automatically fix any relevant issues before completing.

This helped catch a lot of recurring issues in the AI code, and in turn
protected my time as a reviewer of the AI's work product.
