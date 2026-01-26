// Datepicker component using vanilla-calendar-pro

type DatepickerTheme = 'light' | 'dark' | 'auto' | null
type SelectionMode = 'single' | 'multiple' | 'multiple-ranged'
type Placement = 'left' | 'center' | 'right' | 'auto'

interface DatepickerOptions {
  datepickerTheme?: DatepickerTheme
  dateMin?: string | number | Date | null
  dateMax?: string | number | Date | null
  dateFormat?: Intl.DateTimeFormatOptions | ((date: Date, locale?: string) => string) | null
  displayElement?: Element | string | boolean | null
  displayMonthsCount?: number
  firstWeekday?: number
  inline?: boolean
  locale?: string
  positionElement?: Element | string | null
  selectedDates?: string[]
  selectionMode?: SelectionMode
  placement?: Placement
  vcpOptions?: Record<string, unknown>
}

class Datepicker {
  private element: HTMLElement
  private options: DatepickerOptions
  private calendar: InstanceType<typeof window.Calendar> | null = null
  private isShown: boolean = false
  private isInline: boolean = false
  private isInput: boolean = false
  private boundInput: HTMLInputElement | null = null
  private displayElement: HTMLElement | null = null
  private positionElement: HTMLElement
  private themeObserver: MutationObserver | null = null

  constructor(element: HTMLElement, options: DatepickerOptions = {}) {
    this.element = element
    this.options = options
    this.positionElement = this.element

    this.initCalendar()
  }

  private initCalendar(): void {
    if (!window.Calendar) {
      return
    }

    this.isInput = this.element.tagName === 'INPUT'
    this.isInline = this.options.inline ?? this.element.getAttribute('data-bs-inline') === 'true'

    if (this.isInline && !this.isInput) {
      const hiddenInput = this.element.querySelector('input[type="hidden"], input[name]') as HTMLInputElement | null
      this.boundInput = hiddenInput
    }

    this.positionElement = this.resolvePositionElement()
    this.displayElement = this.resolveDisplayElement()

    // Ensure element has an ID for vanilla-calendar-pro
    if (!this.element.id) {
      this.element.id = `datepicker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    const calendarOptions = this.buildCalendarOptions()

    // vanilla-calendar-pro uses selector string (e.g., '#element-id')
    const calendarSelector = `#${this.element.id}`

    this.calendar = new window.Calendar(calendarSelector, calendarOptions)
    this.calendar.init()

    this.setupThemeObserver()

    if (this.isInput && (this.element as HTMLInputElement).value) {
      this.parseInputValue()
    }

    this.updateDisplayWithSelectedDates()
  }

  private resolvePositionElement(): HTMLElement {
    let { positionElement } = this.options

    if (typeof positionElement === 'string') {
      const found = document.querySelector(positionElement) as HTMLElement | null
      if (found) {
        return found
      }
    } else if (positionElement instanceof Element) {
      return positionElement as HTMLElement
    }

    if (!positionElement && this.isInput && !this.isInline) {
      const parent = this.element.closest('.form-adorn')
      if (parent) {
        return parent as HTMLElement
      }
    }

    return this.element
  }

  private resolveDisplayElement(): HTMLElement | null {
    const { displayElement } = this.options

    if (typeof displayElement === 'string') {
      return document.querySelector(displayElement) as HTMLElement | null
    }

    if (displayElement instanceof Element) {
      return displayElement as HTMLElement
    }

    if (displayElement === true || (displayElement === null && !this.isInput && !this.isInline)) {
      const displayChild = this.element.querySelector('[data-bs-datepicker-display]')
      return (displayChild || this.element) as HTMLElement
    }

    if (displayElement === false || displayElement === null) {
      return null
    }

    return null
  }

  private getThemeAncestor(): HTMLElement | null {
    return this.element.closest('[data-bs-theme]') as HTMLElement | null
  }

  private getEffectiveTheme(): DatepickerTheme {
    const { datepickerTheme } = this.options
    if (datepickerTheme) {
      return datepickerTheme
    }

    const dataTheme = this.element.getAttribute('data-bs-datepicker-theme')
    if (dataTheme) {
      return dataTheme as DatepickerTheme
    }

    const ancestor = this.getThemeAncestor()
    return (ancestor?.getAttribute('data-bs-theme') as DatepickerTheme) || null
  }

  private syncThemeAttribute(): void {
    // Theme is handled by vanilla-calendar-pro via selectedTheme option
    // This method is kept for compatibility but may not be needed
  }

  private setupThemeObserver(): void {
    // Theme observer is handled by vanilla-calendar-pro
    // This method is kept for compatibility but may not be needed
  }

  private buildCalendarOptions(): Record<string, unknown> {
    const theme = this.getEffectiveTheme()
    const vcpTheme = !theme || theme === 'auto' ? 'system' : theme

    const displayMonthsCount = this.options.displayMonthsCount ?? parseInt((this.element.getAttribute('data-bs-display-months-count') || '1'), 10)
    const firstWeekday = this.options.firstWeekday ?? parseInt((this.element.getAttribute('data-bs-first-weekday') || '1'), 10)
    const locale = this.options.locale ?? (this.element.getAttribute('data-bs-locale') || 'default')
    const selectionMode = (this.options.selectionMode ?? (this.element.getAttribute('data-bs-selection-mode') || 'single')) as SelectionMode
    const placement = (this.options.placement ?? (this.element.getAttribute('data-bs-placement') || 'left')) as Placement

    let selectedDates: string[] = []
    if (this.options.selectedDates) {
      selectedDates = this.options.selectedDates
    } else {
      const dataDates = this.element.getAttribute('data-bs-selected-dates')
      if (dataDates) {
        selectedDates = dataDates.split(',').map(d => d.trim())
      } else if (this.isInput && (this.element as HTMLInputElement).value) {
        const date = new Date((this.element as HTMLInputElement).value)
        if (!Number.isNaN(date.getTime())) {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          selectedDates = [`${year}-${month}-${day}`]
        }
      }
    }

    // vanilla-calendar-pro uses settings and actions structure
    const calendarOptions: Record<string, unknown> = {
      settings: {
        ...this.options.vcpOptions,
        type: displayMonthsCount > 1 ? 'multiple' : 'default',
        inputMode: !this.isInline,
        positionToInput: placement,
        firstWeekday,
        locale,
        selectionDatesMode: selectionMode,
        selected: {
          dates: selectedDates
        },
        selectedTheme: vcpTheme,
        themeAttrDetect: '[data-bs-theme]'
      },
      actions: {
        clickDay: (event: Event, dates: string[]) => {
          this.handleDateClick(dates, event)
        }
      }
    }

    if (selectedDates.length > 0) {
      const firstDate = this.parseDate(selectedDates[0])
      ;(calendarOptions.settings as Record<string, unknown>).selectedMonth = firstDate.getMonth()
      ;(calendarOptions.settings as Record<string, unknown>).selectedYear = firstDate.getFullYear()
    }

    if (this.options.dateMin) {
      ;(calendarOptions.settings as Record<string, unknown>).dateMin = this.options.dateMin
    } else {
      const dataMin = this.element.getAttribute('data-bs-date-min')
      if (dataMin) {
        ;(calendarOptions.settings as Record<string, unknown>).dateMin = dataMin
      }
    }

    if (this.options.dateMax) {
      ;(calendarOptions.settings as Record<string, unknown>).dateMax = this.options.dateMax
    } else {
      const dataMax = this.element.getAttribute('data-bs-date-max')
      if (dataMax) {
        ;(calendarOptions.settings as Record<string, unknown>).dateMax = dataMax
      }
    }

    return calendarOptions
  }

  private handleDateClick(dates: string[], event: Event): void {
    const selectedDates = [...dates]

    if (selectedDates.length > 0) {
      const formattedDate = this.formatDateForInput(selectedDates)

      if (this.isInput) {
        // For input elements, use the first date in YYYY-MM-DD format (standard input format)
        ;(this.element as HTMLInputElement).value = selectedDates[0]
      }

      if (this.boundInput) {
        this.boundInput.value = selectedDates.join(',')
      }

      if (this.displayElement) {
        this.displayElement.textContent = formattedDate
      }
    }

    this.element.dispatchEvent(
      new CustomEvent('change.bs.datepicker', {
        bubbles: true,
        detail: { dates: selectedDates, event }
      })
    )

    this.maybeHideAfterSelection(selectedDates)
  }

  private maybeHideAfterSelection(selectedDates: string[]): void {
    if (this.isInline) {
      return
    }

    const selectionMode = (this.options.selectionMode ?? (this.element.getAttribute('data-bs-selection-mode') || 'single')) as SelectionMode
    const shouldHide =
      (selectionMode === 'single' && selectedDates.length > 0) ||
      (selectionMode === 'multiple-ranged' && selectedDates.length >= 2)

    if (shouldHide) {
      setTimeout(() => this.hide(), 100)
    }
  }

  private parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-')
    return new Date(Number(year), Number(month) - 1, Number(day))
  }

  private formatDate(dateStr: string): string {
    const date = this.parseDate(dateStr)
    const localeAttr = this.options.locale ?? (this.element.getAttribute('data-bs-locale') || 'default')
    const locale = localeAttr === 'default' ? undefined : localeAttr
    const { dateFormat } = this.options

    if (typeof dateFormat === 'function') {
      return dateFormat(date, locale)
    }

    if (dateFormat && typeof dateFormat === 'object') {
      return new Intl.DateTimeFormat(locale, dateFormat).format(date)
    }

    return date.toLocaleDateString(locale)
  }

  private formatDateForInput(dates: string[]): string {
    if (dates.length === 0) {
      return ''
    }

    if (dates.length === 1) {
      return this.formatDate(dates[0])
    }

    const selectionMode = (this.options.selectionMode ?? (this.element.getAttribute('data-bs-selection-mode') || 'single')) as SelectionMode
    const separator = selectionMode === 'multiple-ranged' ? ' – ' : ', '
    return dates.map((date) => this.formatDate(date)).join(separator)
  }

  private parseInputValue(): void {
    const value = (this.element as HTMLInputElement).value.trim()
    if (!value) {
      return
    }

    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const formatted = `${year}-${month}-${day}`
      this.calendar?.set({ 
        settings: {
          selected: {
            dates: [formatted]
          }
        }
      })
    }
  }

  private updateDisplayWithSelectedDates(): void {
    const selectedDates = this.options.selectedDates || []
    if (selectedDates.length === 0) {
      return
    }

    const formattedDate = this.formatDateForInput(selectedDates)

    if (this.isInput) {
      ;(this.element as HTMLInputElement).value = formattedDate
    }

    if (this.boundInput) {
      this.boundInput.value = selectedDates.join(',')
    }

    if (this.displayElement) {
      this.displayElement.textContent = formattedDate
    }
  }

  // Public methods
  toggle(): void {
    if (this.isInline) {
      return
    }

    if (this.isShown) {
      this.hide()
      return
    }

    this.show()
  }

  show(): void {
    if (this.isInline || !this.calendar || this.isShown) {
      return
    }

    this.element.dispatchEvent(new CustomEvent('show.bs.datepicker', { bubbles: true }))
    this.calendar.show()
    this.isShown = true
    this.element.dispatchEvent(new CustomEvent('shown.bs.datepicker', { bubbles: true }))
  }

  hide(): void {
    if (this.isInline || !this.calendar || !this.isShown) {
      return
    }

    this.element.dispatchEvent(new CustomEvent('hide.bs.datepicker', { bubbles: true }))
    this.calendar.hide()
    this.isShown = false
    this.element.dispatchEvent(new CustomEvent('hidden.bs.datepicker', { bubbles: true }))
  }

  dispose(): void {
    if (this.themeObserver) {
      this.themeObserver.disconnect()
      this.themeObserver = null
    }

    if (this.calendar) {
      this.calendar.destroy()
    }

    this.calendar = null
  }

  getSelectedDates(): string[] {
    // vanilla-calendar-pro stores dates in context.selected.dates
    const dates = (this.calendar as any)?.context?.selected?.dates
    return dates ? [...dates] : []
  }

  setSelectedDates(dates: string[]): void {
    if (this.calendar) {
      this.calendar.set({ 
        settings: {
          selected: {
            dates: dates
          }
        }
      })
    }
  }
}

// Initialize datepickers on page load
const datepickerElements: HTMLElement[] = [].slice.call(
  document.querySelectorAll<HTMLElement>('[data-bs-toggle="datepicker"]')
)

datepickerElements.forEach(function (element: HTMLElement) {
  const options: DatepickerOptions = {}

  // Read options from data attributes
  const inline = element.getAttribute('data-bs-inline')
  if (inline !== null) {
    options.inline = inline === 'true'
  }

  const displayMonthsCount = element.getAttribute('data-bs-display-months-count')
  if (displayMonthsCount) {
    options.displayMonthsCount = parseInt(displayMonthsCount, 10)
  }

  const firstWeekday = element.getAttribute('data-bs-first-weekday')
  if (firstWeekday) {
    options.firstWeekday = parseInt(firstWeekday, 10)
  }

  const locale = element.getAttribute('data-bs-locale')
  if (locale) {
    options.locale = locale
  }

  const selectionMode = element.getAttribute('data-bs-selection-mode')
  if (selectionMode) {
    options.selectionMode = selectionMode as SelectionMode
  }

  const placement = element.getAttribute('data-bs-placement')
  if (placement) {
    options.placement = placement as Placement
  }

  const datepickerTheme = element.getAttribute('data-bs-datepicker-theme')
  if (datepickerTheme) {
    options.datepickerTheme = datepickerTheme as DatepickerTheme
  }

  const selectedDates = element.getAttribute('data-bs-selected-dates')
  if (selectedDates) {
    options.selectedDates = selectedDates.split(',').map(d => d.trim())
  }

  const dateMin = element.getAttribute('data-bs-date-min')
  if (dateMin) {
    options.dateMin = dateMin
  }

  const dateMax = element.getAttribute('data-bs-date-max')
  if (dateMax) {
    options.dateMax = dateMax
  }

  // Initialize inline datepickers immediately
  if (options.inline || element.getAttribute('data-bs-inline') === 'true') {
    new Datepicker(element, options)
    return
  }

  // For input elements, show on focus
  if (element.tagName === 'INPUT') {
    element.addEventListener('focusin', function () {
      const datepicker = new Datepicker(element, options)
      ;(element as any).__datepicker = datepicker
      datepicker.show()
    })
    return
  }

  // For other elements, toggle on click
  element.addEventListener('click', function (event) {
    event.preventDefault()
    let datepicker = (element as any).__datepicker
    if (!datepicker) {
      datepicker = new Datepicker(element, options)
      ;(element as any).__datepicker = datepicker
    }
    datepicker.toggle()
  })
})

// Initialize inline datepickers on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const inlineDatepickers: HTMLElement[] = [].slice.call(
    document.querySelectorAll<HTMLElement>('[data-bs-toggle="datepicker"][data-bs-inline="true"]')
  )

  inlineDatepickers.forEach(function (element: HTMLElement) {
    if (!(element as any).__datepicker) {
      const options: DatepickerOptions = {
        inline: true
      }
      new Datepicker(element, options)
    }
  })
})

export default Datepicker
