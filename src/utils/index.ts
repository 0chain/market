import axios, { AxiosResponse } from 'axios'
import { format } from 'date-fns'

export function updateQueryStringParameter(
  uri: string,
  key: string,
  newValue: string
): string {
  const regex = new RegExp('([?&])' + key + '=.*?(&|$)', 'i')
  const separator = uri.indexOf('?') !== -1 ? '&' : '?'

  if (uri.match(regex)) {
    return uri.replace(regex, '$1' + key + '=' + newValue + '$2')
  } else {
    return uri + separator + key + '=' + newValue
  }
}

export function prettySize(
  bytes: number,
  separator = ' ',
  postFix = ''
): string {
  if (bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      sizes.length - 1
    )
    return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)}${separator}${
      sizes[i]
    }${postFix}`
  }
  return 'n/a'
}

// Boolean value that will be true if we are inside a browser, false otherwise
export const isBrowser = typeof window !== 'undefined'

export function toStringNoMS(date: Date): string {
  return date.toISOString().replace(/\.[0-9]{3}Z/, 'Z')
}

export async function fetchData(url: string): Promise<AxiosResponse['data']> {
  try {
    const response = await axios(url)

    if (response.status !== 200) {
      return console.error('Non-200 response: ' + response.status)
    }

    return response.data
  } catch (error) {
    console.error('Error parsing json: ' + error.message)
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function removeItemFromArray<T>(arr: Array<T>, value: T): Array<T> {
  const index = arr.indexOf(value)
  if (index > -1) {
    arr.splice(index, 1)
  }
  return arr
}

export function parseWalletInfo(ae: {
  id: string
  // eslint-disable-next-line camelcase
  public_key: string
  secretKey: string
  mnemonic: string
  timeStamp: any
}): {
  // eslint-disable-next-line camelcase
  client_id: string
  // eslint-disable-next-line camelcase
  client_key: string
  // eslint-disable-next-line camelcase
  keys: [{ public_key: string; private_key: string }]
  mnemonics: string
  version: string
  // eslint-disable-next-line camelcase
  date_created: string
} {
  return {
    client_id: ae.id,
    client_key: ae.public_key,
    keys: [
      {
        public_key: ae.public_key,
        private_key: ae.secretKey
      }
    ],
    mnemonics: ae.mnemonic,
    version: '1.0',
    date_created: format(ae.timeStamp, `yyyy-MM-dd'T'HH:mm:ssz`)
  }
}
