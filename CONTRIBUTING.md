# Contributing to @covalenthq/langchain-goldrush

Thank you for your interest in contributing! This guide covers everything you need to get started.

## Development Setup

**Prerequisites:** Node.js ≥18, npm ≥9

```bash
git clone https://github.com/covalenthq/langchain-goldrush.git
cd langchain-goldrush
npm install
```

Verify everything is working:

```bash
npm run typecheck   # 0 errors expected
npm test            # 93 tests expected to pass
npm run build       # produces dist/
```

## Project Structure

```
src/
├── client.ts          # GoldRushClient — SDK wrapper with retry + timeout
├── toolkit.ts         # GoldRushToolkit — aggregates all tools
├── types.ts           # Shared Zod schemas and TypeScript types
├── errors.ts          # GoldRushToolError with error classification
├── index.ts           # Public exports
├── tools/
│   ├── balance/       # 6 tools
│   ├── transaction/   # 8 tools
│   ├── nft/           # 3 tools
│   ├── security/      # 1 tool
│   ├── bitcoin/       # 4 tools
│   ├── pricing/       # 3 tools
│   ├── utility/       # 8 tools
│   └── cross-chain/   # 3 tools
└── utils/
    ├── format-response.ts
    └── paginate.ts
tests/
├── setup.ts           # MSW server setup (runs before all tests)
├── mocks/handlers.ts  # HTTP mock handlers for all 36 endpoints
├── toolkit.test.ts
├── balance.test.ts
├── transaction.test.ts
├── nft.test.ts
├── security.test.ts
├── bitcoin.test.ts
├── pricing.test.ts
├── utility.test.ts
└── cross-chain.test.ts
```

## Adding a New Tool

1. **Create the tool file** in the appropriate `src/tools/<service>/` directory:

```typescript
import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChainNameEnum } from "../../types.js";
import type { GoldRushClient } from "../../client.js";
import { formatResponse, formatError } from "../../utils/format-response.js";

export class MyNewTool extends StructuredTool {
  name = "goldrush_my_new_tool";
  description = `One-paragraph description of what this tool does.
Use when: concrete examples of when an LLM agent should invoke this tool.`;

  schema = z.object({
    chainName: ChainNameEnum.describe("Blockchain network slug"),
    // ... other inputs
  });

  constructor(private client: GoldRushClient) {
    super();
  }

  protected async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await this.client.call(this.name, () =>
        this.client.SomeService.someMethod(input.chainName, /* ... */)
      );
      return formatResponse(result, this.name, this.client.config.maxResponseSize);
    } catch (err) {
      return formatError(this.name, err);
    }
  }
}
```

2. **Export it** from `src/tools/<service>/index.ts` and the main `src/index.ts`.

3. **Register it** in `src/toolkit.ts` in the appropriate service group array.

4. **Add an MSW handler** in `tests/mocks/handlers.ts` matching the SDK's HTTP endpoint.

5. **Write tests** in the appropriate `tests/<service>.test.ts` file, verifying:
   - `tool.name` matches the expected constant
   - The happy path returns `{ success: true, tool: "goldrush_..." }`
   - Any optional parameters are accepted without errors

6. **Update the toolkit count** assertion in `tests/toolkit.test.ts`.

## Tool Naming Conventions

- All tool names follow the pattern: `goldrush_<noun>_<noun>` (snake_case)
- Names must be globally unique across all 36 tools
- Keep names short enough for LLM token budgets

## Code Style

This project uses Prettier for formatting. Run before committing:

```bash
npm run format
```

TypeScript strict mode is enabled. No `any` casts without a comment explaining why.

## Pull Request Process

1. Fork the repo and create a feature branch: `git checkout -b feat/my-new-tool`
2. Make your changes with tests
3. Ensure `npm run typecheck && npm test && npm run build` all pass
4. Open a PR against `main` with a clear description of the change
5. A maintainer will review within 5 business days

## Reporting Bugs

Open an issue at https://github.com/covalenthq/langchain-goldrush/issues with:
- The tool name that is failing
- The input parameters used
- The error message or unexpected output
- Your `@covalenthq/client-sdk` version
