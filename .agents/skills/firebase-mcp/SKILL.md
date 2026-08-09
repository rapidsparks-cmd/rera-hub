---
name: firebase-mcp
description: Firebase MCP server integration for managing Firestore, Authentication, and Security Rules using official firebase-tools
---

# Firebase MCP Server Integration

This skill configures and manages the official Firebase Model Context Protocol (MCP) server (`firebase-tools@latest experimental:mcp`).

## Configured Server (`mcp.json` & `.mcp.json`)

```json
{
  "mcpServers": {
    "firebase": {
      "command": "npx",
      "args": [
        "-y",
        "firebase-tools@latest",
        "experimental:mcp"
      ]
    }
  }
}
```

## Authentication & Usage

To authenticate the CLI for local MCP tool operations:
```bash
npx firebase-tools login
```
