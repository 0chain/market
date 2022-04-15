import React, { ChangeEvent, ReactElement } from 'react'
import Button from '../../../atoms/Button'
import { FieldInputProps, useField } from 'formik'
import Loader from '../../../atoms/Loader'
import styles from './Input.module.css'
import InputGroup from '../../../atoms/Input/InputGroup'
import Input from '../../../atoms/Input'
import Label from '../../../atoms/Input/Label'

export default function ZeroChainInput({
  submitText,
  fileName,
  jsonFileName,
  handleFileUpload,
  handleButtonClick,
  handleFileUploadJson,
  handleButtonClickJson,
  isLoading,
  setEncrypted,
  isEncrypted,
  ...props
}: {
  submitText: string
  fileName: string
  jsonFileName: string
  handleFileUpload(e: React.SyntheticEvent): void
  handleButtonClick(e: React.SyntheticEvent): void
  handleFileUploadJson(e: React.SyntheticEvent): void
  handleButtonClickJson(e: React.SyntheticEvent): void
  isLoading: boolean
  setEncrypted(e: ChangeEvent<HTMLInputElement>): void
  isEncrypted: boolean
}): ReactElement {
  const [field, meta] = useField(props as FieldInputProps<any>)

  return (
    <>
      <InputGroup>
        <input
          type="text"
          className={styles.input}
          placeholder="Add File e.g like example.png"
          defaultValue={fileName}
        />
        <input
          className={styles.hiddenfileinput}
          {...props}
          value={undefined}
          type="file"
          onChange={(e: React.SyntheticEvent) => handleFileUpload(e)}
        />

        <Button
          style="primary"
          size="small"
          onClick={(e: React.SyntheticEvent) => {
            e.preventDefault()
            handleButtonClick(e)
          }}
          disabled={fileName === undefined || fileName === '' || isLoading}
        >
          {isLoading ? <Loader /> : submitText}
        </Button>
      </InputGroup>
      <Input
        name="encrypted"
        type="checkbox"
        options={['Upload File as Encrypted']}
        onChange={setEncrypted}
      />
      {isEncrypted && (
        <>
          <Label htmlFor={jsonFileName}>
            Upload Json for encrypted file to 0chain
          </Label>
          <InputGroup>
            <input
              type="text"
              className={styles.input}
              placeholder="Add Json File e.g like example.json"
              defaultValue={jsonFileName}
            />
            <input
              className={styles.hiddenfileinput}
              {...props}
              value={undefined}
              type="file"
              onChange={(e: React.SyntheticEvent) => handleFileUploadJson(e)}
            />

            <Button
              style="primary"
              size="small"
              onClick={(e: React.SyntheticEvent) => {
                e.preventDefault()
                handleButtonClickJson(e)
              }}
              disabled={
                jsonFileName === undefined || jsonFileName === '' || isLoading
              }
            >
              {isLoading ? <Loader /> : submitText}
            </Button>
          </InputGroup>
        </>
      )}
    </>
  )
}
