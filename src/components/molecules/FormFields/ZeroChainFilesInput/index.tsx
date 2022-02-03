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

export default function ZeroChainFilesInput(props: InputProps): ReactElement {
  const [field, meta, helpers] = useField(props.name)
  const [isLoading, setIsLoading] = useState(false)
  const [files, setFiles] = useState([])
  const [fileName, setFileName] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [authTicket, setAuthTicket] = useState<string>()
  const [activeZeroChainWallet, setActivZeroChainWallet] = useState({ id: '' })
  const [activeZeroChainWalletParsed, setActivZeroChainWalletParsed] = useState(
    {}
  )
  const [zcnBalance, setZcnBalance] = useState(0)
  const [allocationId, setAllocationId] = useState(
    LocalStorageManager.getDefaultAllocation()
  )
  const { theUuid, setTheUuId } = useZeroChainUuid()

  async function loadWalletInfo() {
    try {
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
      return await RestApiManager.shareObjectMethod(
        LocalStorageManager.getDefaultAllocation(),
        '/' + fileName,
        '',
        '',
        '0',
        LocalStorageManager.getParsedWallet()
      ).then((response) => {
        Logger.log('[0chain] getAuthTicket response', response.data.auth_ticket)
        // const authTicket = JSON.parse(atob(response.data.auth_ticket))
        const authTicket = response.data.auth_ticket
        setAuthTicket(authTicket)
        return authTicket
      })
    } catch (error) {
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

        if (Object.keys(activeZeroChainWalletParsed).length > 0) {
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
                  activeZeroChainWalletParsed,
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
                      err.response.data.error ===
                      'upload_file_failed: Upload failed: Consensus_rate:NaN, expected:10.000000'
                    ) {
                      toast.error(
                        `Could not upload file with the same name to 0chain! Please choose another file`
                      )
                    }
                    console.error(
                      'Upload function error',
                      err.response.data.error
                    )
                  })
              })
              setIsLoading(false)
            })
            .catch((err) => {
              Logger.error('[0chain] Error ZCN Balance: ', err.message)
              setIsLoading(false)
            })
        } else {
          loadWalletInfo().then((response) => {
            Logger.log('[0chain] parsed wallet', response)
            setTimeout(() => {
              selectedFiles.map(async (fileObj) => {
                await RestApiManager.uploadObject(
                  fileObj,
                  LocalStorageManager.getDefaultAllocation(),
                  path && path !== ''
                    ? `/${path}/${fileObj.name}`
                    : `/${fileObj.name}`,
                  false,
                  response,
                  option
                )
                  .then((response) => {
                    Logger.log('[0chain] upload function response', response)
                    toast.success('File uploaded to 0chain')
                    getAuthTicket().then((response) => {
                      console.log(
                        '[0chain] auth_ticket for shared file',
                        response
                      )
                    })
                  })
                  .catch((error) => {
                    console.log(
                      '[0chain] error in uploading and getting the auth ticket',
                      error.response.data.error
                    )
                    toast.error(
                      `Could not upload File: ${error.response.data.error}`
                    )
                  })
              })
              setIsLoading(false)
            }, 5000)
          })
        }
      }
    } catch (error) {
      toast.error('Could not upload file')
      console.error(error.message)
      setIsLoading(false)
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
    uploadFile()
  }, [files])

  useEffect(() => {
    getUuId()
  }, [getUuId])

  // useEffect(() => {
  //   getListOfFiles()
  // }, [getListOfFiles])

  return (
    <>
      <React.StrictMode>
        <CustomInputZeroChain
          submitText="Add File"
          fileName={fileName}
          {...props}
          {...field}
          isLoading={isLoading}
          handleButtonClick={onFileSelected}
        />
      </React.StrictMode>
    </>
  )
}
