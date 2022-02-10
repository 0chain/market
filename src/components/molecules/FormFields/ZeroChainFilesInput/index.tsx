import React, { ReactElement, useCallback, useEffect, useState } from 'react'
import { useField } from 'formik'
import { toast } from 'react-toastify'
import CustomInputZeroChain from '../ZeroChainInput/Input'
import { InputProps } from '../../../atoms/Input'
import RestApiManager, {
  getUUID,
  listFiles
} from '../../../../utils/restApiManager'
import LocalStorageManager from '../../../../utils/localStorageManager'
import { parseWalletInfo } from '../../../../utils/'
import { Logger } from '@oceanprotocol/lib'
import { useZeroChainUuid } from '../../../pages/Publish'
import Modal from '../../../atoms/Modal'
import Button from '../../../atoms/Button'
import InputElement from '../../../atoms/Input/InputElement'
import Loader from '../../../atoms/Loader'
import styles from './Info.module.css'

export default function ZeroChainFilesInput(props: InputProps): ReactElement {
  const [field, meta, helpers] = useField(props.name)
  const [isLoading, setIsLoading] = useState(false)
  const [openModal, setOpenModal] = useState(false)
  const [openMnemonic, setOpenMnemonic] = useState(false)
  const [mnemonic, setMnemonic] = useState('')
  const [files, setFiles] = useState([])
  const [fileName, setFileName] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [authTicket, setAuthTicket] = useState<string>()
  const [activeZeroChainWallet, setActivZeroChainWallet] = useState({
    id: '',
    secretKey: '',
    public_key: ''
  })
  const [activeZeroChainWalletParsed, setActivZeroChainWalletParsed] = useState(
    {}
  )
  const [zcnBalance, setZcnBalance] = useState(0)
  const [allocationId, setAllocationId] = useState(
    LocalStorageManager.getDefaultAllocation()
  )
  const { theUuid, setTheUuId } = useZeroChainUuid()

  async function loadWalletInfo() {
    debugger
    try {
      setIsLoading(true)
      return await RestApiManager.createWalletAndDesiredAllocationMethod().then(
        (response) => {
          console.log(
            '[0chain] create wallet and allocation response',
            response
          )
          const allocId = response.allocateStorage?.hash
          LocalStorageManager.saveDefaultAllocation(allocId)
          setAllocationId(allocId)
          setActivZeroChainWallet(response.activeWallet)
          response.activeWallet.timeStamp = Date.now()
          // RestApiManager.setWalletConfig(response.activeWallet)
          const activeWll = parseWalletInfo(response.activeWallet)
          LocalStorageManager.setParsedWallet(JSON.stringify(activeWll))
          setActivZeroChainWalletParsed(activeWll)
          toast.success(
            <div>
              This is your recover mnemonic, save it to a secure place in order
              to access your 0chain wallet:{' '}
              <pre>{response.activeWallet.mnemonic}</pre>{' '}
            </div>,
            {
              autoClose: false,
              hideProgressBar: false,
              closeOnClick: false
            }
          )
          setIsLoading(false)
          return parseWalletInfo(response.activeWallet)
        }
      )
    } catch (error) {
      toast.error('Could not create wallet and allocation')
      setIsLoading(false)
      throw new Error(error.message)
    }
  }

  async function getAuthTicket() {
    try {
      setIsLoading(true)
      const authTicket = await RestApiManager.shareObjectMethod(
        LocalStorageManager.getDefaultAllocation(),
        '/' + fileName,
        '',
        '',
        0
      )
      Logger.log('[0chain] getAuthTicket response', authTicket)
      await RestApiManager.commitMetaTransaction(
        JSON.parse(LocalStorageManager.getActiveWallet()),
        'Share',
        LocalStorageManager.getDefaultAllocation(),
        '/' + fileName
      )
      setAuthTicket(authTicket)
      setIsLoading(false)
      return authTicket
    } catch (error) {
      setIsLoading(false)
      toast.error('Could not get auth ticket')
      throw new Error(error.message)
    }
  }

  const onFileSelected = (event) => {
    setUploadProgress(0)

    const { files } = event.target
    setFiles([])
    setFiles((prevState) => [...prevState, ...files])
    setFileName(event.target?.files && event.target.files[0]?.name)
    helpers.setTouched(false)
    setIsLoading(true)
  }

  async function uploadFile() {
    try {
      const option = {
        onUploadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent
          const per = Math.floor((loaded * 100) / total)
          setUploadProgress(per)
        }
      }
      setUploadProgress(0)
      const path = LocalStorageManager.getCurrentPath() || '/'

      /**
       * upload multiple files
       */
      Logger.log('[0chain] files to be uploaded', files)
      if (files && files.length > 0) {
        const selectedFiles = [...files]

        if (Object.keys(LocalStorageManager.getActiveWallet()).length > 0) {
          await RestApiManager.getBalanceMethod(activeZeroChainWallet.id)
            .then((response) => {
              const zcnBalance = response.balance
              // TODO: if zcnBalance === 0
              setZcnBalance(zcnBalance)
              Logger.log('[0chain] ZCN Balance: ', response)
              selectedFiles.map(async (fileObj) => {
                await RestApiManager.uploadObject(
                  fileObj,
                  allocationId,
                  path && path !== ''
                    ? `/${path}/${fileObj.name}`
                    : `/${fileObj.name}`,
                  false,
                  false,
                  option
                )
                  .then((response) => {
                    console.log('[0chain] upload function response', response)
                    toast.success('File uploaded to 0chain')
                    getAuthTicket().then((response) => {
                      console.log(
                        '[0chain] auth_ticket for shared file',
                        response
                      )
                    })
                  })
                  .catch((err) => {
                    if (
                      err.message ===
                      'Upload failed: Consensus_rate:NaN, expected:10.000000'
                    ) {
                      toast.error(
                        `Could not upload file with the same name to 0chain! Please choose another file or rename it.`
                      )
                    }
                    console.error('Upload function error', err)
                  })
              })
              setIsLoading(false)
            })
            .catch((err) => {
              Logger.error('[0chain] Error ZCN Balance: ', err.message)
              setIsLoading(false)
            })
        } else {
          toast.error(
            'Could not upload file! Please create or connect a wallet first'
          )
        }
        setIsLoading(false)
      }
    } catch (error) {
      toast.error('Could not upload file')
      console.error(error.message)
      setIsLoading(false)
    }
  }

  const toggleModal = (e) => {
    e.preventDefault()
    openModal ? setOpenModal(false) : setOpenModal(true)
    setOpenMnemonic(false)
  }

  const toggleMnemonic = (e) => {
    e.preventDefault()
    openMnemonic ? setOpenMnemonic(false) : setOpenMnemonic(true)
  }

  const handleChangeMnemonic = (event) => {
    setMnemonic(event.target.value)
  }

  async function recoverWallet() {
    try {
      setIsLoading(true)
      return await RestApiManager.restoreWallet(mnemonic).then((response) => {
        setActivZeroChainWallet(response)
        response.timeStamp = Date.now()
        const activeWll = parseWalletInfo(response)
        LocalStorageManager.setParsedWallet(JSON.stringify(activeWll))
        setActivZeroChainWalletParsed(activeWll)
        RestApiManager.listAllocations(response.id)
          .then((res) => {
            LocalStorageManager.saveDefaultAllocation(res[0].id)
            setAllocationId(res[0].id)
          })
          .catch((err) => {
            console.error('Listing Allocations for this wallet error:', err)
          })
        setIsLoading(false)
      })
    } catch (error) {
      setIsLoading(false)
      Logger.log('Mnemonic error', error)
      toast.error('Could not recover wallet from this mnemonic')
      throw new Error(error.message)
    }
  }

  const getUuId = useCallback(async () => {
    if (!authTicket) return
    try {
      const theUUID = await getUUID(authTicket)
      setTheUuId(theUUID)
      theUUID &&
        Logger.log(`[0chain] UUID for the auth ticket sent is: ${theUUID}`)
    } catch (error) {
      toast.error('Could not get UUID')
      throw new Error(error.message)
    }
  }, [authTicket])

  const getListOfFiles = useCallback(async () => {
    if (!theUuid) return
    try {
      const listOfFiles = await listFiles('', theUuid)
      listOfFiles && Logger.log('[0chain] list of files', listOfFiles)
    } catch (error) {
      Logger.error('[0chain] Error on listing files: ', error.message)
      toast.error('Could not get List of files')
      throw new Error(error.message)
    }
  }, [theUuid])

  useEffect(() => {
    if (activeZeroChainWallet && activeZeroChainWallet.secretKey) {
      RestApiManager.setWalletConfig(activeZeroChainWallet)
    }
  }, [activeZeroChainWallet])

  useEffect(() => {
    uploadFile()
  }, [files])

  useEffect(() => {
    getUuId()
  }, [getUuId])

  return (
    <>
      {(Object.keys(activeZeroChainWalletParsed).length === 0 &&
        activeZeroChainWalletParsed.constructor === Object &&
        allocationId === null) ||
      allocationId === '' ? (
        <>
          <Button style="primary" size="small" onClick={toggleModal}>
            Connect to 0chain wallet
          </Button>
          <Modal
            title="ZCN Wallet"
            onToggleModal={toggleModal}
            isOpen={openModal}
          >
            <div>
              <p>Create / Recover your Existing Wallet</p>
              {openMnemonic ? (
                <div>
                  <div className={styles.mnemonic}>
                    <label title="Enter Secret Phrase">
                      Enter Secret Phrase
                    </label>
                    <InputElement
                      name="mnemonic"
                      type="textarea"
                      rows={7}
                      value={mnemonic}
                      onChange={handleChangeMnemonic}
                    />
                  </div>
                  <div className={styles.modalContent}>
                    <Button
                      style="primary"
                      size="small"
                      disabled={!mnemonic}
                      onClick={recoverWallet}
                    >
                      {isLoading ? <Loader /> : 'Send'}
                    </Button>
                    <Button style="ghost" size="small" onClick={toggleMnemonic}>
                      Back to Create
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={styles.modalContent}>
                  <Button style="primary" size="small" onClick={loadWalletInfo}>
                    {isLoading ? <Loader /> : 'Create Wallet and Allocation'}
                  </Button>
                  <Button style="ghost" size="small" onClick={toggleMnemonic}>
                    Recover Wallet from Mnemonic
                  </Button>
                </div>
              )}
            </div>
          </Modal>
        </>
      ) : (
        <CustomInputZeroChain
          submitText="Add File"
          fileName={fileName}
          {...props}
          {...field}
          isLoading={isLoading}
          handleButtonClick={onFileSelected}
        />
      )}
    </>
  )
}
