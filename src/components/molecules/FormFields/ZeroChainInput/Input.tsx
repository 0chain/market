import React, { ReactElement } from 'react'
import Button from '../../../atoms/Button'
import { FieldInputProps, useField } from 'formik'
import Loader from '../../../atoms/Loader'
import styles from './Input.module.css'
import InputGroup from '../../../atoms/Input/InputGroup'

export default function ZeroChainInput({
  submitText,
  fileName,
  handleButtonClick,
  isLoading,
  ...props
}: {
  submitText: string
  fileName: string
  handleButtonClick(e: React.SyntheticEvent): void
  isLoading: boolean
}): ReactElement {
  const [field, meta] = useField(props as FieldInputProps<any>)

  return (
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
        onChange={(e: React.SyntheticEvent) => handleButtonClick(e)}
      />

      <Button
        style="primary"
        size="small"
        onClick={(e: React.SyntheticEvent) => e.preventDefault()}
        disabled={!field.value}
      >
        {isLoading ? <Loader /> : submitText}
      </Button>
    </InputGroup>
  )
}
