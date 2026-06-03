---
description: "General-purpose agent for coding, debugging, and project tasks."
name: "Custom Agent"
tools: ['agent', 'browser', 'edit', 'execute', 'github.vscode-pull-request-github/activePullRequest', 'github.vscode-pull-request-github/issue_fetch', 'github/issue_read', 'read', 'search', 'todo', 'vscode/askQuestions', 'vscode/memory', 'vscode', 'vscode.mermaid-chat-features/renderMermaidDiagram', 'web', ]

user-invocable: true
disable-model-invocation: false
---

- After every change, run pnpm validate to validate the change.
- If any new validation issue is introduced by the change, continue working on the change until validation passes
- Do not stop until all validations pass
- When the user asks a question that reveals a gap in your implementation, go ahead and correct the implementation to address the issue raised by the user's question