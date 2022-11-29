
import { Descendant } from 'slate'
import { ReactEditor } from 'slate-react'

type HookParams = {
    server: boolean;
}

export type useSlateDataHookType = (params: HookParams) => [ReactEditor, (params: Descendant[]) => void]

export type keyboardTitleType = 'firstTitle' | 'secondTitle' | 'thirdTitle'
export type keyboardMethodsType = 'bold' | 'italic' | 'underline' | 'code' | 'image' | keyboardTitleType
export type keyboardMethodsTypeObject = {
  [K in keyboardMethodsType]: K
}

export const enum keyboardMethodsTypeEnum {
  bold = 'bold',
  italic = 'italic',
  underline = 'underline',
  code = 'code',
  image = 'image',
  firstTitle = 'firstTitle',
  secondTitle = 'secondTitle',
  thirdTitle = 'thirdTitle'
}

export type keyboardMethodsListType = {
  type: keyboardMethodsTypeEnum,
  label: string;
  element?: boolean;
}