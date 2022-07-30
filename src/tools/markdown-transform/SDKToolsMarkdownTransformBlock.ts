//
//  SDKToolsMarkdownTransformBlock.ts
//  Supernova SDK
//
//  Created by Jiri Trecak.
//  Copyright © 2022 Supernova. All rights reserved.
//

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// MARK: - Imports

import { TokenGroup } from '../..'
import { DesignSystemVersion } from '../../core/SDKDesignSystemVersion'
import { DocumentationPageBlockAsset } from '../../model/documentation/blocks/SDKDocumentationPageBlockAsset'
import { DocumentationPageBlockAssets } from '../../model/documentation/blocks/SDKDocumentationPageBlockAssets'
import { DocumentationPageBlockCallout } from '../../model/documentation/blocks/SDKDocumentationPageBlockCallout'
import { DocumentationPageBlockCode } from '../../model/documentation/blocks/SDKDocumentationPageBlockCode'
import { DocumentationPageBlockColumn } from '../../model/documentation/blocks/SDKDocumentationPageBlockColumn'
import { DocumentationPageBlockColumnItem } from '../../model/documentation/blocks/SDKDocumentationPageBlockColumnItem'
import { DocumentationPageBlockCustom } from '../../model/documentation/blocks/SDKDocumentationPageBlockCustom'
import { DocumentationPageBlockDivider } from '../../model/documentation/blocks/SDKDocumentationPageBlockDivider'
import { DocumentationPageBlockEmbedFigma } from '../../model/documentation/blocks/SDKDocumentationPageBlockEmbedFigma'
import { DocumentationPageBlockEmbedGeneric } from '../../model/documentation/blocks/SDKDocumentationPageBlockEmbedGeneric'
import { DocumentationPageBlockEmbedLink } from '../../model/documentation/blocks/SDKDocumentationPageBlockEmbedLink'
import { DocumentationPageBlockEmbedStorybook } from '../../model/documentation/blocks/SDKDocumentationPageBlockEmbedStorybook'
import { DocumentationPageBlockEmbedYoutube } from '../../model/documentation/blocks/SDKDocumentationPageBlockEmbedYoutube'
import { DocumentationPageBlockFrame } from '../../model/documentation/blocks/SDKDocumentationPageBlockFrame'
import { DocumentationPageBlockFrames } from '../../model/documentation/blocks/SDKDocumentationPageBlockFrames'
import { DocumentationPageBlockHeading } from '../../model/documentation/blocks/SDKDocumentationPageBlockHeading'
import { DocumentationPageBlockImage } from '../../model/documentation/blocks/SDKDocumentationPageBlockImage'
import { DocumentationPageOrderedList } from '../../model/documentation/blocks/SDKDocumentationPageBlockOrderedList'
import { DocumentationPageBlockQuote } from '../../model/documentation/blocks/SDKDocumentationPageBlockQuote'
import { DocumentationPageBlockRenderCode } from '../../model/documentation/blocks/SDKDocumentationPageBlockRenderCode'
import { DocumentationPageBlockShortcut } from '../../model/documentation/blocks/SDKDocumentationPageBlockShortcut'
import { DocumentationPageBlockShortcuts } from '../../model/documentation/blocks/SDKDocumentationPageBlockShortcuts'
import { DocumentationPageBlockTab } from '../../model/documentation/blocks/SDKDocumentationPageBlockTab'
import { DocumentationPageBlockTabItem } from '../../model/documentation/blocks/SDKDocumentationPageBlockTabItem'
import { DocumentationPageBlockTable } from '../../model/documentation/blocks/SDKDocumentationPageBlockTable'
import { DocumentationPageBlockTableCell } from '../../model/documentation/blocks/SDKDocumentationPageBlockTableCell'
import { DocumentationPageBlockTableColumn } from '../../model/documentation/blocks/SDKDocumentationPageBlockTableColumn'
import { DocumentationPageBlockTableRow } from '../../model/documentation/blocks/SDKDocumentationPageBlockTableRow'
import { DocumentationPageBlockText } from '../../model/documentation/blocks/SDKDocumentationPageBlockText'
import { DocumentationPageBlockToken } from '../../model/documentation/blocks/SDKDocumentationPageBlockToken'
import { DocumentationPageBlockTokenGroup } from '../../model/documentation/blocks/SDKDocumentationPageBlockTokenGroup'
import { DocumentationPageBlockTokenList } from '../../model/documentation/blocks/SDKDocumentationPageBlockTokenList'
import { DocumentationPageUnorderedList } from '../../model/documentation/blocks/SDKDocumentationPageBlockUnorderedList'
import { DocumentationPageBlock } from '../../model/documentation/SDKDocumentationPageBlock'
import { DocumentationRichText } from '../../model/documentation/SDKDocumentationRichText'
import { DocumentationHeadingType } from '../../model/enums/SDKDocumentationHeadingType'
import { DocumentationPageBlockType } from '../../model/enums/SDKDocumentationPageBlockType'
import { RichTextSpanAttributeType } from '../../model/enums/SDKRichTextSpanAttributeType'
import { MarkdownTransformType } from './SDKToolsMarkdownTransform'
import { MarkdownTransformUtil } from './SDKToolsMarkdownTransformUtil'

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// MARK: - Definitions

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// MARK: - Search Instance

/** Markdown block transformer */
export class MarkdownTransformBlock {

  // -- Properties

  private transformType: MarkdownTransformType
  private utilTransformer: MarkdownTransformUtil
  private version: DesignSystemVersion

  // --- Conversion
  constructor(type: MarkdownTransformType, version: DesignSystemVersion) {
    this.transformType = type
    if (type === MarkdownTransformType.github) {
        console.log("Note: GitHub mode of markdown is currently in development and is not yet fully supported")
    }
    this.utilTransformer = new MarkdownTransformUtil(this.transformType, version)
  }

  // --- Conversion

  /** Converts a single block - depending on the type - to a markdown definition of specific type */
  async convertBlockToMarkdown(block: DocumentationPageBlock): Promise<string | null> {

    switch (block.type) {
      // Following blocks are automatically transformed
      case DocumentationPageBlockType.callout: return this.convertCalloutBlock(block as DocumentationPageBlockCallout)
      case DocumentationPageBlockType.code: return this.convertCodeBlock(block as DocumentationPageBlockCode)
      case DocumentationPageBlockType.componentAssets: return this.convertComponentAssetBlock(block as DocumentationPageBlockAssets)
      case DocumentationPageBlockType.custom: return this.convertCustomBlock(block as DocumentationPageBlockCustom)
      case DocumentationPageBlockType.divider: return this.convertDividerBlock(block as DocumentationPageBlockDivider)
      case DocumentationPageBlockType.figmaEmbed: return this.convertFigmaEmbedBlock(block as DocumentationPageBlockEmbedFigma)
      case DocumentationPageBlockType.figmaFrames: return this.convertFigmaFramesBlock(block as DocumentationPageBlockFrames)
      case DocumentationPageBlockType.genericEmbed: return this.convertGenericEmbedBlock(block as DocumentationPageBlockEmbedGeneric)
      case DocumentationPageBlockType.heading: return this.convertHeadingBlock(block as DocumentationPageBlockHeading)
      case DocumentationPageBlockType.image: return this.convertImageBlock(block as DocumentationPageBlockImage)
      case DocumentationPageBlockType.link: return this.convertLinkBlock(block as DocumentationPageBlockEmbedLink)
      case DocumentationPageBlockType.orderedList: return this.convertOrderedListBlock(block as DocumentationPageOrderedList)
      case DocumentationPageBlockType.quote: return this.convertQuoteBlock(block as DocumentationPageBlockQuote)
      case DocumentationPageBlockType.renderCode: return this.convertLiveCodeBlock(block as DocumentationPageBlockRenderCode)
      case DocumentationPageBlockType.shortcuts: return this.convertShortcutsBlock(block as DocumentationPageBlockShortcuts)
      case DocumentationPageBlockType.storybookEmbed: return this.convertStorybookEmbedBlock(block as DocumentationPageBlockEmbedStorybook)
      case DocumentationPageBlockType.text: return this.convertTextBlock(block as DocumentationPageBlockText)
      case DocumentationPageBlockType.token: return await this.convertTokenBlock(block as DocumentationPageBlockToken)
      case DocumentationPageBlockType.tokenGroup: return this.convertTokenGroupBlock(block as DocumentationPageBlockTokenGroup)
      case DocumentationPageBlockType.tokenList: return this.convertTokenListBlock(block as DocumentationPageBlockTokenList)
      case DocumentationPageBlockType.unorderedList: return this.convertUnorderedListBlock(block as DocumentationPageUnorderedList)
      case DocumentationPageBlockType.youtubeEmbed: return this.convertYoutubeEmbedBlock(block as DocumentationPageBlockEmbedYoutube)

      // Following blocks are special because their transformation is invoked manually (containers)
      case DocumentationPageBlockType.column: return this.convertColumnBlock(block as DocumentationPageBlockColumn)
      case DocumentationPageBlockType.table: return this.convertTableBlock(block as DocumentationPageBlockTable)
      case DocumentationPageBlockType.tabs: return this.convertTabsBlock(block as DocumentationPageBlockTab)

      // Following blocks are special because their transformation is invoked manually (contained items)
      case DocumentationPageBlockType.tabItem: return this.convertTabItemBlock(block as DocumentationPageBlockTabItem)
      case DocumentationPageBlockType.columnItem: return this.convertColumnItemBlock(block as DocumentationPageBlockColumnItem)
      case DocumentationPageBlockType.tableCell: return this.convertTableCellBlock(block as DocumentationPageBlockTableCell)
      case DocumentationPageBlockType.tableRow: return this.convertTableRowBlock(block as DocumentationPageBlockTableRow)
    }
  }

  // -- Plain blocks

  convertHeadingBlock(block: DocumentationPageBlockHeading): string | null {

    let heading = block as DocumentationPageBlockHeading
    let text = this.utilTransformer.convertTextBlockToMarkdown(heading)
    switch (heading.headingType) {
      case DocumentationHeadingType.h1:
        return `# ${text}`
      case DocumentationHeadingType.h2:
        return `## ${text}`
      case DocumentationHeadingType.h3:
        return `### ${text}`
    }
  }

  convertCalloutBlock(block: DocumentationPageBlockCallout): string | null {
    let text = this.utilTransformer.convertTextBlockToMarkdown(block)
    return `> ${text}`
  }

  convertQuoteBlock(block: DocumentationPageBlockQuote): string | null {
    let text = this.utilTransformer.convertTextBlockToMarkdown(block)
    return `> ${text}`
  }

  convertDividerBlock(block: DocumentationPageBlockDivider): string | null {
    return "---"
  }

  convertImageBlock(block: DocumentationPageBlockImage): string | null {
    if (block.url) {
      return `![Img](${block.url})`
    }
  }

  convertOrderedListBlock(block: DocumentationPageOrderedList): string | null {
    let text = this.utilTransformer.convertTextBlockToMarkdown(block)
    return `1. ` + text
  }

  convertUnorderedListBlock(block: DocumentationPageUnorderedList): string | null {
    let text = this.utilTransformer.convertTextBlockToMarkdown(block)
    return `1. ` + text
  }

  convertLiveCodeBlock(block: DocumentationPageBlockRenderCode): string | null {
    const codeLanguageDefinition = "javascript"
    return `\`\`\`${codeLanguageDefinition}\n${block.code}\n\`\`\``
  }

  convertCodeBlock(block: DocumentationPageBlockCode): string | null {
    const codeLanguageDefinition = block.codeLanguage ? block.codeLanguage.toLowerCase() : ""
    return `\`\`\`${codeLanguageDefinition}\n${block.text.asPlainText()}\n\`\`\``
  }

  convertTextBlock(block: DocumentationPageBlockText): string | null {
    return this.utilTransformer.convertTextBlockToMarkdown(block)
  }

  convertGenericEmbedBlock(block: DocumentationPageBlockEmbedGeneric): string | null {
    return this.convertURLBlock(block, block.url ?? "Open link")
  }

  convertStorybookEmbedBlock(block: DocumentationPageBlockEmbedStorybook): string | null {
    return this.convertURLBlock(block, "Open Storybook Canvas")
  }

  convertLinkBlock(block: DocumentationPageBlockEmbedLink): string | null {
    return this.convertURLBlock(block, block.url ?? "Open link")
  }

  convertYoutubeEmbedBlock(block: DocumentationPageBlockEmbedYoutube): string | null {
    return this.convertURLBlock(block, block.url ?? "Open Youtube Video")
  }

  // -- Token blocks

  async convertTokenBlock(block: DocumentationPageBlockToken): Promise<string | null> {

    if (!block.tokenId) {
      return null
    }

    // Fetch token
    let tokens = await this.version.tokens()
    tokens = tokens.filter(t => t.id === block.tokenId || t.versionedId === block.tokenId)
    if (tokens.length === 0) {
      return null
    }

    // Convert token
    return `\n${this.utilTransformer.convertTokenToMarkdown(tokens[0])}\n`
  }

  async convertTokenListBlock(block: DocumentationPageBlockTokenList): Promise<string | null> {

    if (!block.tokenIds) {
      return null
    }

    // Fetch tokens
    let tokens = await this.version.tokens()
    tokens = tokens.filter(t => block.tokenIds.includes(t.id) || block.tokenIds.includes(t.versionedId))
    if (tokens.length === 0) {
      return null
    }

    // Convert token
    return `\n${tokens.map(t => this.utilTransformer.convertTokenToMarkdown(t)).join("\n")}\n`
  }

  async convertTokenGroupBlock(block: DocumentationPageBlockTokenGroup): Promise<string | null> {

    if (!block.groupId) {
      return null
    }

    // Fetch tokens
    let tokens = await this.version.tokens()
    let groups = await this.version.tokenGroups()
    groups = groups.filter(g => g.id === block.groupId || g.versionedId === block.groupId)
    
    if (groups.length !== 1) {
      return null
    }

    // Show either single group or all nested groups
    let groupsToShow = [groups[0]]
    if (block.showNestedGroups) {
      groupsToShow = this.flattenedGroupsFromRoot(groups[0])
    }

    // Convert group and all its tokens
    let segments: Array<string> = []
    for (let group of groupsToShow) {
      let tokensToShow = tokens.filter(t => group.tokenIds.includes(t.id) || group.tokenIds.includes(t.versionedId))
      let segment = `\n${`Token Group ${group.path.join(" / ")}`}\n${tokens.map(t => this.utilTransformer.convertTokenToMarkdown(t)).join("\n")}\n`
      segments.push(segment)
    }

    // Convert to single string
    return segments.join("\n")
  }

  private flattenedGroupsFromRoot(root: TokenGroup): Array<TokenGroup> {

    let groups = [root]
    for (let group of root.subgroups) {
      groups.push(group)
      groups = groups.concat(this.flattenedGroupsFromRoot(group))
    }

    return groups
  }

  convertComponentAssetBlock(block: DocumentationPageBlockAssets): string | null {

    // TODO: Block conversion
    return null
  }

  convertFigmaEmbedBlock(block: DocumentationPageBlockEmbedFigma): string | null {

    // TODO: Block conversion
    return null
  }

  convertFigmaFramesBlock(block: DocumentationPageBlockFrames): string | null {

    // TODO: Block conversion
    return null
  }

  convertShortcutsBlock(block: DocumentationPageBlockShortcuts): string | null {

    // TODO: Block conversion
    return null
  }

  // -- Containers

  convertColumnBlock(block: DocumentationPageBlockColumn): string | null {

    // TODO: Block conversion
    return null
  }

  convertTabsBlock(block: DocumentationPageBlockTab): string | null {

    // TODO: Block conversion
    return null
  }

  convertTableBlock(block: DocumentationPageBlockTable): string | null {

    // TODO: Block conversion
    return null
  }

  // -- Contained items

  convertColumnItemBlock(block: DocumentationPageBlockColumnItem): string | null {

    // TODO: Block conversion
    return null
  }

  convertTabItemBlock(block: DocumentationPageBlockTabItem): string | null {

    // TODO: Block conversion
    return null
  }

  convertTableCellBlock(block: DocumentationPageBlockTableCell): string | null {

    // TODO: Block conversion
    return null
  }

  convertTableRowBlock(block: DocumentationPageBlockTableRow): string | null {

    // TODO: Block conversion
    return null
  }

  // -- Unsupported

  convertCustomBlock(block: DocumentationPageBlockCustom): string | null {
    // Custom blocks will not be transformed for now, as we can't realistically 
    // know what they are supposed to do and right now we also can't invoke them
    return null
    // TODO: Custom component blocks should still be converted, probably
  }

  // -- Conveniences

  convertURLBlock(block: DocumentationPageBlockEmbedGeneric, userAction: string): string | null {

    // Will generate:
    // [Action prompt, ie. "Open Figma File"](url)
    // ^ caption_if_provided
    if (block.url) {
      const caption = block.caption ? `^ ${block.caption}\n` : ""
      return `\n[${userAction}](${block.url})\n${caption}`
    }
    return null
  }
}