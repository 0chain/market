import LocalStorageManager from './localStorageManager'

export default function switchNetworkConfig(json: any) {
  const { networkPrefix } = json
  const allowedHosts = [
    'oceanprotocol.com',
    'market.oceanprotocol.com',
    'localhost:8000'
  ]
  if (!networkPrefix)
    throw new Error('networkPrefix is not defined at explorer-settings.json')

  const jsonStr = JSON.stringify(json)
  let network = LocalStorageManager.getNetwork()

  const isDevNetwork = network.includes('.devnet')
  if (isDevNetwork) {
    network = network.replace('.devnet', '')
  }

  const zeroChainDomain = encodeURI('0chain.net')
  const isDevDomain = allowedHosts.includes(encodeURI('devnet-0chain.net'))

  let newDomain = zeroChainDomain
  if (isDevNetwork || isDevDomain) {
    newDomain = encodeURI('devnet-0chain.net')
  }

  const newJsonStr = jsonStr.replace(
    RegExp(String.raw`${networkPrefix}.${zeroChainDomain}`, 'g'),
    `${network}.${newDomain}`
  )

  return JSON.parse(newJsonStr)
}
