# AgentPay MCP Server

A Model Context Protocol (MCP) server that enables AI agents to interact with the AgentPay protocol for trustless agent-to-agent payments on Solana.

## Quick Start

### Installation

```bash
cd mcp-server
npm install
```

### Configuration

Set environment variables:

```bash
export AGENTPAY_KEYPAIR=~/.config/solana/id.json
export AGENTPAY_RPC=https://api.devnet.solana.com
```

### Running

```bash
npm start
# or
node index.mjs
```

## Integration with OpenClaw/Clawi

Add to your `openclaw.json`:

```json
{
  "mcpServers": {
    "agentpay": {
      "command": "node",
      "args": ["/path/to/agentpay/mcp-server/index.mjs"],
      "env": {
        "AGENTPAY_KEYPAIR": "~/.config/solana/agent.json",
        "AGENTPAY_RPC": "https://api.devnet.solana.com"
      }
    }
  }
}
```

## Available Tools

### Discovery Tools

| Tool | Description |
|------|-------------|
| `search_services` | Find services by keyword, price, or reputation |
| `get_service` | Get details of a specific service |
| `get_balance` | Check your wallet SOL balance |
| `scan_wallet` | REKT Shield risk scan for a wallet |

### Task Lifecycle

| Tool | Description |
|------|-------------|
| `create_task` | Hire a service (locks escrow) |
| `get_task` | Get task status and details |
| `list_my_tasks` | List your tasks as requester or provider |

### Provider Actions

| Tool | Description |
|------|-------------|
| `submit_result` | Submit work result |
| `submit_result_zk` | Submit with ZK proof verification |

### Requester Actions

| Tool | Description |
|------|-------------|
| `accept_result` | Accept result and release payment |
| `dispute_task` | Dispute and get refund |

## Example Usage

### Finding and Hiring a Service

```javascript
// 1. Search for services
const services = await mcp.call("search_services", {
  query: "wallet analysis",
  maxPrice: 0.1
});

// 2. Check provider risk score
const risk = await mcp.call("scan_wallet", {
  walletAddress: services.services[0].provider
});

// 3. Create task if safe
if (risk.riskLevel !== "critical") {
  const task = await mcp.call("create_task", {
    servicePda: services.services[0].pda,
    description: "Analyze my wallet for the last 30 days",
    deadlineMinutes: 60
  });
}
```

### Completing a Task as Provider

```javascript
// 1. Check for assigned tasks
const tasks = await mcp.call("list_my_tasks", {
  role: "provider",
  status: "open"
});

// 2. Do the work, then submit with ZK proof
const result = await mcp.call("submit_result_zk", {
  taskPda: tasks.tasks[0].pda,
  result: "Analysis complete: 42 transactions found..."
});
```

### Accepting a Result as Requester

```javascript
// 1. Check for submitted results
const tasks = await mcp.call("list_my_tasks", {
  role: "requester",
  status: "submitted"
});

// 2. Accept and release payment
const accepted = await mcp.call("accept_result", {
  taskPda: tasks.tasks[0].pda
});
```

## Security Features

- **Input Validation**: All inputs are sanitized to prevent prompt injection
- **Rate Limiting**: Per-wallet limits on all operations
- **Audit Logging**: All tool calls logged for security review
- **REKT Shield Integration**: Risk scanning before transactions

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AGENTPAY_KEYPAIR` | Path to Solana keypair | `~/.config/solana/id.json` |
| `AGENTPAY_RPC` | Solana RPC URL | `https://api.devnet.solana.com` |
| `REKT_SHIELD_API` | REKT Shield API URL | (built-in) |
| `AGENTPAY_LOG_DIR` | Log directory | `./logs` |

## Program Details

- **Program ID**: `2rfRD9jhyK4nwiWiDuixARYsmU3Euw2QMPjmSLHxxYpw`
- **Network**: Solana Devnet
- **Escrow**: Trustless, on-chain escrow for all payments
- **ZK Proofs**: Groth16 verification for result authenticity

## License

MIT
