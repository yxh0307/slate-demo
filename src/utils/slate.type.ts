
import { Descendant } from 'slate'
import { ReactEditor } from 'slate-react'

type HookParams = {
    server: boolean;
}

export type useSlateDataHookType = (params: HookParams) => [ReactEditor, (params: Descendant[]) => void]

export type keyboardMethodsType = 'bold' | 'italic' | 'underline' | 'code' | 'image'
export type keyboardMethodsTypeObject = {
  [K in keyboardMethodsType]: K
}

export const enum keyboardMethodsTypeEnum {
  bold = 'bold',
  italic = 'italic',
  underline = 'underline',
  code = 'code',
  image = 'image'
}

export type keyboardMethodsListType = {
  type: keyboardMethodsTypeEnum,
  label: string;
  element?: boolean;
}