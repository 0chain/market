import axios from 'axios'
import jsClientSdk from '@zerochain/0chain'
import switchNetworkConfig from './switchNetworkConfig'
import LocalStorageManager from './localStorageManager'
import bls from 'bls-wasm'

declare global {
  interface Window {
    bls: bls
  }
}

class RestApiManager {
  private initSuccessful: boolean
  private responseDataJSON: any
  // public jsClientSdkInstance: any
  async init(cb: any) {
    this.initSuccessful = false

    const errorObj = {
      message: 'Network error, please try again in a few moments'
    }

    try {
      const explorer = await this.getExplorerConfig()

      this.responseDataJSON = explorer

      await jsClientSdk.init(explorer, window.bls)

      this.initSuccessful = true
      cb && cb()
    } catch (e) {
      cb && cb(errorObj)
    }
  }

  setWalletConfig = (activeWallet) => {
    return jsClientSdk.setWallet(
      activeWallet.id,
      activeWallet.secretKey,
      activeWallet.public_key
    )
  }

  getExplorerConfig = async () => {
    let selectedNetwork
    const devnetDomain = encodeURIComponent('devnet-0chain.net')
    const testnetDomain = encodeURIComponent('testnet-0chain.net')
    const stdDomain = encodeURI('0chain.net')
    let domain = stdDomain

    const allowedHosts = [
      'oceanprotocol.com',
      'market.oceanprotocol.com',
      'localhost:8000'
    ]

    // if (!window.location.host.includes(stdDomain)) {
    if (!allowedHosts.includes(stdDomain)) {
      // TODO: Make it dynamic
      selectedNetwork = 'test'

      if (selectedNetwork.includes('.devnet')) {
        selectedNetwork = selectedNetwork.replace('.devnet', '')
        domain = devnetDomain
      } else if (selectedNetwork.includes('.testnet')) {
        selectedNetwork = selectedNetwork.replace('.testnet', '')
        domain = testnetDomain
      }
    } else {
      const isDevnetHost = allowedHosts.includes(devnetDomain)
      if (isDevnetHost) domain = devnetDomain
      const isTestnetHost = window.location.host.includes(testnetDomain)
      if (isTestnetHost) domain = testnetDomain

      selectedNetwork = window.location.host.replace(`.${domain}`, '')
      LocalStorageManager.setNetwork(selectedNetwork)
    }

    if (selectedNetwork === 'local') {
      const localChainUri = `${process.env.PUBLIC_URL}/explorer-local.json`
      return await this.getRequest(localChainUri)
    }

    const hostName = `https://${selectedNetwork}.${domain}`
    const minersSharders = await this.getRequest(`${hostName}/dns/network`)

    // const settingsUri = `${process.env.PUBLIC_URL}/explorer-settings.json`
    const settingsUri = `http://localhost:8000/explorer-settings.json`
    const explorerSettings = await this.getRequest(settingsUri)

    const miners = minersSharders.miners.map((url: any) => url + '/')
    const sharders = minersSharders.sharders.map((url: any) => url + '/')

    const config = {
      ...explorerSettings,
      miners,
      sharders
    }

    return switchNetworkConfig(config)
  }

  getRequest = async (hostName: any) => {
    return await fetch(hostName)
      .then((resp) => {
        if (!resp.ok) throw new Error('Error fetching explorer settings')

        return resp.json()
      })
      .then((data) => data)
  }

  getAllMiners = () => {
    return this.responseDataJSON.miners.map((url) => ({ id: url }))
  }

  createWalletAndDesiredAllocationMethod = async () => {
    return await jsClientSdk.createWalletAndDesiredAllocation()
  }

  registerClientMethod = async () => {
    return await jsClientSdk.registerClient()
  }

  executeFaucetSmartContractMethod = async (
    ae,
    methodName,
    input,
    transactionValue
  ) => {
    return await jsClientSdk.executeFaucetSmartContract(
      ae,
      methodName,
      input,
      transactionValue
    )
  }

  allocateStorageMethod = (
    ae,
    data,
    parity,
    size,
    tokens,
    preferredBlobber,
    writePrice,
    readPrice,
    challengeCompletionTime
  ) => {
    return jsClientSdk.allocateStorage(
      ae,
      data,
      parity,
      size,
      tokens,
      preferredBlobber,
      writePrice,
      readPrice,
      challengeCompletionTime
    )
  }

  uploadObject = (
    file,
    allocation,
    remotePath,
    encryptFile,
    shouldCommitMeta,
    option
  ) => {
    return jsClientSdk.uploadObject(
      file,
      allocation,
      remotePath,
      encryptFile,
      shouldCommitMeta,
      option
    )
  }

  restoreWalletMethod = (mnemonic) => {
    return jsClientSdk.restoreWallet(mnemonic)
  }

  getBalanceMethod = async (clientId) => {
    return await jsClientSdk.getBalance(clientId)
  }

  getZCNTestToken = async (ae) => {
    return await jsClientSdk.executeFaucetSmartContract(
      ae,
      'pour',
      {},
      Math.pow(10, 10)
    )
  }

  shareObjectMethod = async (
    allocationId,
    path,
    clientId,
    publicEncryptionKey,
    expiration
  ) => {
    return jsClientSdk.shareObject(
      allocationId,
      path,
      clientId,
      publicEncryptionKey,
      expiration
    )
  }

  restoreWallet = async (mnemonic) => {
    return await jsClientSdk.restoreWallet(mnemonic)
  }

  getClient = async (mnemonic) => {
    return await jsClientSdk.getClient(mnemonic)
  }

  listAllocations = async (clientId) => {
    return await jsClientSdk.listAllocations(clientId)
  }

  commitMetaTransaction = async (
    ae,
    crudType,
    // eslint-disable-next-line camelcase
    allocation_id,
    path,
    auth_ticket = undefined,
    lookup_hash = undefined,
    metadata = undefined
  ) => {
    return await jsClientSdk.commitMetaTransaction(
      ae,
      crudType,
      allocation_id,
      path,
      auth_ticket,
      lookup_hash,
      metadata
    )
  }

  getFileMetaDataFromPath = async (
    // eslint-disable-next-line camelcase
    allocation_id,
    path,
    // eslint-disable-next-line camelcase
    client_id,
    // eslint-disable-next-line camelcase
    private_key,
    // eslint-disable-next-line camelcase
    public_key
  ) => {
    return await jsClientSdk.getFileMetaDataFromPath(
      allocation_id,
      path,
      client_id,
      private_key,
      public_key
    )
  }
}

export default new RestApiManager()

export async function checkForZcnWallet(clientId: string): Promise<any> {
  const result = await axios({
    method: 'get',
    url: `https://test.0chain.net/miner02/v1/client/get?id=${clientId}`,
    responseType: 'stream'
  })
  if (!result || result.status !== 200 || !result.data) return
  return result.data
}

export async function getUUID(authTicket: string): Promise<any> {
  const result = await axios({
    method: 'post',
    url: `https://0nft.test.0chain.net/server/v1/api/token`,
    data: { auth_ticket: authTicket },
    responseType: 'stream'
  })
  if (!result || result.status !== 200 || !result.data) return
  return result.data
}

export async function listFiles(
  remotePath: string,
  uuid: string
): Promise<any> {
  const result = await axios({
    method: 'get',
    url: `https://0nft.test.0chain.net/server/v1/api/download`,
    params: { remote_path: remotePath, uuid: uuid },
    responseType: 'stream'
  })
  if (!result || result.status !== 200 || !result.data) return
  return result
}
