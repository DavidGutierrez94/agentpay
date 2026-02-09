#!/usr/bin/env node

/**
 * AgentPay MCP Server
 *
 * A Model Context Protocol server that enables AI agents to interact with
 * the AgentPay protocol for trustless agent-to-agent payments on Solana.
 *
 * Usage:
 *   npx agentpay-mcp
 *
 * Environment:
 *   AGENTPAY_KEYPAIR - Path to Solana keypair file (default: ~/.config/solana/id.json)
 *   AGENTPAY_RPC - Solana RPC URL (default: https://api.devnet.solana.com)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Tools
import { searchServices, getService, serviceTools } from "./tools/services.mjs";
import { createTask, getTask, listMyTasks, taskTools } from "./tools/tasks.mjs";
import { submitResult, submitResultZk, providerTools } from "./tools/provider.mjs";
import { acceptResult, disputeTask, requesterTools } from "./tools/requester.mjs";
import { getBalance, scanWallet, walletTools } from "./tools/wallet.mjs";
import { teamTools, teamHandlers } from "./tools/teams.mjs";

// Security
import { validateToolParams, SecurityError } from "./security/input-validator.mjs";
import { rateLimiter, RateLimitError } from "./security/rate-limiter.mjs";
import { auditLogger } from "./security/audit-log.mjs";

// ============================================================================
// Server Configuration
// ============================================================================

const SERVER_NAME = "agentpay-mcp";
const SERVER_VERSION = "1.0.0";

// Combine all tool definitions
const ALL_TOOLS = [
  ...serviceTools,
  ...taskTools,
  ...providerTools,
  ...requesterTools,
  ...walletTools,
  ...teamTools,
];

// Map tool names to handler functions
const TOOL_HANDLERS = {
  // Service tools
  search_services: searchServices,
  get_service: getService,

  // Task tools
  create_task: createTask,
  get_task: getTask,
  list_my_tasks: listMyTasks,

  // Provider tools
  submit_result: submitResult,
  submit_result_zk: submitResultZk,

  // Requester tools
  accept_result: acceptResult,
  dispute_task: disputeTask,

  // Wallet tools
  get_balance: getBalance,
  scan_wallet: scanWallet,

  // Team tools
  ...teamHandlers,
};

// ============================================================================
// MCP Server
// ============================================================================

class AgentPayMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: ALL_TOOLS,
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const startTime = Date.now();

      // Get client ID (wallet address if available, otherwise "anonymous")
      let clientId = "anonymous";
      try {
        const { keypair } = await import("./tools/program.mjs").then(m => m.getProgram());
        clientId = keypair.publicKey.toBase58();
      } catch {
        // Use anonymous if keypair not available
      }

      try {
        // Rate limiting
        rateLimiter.checkLimit(clientId, name);

        // Input validation
        const validatedArgs = validateToolParams(name, args || {});

        // Get the handler function
        const handler = TOOL_HANDLERS[name];
        if (!handler) {
          throw new Error(`Unknown tool: ${name}`);
        }

        // Execute the tool
        const result = await handler(validatedArgs);

        // Log successful call
        const duration = Date.now() - startTime;
        auditLogger.logToolCall({
          tool: name,
          clientId,
          params: validatedArgs,
          result: { success: result.success },
          duration,
          txSignature: result.txSignature,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const duration = Date.now() - startTime;

        // Log the error
        auditLogger.logToolCall({
          tool: name,
          clientId,
          params: args,
          error,
          duration,
        });

        // Handle specific error types
        if (error instanceof RateLimitError) {
          auditLogger.logRateLimit({
            clientId,
            tool: name,
            retryAfter: error.retryAfter,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: "Rate limit exceeded",
                  message: error.message,
                  retryAfter: error.retryAfter,
                }),
              },
            ],
            isError: true,
          };
        }

        if (error instanceof SecurityError) {
          auditLogger.logValidationFailure({
            clientId,
            tool: name,
            field: "input",
            reason: error.message,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: "Validation error",
                  message: error.message,
                  code: error.code,
                }),
              },
            ],
            isError: true,
          };
        }

        // Generic error
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message || "Unknown error",
              }),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error(`🚀 ${SERVER_NAME} v${SERVER_VERSION} started`);
    console.error(`📍 RPC: ${process.env.AGENTPAY_RPC || "https://api.devnet.solana.com"}`);
    console.error(`🔧 Tools: ${ALL_TOOLS.length} available`);
  }
}

// ============================================================================
// Main
// ============================================================================

const server = new AgentPayMCPServer();
server.run().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
