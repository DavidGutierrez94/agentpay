import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Agentpay } from "../target/types/agentpay";
import { expect } from "chai";
import { Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as crypto from "crypto";

describe("agentpay", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.agentpay as Program<Agentpay>;

  // Agents
  let providerAgent: Keypair;
  let requesterAgent: Keypair;

  // IDs
  let serviceId: Uint8Array;
  let taskId: Uint8Array;

  // PDAs
  let serviceListingPda: PublicKey;
  let taskRequestPda: PublicKey;

  const PRICE_LAMPORTS = 0.01 * LAMPORTS_PER_SOL; // 0.01 SOL

  function padBytes(input: string, length: number): number[] {
    const buf = Buffer.alloc(length);
    buf.write(input, "utf-8");
    return Array.from(buf);
  }

  before(async () => {
    // Create and fund two agent wallets
    providerAgent = Keypair.generate();
    requesterAgent = Keypair.generate();

    // Airdrop to both agents
    const airdropProvider = await provider.connection.requestAirdrop(
      providerAgent.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropProvider);

    const airdropRequester = await provider.connection.requestAirdrop(
      requesterAgent.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropRequester);

    // Generate IDs
    serviceId = crypto.randomBytes(16);
    taskId = crypto.randomBytes(16);

    // Derive PDAs
    [serviceListingPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("service"), providerAgent.publicKey.toBuffer(), Buffer.from(serviceId)],
      program.programId
    );

    [taskRequestPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("task"), requesterAgent.publicKey.toBuffer(), Buffer.from(taskId)],
      program.programId
    );
  });

  // =========================================================================
  // register_service
  // =========================================================================

  it("registers a service listing", async () => {
    const description = padBytes("Solana wallet analysis - on-chain activity reports", 128);

    await program.methods
      .registerService(
        Array.from(serviceId),
        description,
        new anchor.BN(PRICE_LAMPORTS)
      )
      .accounts({
        provider: providerAgent.publicKey,
        serviceListing: serviceListingPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([providerAgent])
      .rpc();

    const listing = await program.account.serviceListing.fetch(serviceListingPda);
    expect(listing.provider.toBase58()).to.equal(providerAgent.publicKey.toBase58());
    expect(listing.priceLamports.toNumber()).to.equal(PRICE_LAMPORTS);
    expect(listing.isActive).to.be.true;
    expect(listing.tasksCompleted.toNumber()).to.equal(0);
  });

  // =========================================================================
  // create_task
  // =========================================================================

  it("creates a task and locks escrow", async () => {
    const description = padBytes("Analyze wallet FMB4...n5NG for last 30 days", 256);
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    const requesterBalanceBefore = await provider.connection.getBalance(requesterAgent.publicKey);

    await program.methods
      .createTask(
        Array.from(taskId),
        description,
        new anchor.BN(deadline)
      )
      .accounts({
        requester: requesterAgent.publicKey,
        serviceListing: serviceListingPda,
        taskRequest: taskRequestPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([requesterAgent])
      .rpc();

    const task = await program.account.taskRequest.fetch(taskRequestPda);
    expect(task.requester.toBase58()).to.equal(requesterAgent.publicKey.toBase58());
    expect(task.provider.toBase58()).to.equal(providerAgent.publicKey.toBase58());
    expect(task.amountLamports.toNumber()).to.equal(PRICE_LAMPORTS);
    expect(task.status).to.deep.equal({ open: {} });

    // Verify escrow: task PDA balance should include the escrowed amount
    const taskBalance = await provider.connection.getBalance(taskRequestPda);
    expect(taskBalance).to.be.greaterThan(PRICE_LAMPORTS);

    // Verify requester paid
    const requesterBalanceAfter = await provider.connection.getBalance(requesterAgent.publicKey);
    expect(requesterBalanceBefore - requesterBalanceAfter).to.be.greaterThan(PRICE_LAMPORTS);
  });

  it("fails to create task for inactive service", async () => {
    // First deactivate the service
    await program.methods
      .deactivateService()
      .accounts({
        provider: providerAgent.publicKey,
        serviceListing: serviceListingPda,
      })
      .signers([providerAgent])
      .rpc();

    const listing = await program.account.serviceListing.fetch(serviceListingPda);
    expect(listing.isActive).to.be.false;

    // Try to create a task for the inactive service
    const newTaskId = crypto.randomBytes(16);
    const [newTaskPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("task"), requesterAgent.publicKey.toBuffer(), Buffer.from(newTaskId)],
      program.programId
    );

    try {
      await program.methods
        .createTask(
          Array.from(newTaskId),
          padBytes("Should fail", 256),
          new anchor.BN(Math.floor(Date.now() / 1000) + 3600)
        )
        .accounts({
          requester: requesterAgent.publicKey,
          serviceListing: serviceListingPda,
          taskRequest: newTaskPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([requesterAgent])
        .rpc();
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal("ServiceNotActive");
    }

    // Re-activate for remaining tests (register a new service with same ID won't work,
    // so we just note this is deactivated and re-test flow won't need it)
  });

  // =========================================================================
  // submit_result
  // =========================================================================

  it("provider submits a result", async () => {
    const resultData = "Analysis complete: 42 transactions found, 3 large transfers";
    const resultHash = crypto.createHash("sha256").update(resultData).digest();

    await program.methods
      .submitResult(Array.from(resultHash))
      .accounts({
        provider: providerAgent.publicKey,
        taskRequest: taskRequestPda,
      })
      .signers([providerAgent])
      .rpc();

    const task = await program.account.taskRequest.fetch(taskRequestPda);
    expect(task.status).to.deep.equal({ submitted: {} });
    expect(Buffer.from(task.resultHash)).to.deep.equal(resultHash);
  });

  it("fails when non-provider tries to submit result", async () => {
    const fakeHash = crypto.randomBytes(32);

    try {
      await program.methods
        .submitResult(Array.from(fakeHash))
        .accounts({
          provider: requesterAgent.publicKey, // wrong signer
          taskRequest: taskRequestPda,
        })
        .signers([requesterAgent])
        .rpc();
      expect.fail("Should have thrown");
    } catch (err: any) {
      // Constraint violation
      expect(err).to.exist;
    }
  });

  // =========================================================================
  // accept_result
  // =========================================================================

  it("requester accepts result and escrow releases to provider", async () => {
    const providerBalanceBefore = await provider.connection.getBalance(providerAgent.publicKey);

    // Need to re-register service since we deactivated it (for the tasks_completed counter)
    // Actually the service listing account still exists, just is_active = false
    // The accept_result instruction doesn't check is_active, it just increments tasks_completed

    await program.methods
      .acceptResult()
      .accounts({
        requester: requesterAgent.publicKey,
        taskRequest: taskRequestPda,
        provider: providerAgent.publicKey,
        serviceListing: serviceListingPda,
      })
      .signers([requesterAgent])
      .rpc();

    const task = await program.account.taskRequest.fetch(taskRequestPda);
    expect(task.status).to.deep.equal({ completed: {} });

    // Provider should have received the escrowed SOL
    const providerBalanceAfter = await provider.connection.getBalance(providerAgent.publicKey);
    expect(providerBalanceAfter - providerBalanceBefore).to.equal(PRICE_LAMPORTS);

    // Service listing tasks_completed should be incremented
    const listing = await program.account.serviceListing.fetch(serviceListingPda);
    expect(listing.tasksCompleted.toNumber()).to.equal(1);
  });

  // =========================================================================
  // dispute_task (new task for this test)
  // =========================================================================

  describe("dispute flow", () => {
    let disputeTaskId: Uint8Array;
    let disputeTaskPda: PublicKey;
    let disputeServiceId: Uint8Array;
    let disputeServicePda: PublicKey;

    before(async () => {
      // Register a new active service
      disputeServiceId = crypto.randomBytes(16);
      [disputeServicePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("service"), providerAgent.publicKey.toBuffer(), Buffer.from(disputeServiceId)],
        program.programId
      );

      await program.methods
        .registerService(
          Array.from(disputeServiceId),
          padBytes("Code review service", 128),
          new anchor.BN(PRICE_LAMPORTS)
        )
        .accounts({
          provider: providerAgent.publicKey,
          serviceListing: disputeServicePda,
          systemProgram: SystemProgram.programId,
        })
        .signers([providerAgent])
        .rpc();

      // Create a task
      disputeTaskId = crypto.randomBytes(16);
      [disputeTaskPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("task"), requesterAgent.publicKey.toBuffer(), Buffer.from(disputeTaskId)],
        program.programId
      );

      await program.methods
        .createTask(
          Array.from(disputeTaskId),
          padBytes("Review my smart contract", 256),
          new anchor.BN(Math.floor(Date.now() / 1000) + 3600)
        )
        .accounts({
          requester: requesterAgent.publicKey,
          serviceListing: disputeServicePda,
          taskRequest: disputeTaskPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([requesterAgent])
        .rpc();

      // Provider submits result
      const resultHash = crypto.createHash("sha256").update("bad review").digest();
      await program.methods
        .submitResult(Array.from(resultHash))
        .accounts({
          provider: providerAgent.publicKey,
          taskRequest: disputeTaskPda,
        })
        .signers([providerAgent])
        .rpc();
    });

    it("requester disputes and gets refund", async () => {
      const requesterBalanceBefore = await provider.connection.getBalance(requesterAgent.publicKey);

      await program.methods
        .disputeTask()
        .accounts({
          requester: requesterAgent.publicKey,
          taskRequest: disputeTaskPda,
        })
        .signers([requesterAgent])
        .rpc();

      const task = await program.account.taskRequest.fetch(disputeTaskPda);
      expect(task.status).to.deep.equal({ disputed: {} });

      // Requester should get the refund
      const requesterBalanceAfter = await provider.connection.getBalance(requesterAgent.publicKey);
      expect(requesterBalanceAfter - requesterBalanceBefore).to.equal(PRICE_LAMPORTS);
    });
  });

  // =========================================================================
  // expire_task
  // =========================================================================

  describe("expire flow", () => {
    let expireTaskId: Uint8Array;
    let expireTaskPda: PublicKey;
    let expireServiceId: Uint8Array;
    let expireServicePda: PublicKey;

    before(async () => {
      // Register a new service
      expireServiceId = crypto.randomBytes(16);
      [expireServicePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("service"), providerAgent.publicKey.toBuffer(), Buffer.from(expireServiceId)],
        program.programId
      );

      await program.methods
        .registerService(
          Array.from(expireServiceId),
          padBytes("Quick task service", 128),
          new anchor.BN(PRICE_LAMPORTS)
        )
        .accounts({
          provider: providerAgent.publicKey,
          serviceListing: expireServicePda,
          systemProgram: SystemProgram.programId,
        })
        .signers([providerAgent])
        .rpc();

      // Create a task with a very short deadline (2 seconds)
      expireTaskId = crypto.randomBytes(16);
      [expireTaskPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("task"), requesterAgent.publicKey.toBuffer(), Buffer.from(expireTaskId)],
        program.programId
      );

      await program.methods
        .createTask(
          Array.from(expireTaskId),
          padBytes("Urgent task", 256),
          new anchor.BN(Math.floor(Date.now() / 1000) + 2) // 2 seconds from now
        )
        .accounts({
          requester: requesterAgent.publicKey,
          serviceListing: expireServicePda,
          taskRequest: expireTaskPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([requesterAgent])
        .rpc();
    });

    it("expires task after deadline and refunds requester", async () => {
      // Wait for deadline to pass
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const requesterBalanceBefore = await provider.connection.getBalance(requesterAgent.publicKey);

      await program.methods
        .expireTask()
        .accounts({
          requester: requesterAgent.publicKey,
          taskRequest: expireTaskPda,
        })
        .rpc(); // Anyone can call this

      const task = await program.account.taskRequest.fetch(expireTaskPda);
      expect(task.status).to.deep.equal({ expired: {} });

      const requesterBalanceAfter = await provider.connection.getBalance(requesterAgent.publicKey);
      expect(requesterBalanceAfter - requesterBalanceBefore).to.equal(PRICE_LAMPORTS);
    });
  });
});
