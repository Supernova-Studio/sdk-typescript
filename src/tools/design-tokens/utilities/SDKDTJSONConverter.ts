//
//  SDKToolsTokenSync.ts
//  Supernova SDK
//
//  Created by Jiri Trecak.
//  Copyright © 2021 Supernova. All rights reserved.
//

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// MARK: - Imports

import { Brand, DesignSystemVersion, Token, TokenGroup, TokenType } from "../../.."
import { DTParsedNode } from "./SDKDTJSONLoader"


// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// MARK: - Definitions

export type DTProcessedTokenNode = {
  token: Token,
  path: Array<string>
}

type DTRootNodeDefinition = {
  name: string,
  type: TokenType
}


// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// MARK: - Tool implementation

/** Utility to DS Tokens plugin JSON to Supernova entities */
export class DTJSONConverter {

  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Properties

  version: DesignSystemVersion
  brand: Brand

  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Constructor

  constructor(version: DesignSystemVersion, brand: Brand) {
    this.version = version
    this.brand = brand
  }

  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Token Conversion

  convertNodesToTokens(nodes: Array<DTParsedNode>): Array<DTProcessedTokenNode> {

    let unprocessedTokens = new Array<DTParsedNode>()
    let processedTokens = new Array<DTProcessedTokenNode>()

    // Convert atomic tokens, ie. tokens without references
    for (let node of nodes) {
      if (typeof node.value === "string" && !this.valueIsReference(node.value)) {
        let token = this.convertAtomicNode(node)
        processedTokens.push(token)
      } else {
        unprocessedTokens.push(node)
      }
    }

    // Now we have all atomic tokens processed, we can start creating references
    // References will be emptying pool until they are all resolved (this can take multiple
    // passes, resolving one depth level with each pass)
    while (unprocessedTokens.length === 0) {
      let unprocessedDepthTokens = new Array<DTParsedNode>()
      for (let node of unprocessedTokens) {
        let token = this.convertReferencedNode(node, processedTokens)
        if (token) {
          processedTokens.push(token)
        } else {
          unprocessedDepthTokens.push(node)
        }
      }
      if (unprocessedDepthTokens.length === 0) {
        break
      }
      unprocessedTokens = unprocessedDepthTokens
    }

    return processedTokens
  }


  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Atomic nodes

  convertAtomicNode(node: DTParsedNode): DTProcessedTokenNode {

    let snType = this.convertDTTypeToSupernovaType(node.type)
    switch (snType) {
      case TokenType.color: return this.convertColorAtomicNode(node)
      default: throw new Error("Unsupported token type " + snType)
    }
  }

  convertColorAtomicNode(node: DTParsedNode): DTProcessedTokenNode {

  }


  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Referenced nodes

  convertReferencedNode(node: DTParsedNode, resolvedTokens: Array<DTProcessedTokenNode>): DTProcessedTokenNode | undefined {

  }


  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Convenience

  valueIsReference(value: string): boolean {

    value = value.trim()
    return value.length > 3 && 
           value.startsWith("{") &&
           value.endsWith("}")
  }

  convertDTTypeToSupernovaType(type: string): TokenType {
   
    switch (type) {
      case "Color": return TokenType.color
      default: throw new Error("Unsupported token type " + type)
    }
  }
}