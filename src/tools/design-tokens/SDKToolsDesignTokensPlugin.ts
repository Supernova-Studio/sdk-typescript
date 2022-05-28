
//
//  SDKToolsDesignTokensPlugin.ts
//  Supernova SDK
//
//  Created by Jiri Trecak.
//  Copyright © 2021 Supernova. All rights reserved.
//

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// MARK: - Imports

import { DesignSystemVersion } from "../../core/SDKDesignSystemVersion"
import { Supernova } from "../../core/SDKSupernova"
import { TokenType } from "../../model/enums/SDKTokenType"
import { TokenGroup } from "../../model/groups/SDKTokenGroup"
import { Token } from "../../model/tokens/SDKToken"
import _ from "lodash"
import { Brand } from "../.."
import { TokenWriteResponse } from "../../core/SDKBrandWriter"
import { DTJSONLoader } from "./utilities/SDKDTJSONLoader"
import { DTJSONConverter, DTProcessedTokenNode } from "./utilities/SDKDTJSONConverter"
import { DTJSONGroupBuilder } from "./utilities/SDKDTJSONGroupBuilder"
import { DTTokenGroupTreeMerger } from "./utilities/SDKDTTokenGroupTreeMerger"
import { DTTokenMerger } from "./utilities/SDKDTTokenMerger"


// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// MARK: - Types


// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// MARK: - Tool implementation

/** Design Tokens Plugin Manipulation Tool */
export class SupernovaToolsDesignTokensPlugin {

  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Properties

  private instance: Supernova
  private version: DesignSystemVersion
  private brand: Brand
  private sortMultiplier: number = 100


  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Constructor

  constructor(instance: Supernova, version: DesignSystemVersion, brand: Brand) {
    this.instance = instance
    this.version = version
    this.brand = brand
  }


  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Loader

  /** Load token definitions from multiple sources */
  /*
  async loadTokensFromDefinitions(definitions: Array<string>): Promise<{
      tokens: Array<Token>
      groups: Array<TokenGroup>
  }> {

    for (let definition of definitions) {
        let result = this.loadTokensFromDefinition(definition)
    }
    throw new Error("Not implemented")
  }
  */

  /** Load token definitions from */
  async loadTokensFromDefinition(definition: string): Promise<{
    processedNodes: Array<DTProcessedTokenNode>,
    tokens: Array<Token>,
    groups: Array<TokenGroup>
  }> {
    let loader = new DTJSONLoader()
    let converter = new DTJSONConverter(this.version, this.brand)
    let groupBuilder = new DTJSONGroupBuilder(this.version, this.brand)

    let nodes = await loader.loadDSObjectsFromDefinition(definition)
    let processedNodes = await converter.convertNodesToTokens(nodes)
    let processedGroups = await groupBuilder.constructAllDefinableGroupsTrees(processedNodes)
    
    return {
        processedNodes,
        tokens: processedNodes.map(n => n.token),
        groups: processedGroups
    }
  }


  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Merging

  /** Loads remote source connected to this tool, then merges tokens and groups with it, creating union. Can optionally write to the source as well */
  async mergeWithRemoteSource(processedNodes: Array<DTProcessedTokenNode>, tokenGroups: Array<TokenGroup>, write: boolean): Promise<{
      tokens: Array<Token>
      groups: Array<TokenGroup>
  }> {
    // Get remote token data
    let upstreamTokenGroups = await this.brand.tokenGroups()
    let upstreamTokens = await this.brand.tokens()

    // Assign correct sorting order to incoming tokens and token groups
    this.correctSortOrder(upstreamTokens, upstreamTokenGroups)

    // Merge trees
    let pack: Array<Token | TokenGroup> = [...upstreamTokens, ...upstreamTokenGroups]
    let treeMerger = new DTTokenGroupTreeMerger()
    let tokenMerger = new DTTokenMerger()
    let tokenMergeResult = tokenMerger.makeTokensDiff(upstreamTokens, processedNodes)
    let result = treeMerger.makeGroupsDiff(tokenMergeResult, pack)

    // Update referenced tokens in group based on the result
    let groups: Array<TokenGroup> = []
    for (let item of result.toCreate) {
      if (item.element instanceof TokenGroup) {
        item.element.childrenIds = item.childrenIds
        groups.push(item.element)
      }
    }
    for (let item of result.toUpdate) {
      if (item.element instanceof TokenGroup) {
        item.element.childrenIds = item.childrenIds
        groups.push(item.element)
      }
    }

    // Synchronize changes
    let writer = this.brand.writer()
    let tokensToWrite = processedNodes.map(n => n.token)
    let tokenGroupsToWrite = groups
    await writer.writeTokens(tokenMergeResult.toCreateOrUpdate.map(r => r.token), tokenGroupsToWrite, tokenMergeResult.toDelete.map(r => r.token))

    // console.log(result)
    console.log("--- --- --- RESULT (TO CREATE): ")
    console.log(result.toCreate)
    console.log("--- --- --- RESULT (TO UPDATE): ")
    console.log(result.toUpdate)

    return {
      tokens: tokensToWrite,
      groups: tokenGroupsToWrite
    }
  }

  correctSortOrder(tokens: Array<Token>, tokenGroups: Array<TokenGroup>) {

    // Build maps so lookup is faster
    let tokenMap = new Map<string, Token>()
    let groupMap = new Map<string, TokenGroup>()
    tokens.forEach(t => tokenMap.set(t.id, t))
    tokenGroups.forEach(g => groupMap.set(g.id, g))

    // Correct order for each root
    let roots = tokenGroups.filter(g => g.isRoot)
    roots.forEach(r => this.correctSortOrderFromTypeRoot(r, tokenMap, groupMap))
  }

  correctSortOrderFromTypeRoot(root: TokenGroup, tokenMap: Map<string, Token>, groupMap: Map<string, TokenGroup>) {

    let ids = this.flattenedIdsFromRoot(root, tokenMap, groupMap)
    for (let i = 0; i < ids.length; i++) {
      let element = tokenMap.get(ids[i]) ?? groupMap.get(ids[i])
      element.sortOrder = i * this.sortMultiplier
    }
  }

  flattenedIdsFromRoot(root: TokenGroup, tokenMap: Map<string, Token>, groupMap: Map<string, TokenGroup>): Array<string> {

    let result: Array<string> = [root.id]
    let ids = root.childrenIds
    for (let id of ids) {
      result.push(id)
      let tokenGroup = groupMap.get(id)
      if (tokenGroup) {
        result = result.concat(this.flattenedIdsFromRoot(tokenGroup, tokenMap, groupMap))
      } else {
        let token = tokenMap.get(id)
        if (token) {
          result.push(id)
        } else {
          throw new Error(`Unable to find token or group ${id} of type ${root.tokenType}`)
        }
      }
    }

    return result
  }
}
