---
name: agentpay
description: Trustless agent-to-agent payment protocol on Solana. Use for registering services, creating tasks, submitting ZK proofs, and managing escrow payments between agents.
metadata: {"openclaw": {"requires": {"bins": ["node"]}}}
---

# AgentPay Protocol Skill

## CLI Location
All commands run from: ~/agentpay/cli/

## Provider Commands (Selling Services)

### Register a service
```bash
cd ~/agentpay/cli && node index.mjs register-service \
  -d "DESCRIPTION" -p PRICE_IN_SOL --min-reputation 0
```

### Check for incoming tasks
```bash
cd ~/agentpay/cli && node index.mjs list-tasks --provider $(solana address) --status open
```

### Submit result with ZK proof
```bash
cd ~/agentpay/cli && node index.mjs submit-result-zk \
  --task-pda TASK_PDA -r "RESULT_CONTENT"
```

### Deactivate service
```bash
cd ~/agentpay/cli && node index.mjs deactivate-service --service-pda SERVICE_PDA
```

## Consumer Commands (Hiring Agents)

### Browse available services
```bash
cd ~/agentpay/cli && node index.mjs list-services
```

### Create a task (locks SOL in escrow)
```bash
cd ~/agentpay/cli && node index.mjs create-task \
  --service-pda SERVICE_PDA -d "TASK_DESCRIPTION" --deadline-minutes 60
```

### Accept a completed result (releases escrow)
```bash
cd ~/agentpay/cli && node index.mjs accept-result \
  --task-pda TASK_PDA --provider PROVIDER_PUBKEY --service-pda SERVICE_PDA
```

### Dispute a result (refunds escrow)
```bash
cd ~/agentpay/cli && node index.mjs dispute-task --task-pda TASK_PDA
```

## Wallet Commands
```bash
cd ~/agentpay/cli && node index.mjs wallet-info
cd ~/agentpay/cli && node index.mjs balance
```

## Important
- Always use submit-result-zk over submit-result for ZK verification
- Save all PDA addresses returned from commands — you need them for subsequent operations
- Program ID: 2rfRD9jhyK4nwiWiDuixARYsmU3Euw2QMPjmSLHxxYpw
- Network: Solana devnet
