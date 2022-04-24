import React, { ReactElement, useCallback, useEffect, useState } from 'react'
import MetaItem from './MetaItem'
import styles from './MetaFull.module.css'
import Publisher from '../../atoms/Publisher'
import { useAsset } from '../../../providers/Asset'
import Loader from '../../atoms/Loader'
import Button from '../../atoms/Button'
import { File as FileMetadata, DDO, Logger } from '@oceanprotocol/lib'
import RestApiManager, { getUUID } from '../../../utils/restApiManager'
import LocalStorageManager from '../../../utils/localStorageManager'
import Modal from '../../atoms/Modal'
import { toast } from 'react-toastify'

export default function MetaFull(): ReactElement {
  const { ddo, metadata, isInPurgatory, type } = useAsset()
  const { algorithm } = ddo.findServiceByType('metadata').attributes.main
  const [isAuthTicketLoading, setIsAuthTicketLoading] = useState(false)
  const [authTicket, setAuthTicket] = useState<string>()
  const [openJsonModal, setJsonOpenModal] = useState(false)
  const [theUuid, setTheUuid] = useState('')

  function DockerImage() {
    const { image, tag } = algorithm.container
    return <span>{`${image}:${tag}`}</span>
  }

  async function getAuthTicket() {
    try {
      setIsAuthTicketLoading(true)
      const authTicket = await RestApiManager.shareObjectMethod(
        LocalStorageManager.getDefaultAllocation(),
        '/testingFile.jpg',
        '79dacae8b882f8a7e020fdf55403e9c6e711f3d59586433af2b18490f37cf191',
        'XTNjdLsxHO5+gU6WG9J8au7dvy406FZtQF3DResVx/E=',
        0
      )
      Logger.log('[0chain] getAuthTicket response', authTicket)
      await RestApiManager.commitMetaTransaction(
        JSON.parse(LocalStorageManager.getActiveWallet()),
        'Share',
        LocalStorageManager.getDefaultAllocation(),
        '/testingFile.jpg'
      )
      setAuthTicket(authTicket)
      setIsAuthTicketLoading(false)
      return authTicket
    } catch (error) {
      setIsAuthTicketLoading(false)
      toast.error('Could not get auth ticket')
      throw new Error(error.message)
    }
  }

  const toggleJsonModal = (e) => {
    e.preventDefault()
    openJsonModal ? setJsonOpenModal(false) : setJsonOpenModal(true)
  }

  const getUuId = useCallback(async () => {
    if (!authTicket) return
    try {
      const theUUID = await getUUID(authTicket)
      setTheUuid(theUUID)
      setJsonOpenModal(true)
      theUUID &&
        Logger.log(`[0chain] UUID for the auth ticket sent is: ${theUUID}`)
    } catch (error) {
      toast.error('Could not get UUID')
      throw new Error(error.message)
    }
  }, [authTicket])

  useEffect(() => {
    getUuId()
  }, [getUuId])

  return (
    <div className={styles.metaFull}>
      {!isInPurgatory && (
        <MetaItem title="Data Author" content={metadata?.main.author} />
      )}
      <MetaItem
        title="Owner"
        content={<Publisher account={ddo?.publicKey[0].owner} />}
      />
      {type === 'algorithm' && algorithm && (
        <MetaItem title="Docker Image" content={<DockerImage />} />
      )}
      <MetaItem title="DID" content={<code>{ddo?.id}</code>} />

      <MetaItem
        title="Auth Ticket from 0chain"
        content={
          <Button
            style="primary"
            size="small"
            // disabled={isDisabled}
            onClick={(e: React.SyntheticEvent) => {
              e.preventDefault()
              getAuthTicket()
            }}
          >
            {isAuthTicketLoading ? <Loader /> : 'Generate Auth Ticket'}
          </Button>
        }
      />

      <Modal
        title="0chain encrypted file"
        onToggleModal={toggleJsonModal}
        isOpen={openJsonModal}
      >
        <div>
          <p>
            This is the auth_ticket shared with your wallet to generate the UUID
            for the file from 0chain:
          </p>
          <pre>{authTicket}</pre>
          <p>
            This is uuid used to download to build the download link for your
            file:
          </p>
          <pre>{theUuid}</pre>
          <div className={styles.modalContent}>
            <Button
              style="primary"
              size="small"
              href={`https://0nft.demo.0chain.net/server/v1/api/download?remote_path=&uuid=${theUuid}`}
              download
              target="_blank"
            >
              Download Encrypted File
            </Button>
            <Button style="ghost" size="small" onClick={toggleJsonModal}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
