class LocalStorageManager {
  clear = () => {
    const network = this.getNetwork()
    localStorage.clear()
    this.setNetwork(network)
  }

  getNetwork = () => {
    return localStorage.getItem('NETWORK') || 'dev'
  }

  setNetwork = (path: any) => {
    return localStorage.setItem('NETWORK', path)
  }

  getCurrentPath = () => {
    return localStorage.getItem('CURRENT_PATH')
  }

  saveDefaultAllocation = (id: string) => {
    return localStorage.setItem('DEFAULT_ALLOCATION_ID', id)
  }

  getDefaultAllocation = () => {
    return localStorage.getItem('DEFAULT_ALLOCATION_ID')
  }

  setParsedWallet = (wallet: any) => {
    return localStorage.setItem('PARSED_WALLET', wallet)
  }

  getParsedWallet = () => {
    return localStorage.getItem('PARSED_WALLET')
  }
}

export default new LocalStorageManager()
