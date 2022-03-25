//
//  SDKDataCore.ts
//  Supernova SDK
//
//  Created by Jiri Trecak.
//  Copyright © 2020 Supernova. All rights reserved.
//

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// MARK: - Imports

import { Mutex } from "async-mutex"
import { Asset } from "../../model/assets/SDKAsset"
import { RenderedAsset, RenderedAssetModel } from "../../model/assets/SDKRenderedAsset"
import { AssetFormat } from "../../model/enums/SDKAssetFormat"
import { AssetScale } from "../../model/enums/SDKAssetScale"
import { Component, ComponentRemoteModel } from "../../model/components/SDKComponent"
import { ExporterCustomBlock, ExporterCustomBlockModel } from "../../model/exporters/custom_blocks/SDKExporterCustomBlock"
import { DocumentationConfiguration } from "../../model/documentation/SDKDocumentationConfiguration"
import { DocumentationGroupModel } from "../../model/documentation/SDKDocumentationGroup"
import { DocumentationItem } from "../../model/documentation/SDKDocumentationItem"
import { DocumentationPageModel } from "../../model/documentation/SDKDocumentationPage"
import { AssetGroup } from "../../model/groups/SDKAssetGroup"
import { ComponentGroup, ComponentGroupRemoteModel } from "../../model/groups/SDKComponentGroup"
import { TokenGroup, TokenGroupRemoteModel } from "../../model/groups/SDKTokenGroup"
import { TokenRemoteModel } from "../../model/tokens/remote/SDKRemoteTokenModel"
import { Token } from "../../model/tokens/SDKToken"
import { AssetGroupResolver } from "../resolvers/SDKAssetGroupResolver"
import { ComponentGroupResolver } from "../resolvers/SDKComponentGroupResolver"
import { DocumentationItemResolver } from "../resolvers/SDKDocumentationItemResolver"
import { TokenGroupResolver } from "../resolvers/SDKTokenGroupResolver"
import { TokenResolver } from "../resolvers/SDKTokenResolver"
import { DesignSystemVersion } from "../SDKDesignSystemVersion"
import { Documentation, DocumentationModel } from "../SDKDocumentation"
import { DataBridge } from "./SDKDataBridge"
import { ExporterConfigurationProperty, ExporterConfigurationPropertyModel } from "../../model/exporters/custom_properties/SDKExporterConfigurationProperty"
import { Exporter, ExporterModel } from "../../model/exporters/SDKExporter"
import { DesignSystem } from "index"


// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// MARK: - Function Definition

export class DataCore {
  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Configuration

  // Synchronization 
  private tokensSynced: boolean
  private tokenGroupsSynced: boolean
  private componentAssetSynced: boolean
  private componentAssetGroupsSynced: boolean
  private documentationItemsSynced: boolean
  private documentationSynced: boolean
  private exporterCustomBlocksSynced: boolean

  // Synchronization mutexes
  private tokenMutex = new Mutex()
  private tokenGroupMutex = new Mutex()
  private componentAssetMutex = new Mutex()
  private componentAssetGroupMutex = new Mutex()
  private documentationItemMutex = new Mutex()
  private configurationMutex = new Mutex()
  private exporterCustomBlocksMutex = new Mutex()

  // Data store
  private tokens: Array<Token>
  private tokenGroups: Array<TokenGroup>
  private components: Array<Component>
  private componentGroups: Array<ComponentGroup>
  private assets: Array<Asset>
  private assetGroups: Array<AssetGroup>
  private documentation: Documentation
  private documentationItems: Array<DocumentationItem>
  private exporterCustomBlocks: Array<ExporterCustomBlock>

  private bridge: DataBridge


  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Constructor

  constructor(bridge: DataBridge) {
    this.bridge = bridge

    this.tokensSynced = false
    this.tokens = new Array<Token>()

    this.tokenGroupsSynced = false
    this.tokenGroups = new Array<TokenGroup>()

    this.documentationItemsSynced = false
    this.documentationItems = new Array<DocumentationItem>()

    this.exporterCustomBlocksSynced = false
    this.exporterCustomBlocks = new Array<ExporterCustomBlock>()

    this.componentAssetSynced = false
    this.components = new Array<Component>()
    this.assets = new Array<Asset>()

    this.componentAssetGroupsSynced = false
    this.componentGroups = new Array<ComponentGroup>()
    this.assetGroups = new Array<AssetGroup>()

    this.documentationSynced = false
    this.documentation = null
  }

  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Public Accessors - Tokens

  async currentDesignSystemTokens(designSystemId: string, designSystemVersion: DesignSystemVersion): Promise<Array<Token>> {
    // Thread-lock the call
    const release = await this.tokenMutex.acquire()

    // Acquire data
    if (!this.tokensSynced) {
      await this.updateTokenData(designSystemId, designSystemVersion)
    }

    // Unlock the thread
    release()

    // Retrieve the data
    return this.tokens
  }

  async currentDesignSystemTokenGroups(designSystemId: string, designSystemVersion: DesignSystemVersion): Promise<Array<TokenGroup>> {
    // Thread-lock the call
    const release = await this.tokenGroupMutex.acquire()

    // Acquire data
    if (!this.tokenGroupsSynced) {
      await this.updateTokenGroupData(designSystemId, designSystemVersion)
    }

    // Unlock the thread
    release()

    // Retrieve the data
    return this.tokenGroups
  }

  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Public Accessors - Assets

  async currentDesignSystemAssets(designSystemId: string, designSystemVersion: DesignSystemVersion): Promise<Array<Asset>> {
    // Thread-lock the call
    const release = await this.componentAssetMutex.acquire()

    // Acquire data
    if (!this.componentAssetSynced) {
      await this.updateComponentAndAssetData(designSystemId, designSystemVersion)
    }

    // Unlock the thread
    release()

    // Retrieve the data
    return this.assets
  }

  async currentDesignSystemAssetGroups(designSystemId: string, designSystemVersion: DesignSystemVersion): Promise<Array<AssetGroup>> {
    // Thread-lock the call
    const release = await this.componentAssetGroupMutex.acquire()

    // Acquire data
    if (!this.componentAssetSynced) {
      await this.updateComponentAndAssetData(designSystemId, designSystemVersion)
    }
    if (!this.componentAssetGroupsSynced) {
      await this.updateComponentAndAssetGroupData(designSystemId, designSystemVersion)
    }

    // Unlock the thread
    release()

    // Retrieve the data
    return this.assetGroups
  }


  async renderAssetsForConfiguration(designSystemId: string, designSystemVersion: DesignSystemVersion, assets: Array<Asset>, groups: Array<AssetGroup>, format: AssetFormat, scale: AssetScale): Promise<Array<RenderedAsset>> {
    
    // Configure payload
    let configuration = {
        "settings": [{
            prefix: "",
            suffix: "",
            scale: scale,
            format: format
        }],
        "persistentIds": assets.map(a => a.id)
    }

    // Render items
    const endpoint = `components/assets/download-list`
    let items = (await this.bridge.postDSMDataToEndpoint(
      designSystemId, 
      designSystemVersion.id,
      endpoint,
      configuration
    )).items as Array<RenderedAssetModel>

    if (items.length !== assets.length) {
      throw new Error("Number of rendered assets doesn't align with number of requested assets")
    }

    let counter = 0
    let resultingAssets: Array<RenderedAsset> = []
    
    // For duplicates
    let names = new Map<string, number>()
    for (let item of items) {
      names.set(item.originalName.toLowerCase(), 0)
    }

    // Create asset
    for (let item of items) {
      let asset = assets[counter]
      let renderedGroup: AssetGroup
      counter++

      for (let group of groups) {
        if (group.assetIds.includes(asset.id)) {
          renderedGroup = group
          break
        }
      }

      if (!renderedGroup) {
        throw new Error(`Each asset must be assigned to some group`)
      }
      let lowercasedName = item.originalName.toLowerCase()
      let renderedAsset = new RenderedAsset(item, asset, renderedGroup, names.get(lowercasedName))

      // Increase number of duplicates
      names.set(lowercasedName, names.get(lowercasedName) + 1)

      // Store
      resultingAssets.push(renderedAsset)
    }

    return resultingAssets
  }


  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Public Accessors - Components

  async currentDesignSystemComponents(designSystemId: string, designSystemVersion: DesignSystemVersion): Promise<Array<Component>> {
    // Thread-lock the call
    const release = await this.componentAssetMutex.acquire()

    // Acquire data
    if (!this.componentAssetSynced) {
      await this.updateComponentAndAssetData(designSystemId, designSystemVersion)
    }

    // Unlock the thread
    release()

    // Retrieve the data
    return this.components
  }

  async currentDesignSystemComponentGroups(designSystemId: string, designSystemVersion: DesignSystemVersion): Promise<Array<ComponentGroup>> {
    // Thread-lock the call
    const release = await this.componentAssetGroupMutex.acquire()

    // Acquire data
    if (!this.componentAssetSynced) {
      await this.updateComponentAndAssetData(designSystemId, designSystemVersion)
    }
    if (!this.componentAssetGroupsSynced) {
      await this.updateComponentAndAssetGroupData(designSystemId, designSystemVersion)
    }

    // Unlock the thread
    release()

    // Retrieve the data
    return this.componentGroups
  }

  
  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Public Accessors - Documentation

  async currentDesignSystemDocumentationItems(designSystem: DesignSystem, designSystemVersion: DesignSystemVersion): Promise<Array<DocumentationItem>> {
    // Thread-lock the call
    const release = await this.documentationItemMutex.acquire()

    // Acquire custom blocks and doc configuration first, so they can be used for resolution
    let blocks = await this.currentExporterCustomBlocks(designSystem.id, designSystemVersion)
    let documentation = (await this.currentDesignSystemDocumentation(designSystem, designSystemVersion)).settings

    // Acquire data
    if (!this.documentationItemsSynced) {
      await this.updateDocumentationItemData(designSystem.id, designSystemVersion, blocks, documentation)
    }

    // Unlock the thread
    release()

    // Retrieve the data
    return this.documentationItems
  }

  async currentDesignSystemDocumentation(designSystem: DesignSystem, designSystemVersion: DesignSystemVersion): Promise<Documentation> {
    // Thread-lock the call
    const release = await this.configurationMutex.acquire()

    // Acquire data
    if (!this.documentationSynced) {
      await this.updateDocumentationData(designSystem, designSystemVersion)
    }

    // Unlock the thread
    release()

    // Retrieve the data
    return this.documentation
  }

  async currentExporterCustomBlocks(designSystemId: string, designSystemVersion: DesignSystemVersion): Promise<Array<ExporterCustomBlock>> {
 
    // Thread-lock the call
    const release = await this.exporterCustomBlocksMutex.acquire()

    // Acquire data
    if (!this.exporterCustomBlocksSynced) {
      await this.updateExporterCustomBlocksData(designSystemId, designSystemVersion)
    }

    // Unlock the thread
    release()

    // Retrieve the data
    return this.exporterCustomBlocks
  }

  async currentExporterConfigurationProperties(designSystemId: string, exporterId: string, designSystemVersion: DesignSystemVersion): Promise<Array<ExporterConfigurationProperty>> {
 
    // TODO: This call is currently not cached as we need multi-cache because of exporterId. Easy to implement, but will have to wait for later as ideally we create more sophisticated caching system
    let exporter = await this.getExporter(designSystemId, exporterId, designSystemVersion)
    let propertyValues = await this.getExporterConfigurationPropertyUserValues(designSystemId, exporterId, designSystemVersion)
    let properties = exporter.contributes.configuration

    // Update properties with the downloaded data
    for (let property of properties) {
      if (propertyValues.hasOwnProperty(property.key)) {
        property.updateValue(propertyValues[property.key])
      }
    }

    // Retrieve the data
    return properties
  }



  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Documentation

  /** Prepare design configuration, merging it with pulsar data */
  async updateDocumentationData(designSystem: DesignSystem, designSystemVersion: DesignSystemVersion) {
    // Download core documentation settings
    this.documentation = await this.getDocumentation(designSystem, designSystemVersion)
    if (this.bridge.cache) {
      this.documentationSynced = true
    }
  }

  private async getDocumentation(designSystem: DesignSystem, designSystemVersion: DesignSystemVersion): Promise<Documentation> {

    // Download design system documentation from the API
    // Get remote data
    const endpoint = `documentation`
    let remoteDocumentation = (await this.bridge.getDSMDataFromEndpoint(
      designSystem.id, 
      designSystemVersion.id,
      endpoint
    )).documentation as DocumentationModel

    // Extend with information coming from pulsar
    let configuration = new Documentation(designSystemVersion, designSystem, remoteDocumentation)
    return configuration
  }

  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Exporter custom blocks

  /** Download all custom blocks provided by the currently active exporter */
  async updateExporterCustomBlocksData(designSystemId: string, designSystemVersion: DesignSystemVersion) {
    // Download core design system token data
    this.exporterCustomBlocks = await this.getExporterCustomBlocks(designSystemId, designSystemVersion)
    if (this.bridge.cache) {
      this.exporterCustomBlocksSynced = true
    }
  }

  private async getExporterCustomBlocks(designSystemId: string, designSystemVersion: DesignSystemVersion): Promise<Array<ExporterCustomBlock>> {
    // Download the raw token data and resolve them
    let rawBlocks = await this.getExporterCustomBlockData(designSystemId, designSystemVersion)
    let resolvedBlocks = await this.resolveExporterCustomBlockData(rawBlocks)
    return resolvedBlocks
  }

  private async getExporterCustomBlockData(designSystemId: string, designSystemVersion: DesignSystemVersion): Promise<Array<ExporterCustomBlockModel>> {
    // Download token data from the design system endpoint. This downloads tokens of all types
    const endpoint = 'documentation/custom-blocks'
    let result: Array<ExporterCustomBlockModel> = (await this.bridge.getDSMDataFromEndpoint(designSystemId, designSystemVersion.id, endpoint)).customBlocks
    return result
  }

  private async resolveExporterCustomBlockData(
    data: Array<ExporterCustomBlockModel>
  ): Promise<Array<ExporterCustomBlock>> {
    return data.map(b => new ExporterCustomBlock(b))
  }

  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Exporter custom properties / values

  private async getExporterConfigurationPropertyUserValues(designSystemId: string, exporterId: string, designSystemVersion: DesignSystemVersion): Promise<Object> {
    // Download the raw token data and resolve them
    let userValues = await this.getExporterConfigurationPropertiesUserValuesData(designSystemId, exporterId, designSystemVersion)
    // let resolvedProperties = await this.resolveExporterConfigurationPropertiesUserValuesData(rawProperties) // no resolution needed
    return userValues
  }

  private async getExporterConfigurationPropertiesUserValuesData(designSystemId: string, exporterId: string, designSystemVersion: DesignSystemVersion): Promise<Object> {
    // Download token data from the design system endpoint. This downloads tokens of all types
    const endpoint = `exporter-properties/${exporterId}`
    let result: Array<ExporterConfigurationPropertyModel> = (await this.bridge.getDSMDataFromEndpoint(designSystemId, designSystemVersion.id, endpoint)).items
    return result
  }

  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Exporter

  private async getExporter(designSystemId, exporterId: string, designSystemVersion: DesignSystemVersion): Promise<Exporter> {
    // Download the raw token data and resolve them
    let rawExporter = await this.getExporterData(designSystemId, exporterId, designSystemVersion)
    let resolvedExporter = await this.resolveExporterData(rawExporter)
    return resolvedExporter
  }

  private async getExporterData(designSystemId: string, exporterId: string, designSystemVersion: DesignSystemVersion): Promise<ExporterModel> {
    // Download token data from the design system endpoint. This downloads tokens of all types
    const endpoint = `exporters/${exporterId}`
    let result: ExporterModel = (await this.bridge.getDSMDataFromEndpoint(designSystemId, designSystemVersion.id, endpoint)).exporter
    return result
  }

  private async resolveExporterData(
    data: ExporterModel,
  ): Promise<Exporter> {
    return new Exporter(data)
  }


  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---e
  // MARK: - Tokens

  /** Prepare design system data for use for the entire design system, downloading and resolving all tokens */
  async updateTokenData(designSystemId: string, designSystemVersion: DesignSystemVersion) {
    // Download core design system token data
    this.tokens = await this.getTokens(designSystemId, designSystemVersion)
    if (this.bridge.cache) {
      this.tokensSynced = true
    }
  }

  private async getTokens(designSystemId: string, designSystemVersion: DesignSystemVersion): Promise<Array<Token>> {
    // Download the raw token data and resolve them
    let rawData = await this.getRawTokenData(designSystemId, designSystemVersion)
    let resolvedTokens = await this.resolveTokenData(rawData, designSystemVersion)
    return resolvedTokens
  }

  private async getRawTokenData(designSystemId: string, designSystemVersion: DesignSystemVersion): Promise<Array<TokenRemoteModel>> {
    // Download token data from the design system endpoint. This downloads tokens of all types
    const endpoint = 'tokens'
    let result: Array<TokenRemoteModel> = (await this.bridge.getDSMDataFromEndpoint(designSystemId, designSystemVersion.id, endpoint)).tokens
    return result
  }

  private async resolveTokenData(
    data: Array<TokenRemoteModel>,
    version: DesignSystemVersion
  ): Promise<Array<Token>> {
    let resolver = new TokenResolver(version)
    let result = resolver.resolveTokenData(data)
    return result
  }

  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Token Groups

  /** Prepare design system data for use for the entire design system, downloading and resolving all groups */
  async updateTokenGroupData(designSystemId: string, designSystemVersion: DesignSystemVersion) {
    // Download core design system token data
    this.tokenGroups = await this.getTokenGroups(designSystemId, designSystemVersion)
    if (this.bridge.cache) {
      this.tokenGroupsSynced = true
    }
  }

  private async getTokenGroups(designSystemId: string, designSystemVersion: DesignSystemVersion): Promise<Array<TokenGroup>> {
    // Download the raw token data and resolve them
    let rawData = await this.getRawTokenGroupData(designSystemId, designSystemVersion)
    let resolvedGroups = await this.resolveTokenGroupData(rawData)
    return resolvedGroups
  }

  private async getRawTokenGroupData(designSystemId: string, designSystemVersion: DesignSystemVersion): Promise<Array<TokenGroupRemoteModel>> {
    // Download token group data from the design system endpoint
    const endpoint = 'token-groups'
    let result: Array<TokenGroupRemoteModel> = (await this.bridge.getDSMDataFromEndpoint(designSystemId, designSystemVersion.id, endpoint)).groups
    return result
  }

  private async resolveTokenGroupData(data: Array<TokenGroupRemoteModel>): Promise<Array<TokenGroup>> {
    let resolver = new TokenGroupResolver()
    let result = await resolver.resolveGroupData(data)
    return result
  }

  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Assets & Components

  /** Prepare design system data for use for the entire design system, downloading and resolving all components - and indirectly, assets as well */
  async updateComponentAndAssetData(designSystemId: string, designSystemVersion: DesignSystemVersion) {
    // Download core design system component data without frame definitions
    let result = await this.getComponentsAndAssets(designSystemId, designSystemVersion)
    this.components = result.components
    this.assets = result.assets
    if (this.bridge.cache) {
      this.componentAssetSynced = true
    }
  }

  private async getComponentsAndAssets(designSystemId: string, designSystemVersion: DesignSystemVersion): Promise<{ 
    components: Array<Component>, 
    assets: Array<Asset> 
  }> {
    // Download the raw token data and resolve them
    let rawData = await this.getRawComponentAndAssetData(designSystemId, designSystemVersion)
    let resolvedComponentsAndAssets = await this.resolveComponentAndAssetData(rawData, designSystemVersion)
    return resolvedComponentsAndAssets
  }

  private async getRawComponentAndAssetData(designSystemId: string, designSystemVersion: DesignSystemVersion): Promise<Array<ComponentRemoteModel>> {
    // Download token data from the design system endpoint. This downloads tokens of all types
    const endpoint = 'components'
    let result: Array<ComponentRemoteModel> = (await this.bridge.getDSMDataFromEndpoint(designSystemId, designSystemVersion.id, endpoint)).components
    return result
  }

  private async resolveComponentAndAssetData(
    data: Array<ComponentRemoteModel>,
    _version: DesignSystemVersion
  ): Promise<{ 
    components: Array<Component>, 
    assets: Array<Asset> 
  }> {
    // For now, transform all components into components
    let components: Array<Component> = []
    for (let component of data) {
      components.push(new Component(component))
    }

    // For duplicates
    let assetNames = new Map<string, number>()
    for (let item of data) {
      if (item.exportProperties.isAsset) {
        assetNames.set(item.meta.name.toLowerCase(), 0)
      }
    }

    // Transform only exportable components into assets
    let assets: Array<Asset> = []
    for (let asset of data) {
      let lowercasedName = asset.meta.name.toLowerCase()
      if (asset.exportProperties.isAsset) {
        assets.push(new Asset(asset, assetNames.get(lowercasedName)))
        // Increase number of duplicates
        assetNames.set(lowercasedName, assetNames.get(lowercasedName) + 1)
      }
    }

    return {
      components: components,
      assets: assets
    }
  }

  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Component & Assets Groups

  /** Prepare design system data for use for the entire design system, downloading and resolving all groups */
  async updateComponentAndAssetGroupData(designSystemId: string, designSystemVersion: DesignSystemVersion) {
    // Download core design system token data
    let result = await this.getComponentAndAssetGroups(designSystemId, designSystemVersion, this.components, this.assets)
    this.componentGroups = result.componentGroups
    this.assetGroups = result.assetGroups
    if (this.bridge.cache) {
      this.componentAssetGroupsSynced = true
    }
  }

  private async getComponentAndAssetGroups(designSystemId: string, designSystemVersion: DesignSystemVersion, components: Array<Component>, assets: Array<Asset>): Promise<{
    componentGroups: Array<ComponentGroup>,
    assetGroups: Array<AssetGroup>
  }> {
    // Download the raw token data and resolve them
    let rawData = await this.getRawComponentAndAssetGroupData(designSystemId, designSystemVersion)
    let resolvedComponentGroups = await this.resolveComponentGroupData(rawData, components)
    let resolvedAssetGroups = await this.resolveAssetGroupData(rawData, assets)
    return {
      componentGroups: resolvedComponentGroups,
      assetGroups: resolvedAssetGroups
    }
  }

  private async getRawComponentAndAssetGroupData(designSystemId: string, designSystemVersion: DesignSystemVersion): Promise<Array<ComponentGroupRemoteModel>> {
    // Download token group data from the design system endpoint
    const endpoint = 'component-groups'
    let result: Array<ComponentGroupRemoteModel> = (await this.bridge.getDSMDataFromEndpoint(designSystemId, designSystemVersion.id, endpoint)).groups
    return result
  }

  private async resolveComponentGroupData(data: Array<ComponentGroupRemoteModel>, components: Array<Component>): Promise<Array<ComponentGroup>> {
    let resolver = new ComponentGroupResolver(components)
    let result = await resolver.resolveGroupData(data)
    return result
  }

  private async resolveAssetGroupData(data: Array<ComponentGroupRemoteModel>, assets: Array<Asset>): Promise<Array<AssetGroup>> {
    let resolver = new AssetGroupResolver(assets)
    let result = await resolver.resolveGroupData(data)
    return result
  }

  // --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // MARK: - Documentation Items

  async updateDocumentationItemData(designSystemId: string, designSystemVersion: DesignSystemVersion, blocks: Array<ExporterCustomBlock>, configuration: DocumentationConfiguration) {
    // Download core design documentation item data
    this.documentationItems = await this.getDocumentationItems(designSystemId, designSystemVersion, blocks, configuration)
    if (this.bridge.cache) {
      this.documentationItemsSynced = true
    }
  }

  private async getDocumentationItems(designSystemId: string, designSystemVersion: DesignSystemVersion, blocks: Array<ExporterCustomBlock>, configuration: DocumentationConfiguration): Promise<Array<DocumentationItem>> {
    // Download the raw token data and resolve them
    let rawData = await this.getRawDocumentationItemData(designSystemId, designSystemVersion)
    let resolvedItems = await this.resolveDocumentationItemData(rawData.pageDetails, rawData.groupDetails, blocks, configuration)
    return resolvedItems
  }

  private async getRawDocumentationItemData(designSystemId: string, designSystemVersion: DesignSystemVersion): Promise<{
    pageDetails: Array<DocumentationPageModel>
    groupDetails: Array<DocumentationGroupModel>
  }> {
    // Request documentation content
    const endpointDetails = 'documentation/all'
    let detailResult: {
      groups: Array<DocumentationGroupModel>
      pages: Array<DocumentationPageModel>
    } = await this.bridge.getDSMDataFromEndpoint(designSystemId, designSystemVersion.id, endpointDetails)

    return {
      pageDetails: detailResult.pages,
      groupDetails: detailResult.groups
    }
  }

  private async resolveDocumentationItemData(
    pageDetails: Array<DocumentationPageModel>,
    groupDetails: Array<DocumentationGroupModel>,
    blocks: Array<ExporterCustomBlock>,
    configuration: DocumentationConfiguration
  ): Promise<Array<DocumentationItem>> {
    let resolver = new DocumentationItemResolver(blocks, configuration)
    let result = await resolver.resolveItemData(pageDetails, groupDetails)
    return result
  }
}
