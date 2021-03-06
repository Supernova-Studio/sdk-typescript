//
//  SDKDocumentationPageBlockType.ts
//  Supernova SDK
//
//  Created by Jiri Trecak.
//  Copyright © 2021 Supernova. All rights reserved.
//

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// MARK: - Source type enum

export enum DocumentationPageBlockType {
  text = 'Text',
  heading = 'Heading',
  code = 'Code',
  unorderedList = 'UnorderedList',
  orderedList = 'OrderedList',
  quote = 'Quote',
  callout = 'Callout',
  divider = 'Divider',
  image = 'Image',
  token = 'Token',
  tokenList = 'TokenList',
  tokenGroup = 'TokenGroup',
  shortcuts = 'Shortcuts',
  link = 'Link',
  figmaEmbed = 'FigmaEmbed',
  youtubeEmbed = 'YoutubeEmbed',
  storybookEmbed = 'StorybookEmbed',
  genericEmbed = 'Embed',
  figmaFrames = 'FigmaFrames',
  custom = 'Custom',
  renderCode = 'RenderCode',
  componentAssets = 'ComponentAssets',
  column = 'Column',
  columnItem = 'ColumnItem',
  tabs = 'Tabs',
  tabItem = 'TabItem',
  table = 'Table',
  tableCell = 'TableCell',
  tableRow = 'TableRow'
}
