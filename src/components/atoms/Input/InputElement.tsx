import React, { ReactElement } from 'react'
import slugify from '@sindresorhus/slugify'
import styles from './InputElement.module.css'
import { InputProps } from '.'
import FilesInput from '../../molecules/FormFields/FilesInput'
import ZeroChainFilesInput from '../../molecules/FormFields/ZeroChainFilesInput'
import CustomProvider from '../../molecules/FormFields/CustomProvider'
import Terms from '../../molecules/FormFields/Terms'
import BoxSelection, {
  BoxSelectionOption
} from '../../molecules/FormFields/BoxSelection'
import Datatoken from '../../molecules/FormFields/Datatoken'
import classNames from 'classnames/bind'
import AssetSelection, {
  AssetSelectionAsset
} from '../../molecules/FormFields/AssetSelection'
import Credentials from '../../molecules/FormFields/Credential'

const cx = classNames.bind(styles)

const DefaultInput = ({
  size,
  className,
  prefix,
  postfix,
  additionalComponent,
  ...props
}: InputProps) => (
  <input
    className={cx({ input: true, [size]: size, [className]: className })}
    id={props.name}
    {...props}
  />
)

export default function InputElement({
  type,
  options,
  sortOptions,
  name,
  prefix,
  postfix,
  size,
  field,
  label,
  multiple,
  disabled,
  help,
  form,
  additionalComponent,
  disclaimer,
  disclaimerValues,
  ...props
}: InputProps): ReactElement {
  const styleClasses = cx({ select: true, [size]: size })
  switch (type) {
    case 'select': {
      const sortedOptions =
        !sortOptions && sortOptions === false
          ? options
          : options.sort((a: string, b: string) => a.localeCompare(b))
      return (
        <select
          id={name}
          className={styleClasses}
          {...props}
          disabled={disabled}
          multiple={multiple}
        >
          {field !== undefined && field.value === '' && (
            <option value="">---</option>
          )}
          {sortedOptions &&
            sortedOptions.map((option: string, index: number) => (
              <option key={index} value={option}>
                {option} {postfix}
              </option>
            ))}
        </select>
      )
    }
    case 'textarea':
      return (
        <textarea
          name={name}
          id={name}
          className={styles.textarea}
          {...props}
        />
      )
    case 'radio':
    case 'checkbox':
      return (
        <div className={styles.radioGroup}>
          {options &&
            options.map((option: string, index: number) => (
              <div className={styles.radioWrap} key={index}>
                <input
                  className={styles[type]}
                  id={slugify(option)}
                  type={type}
                  name={name}
                  defaultChecked={props.defaultChecked}
                  {...props}
                />
                <label
                  className={cx({ [styles.radioLabel]: true, [size]: size })}
                  htmlFor={slugify(option)}
                >
                  {option}
                </label>
              </div>
            ))}
        </div>
      )
    case 'assetSelection':
      return (
        <AssetSelection
          assets={options as unknown as AssetSelectionAsset[]}
          {...field}
          {...props}
        />
      )
    case 'assetSelectionMultiple':
      return (
        <AssetSelection
          assets={options as unknown as AssetSelectionAsset[]}
          multiple
          disabled={disabled}
          {...field}
          {...props}
        />
      )
    case 'files':
      return <FilesInput name={name} {...field} {...props} />
    case 'zerochainfiles':
      return <ZeroChainFilesInput name={name} {...field} {...props} />
    case 'providerUri':
      return <CustomProvider name={name} {...field} {...props} />
    case 'datatoken':
      return <Datatoken name={name} {...field} {...props} />
    case 'terms':
      return <Terms name={name} options={options} {...field} {...props} />
    case 'boxSelection':
      return (
        <BoxSelection
          name={name}
          options={options as unknown as BoxSelectionOption[]}
          {...field}
          {...props}
        />
      )
    case 'credentials':
      return <Credentials name={name} {...field} {...props} />
    default:
      return prefix || postfix ? (
        <div className={`${prefix ? styles.prefixGroup : styles.postfixGroup}`}>
          {prefix && (
            <div className={cx({ prefix: true, [size]: size })}>{prefix}</div>
          )}
          <DefaultInput
            name={name}
            type={type || 'text'}
            size={size}
            disabled={disabled}
            {...props}
          />
          {postfix && (
            <div className={cx({ postfix: true, [size]: size })}>{postfix}</div>
          )}
        </div>
      ) : (
        <DefaultInput
          name={name}
          type={type || 'text'}
          size={size}
          disabled={disabled}
          {...props}
        />
      )
  }
}
