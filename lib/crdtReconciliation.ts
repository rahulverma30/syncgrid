/**
 * Operational Transform (OT) & CRDT Document Reconciliation Engine
 * Supports lightweight patch deltas, merge queue conflicts, vector clocks,
 * and future Yjs / Automerge compliance hooks.
 */

export interface DeltaOperation {
  type: 'insert' | 'delete' | 'retain';
  index: number; // Character position offset in the text stream
  text?: string; // Content to insert
  length?: number; // Count of characters to retain or delete
  userId: string; // Author identity mapping
  timestamp: number; // Epoch millisecond tracker
}

export interface VectorClock {
  [userId: string]: number; // Logical sequence clock counter per collaborator
}

export class CRDTReconciliationEngine {
  /**
   * Applies an operational transform patch onto existing document content,
   * reconciling potential concurrently executing edit conflicts.
   */
  public static reconcile(
    baseContent: string,
    incomingOp: DeltaOperation,
    historyQueue: DeltaOperation[],
    localVectorClock: VectorClock
  ): { reconciledContent: string; transformedOp: DeltaOperation; updatedClock: VectorClock } {
    const clock = { ...localVectorClock };

    // 1. Advance logical vector clock sequence
    clock[incomingOp.userId] = (clock[incomingOp.userId] || 0) + 1;

    // 2. Transform incoming operation against concurrent operations in the queue
    let transformed = { ...incomingOp };

    for (const historicOp of historyQueue) {
      // If concurrent operations occurred from a different user after the historic point
      if (historicOp.userId !== incomingOp.userId && historicOp.timestamp >= incomingOp.timestamp) {
        transformed = this.transform(transformed, historicOp);
      }
    }

    // 3. Apply the transformed delta patch onto baseContent
    let newContent = baseContent;

    if (transformed.type === 'insert' && transformed.text !== undefined) {
      newContent =
        baseContent.substring(0, transformed.index) +
        transformed.text +
        baseContent.substring(transformed.index);
    } else if (transformed.type === 'delete' && transformed.length !== undefined) {
      newContent =
        baseContent.substring(0, transformed.index) +
        baseContent.substring(transformed.index + transformed.length);
    }

    return {
      reconciledContent: newContent,
      transformedOp: transformed,
      updatedClock: clock,
    };
  }

  /**
   * Classic OT Transformation matrix: OP_A transformed against concurrent OP_B
   */
  private static transform(opA: DeltaOperation, opB: DeltaOperation): DeltaOperation {
    const res = { ...opA };

    if (opA.type === 'insert' && opB.type === 'insert') {
      if (opA.index > opB.index) {
        // Shift A's index right by the length of B's insertion
        res.index += (opB.text || '').length;
      } else if (opA.index === opB.index) {
        // Conflict tiebreaker: sort lexicographically by userId
        if (opA.userId > opB.userId) {
          res.index += (opB.text || '').length;
        }
      }
    } else if (opA.type === 'insert' && opB.type === 'delete') {
      if (opA.index > opB.index) {
        const deleteLen = opB.length || 0;
        if (opA.index >= opB.index + deleteLen) {
          res.index -= deleteLen;
        } else {
          // Insertion falls inside deleted region, shift to start of delete
          res.index = opB.index;
        }
      }
    } else if (opA.type === 'delete' && opB.type === 'insert') {
      if (opA.index >= opB.index) {
        res.index += (opB.text || '').length;
      }
    } else if (opA.type === 'delete' && opB.type === 'delete') {
      if (opA.index > opB.index) {
        const deleteBLen = opB.length || 0;
        const deleteALen = opA.length || 0;
        if (opA.index >= opB.index + deleteBLen) {
          res.index -= deleteBLen;
        } else {
          // Overlapping deletions
          const overlap = opB.index + deleteBLen - opA.index;
          res.index = opB.index;
          res.length = Math.max(0, deleteALen - overlap);
        }
      }
    }

    return res;
  }

  /**
   * Future-ready Yjs/Automerge adapter: Generates delta change sets
   */
  public static toYjsDelta(op: DeltaOperation): any {
    if (op.type === 'insert') {
      return { retain: op.index, insert: op.text };
    } else if (op.type === 'delete') {
      return { retain: op.index, delete: op.length };
    }
    return { retain: op.index };
  }
}
