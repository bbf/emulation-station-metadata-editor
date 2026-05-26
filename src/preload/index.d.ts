// Copyright (c) 2026 Bruno Figueiredo
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { ElectronAPI } from '../renderer/src/types'

declare global {
  interface Window {
    api: ElectronAPI
  }
}
