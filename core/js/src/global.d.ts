// Global type declarations for window properties

interface Window {
  autosize?: (element: HTMLElement | HTMLTextAreaElement) => void
  countUp?: {
    CountUp: new (target: HTMLElement, endVal: number, options?: any) => {
      error: boolean
      start: () => void
    }
  }
  IMask?: new (element: HTMLElement, options: { mask: string; lazy?: boolean }) => any
  Sortable?: new (element: HTMLElement, options?: any) => any
  Calendar?: new (selector: string | HTMLElement, options?: any) => {
    init: () => void
    show: () => void
    hide: () => void
    destroy: () => void
    set: (options: any) => void
    context?: {
      selected?: {
        dates: string[]
      }
      mainElement?: HTMLElement
    }
  }
}

